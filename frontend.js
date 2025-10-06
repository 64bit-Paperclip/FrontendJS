/**
 * Frontend.js
 * 
 * A tiny framework for building pages out of <fragment> elements
 * with lightweight state and data binding.
 * 
 * -----------------------------------------------------------------------------
 * Core Concepts:
 * -----------------------------------------------------------------------------
 * - <fragment src="..."> elements act as HTML "includes".
 * - Fragments are automatically fetched, injected, and processed.
 * - Scripts and links inside fragments are promoted and executed correctly.
 * - Parameters can be passed into fragments and substituted with {{param}}.
 * - Conditions and fallbacks let fragments load dynamically.
 * - Global state and data-binding provide reactive updates without a framework.
 * 
 * -----------------------------------------------------------------------------
 * Usage:
 * -----------------------------------------------------------------------------
 *   <fragment src="header.html"></fragment>
 *   <fragment id="user-profile" src="profile.html" param-theme="dark"></fragment>
 *   <fragment src="footer.html"></fragment>
 *
 *   <script>
 *     Frontend.on("fragment:loaded", e => {
 *       console.log("Loaded:", e.detail.src, "id:", e.detail.id);
 *       if (e.detail.id === "user-profile") {
 *         initUserProfile(e.detail.nodes);
 *       }
 *     });
 *
 *     Frontend.on("page:load_complete", e => {
 *       console.log(`Page assembled with ${e.detail.count} fragments`);
 *     });
 *   </script>
 *
 * -----------------------------------------------------------------------------
 * Fragment Features:
 * -----------------------------------------------------------------------------
 * - <fragment src="path.html"></fragment>
 *     Loads an external file into the DOM at that location.
 * 
 * - id="..." 
 *     Identifies the fragment in events and params.
 * 
 * - condition="jsExpression"
 *     If the expression evaluates to false, the fragment is skipped.
 * 
 * - fallback="path.html"
 *     Alternate src to use if condition fails.
 * 
 * - param-key="value"
 *     Pass parameters into the fragment. Inside the fragment HTML,
 *     use placeholders like {{key}}.
 *
 * - Built-in params automatically provided:
 *     {{frag_id}}  → fragment id, if set
 *     {{frag_src}} → original src path
 *
 * - State substitution:
 *     If a placeholder is not found in params, it will fall back to
 *     the global state (via Frontend.getData). Dot-paths are supported,
 *     e.g. {{user.name}} or {{settings.theme}}.
 *
 * - Recursive:
 *     Fragments can themselves contain <fragment> tags.

 *
 * -----------------------------------------------------------------------------
 * Script & Link Handling:
 * -----------------------------------------------------------------------------
 * - <script src="..."></script> (external):
 *     Promoted to <head>. Only loaded once per src.
 * 
 * - <script> ... </script> (inline):
 *     Re-inserted to force execution each time fragment is injected.
 * 
 * - <link rel="stylesheet" href="...">:
 *     Promoted to <head>. Prevents duplicates based on rel + href.
 *
 * -----------------------------------------------------------------------------
 * State & Data Binding:
 * -----------------------------------------------------------------------------
 * A simple reactive state system lets you bind DOM elements to keys.
 * 
 * - Set data:
 *     Frontend.setData("user.name", "Alice");
 *
 * - Get data:
 *     Frontend.getData("user.name"); // → "Alice"
 *
 * - Remove data:
 *     Frontend.removeData("user.name");
 *
 * - Reset state:
 *     Frontend.resetState(); // clears all keys
 *
 * - Bind elements:
 *     <span data-binding="user.name"></span>
 *       → auto-updates textContent when user.name changes
 *
 * - Lifecycle attributes:
 *     <div data-binding="user"
 *          on-data-add="console.log('added', value)"
 *          on-data-change="console.log('changed', oldValue, '→', value)"
 *          on-data-delete="console.log('deleted', oldValue)"
 *          on-data-child-add="console.log('child added', key, value)"
 *          on-data-child-change="console.log('child changed', key, oldValue, '→', value)"
 *          on-data-child-delete="console.log('child deleted', key, oldValue)">
 *     </div>
 *
 * Events dispatched on document:
 *   - data:added    { path, value }
 *   - data:changed  { path, value, oldValue }
 *   - data:removed  { path, oldValue }
 *
 * -----------------------------------------------------------------------------
 * Framework Events:
 * -----------------------------------------------------------------------------
 * - "fragment:loaded"
 *     Fired for each fragment after injection.
 *     detail: { id, src, nodes }
 *
 * - "page:load_complete"
 *     Fired once when all fragments have been processed.
 *     detail: { count, finishedAt }
 *
 * - "data:*" (added/changed/removed)
 *     Fired when state changes.
 *
 * -----------------------------------------------------------------------------
 * Public API:
 * -----------------------------------------------------------------------------
 * - Frontend.load(root=document)
 *     Manually process fragments inside a root node.
 *
 * - Frontend.loadInto(parent, src, extraParams)
 *     Programmatically load a fragment into a given parent element.
 *
 * - Frontend.setData(path, value)
 * - Frontend.getData(path)
 * - Frontend.removeData(path)
 * - Frontend.resetState()
 *     Manage global reactive state.
 *
 * - Frontend.on(event, handler)
 *     Listen for framework events (fragment, page, data).
 *
 * -----------------------------------------------------------------------------
 * Philosophy:
 * -----------------------------------------------------------------------------
 * - Easy, clean, lazy, simple front-end includes
 * - Lightweight reactivity without a virtual DOM
 * - Build websites from reusable HTML fragments
 * - No heavy framework overhead, just enough structure to stay maintainable
 */



const Frontend = (() => {

    /**
     * Main entry point: loads all <fragment src="..."> elements inside root.
     * Recursively processes nested fragments.
     * Dispatches `fragment:loaded` for each fragment and `page:load_complete` when done.
     */
    async function load(root = document) {
        const fragments = Array.from(root.querySelectorAll("fragment[src]"));
        let loadedCount = 0;

        for (const frag of fragments) {

            const fragId = frag.id || null;
            const src = frag.getAttribute("src");
            const condition = frag.getAttribute("condition");
            const fallback = frag.getAttribute("fallback");
            const params = collectParams(frag, src, fragId);

            try {
                // --- Resolve target source ---
                const targetSrc = resolveSource(src, condition, fallback, frag);
                if (!targetSrc) continue;

                // --- Fetch HTML ---
                const html = await fetchFragment(targetSrc, frag);
                if (!html) continue;

                // --- Param substitution ---
                const substituted = substituteParams(html, params);

                // --- Parse & replace ---
                const newNodes = parseFragment(substituted, frag);

                // --- Run scripts & links ---
                newNodes.forEach(n => {
                    handleLinks(n);
                    runScripts(n);
                });

                // --- Fire event ---
                dispatch("fragment:loaded", { id: fragId, src: targetSrc, nodes: newNodes });
                loadedCount++;

                // --- Nested fragments ---
                for (const n of newNodes) {
                    if (n.nodeType === Node.ELEMENT_NODE) {
                        await load(n);
                    }
                }

            } catch (err) {
                console.error("Unexpected fragment error:", err);
                frag.remove();
            }
        }

        // --- Global complete event ---
        if (root === document && !document.querySelector("fragment[src]")) {
            dispatch("page:load_complete", { count: loadedCount, finishedAt: Date.now() });
        }
    }

    /**
     * Programmatically load a fragment into a parent node.
     * 
     * @param {Element} parent   The DOM element to insert into.
     * @param {string} src       Path to the fragment file.
     * @param {Object} extraParams Optional params to merge into substitution.
     * @returns {Promise<Element[]>} The inserted nodes.
     */
    async function loadInto(parent, src, extraParams = {}) {
        const fragId = parent.id || null;

        // Base params
        const params = {
            ...(extraParams || {}),
            frag_src: src
        };
        if (fragId) params.frag_id = fragId;

        try {
            // --- Fetch HTML ---
            const html = await fetchFragment(src, parent);
            if (!html) return [];

            // --- Param substitution ---
            const substituted = substituteParams(html, params);

            // --- Parse into wrapper ---
            const wrapper = document.createElement("div");
            wrapper.innerHTML = substituted;

            // --- Insert into parent ---
            const newNodes = Array.from(wrapper.childNodes);
            parent.append(...newNodes);

            // --- Run scripts & links ---
            newNodes.forEach(n => {
                handleLinks(n);
                runScripts(n);
            });

            // --- Fire event ---
            dispatch("fragment:loaded", { id: fragId, src, nodes: newNodes });

            // --- Nested fragments ---
            for (const n of newNodes) {
                if (n.nodeType === Node.ELEMENT_NODE) {
                    await load(n);
                }
            }

            return newNodes;

        } catch (err) {
            console.error("Unexpected fragment error:", err);
            return [];
        }
    }


    // ---------------------------
    // Helpers
    // ---------------------------

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

        if (fragId) params.frag_id = fragId;
        params.frag_src = src;
        return params;
    }

    /**
     * Resolves which source URL to use for a fragment.
     * - Evaluates `condition` if present
     * - Falls back to `fallback` if condition fails
     * - Removes the fragment if neither apply
     */
    function resolveSource(src, condition, fallback, frag) {
        if (!condition) return src;

        try {
            const ok = Function(`return (${condition});`)();
            if (ok) return src;
        } catch (e) {
            console.error("Invalid fragment condition:", condition, e);
        }

        if (fallback) return fallback;
        frag.remove();
        return null;
    }

    /**
     * Fetches the HTML for a fragment source URL.
     * Removes the fragment and returns null if fetch fails.
     */
    async function fetchFragment(src, frag) {
        try {
            const response = await fetch(src);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.text();
        } catch (e) {
            console.error(`Failed to load fragment "${src}":`, e);
            frag.remove();
            return null;
        }
    }

    /**
     * Performs {{param}} substitution in a fragment’s HTML string.
     * 
     * Priority order:
     *   1. Fragment-level params (from param-* attributes, frag_id, frag_src)
     *   2. Global state values (via Frontend.getData)
     * 
     * Supports dot-notation paths (e.g., {{user.name}}).
     * 
     * @param {string} html   The raw HTML text to process.
     * @param {Object} params Key-value pairs collected from the fragment element.
     * @returns {string} The HTML string with placeholders replaced.
     *
     * Example:
     *   params = { theme: "dark", frag_id: "profile" }
     *   state  = { user: { name: "Alice" } }
     *
     *   Input:  "<div class='{{theme}}'>{{user.name}} ({{frag_id}})</div>"
     *   Output: "<div class='dark'>Alice (profile)</div>"
     */
    function substituteParams(html, params) {
        return html.replace(/{{\s*(\w+(\.\w+)*)\s*}}/g, (_, key) => {
            // 1. Explicit fragment params take priority
            if (params[key] !== undefined) return params[key];

            // 2. Fallback to global state (dot paths supported)
            const stateVal = getData(key);
            if (stateVal !== undefined) return stateVal;

            // 3. Unknown → empty string
            return "";
        });
    }


    /**
     * Parses HTML into DOM nodes and replaces the original fragment.
     * Returns an array of the new nodes.
     */
    function parseFragment(html, frag) {
        const wrapper = document.createElement("div");
        wrapper.innerHTML = html;
        const newNodes = Array.from(wrapper.childNodes);
        frag.replaceWith(...newNodes);
        return newNodes;
    }

    /**
     * Promotes <link> elements into <head>, avoiding duplicates.
     * Removes them from the body if already present.
     */
    function handleLinks(node) {
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
            node.querySelectorAll("link").forEach(handleLinks);
        }
    }

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
            console.error("Script execution error:", err);
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
        if (old.textContent) s.textContent = old.textContent;
        old.parentNode.insertBefore(s, old);
        old.remove();
    }

    /**
     * Sets a value in the global state and updates bound elements.
     * Path can be nested ("user.name").
     */
    function setData(path, value) {
        const keys = path.split(".");
        let obj = state;
        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!(k in obj)) obj[k] = {};
            obj = obj[k];
        }
        const lastKey = keys[keys.length - 1];
        const existed = lastKey in obj;
        const oldValue = obj[lastKey];

        if (value === null || value === undefined) {
            if (existed) {
                delete obj[lastKey];
                updateBindings(path, value, "delete", oldValue);
                dispatch("data:removed", { path, oldValue });
            }
            return;
        }

        obj[lastKey] = value;

        if (!existed) {
            updateBindings(path, value, "add", oldValue);
            dispatch("data:added", { path, value });
        } else {
            updateBindings(path, value, "change", oldValue);
            dispatch("data:changed", { path, value, oldValue });
        }
    }


    /**
     * Retrieves a value from the global state.
     */
    function getData(path) {
        return path.split(".").reduce((o, k) => (o ? o[k] : undefined), state);
    }

    /**
     * Removes a value from the global state at a given path.
     * Fires data:removed and updates bound elements.
     */
    function removeData(path) {
        const keys = path.split(".");
        let obj = state;
        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!(k in obj)) return; // nothing to remove
            obj = obj[k];
        }
        const lastKey = keys[keys.length - 1];
        if (lastKey in obj) {
            const oldValue = obj[lastKey];
            delete obj[lastKey];
            updateBindings(path, undefined, "delete", oldValue);
            dispatch("data:removed", { path, oldValue });
        }
    }

    /**
     * Resets the entire state object to empty.
     * Fires data:removed for each cleared key.
     */
    function resetState() {
        for (const key of Object.keys(state)) {
            const oldValue = state[key];
            delete state[key];
            updateBindings(key, undefined, "delete", oldValue);
            dispatch("data:removed", { path: key, oldValue });
        }
    }


    /**
     * Finds elements bound to a given path and updates them.
     * Also fires lifecycle hooks (on-data-add, on-data-change, etc.).
     */
    function updateBindings(path, value, type, oldValue) {
        const nodes = document.querySelectorAll(`[data-binding="${path}"]`);

        nodes.forEach(el => {
            // Default behavior: update textContent if not otherwise handled
            if (!el.hasAttribute("on-data-change") &&
                !el.hasAttribute("on-data-add") &&
                !el.hasAttribute("on-data-delete")) {
                el.textContent = value ?? "";
            }

            // Fire lifecycle attributes
            const attr = `on-data-${type}`;
            if (el.hasAttribute(attr)) {
                try {
                    new Function("el", "value", "oldValue", el.getAttribute(attr))(el, value, oldValue);
                } catch (e) {
                    console.error(`Error in ${attr} handler:`, e);
                }
            }
        });

        // Handle parent bindings (object-level child events)
        const parentPath = path.split(".").slice(0, -1).join(".");
        const key = path.split(".").pop();
        if (parentPath) {
            const parentEls = document.querySelectorAll(`[data-binding="${parentPath}"]`);
            parentEls.forEach(el => {
                const attr = `on-data-child-${type}`;
                if (el.hasAttribute(attr)) {
                    try {
                        new Function("el", "key", "value", "oldValue",
                            el.getAttribute(attr))(el, key, value, oldValue);
                    } catch (e) {
                        console.error(`Error in ${attr} handler:`, e);
                    }
                }
            });
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
        load,
        loadInto,
        on,
        setData,
        getData,
        removeData,
        resetState
    };



})();

// Auto-load on DOM ready
document.addEventListener("DOMContentLoaded", () => Frontend.load());
