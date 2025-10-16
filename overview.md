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
 * - Frontend.loadFragmentInto(parent, src, extraParams)
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
