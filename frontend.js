const Frontend = (() => {

    const state = {};
    const dataListeners = new Set();
    let markdownProcessor = text => `<pre>${text}</pre>`; // default fallback


    /********************************************************************************
     * Performs one-time initialization for the Frontend runtime.
     * Loads templates, behaviors, triggers, and code elements at the document level.
     ********************************************************************************/
    async function initialize() {

        if (!Frontend._behaviors)
            Frontend._behaviors = new Map();

        await loadBehaviorLinks(document);
        await loadBehaviorsElements(document);
        await loadTemplateLinks(document);
        await loadTemplates(document);
        await buildTriggers(document);
        await buildDataBindings(document);
        await loadCodeElements(document);

        const loadedCount = await loadFragments(document);
        dispatch("page:load_complete", { count: loadedCount, finishedAt: Date.now() });
    }


    /**
     * Console logging with a "[Frontend]" prefix on every message.
     * Usage: log.warn("Something happened:", value);
     */
    const log = Object.fromEntries(
        ["debug", "info", "log", "warn", "error"].map(level =>
            [level, (...args) => console[level]("[Frontend]", ...args)]
        )
    );

    const isContainer = v => v !== null && typeof v === "object";
    const isPlainObject = v => isContainer(v) && !Array.isArray(v);


    /**
     * Fetches a URL and returns the response body as text.
     * Throws on network failure or a non-OK HTTP status, so callers can
     * handle every failure in a single catch.
     *
     * @param {string} src - The URL to fetch.
     * @returns {Promise<string>} The response body.
     */
    async function fetchText(src) {
        const res = await fetch(src);

        if (!res.ok)
            throw new Error(`HTTP ${res.status}`);

        return res.text();
    }


    /**
     * Fetches the text content at a fragment source URL.
     * Returns null if the request fails, so the caller can use the inline fallback.
     *
     * @param {string} src - The resolved URL to fetch (main src or fallback).
     * @returns {Promise<string|null>}
     */
    async function fetchFragment(src) {
        try {
            return await fetchText(src);
        } catch (e) {
            log.warn(`Fragment fetch failed: ${src}`, e);
            return null;
        }
    }


    /**
     * Parses an HTML string into a detached DocumentFragment.
     * Uses a <template> element so content is parsed without a surrounding
     * context: table rows, cells, list items, and options are all preserved,
     * where a <div> wrapper would drop table parts. Nothing is rendered,
     * loaded, or executed until the nodes are inserted into the page.
     *
     * @param {string} html - The HTML to parse.
     * @returns {DocumentFragment} The parsed nodes.
     */
    function parseHTML(html) {
        const t = document.createElement("template");
        t.innerHTML = html;
        return t.content;
    }


    /********************************************************************************
     * Loads external "packs" of elements declared with <link type="..." src="...">.
     *
     * A pack is an HTML file containing one or more elements of a given kind
     * (e.g. <behavior id="..."> or <template id="...">). For each matching link
     * under `root`, this fetches the file, parses it, finds every element matching
     * `selector`, and passes each one to `register`.
     *
     * Duplicate packs are skipped: if the document already contains a different
     * <link> with the same type and src, this link is ignored. When a fragment
     * includes a pack the page has already loaded, the pack is not fetched again.
     * When the same pack is linked more than once in the document itself, the
     * first link in document order wins.
     *
     * Links are processed one at a time, in order. A failed fetch, a non-OK HTTP
     * status, or a pack with no matching elements is logged and skipped, and
     * loading continues with the next link.
     *
     * Example:
     *   <link type="behaviors" src="/packs/ui.html">
     *
     *   loadLinkedPacks(document, "behaviors", "behavior[id]", registerBehaviorElement);
     *
     * @param {ParentNode} root
     *        The node to search for <link> elements: the document, an element,
     *        or a parsed fragment's DocumentFragment.
     * @param {string} type
     *        The link's type attribute to match (e.g. "behaviors", "templates").
     *        Also used in log messages.
     * @param {string} selector
     *        CSS selector for the elements to extract from each pack
     *        (e.g. "behavior[id]", "template[id]").
     * @param {(item: Element, src: string) => void} register
     *        Called once per matching element, with the element and the pack's
     *        src URL. Responsible for storing or moving the element; this
     *        function does not insert anything into the document itself.
     * @returns {Promise<void>}
     *          Resolves after every link under `root` has been processed.
     ********************************************************************************/
    async function loadLinkedPacks(root, type, selector, register) {
        for (const link of root.querySelectorAll(`link[type="${type}"][src]`))
        {
            const src = link.getAttribute("src").trim();
            if (src.length === 0)
                continue;

            try {
                const existing = document.querySelector(`link[type="${type}"][src="${CSS.escape(src)}"]`);
                if (existing && existing !== link)
                    continue;

                const items = parseHTML(await fetchText(src)).querySelectorAll(selector);

                if (!items.length) {
                    log.warn(`No ${selector} found in ${src}`); continue;
                }

                items.forEach(item => register(item, src));
                log.log(`Loaded ${items.length} ${type} from: ${src}`);

            } catch (err) {
                log.error(`Failed to load ${type} from ${src}:`, err);
            }
        }
    }


    /**
     * Loads behavior packs declared with <link type="behaviors" src="...">
     * and registers every <behavior id="..."> they contain.
     *
     * @param {ParentNode} [root=document] - The node to search for links.
     * @returns {Promise<void>}
     */
    async function loadBehaviorLinks(root = document) {
        await loadLinkedPacks(root, "behaviors", "behavior[id]", registerBehaviorElement);
    }


    /**
     * Loads template packs declared with <link type="templates" src="...">
     * and moves every <template id="..."> they contain into the global
     * <templates id="templates"> container. Templates whose id is already
     * registered are skipped.
     *
     * @param {ParentNode} [root=document] - The node to search for links.
     * @returns {Promise<void>}
     */
    async function loadTemplateLinks(root = document) {
        await loadLinkedPacks(root, "templates", "template[id]",
            tmpl => moveTemplateToGlobal(tmpl, getTemplatesContainer()));
    }


    async function loadBehaviorsElements(root = document) {

        const inlineBehaviors = Array.from(root.querySelectorAll('behavior[id]'));

        if (!Frontend._behaviors)
            Frontend._behaviors = new Map();

        // --- Register inline <behavior> definitions ---
        for (const bEl of inlineBehaviors)
        {
            registerBehaviorElement(bEl, "inline");
            bEl.remove();
        }
    }


    /********************************************************************************
     * Loads code blocks (<code src="...">) and applies Highlight.js if available.
     * Safe to call multiple times; uses data-loaded flag to avoid duplicates.
     ********************************************************************************/
    async function loadCodeElements(root = document) {

        const canHighlight = typeof hljs !== "undefined";

        const codeBlocks = root.querySelectorAll('code[src]:not([data-loaded])');
        const inlineBlocks = root.querySelectorAll("code:not([src]):not([data-loaded])");

        const highlight = el => {
            const lang = el.getAttribute("language");

            if (lang) {
                const existing = (el.className.match(/\blanguage-([\w-]+)/) || [])[1];

                if (!existing) {
                    el.classList.add(`language-${lang}`);
                } else if (existing !== lang) {
                    log.warn(`<code> has class "language-${existing}" and language="${lang}"; using "${existing}"`, el);
                }
            }

            hljs.highlightElement(el);
        };

        for (const el of codeBlocks) {
            const src = el.getAttribute("src");

            // already processed, skip it.
            if (el.dataset.loaded) { continue; }

            if (!src) {
                log.error(`Failed to load code block. Empty src attribute.`);
                el.dataset.loaded = "error";
                continue;
            }

            

            try {
                el.textContent = await fetchText(src);
                el.dataset.loaded = "true";
            } catch (err) {
                log.error(`Failed to load code block from ${src}:`, err);
                el.textContent = `/* Error loading ${src} */`;
                el.dataset.loaded = "error";
                continue;
            }

            if (!canHighlight)
                continue;

            highlight(el);
        }

        if (canHighlight)
        {
            inlineBlocks.forEach(el => {
                el.dataset.loaded = "true";
                highlight(el);
            });
        }
    }



    async function loadComponents(root) {
        const components = Array.from(root.querySelectorAll("component"));

        for (const comp of components) {

            const componentData = getComponentData(comp);

            const componentID = "fec_" + crypto.randomUUID();
        }
    }


    async function loadFragment(element) {
        let loadedCount = 0;

        // Skip fragments detached when an earlier fragment replaced their parent
        if (!element.isConnected)
            return 0;

        const currentFrag = getFragmentData(element);

        try {
            // --- Resolve target source ---
            const targetSrc = resolveFragmentSource(currentFrag);
            if (!targetSrc) {
                // replaces frag with inner content
                useInlineFallback(currentFrag);
                return loadedCount;
            }

            // --- Fetch HTML ---
            const raw = await fetchFragment(targetSrc);
            let html = raw;
            if (!raw) {
                // replaces frag with inner content
                useInlineFallback(currentFrag);
                return loadedCount;
            }

            // --- Determine content type ---
            const src = targetSrc.toLowerCase() || "";

            if (src.endsWith(".md") || src.endsWith(".markdown") || src.endsWith(".mkd"))
            {
                log.info(`Rendering Markdown fragment: ${src}`);
                html = Frontend.renderMarkdown(raw);

                // --- Param substitution ---
                const substituted = substituteParams(html, currentFrag.params);

                // --- Replace the <fragment> with the rendered HTML ---
                const wrapper = document.createElement("div");
                wrapper.innerHTML = substituted;

                loadCodeElements(wrapper);

                const newNodes = Array.from(wrapper.childNodes);
                currentFrag.el.replaceWith(...newNodes);

                // --- Fire completion event ---
                dispatch("fragment:loaded", { id: currentFrag.id, src: src, nodes: newNodes });
                loadedCount++;

            }else{

                // --- Param substitution ---
                const substituted = substituteParams(html, currentFrag.params);
            
                // --- Parse & replace ---
                const newNodes = await parseFragment(substituted, currentFrag);



                // --- Fire event ---
                dispatch("fragment:loaded", { id: currentFrag.id, src: targetSrc, nodes: newNodes });
                loadedCount++;

                // --- Nested fragments (traverse the full subtree, any depth) ---
                for (const n of newNodes) {
                    if (n.nodeType !== Node.ELEMENT_NODE) continue;

                    // The node itself may be a fragment...
                    if (n.matches("fragment[src]")) {
                        loadedCount += await loadFragment(n);
                        continue;
                    }

                    // ...otherwise load any fragments nested anywhere inside it.
                    if (n.querySelectorAll) {
                        for (const f of n.querySelectorAll("fragment[src]")) {
                            if (!f.isConnected || f.closest("code")) continue;
                            loadedCount += await loadFragment(f);
                        }
                    }
                }

            }
        } catch (err) {
            log.error("Unexpected fragment error:", err);
            element.remove();
        }
        return loadedCount;
    }

    /**
     * Loads all <fragment src="..."> elements inside the given root.
     * Skips any fragments that are nested inside <code> or <pre><code> blocks.
     * Returns the number of fragments successfully loaded.
     */
    async function loadFragments(root)
    {
        // Find all fragment[src] but filter out those inside <code> or <pre><code>
        const allFragments = Array.from(root.querySelectorAll("fragment[src]")).filter(frag => {
            return !frag.closest("code");   // Skip if any ancestor is a <code> element
        });

        let loadedCount = 0;

        for (const fragEl of allFragments) {
            loadedCount += await loadFragment(fragEl);
        }

        return loadedCount;
    }

    /**
     * Loads all <template> and <templates> elements within the given root,
     * ensuring a single <templates id="templates"> container exists at the
     * end of <body>. Deduplicates template IDs intelligently.
     */
    async function loadTemplates(root = document) {
        const allContainers = Array.from(root.querySelectorAll("templates"));
        const allTemplates = Array.from(root.querySelectorAll("template"));

        let docTemplateContainer = getTemplatesContainer();

        // --- Append it to the end of <body> if not already there ---
        if (document.body.lastElementChild !== docTemplateContainer) {
            document.body.appendChild(docTemplateContainer);
        }

        // --- Move all discovered <template> elements into the global container ---
        for (const tmpl of allTemplates) {
            const id = tmpl.id?.trim();

            // Skip templates without IDs
            if (!id) {
                log.warn("Ignored <template> without id:", tmpl);
                continue;
            }

            // Skip duplicates intelligently — prefer first seen
            const existing = docTemplateContainer.querySelector(`template#${CSS.escape(id)}`);
            if (existing) {
                // Compare content to see if they differ
                if (existing.innerHTML !== tmpl.innerHTML) {
                    log.warn(`Duplicate template id "${id}" detected — kept first, ignored new one.`);
                }
                continue;
            }

            docTemplateContainer.appendChild(tmpl);
        }

        // --- Remove all <templates> containers found under this root (cleanup) ---
        for (const container of allContainers) {
            if (container !== docTemplateContainer)
                container.remove();
        }


    }


    /**
     * Instantiates a template into a destination element.
     *
     * @param {string} destinationID - The id of the destination element.
     * @param {string} templateID - The id of the <template> to instantiate.
     * @param {Object} [params={}] - Optional key/value params for substitution.
     * @param {boolean} [clearParent=false] - If true, clears destination before inserting.
     */
    async function loadComponent(destinationID, templateID, params = {}, clearParent = false) {

        // --- Find destination ---
        const destination = document.getElementById(destinationID);
        if (!destination) {
            log.warn(`loadComponent: destination element not found: "${destinationID}"`);
            return;
        }

        // --- Find template ---
        const templateContainer = document.querySelector("templates#templates");
        if (!templateContainer) {
            log.error("loadComponent: global templates container not found.");
            return;
        }

        const tmpl = templateContainer.querySelector(`template#${CSS.escape(templateID)}`);
        if (!tmpl) {
            log.error(`loadComponent: template "${templateID}" not found.`);
            return;
        }

        // --- Clone the template content ---
        const html = tmpl.innerHTML;
        if (!html.trim()) {
            log.warn(`loadComponent: template "${templateID}" is empty.`);
            destination.innerHTML = "";
            return;
        }

        // --- Param substitution ---
        const substituted = substituteParams(html, params || {});

        // --- Parse substituted HTML into DOM nodes ---
        const wrapper = document.createElement("template");
        wrapper.innerHTML = substituted;

        const newNodes = Array.from(wrapper.content.childNodes);

        // --- Insert into destination ---
        if (clearParent) {
            destination.innerHTML = "";
        }

        destination.append(...newNodes);

    }



    /***************************************************************************************
     *
     * Internal Data Utility Functions
     * -------------------------------
     * 
     * getComponentData
     * getFragmentData
     * getTriggerData
     * 
     **************************************************************************************/

    /**
     * Extracts metadata and parameters from a <component> element
     * into a normalized component context object.
     *
     * Components are lightweight instances of templates, created
     * declaratively in the DOM and parameterized via `param-*` attributes.
     *
     * @param {Element} el - The <component> element.
     * @returns {Object|null} Component context containing:
     *   - {Element} el           The <component> element itself
     *   - {string|null} id       Optional unique identifier
     *   - {string|null} template The template-id to instantiate (required)
     *   - {string|null} condition Optional JS condition to determine rendering
     *   - {string|null} fallback  Optional fallback template-id or HTML path
     *   - {string|null} onload    Optional onload handler
     *   - {string|null} onerror   Optional onerror handler
     *   - {boolean} cache         Whether caching is enabled (false if `no-cache` present)
     *   - {Object} params         Collected param-* attributes + metadata
     */
    function getComponentData(el) {
        if (!(el instanceof Element)) {
            log.error("getComponentData() called with non-element:", el);
            return null;
        }

        const id = el.id || null;
        const template = el.getAttribute("template-id");
        const condition = el.getAttribute("condition");
        const fallback = el.getAttribute("fallback");
        const onload = el.getAttribute("onload");
        const onerror = el.getAttribute("onerror");

        if (!template) {
            log.warn(" <component> missing required template-id:", el);
            return null;
        }

        // Boolean attribute: if <component no-cache>, then cache = false
        const cache = !el.hasAttribute("no-cache");

        // Gather param-* attributes like fragments do
        const params = collectParams(el, template, id);

        return { el, id, template, condition, fallback, onload, onerror, cache, params };
    }



    /**
     * Extracts metadata and parameters from a <fragment> element
     * into a normalized fragment context object.
     *
     * @param {Element} el - The <fragment> element.
     * @returns {Object} Fragment context containing:
     *   - {Element} el         The fragment element
     *   - {string|null} id     Fragment id, if present
     *   - {string} src         Main source URL
     *   - {string|null} condition   Optional JS condition
     *   - {string|null} fallback    Optional fallback URL
     *   - {string|null} onload      Optional onload handler
     *   - {string|null} onerror     Optional onerror handler
     *   - {boolean} cache      Whether caching is enabled (false if `no-cache` present)
     *   - {Object} params      Collected param-* attributes + metadata
     */
    function getFragmentData(el) {
        if (!(el instanceof Element)) {
            log.error("getFragmentData() called with non-element:", el);
            return null;
        }

        const id = el.id || null;
        const src = el.getAttribute("src");
        const condition = el.getAttribute("condition");
        const fallback = el.getAttribute("fallback");
        const onload = el.getAttribute("onload");
        const onerror = el.getAttribute("onerror");

        // Boolean attribute: if <fragment no-cache>, then cache = false
        const cache = !el.hasAttribute("no-cache");

        const params = collectParams(el, src, id);

        return { el, id, src, condition, fallback, onload, onerror, cache, params };
    }

    /**
     * Extracts metadata and attributes from a <trigger> element
     * into a normalized trigger context object.
     *
     * A <trigger> element defines a declarative event binding
     * for its parent element, describing how it should react
     * to a specific event on a source element.
     *
     * @param {Element} el - The <trigger> element.
     * @returns {Object|null} Trigger context containing:
     *   - {Element} el             The <trigger> element
     *   - {Element|null} parent    The parent element that owns this trigger
     *   - {string|null} from       CSS selector of source element (null = parent)
     *   - {string|null} on         Event name (required)
     *   - {string|null} target     CSS selector of target element (null = parent)
     *   - {string|null} condition  Optional JS expression guard
     *   - {string|null} action     JS expression or function body to execute
     *   - {boolean} once           If true, the trigger runs only once
     *   - {boolean} prevent        If true, calls e.preventDefault()
     *   - {boolean} stop           If true, calls e.stopPropagation()
     */
    function getTriggerData(el) {
        if (!(el instanceof Element)) {
            log.error("getTriggerData() called with non-element:", el);
            return null;
        }

        const parent = el.parentElement || null;

        const on = el.getAttribute("on");
        const key = el.getAttribute("key");
        const target = el.getAttribute("target");
        const condition = el.getAttribute("condition");
        const action = el.getAttribute("action");

        // Boolean modifiers
        const once = el.hasAttribute("once");
        const prevent = el.hasAttribute("prevent");
        const stop = el.hasAttribute("stop");

        if (!on || !action) {
            log.warn("Ignored <trigger> missing 'on' or 'action':", el);
            return null;
        }

        return {
            el,
            parent,
            key: key || null,
            on: on || null,
            target: target || null,
            condition: condition || null,
            action: action || null,
            once,
            prevent,
            stop
        };
    }

    /***************************************************************************************
    *
    * Behavior Utility Functions
    * 
    ***************************************************************************************/

    /**
     * Registers a single <behavior> element into the global behavior map.
     * 
     * - Extracts the id and its child <trigger> definitions.
     * - Skips duplicates with a clear warning.
     * 
     * @param {Element} bEl - The <behavior> element.
     * @param {string} [source="unknown"] - Optional label (e.g. "inline" or file path).
     */
    function registerBehaviorElement(bEl, source = "unknown") {

        if (!(bEl instanceof Element)) {
            log.error("registerBehaviorElement() called with non-element:", bEl);
            return;
        }

        const id = bEl.id?.trim();

        if (!id) {
            log.warn(`Ignored <behavior> without id (${source})`);
            return;
        }

        // --- Duplicate guard ---
        if (Frontend._behaviors.has(id)) {
            log.warn(`Duplicate behavior id "${id}" encountered in ${source} — skipped`);
            return;
        }

        // --- Extract triggers ---
        const triggers = findChildTriggers(bEl).map(getTriggerData);
        if (triggers.length === 0) {
            log.warn(`Behavior "${id}" (${source}) has no triggers — skipped`);
            return;
        }

        // --- Store in global registry ---
        Frontend._behaviors.set(id, triggers);
        log.log(`Registered behavior "${id}" (${triggers.length} triggers) from ${source}`);
    }


    /***************************************************************************************
     *
     * Trigger DOM Utility Functions
     * 
     ***************************************************************************************/

    /**
     * Recursively compiles all <trigger> elements within a subtree.
     *
     * @param {ParentNode} root - The root element or fragment wrapper to scan.
     */
    function buildTriggers(root = document) {

        if (!(root instanceof Element) && !(root instanceof DocumentFragment) && root !== document) {
            log.error("buildTriggers() called with invalid root:", root);
            return;
        }

        // --- Step 1: Build triggers for the root itself (if it has any immediate <trigger> children)
        if (root instanceof Element && root.matches(':has(> trigger)')) {
            buildElementTriggers(root);
        }

        // --- Step 2: Find all descendants that have immediate <trigger> children
        const elementsWithTriggers = root.querySelectorAll(':has(> trigger)');

        // --- Step 3: Apply triggers for each
        elementsWithTriggers.forEach(el => buildElementTriggers(el));
    }




    /**
     * Compiles all immediate <trigger> children of an element
     * into executable attribute-based bindings.
     *
     * This is typically called during fragment parsing or component
     * initialization to resolve declarative trigger markup into
     * actual behavior definitions on the element.
     *
     * @param {Element} el - The element to process.
     */
    function buildElementTriggers(el) {
        if (!(el instanceof Element)) {
            log.error("buildElementTriggers() called with non-element:", el);
            return;
        }

        // Step 1: Find all immediate <trigger> children
        const triggers = findChildTriggers(el);
        if (triggers.length === 0)
            return;

        // Step 2: Apply (compile) those triggers to the element
        applyTriggersToElement(el, triggers);

        // Step 3: Clean up any lingering <trigger> tags (defensive)
        for (const trig of triggers) {
            if (trig.parentNode === el) {
                trig.remove();
            }
        }
    }


    /**
     * Finds all immediate (non-nested) <trigger> elements
     * that are direct children of a given parent element.
     *
     * This is used during parsing or initialization to attach
     * triggers only to their owning element, not deeper descendants.
     *
     * Example:
     *   <div>
     *     <trigger on="click" do="..."></trigger>      ← included
     *     <span><trigger on="click" do="..."></trigger></span>  ← excluded
     *   </div>
     *
     * @param {Element} parent - The parent element to scan.
     * @returns {Element[]} Ordered array of direct <trigger> elements.
     */
    function findChildTriggers(parent) {
        if (!(parent instanceof Element)) {
            log.error("findChildTriggers() called with non-element:", parent);
            return [];
        }

        const triggers = [];

        for (const child of parent.children) {
            if (child.tagName.toLowerCase() === "trigger") {
                triggers.push(child);
            }
        }

        return triggers;
    }



    /**
     * Translates <trigger> child elements into equivalent
     * inline event or data attributes on the parent element.
     *
     * Each <trigger> element is consumed and removed after compilation.
     *
     * @param {Element} parent     The element to apply triggers to.
     * @param {Element[]} triggers The immediate <trigger> child elements.
     */
    function applyTriggersToElement(parent, triggers) {

        if (!(parent instanceof Element)) {
            log.error("applyTriggersToElement() called with non-element:", parent);
            return;
        }

        if (!Array.isArray(triggers) || triggers.length === 0)
            return;

        for (const trigEl of triggers) {
            const t = getTriggerData(trigEl);
            if (!t) continue;

            // Build a normalized attribute representation
            // For example: <trigger on="click" do="..." condition="...">
            // → <div on-click="..." data-trigger-condition="...">
            const baseName = `on-${t.on}`;
            
            if (t.action) { parent.setAttribute(baseName, t.action); }          // Set primary action attribute
            if (t.key) { parent.setAttribute(`${baseName}-key`, t.key); }       // Optional target/from scoping
            if (t.target) { parent.setAttribute(`${baseName}-target`, t.target); }
            if (t.condition) parent.setAttributeNS(`${baseName}-condition`, t.condition);

            // Boolean flags
            if (t.once) parent.setAttribute(`${baseName}-once`, "");
            if (t.prevent) parent.setAttribute(`${baseName}-prevent`, "");
            if (t.stop) parent.setAttribute(`${baseName}-stop`, "");


            // Remove the trigger element after compilation
            trigEl.remove();
        }
    }



    async function buildDataBindings(root = document) {
        // --- Step 1: Build triggers for the root itself (if it has any immediate <data-binding> children)
        if (root instanceof Element && root.matches(':has(> data-binding)')) {
            buildElementDataBindings(root);
        }

        // --- Step 2: Find all descendants that have immediate <data-binding> children
        const elementsWithDataBindings = root.querySelectorAll(':has(> data-binding)');

        // --- Step 3: Apply Data Bindings for each
        elementsWithDataBindings.forEach(el => buildElementDataBindings(el));

    }

    async function buildElementDataBindings(el) {

        if (!(el instanceof Element)) {
            log.error("buildElementDataBindings() called with non-element:", el);
            return;
        }

        // Step 1: Find all immediate <data-binding> children
        const bindings = findChildDataBindings(el);
        if (bindings.length === 0)
            return;

        // Step 2: Apply (compile) those triggers to the element
        applyDataBindingsToElement(el, bindings);

        // Step 3: Clean up any lingering <data-bindings> tags 
        for (const bind of bindings) {
            if (bind.parentNode === el) {
                bind.remove();
            }
        }
    }

    function findChildDataBindings(parent) {

        if (!(parent instanceof Element)) {
            log.error("findChildDataBindings() called with non-element:", parent);
            return [];
        }

        const bindings = [];

        for (const child of parent.children) {
            if (child.tagName.toLowerCase() === "data-binding") {
                bindings.push(child);
            }
        }

        return bindings;
    }

    /********************************************************************************
     * 
     * Compiles <data-binding> child elements into data-bind-* attributes
     * on their parent element, then removes the <data-binding> elements.
     *
     * Each binding links a state key to a target on the parent. When that key
     * changes via setData(), updateDataBindings() finds the attribute and
     * applies the new value through applyDataBinding().
     *
     * If the key already has a value in state, it is applied immediately so
     * the element is populated on first render rather than on the next change.
     *
     * Example:
     *   <span>
     *     <data-binding key="user.name" target="text"></data-binding>
     *     <data-binding key="theme.color" target="style-color"></data-binding>
     *   </span>
     *
     *   → <span data-bind-text="user.name" data-bind-style-color="theme.color">
     *
     * Supported targets (see applyDataBinding):
     *   text, html, value, class, visible, style-<prop>, attr-<name>,
     *   or any other name, which is set as a plain attribute.
     *
     * @param {Element}   parent   The element receiving the bindings.
     * @param {Element[]} bindings Its immediate <data-binding> children.
     * 
     ********************************************************************************/
    function applyDataBindingsToElement(parent, bindings)
    {
        if (!(parent instanceof Element))
        {
            log.error("applyDataBindingsToElement() called with non-element:", parent);
            return;
        }

        if (!Array.isArray(bindings) || bindings.length === 0)
            return;

        for (const binding of bindings) {
            const bindingKey = binding.getAttribute("key");
            const bindingTarget = binding.getAttribute("target");

            // Invalid binding: warn and discard it
            if (!bindingKey || !bindingTarget) {
                log.warn("Ignored <data-binding> missing 'key' or 'target':", binding);
                binding.remove();
                continue;
            }

            // Compile to an attribute that updateDataBindings() will find later
            parent.setAttribute(`data-bind-${bindingTarget}`, bindingKey);

            // Apply the current value immediately, if state already has one
            const current = getData(bindingKey);
            if (current !== undefined) applyDataBinding(parent, bindingTarget.split("-"), current);

            binding.remove();
        }
    }


    /**
     * Collects params from a <fragment> element.
     * - param-* attributes → { key: value }
     * - frag_id (if present)
     * - frag_src (always included)
     */
    function collectParams(frag, src, fragId) {
        const params = {};
        frag.getAttributeNames()
            .filter(n => n.startsWith("param-"))
            .forEach(n => params[n.replace("param-", "")] = frag.getAttribute(n));

        if (fragId)
            params.frag_id = fragId;

        params.frag_src = src;
        return params;
    }

    /***************************************************************************************
     *
     * Trigger Compilation Utility Functions
     * 
     ***************************************************************************************/

    /**
     * Determines which source URL to load for a fragment context.
     *
     * This function inspects the fragment’s `condition` and `fallback` attributes
     * (already extracted into the fragment context object) and evaluates whether
     * the main `src` should be used. The condition is executed as a JavaScript
     * expression, with both the `frag` context object and its underlying element
     * (`frag.el`) available as variables.
     *
     * Evaluation order:
     *   1. If no `condition` is specified → use `src`.
     *   2. If `condition` evaluates truthy → use `src`.
     *   3. If `condition` evaluates falsy → use `fallback`, if provided.
     *   4. If neither applies → return `null` (caller should remove the element).
     *
     * @param {Object} fragData
     *        The fragment context object, expected to contain:
     *          - {Element} el         The actual <fragment> element in the DOM.
     *          - {string} src         The main source URL.
     *          - {string|null} condition  Optional JavaScript expression to evaluate.
     *          - {string|null} fallback   Optional fallback URL if the condition fails.
     *
     * @returns {string|null}
     *          The resolved source URL to load, or `null` if no valid source applies.
     *
    */
    function resolveFragmentSource(fragData) {

        if (!fragData || typeof fragData !== "object" || !fragData.el) {
            log.error("Invalid fragment context passed to resolveSource:", fragData);
            return null;
        }

        const el = fragData.el;
        const src = fragData.src ?? null;
        const condition = fragData.condition ?? null;
        const fallback = fragData.fallback ?? null;

        if (!condition) {
            return src;
        }

        try {
            const ok = new Function("frag", "el", `return (${condition});`)(fragData, el);
            if (ok) {
                return src;
            }
        } catch (e) {
            log.error("Invalid fragment condition:", condition, e);
        }

        if (fallback) {
            return fallback;
        }

        return null;
    }


    /**
     * Replaces a fragment element with its inline fallback content, if any.
     * Returns null (so callers can handle consistently).
     */
    function useInlineFallback(frag) {
        const src = frag.src;
        const fragEl = frag.el;
        const fallbackContent = fragEl.innerHTML.trim();

        if (fallbackContent) {
            log.info(`Using inline fallback for fragment: ${src}`);
            const wrapper = document.createElement("div");
            wrapper.innerHTML = fallbackContent;
            const newNodes = Array.from(wrapper.childNodes);
            fragEl.replaceWith(...newNodes);
        } else {
            log.warn(`No inline fallback for fragment: ${src}`);
            fragEl.remove();
        }

        return null;
    }


    /**
     * Performs {{param}} substitution in a fragment’s HTML string.
     * 
     * Priority order:
     *   1. Fragment-level params (from param-* attributes, frag_id, frag_src)
     *   2. Global state values (via Frontend.getData)
     *   3. Otherwise: leave the token untouched (e.g., {{key}})
     * 
     * Supports dot-notation paths (e.g., {{user.name}}).
     * 
     * @param {string} html   The raw HTML text to process.
     * @param {Object} params Key-value pairs collected from the fragment element.
     * @returns {string} The HTML string with placeholders replaced where possible.
     *
     * Example:
     *   params = { theme: "dark", frag_id: "profile" }
     *   state  = { user: { name: "Alice" } }
     *
     *   Input:  "<div class='{{theme}}'>{{user.name}} ({{missing}})</div>"
     *   Output: "<div class='dark'>Alice ({{missing}})</div>"
     */
    function substituteParams(html, params) {
        return html.replace(/{{\s*([\w.$-]+)\s*}}/g, (match, key) => {
            // 1. Explicit fragment params take priority
            if (params && key in params) return params[key];

            // 2. Fallback to global state (dot paths supported)
            const stateVal = getData(key);
            if (stateVal !== undefined && stateVal !== null) return stateVal;

            // 3. Unknown → leave token as-is
            return match;
        });
    }




    /**
     * Parses HTML into DOM nodes and replaces the original fragment.
     * Returns an array of the new nodes.
     */
    async function parseFragment(html, fragData) {

        const wrapper = document.createElement("template");
        wrapper.innerHTML = html;
        const root = wrapper.content;

        removeDuplicateScripts(root);
        await loadBehaviorLinks(root);
        await loadBehaviorsElements(root);
        await loadTemplateLinks(root);
        await loadTemplates(root);
        await buildTriggers(root);
        await buildDataBindings(root);
        await loadCodeElements(root);         // --- Parse and Load code src attributes

        const newNodes = Array.from(root.childNodes);

        // --- swap the DOM fragment with the new nodes
        fragData.el.replaceWith(...newNodes);


        // --- Run scripts & links ---
        newNodes.forEach(n => {
            handleFragmentLinks(n);
            runScripts(n);
        });

        return newNodes;
    }

    /**
     * Promotes <link> elements into <head>, avoiding duplicates.
     * Removes them from the body if already present.
     */
    function handleFragmentLinks(node) {
        if (node.nodeName === "LINK") {
            const rel = node.getAttribute("rel");
            const href = node.getAttribute("href");
            const duplicate = [...document.head.querySelectorAll("link")]
                .some(l => l.getAttribute("rel") === rel && l.getAttribute("href") === href);

            if (!duplicate) {
                document.head.appendChild(node);
            } else {
                node.remove();
            }
        } else if (node.querySelectorAll) {
            node.querySelectorAll("link").forEach(handleFragmentLinks);
        }
    }


    /***************************************************************************************
     *
     * Fragment Internal Script Handler Functions
     * 
     **************************************************************************************/

    /**
     * Processes <script> elements:
     * - External scripts (<script src>) are moved to <head> if not already there
     * - Inline scripts are reinserted to force execution
     */
    function runScripts(root) {
        try {
            if (root.nodeName === "SCRIPT") {
                const src = root.getAttribute("src");
                if (src) return handleExternalScript(root, src);
                return handleInlineScript(root);
            }

            if (root.querySelectorAll) {
                root.querySelectorAll("script").forEach(runScripts);
            }
        } catch (err) {
            log.error("Script execution error:", err);
        }
    }

    /**
     * Handles external <script src="...">.
     * Moves it into <head> unless already loaded.
     */
    function handleExternalScript(root, src) {
        const exists = [...document.head.querySelectorAll("script[src]")]
            .some(s => s.getAttribute("src") === src);

        if (!exists) {
            const s = document.createElement("script");
            for (const { name, value } of root.attributes) {
                s.setAttribute(name, value);
            }
            document.head.appendChild(s);
        }
        root.remove();
    }

    /**
     * Handles inline <script> by recreating and reinserting it.
     * Ensures inline code executes.
     */
    function handleInlineScript(old) {
        const s = document.createElement("script");
        for (const { name, value } of old.attributes) {
            s.setAttribute(name, value);
        }
        if (old.textContent)
            s.textContent = old.textContent;
        
        old.parentNode.insertBefore(s, old);
        old.remove();
    }

    /**
     * Removes <script id="..."> elements from a parsed fragment before it is
     * inserted, when a script with the same id is already in the document or
     * appears earlier in the same fragment. Scripts without an id are kept.
     *
     * @param {Element} wrapper - The detached element holding the parsed fragment.
     */
    function removeDuplicateScripts(wrapper) {
        const seen = new Set(); // ids already kept from this fragment

        for (const script of wrapper.querySelectorAll("script[id]")) {
            const id = script.id;
            if (!id) continue;

            if (seen.has(id) || document.querySelector(`script#${CSS.escape(id)}`)) {
                log.debug(`Skipped duplicate script "${id}"`);
                script.remove();
                continue;
            }

            seen.add(id);
        }
    }



    /***************************************************************************************
     *
     * Template Utility Functions
     * 
     **************************************************************************************/

    /**
     * Normalizes any <templates> containers found inside a given root.
     * Moves all <template> children into the global <templates id="templates"> container.
     * Removes the processed <templates> containers afterward.
     *
     * @param {ParentNode} sourceRoot - The DOM node to search within (e.g. fragment wrapper or document).
     * @param {HTMLElement} templatesRoot - The global <templates id="templates"> container.
     */
    function normalizeTemplatesContainers(sourceRoot, templatesRoot) {
        const containers = Array.from(sourceRoot.querySelectorAll("templates"));
        for (const container of containers) {
            // Warn if nested <templates id="templates"> is found
            if (container.id === "templates") {
                log.warn("Found embedded <templates id=\"templates\">; merging into global container.");
            }

            // Move all child <template> elements into the global templates root
            const innerTemplates = Array.from(container.querySelectorAll("template"));
            for (const tmpl of innerTemplates) {
                moveTemplateToGlobal(tmpl, templatesRoot);
            }

            // Remove the container after its contents are merged
            container.remove();
        }
    }


    /**
     * Moves a <template> element into the global <templates id="templates"> container,
     * skipping duplicates by ID.
     *
     * @param {HTMLTemplateElement} tmpl - The <template> element to move.
     * @param {HTMLElement} templatesRoot - The global <templates id="templates"> element.
     */
    function moveTemplateToGlobal(tmpl, templatesRoot) {
        const id = tmpl.id;
        if (!id) {
            log.warn("Ignored <template> without id in fragment.");
            return;
        }

        // Skip duplicates
        if (templatesRoot.querySelector(`template#${CSS.escape(id)}`)) {
            log.warn(`Duplicate template id "${id}" in fragment — skipped`);
            return;
        }

        templatesRoot.appendChild(tmpl);
    }

    /**
     * Returns the global <templates id="templates"> container,
     * creating it at the end of <body> if it doesn't exist yet.
     */
    function getTemplatesContainer() {
        let container = document.querySelector("templates#templates");
        if (!container) {
            container = document.createElement("templates");
            container.id = "templates";
            document.body.appendChild(container);
        }
        return container;
    }

    /***************************************************************************************
     *
     * Markdown Processor API
     * -----------------------
     * Allows developers to register a Markdown-to-HTML processor.
     * Your core code remains agnostic; you just call Frontend.renderMarkdown(text)
     * whenever you need to render Markdown.
     *
     ***************************************************************************************/

    /**
     * Registers a custom Markdown processor.
     * @param {Function} fn - A function(text: string) => html: string
     */
    function setMarkdownProcessor(fn) {
        if (typeof fn !== "function") {
            log.error("setMarkdownProcessor requires a function");
            return;
        }
        markdownProcessor = fn;
        log.log("Markdown processor registered.");
    }

    /**
     * Converts Markdown text to HTML using the registered processor.
     * If none is set, returns escaped plain text.
     * @param {string} text
     * @returns {string} HTML string
     */
    function renderMarkdown(text) {
        try {
            return markdownProcessor(text);
        } catch (err) {
            log.error("Markdown processor failed:", err);
            return `<pre>${text}</pre>`;
        }
    }



    /***************************************************************************************
     *
     * State Functions
     * 
     **************************************************************************************/

    function emitDataDiffEvents(path, oldVal, newVal)
    {
        if (Object.is(oldVal, newVal))
            return false;

        const oldKids = isContainer(oldVal) ? oldVal : null;
        const newKids = isContainer(newVal) ? newVal : null;
        const keys = new Set([
            ...(oldKids ? Object.keys(oldKids) : []),
            ...(newKids ? Object.keys(newKids) : [])
        ]);

        let childChanged = false;
        for (const k of keys) {
            childChanged = emitDataDiffEvents(`${path}.${k}`, oldKids?.[k], newKids?.[k]) || childChanged;
        }


        // Two containers of the same kind with identical contents: no event
        const sameKind = oldKids && newKids && Array.isArray(oldVal) === Array.isArray(newVal);
        if (sameKind && !childChanged)
            return false;

        const type = oldVal === undefined ? "added"
                : newVal === undefined ? "deleted"
                : "changed";
        dispatchDataEvent(type, path, newVal, oldVal);
        return true;
    }
    
    function commitData(path, newVal){
        const keys = path.split(".");
        const last = keys.pop();
        let parent = state;

        for (const k of keys) {
            parent = parent?.[k];
            if (!isContainer(parent)) {
                log.error(`Cannot write "${path}": "${k}" is missing or not an object`);
                return;
            }
        }

        const oldVal = parent[last];
        if (newVal === undefined)
        {
            delete parent[last];
        } else {
            parent[last] = newVal;
        }

        emitDataDiffEvents(path, oldVal, newVal);
    }

    function mergeData(target, patch) {
        if (!isPlainObject(patch))
            return patch == null ? undefined : structuredClone(patch);

        const result = isPlainObject(target) ? structuredClone(target) : {};
        for (const [k, v] of Object.entries(patch)) {
            if (v == null)
            {
                delete result[k];
            } else {
                result[k] = mergeData(result[k], v);
            }
        }
        return result;
    }


    /**
     * Retrieves a value from the global state.
     */
    function getData(path)
    {
        return path.split(".").reduce((o, k) => (o != null ? o[k] : undefined), state);
    }


    function patchData(path, patch) {
        commitData(path, mergeData(getData(path), patch));
    }

    /**
     * Removes a value from the global state at a given path.
     * Fires data:removed and updates bound elements.
     */
    function removeData(path) {
        commitData(path, undefined);
    }

    /**
     * Sets a value in the global state and updates bound elements.
     * Path can be nested ("user.name").
     */
    function setData(path, value) {
        commitData(path, mergeData(undefined, value));
    }


    /**
     * Resets the entire state object to empty.
     * Fires data:removed for each cleared key.
     */
    function resetState() {
        for (const key of Object.keys(state)) {
            const oldValue = state[key];
            delete state[key];
            dispatchDataEvent("deleted", key, undefined, oldValue);
        }
    }

    /********************************************************************************
     * Subscribes to data events for a specific path.
     *
     * @param {"added"|"changed"|"deleted"|"*"} type - Event type, or "*" for all.
     * @param {string} pattern - Exact path ("user.name"), a subtree ("user.*"),
     *                           or "*" for every path.
     * @param {(e: {type, path, value, oldValue}) => void} handler
     * @returns {() => void} Call to unsubscribe.
     ********************************************************************************/
    function onData(type, pattern, handler) {
        const entry = { type, pattern, handler };
        dataListeners.add(entry);
        return () => dataListeners.delete(entry);
    }

    function matchesPath(pattern, path) {
        if (pattern === "*" || pattern === path)
            return true;

        // "user.*" matches user.name, user.profile.age, etc. (any depth)
        if (pattern.endsWith(".*"))
            return path.startsWith(pattern.slice(0, -1));

        return false;
    }


    /**
     * Finds elements bound to a given path and updates them.
     * Also fires lifecycle hooks (on-data-added, on-data-changed, etc.).
     */
    function dispatchDataEvent(type, path, value, oldValue) {

        updateDataBindings(path, value);

        const selector = `[on-data-${type}-key="${path}"]`;
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
            const handler = el.getAttribute(`on-data-${type}`);
            if (!handler)
                continue;

            const targetId = el.getAttribute(`on-data-${type}-target`);
            let targetElement = undefined;
            if (targetId) {
                targetElement = document.getElementById(targetId);
                if (!targetElement) {
                    log.warn(`on-data-${type}-target element not found: "${targetId}"`);
                }
            }

            try {
                invokeEventAction(handler, el, path, path, oldValue, value, targetElement);
            } catch (e) {
                log.error(`Error in on-data-${type} handler for ${path}:`, e);
            }

        }


        const parts = path.split(".");

        // iterate up the path chain: user.profile.name -> user.profile.*, user.*
        for (let i = parts.length - 1; i > 0; i--) {
            const key = parts.slice(0, i).join(".") + ".*";
            const selector = `[on-data-child-${type}-key="${key}"]`;

            const matches = document.querySelectorAll(selector);
            if (matches.length === 0) continue;

            for (const el of matches) {
                const handler = el.getAttribute(`on-data-child-${type}`);
                if (!handler)
                    continue;

                const targetId = el.getAttribute(`on-data-${type}-target`);
                let targetElement = undefined;
                if (targetId) {
                    targetElement = document.getElementById(targetId);
                    if (!targetElement) {
                        log.warn(`on-data-${type}-target element not found: "${targetId}"`);
                    }
                }

                invokeEventAction(handler, el, path, key, oldValue, value, undefined);
            }
        }

        for (const l of [...dataListeners]) {
            if (l.type !== "*" && l.type !== type)
                continue;

            if (!matchesPath(l.pattern, path))
                continue;

            try {
                l.handler({ type, path, value, oldValue });
            } catch (e) {
                log.error(`Error in onData handler for "${l.pattern}":`, e);
            }
        }

        dispatch("data:" + type, { path, value, oldValue });
    }


    function invokeEventAction(handler, el, key, matchedOn, oldValue, value, targetElement) {

        try {
            new Function("el", "key", "matchedOn", "value", "oldValue", "targetElement", handler)(
                el, key, matchedOn, value, oldValue, targetElement
            );

        } catch (e) {
            log.error(`Error in event handler:`, e);
        }
    }


    /**
     * Updates all elements that declare any data-bind-* attribute matching the key.
     *
     * @param {string} key  - The state key that changed.
     * @param {*} value     - The new value to bind.
     */
    function updateDataBindings(key, value) {
        // Query every element that might have bindings.
        const all = document.querySelectorAll("*");

        for (const el of all) {
            for (const attr of el.attributes) {
                if (!attr.name.startsWith("data-bind-")) continue;

                // Match only bindings for this specific key
                if (attr.value !== key) continue;

                // e.g. data-bind-text, data-bind-style-color → ["text"], ["style","color"]
                const targetPath = attr.name.split("-").slice(2);
                applyDataBinding(el, targetPath, value);
            }
        }
    }


    /**
     * Applies a binding to the element.
     *
     * @param {Element} el
     * @param {string[]} targetPath - e.g. ["text"], ["style","color"], ["attr","title"]
     * @param {*} value
     */
    function applyDataBinding(el, targetPath, value) {
        const [main, ...rest] = targetPath;

        switch (main) {
            case "text":
                el.textContent = value ?? "";
                break;

            case "html":
                el.innerHTML = value ?? "";
                break;

            case "value":
                el.value = value ?? "";
                break;

            case "class":
                // Replace full classList with the value (string or array)
                el.className = Array.isArray(value) ? value.join(" ") : (value ?? "");
                break;

            case "visible":
                el.style.display = value ? "" : "none";
                break;

            case "style":
                if (rest.length) {
                    const prop = rest.join("-");
                    el.style[prop] = value ?? "";
                }
                break;

            case "attr":
                if (rest.length) {
                    const name = rest.join("-");
                    if (value == null || value === false) el.removeAttribute(name);
                    else el.setAttribute(name, value);
                }
                break;

            default:
                // Generic fallback — treat as direct attribute set
                const name = targetPath.join("-");
                if (value == null || value === false) {
                    el.removeAttribute(name);
                } else {
                    el.setAttribute(name, value);
                }


                break;
        }
    }

    /**
     * Dispatches a CustomEvent with detail payload on document.
     */
    function dispatch(eventName, detail) {
        document.dispatchEvent(new CustomEvent(eventName, { detail }));
    }


    /**
     * Adds an event listener on document for framework events.
     */
    function on(eventName, handler) {
        document.addEventListener(eventName, handler);
    }

    // ---------------------------
    // Public API
    // ---------------------------
    return {
        initialize,
        on,
        onData,
        setData,
        getData,
        loadComponent,
        removeData,
        resetState,
        setMarkdownProcessor,
        renderMarkdown
    };



})();

// Auto-load on DOM ready
document.addEventListener("DOMContentLoaded", () => Frontend.initialize());
