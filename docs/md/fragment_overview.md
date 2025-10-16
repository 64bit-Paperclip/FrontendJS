
# Fragment

Fragments are lightweight, declarative content loaders. They let you pull in external HTML or Markdown files, substitute parameters, and compose pages dynamically without a full-page reload. Each `<fragment>` tag acts as a self-contained placeholder that’s replaced at runtime with the content from its `src`, optionally responding to conditions, parameters, and state updates.



## Attributes

Fragments are controlled entirely through their attributes. Each attribute defines how the fragment loads, substitutes data, or reacts to runtime
events such as success, error, or conditional logic.  

Below are the supported attributes and their behaviors.


### Summary

| Attribute       | Purpose |
|-----------------|----------|
| `id`            | Identifies the fragment for debugging or event targeting |
| `src`           | Primary URL to fetch content from |
| `param-*`       | Defines substitution variables for `{{placeholders}}` |
| `no-cache`      | Disables internal caching (always re-fetch) |
| `condition`     | JavaScript expression controlling which source to load |
| `fallback`      | Alternate URL if the condition fails or the source cannot load |
| `onload`        | Runs after the fragment successfully loads and inserts |
| `onerror`       | Runs if the fragment fails to load or parse |

### id
Each fragment can have an ID.

This is useful for:
- Logging and debugging
- Event dispatching (fragment:loaded includes the id)
- Targeting via Frontend.loadInto() or Frontend.getFragmentById()



```html
<fragment id="welcome-frag" src="/frags/index/hello.html">
    <!-- Fallback content -->
    <p>Welcome fragment failed to load.</p>
</fragment>
```



### src

Simplest form of a Fragment. Only the 'src' attribute is used.

&nbsp;

The fragment will:
- Fetch the HTML from the specified source.
- Replace this &lt;fragment&gt; tag with the fetched contents.
- Remove itself after insertion.
- Fire the 'fragment:loaded' event when done.

If fetching fails (e.g., 404 or network error), the contents
inside the &lt;fragment&gt; (if any) are used as fallback output.

```html
<fragment src="/frags/index/hello.html">
    <!-- Fallback content if src cannot be loaded -->
    <p>Could not load fragment content.</p>
</fragment>
```




### param-* 
Fragments can declare 'param-*' attributes.

Each param is available for {{substitution}} inside the fetched fragment HTML.

Example: a fragment containing "{{example}}" will be replaced by "Example Value".

The following fragment will:
- Fetch '/frags/index/hello.html'
- Replace all instances of {{example}} with "Example Value"


```html
<!-- Fragment Parameters-->
<fragment src="/frags/index/hello.html" param-example="Example Value">
    <!--
        Contents are used as fallback incase of faliure to load src or other error.
        Fragment will be removed, and contents will be put in its place.
    -->
</fragment>
```



### no-cache

Fragments support caching by default to improve performance. Adding the 'no-cache' attribute disables internal caching, forcing the framework to always re-fetch the content. This is useful when the source is dynamic or frequently changes.

Behavior:
- Always fetch fresh HTML from src (no cached result used).
- Otherwise behaves normally.


```html
<!-- Fragment Caching: prevents internal caching of results.-->
<fragment src="/frags/index/hello.html" no-cache>
    <!--
        Contents are used as fallback incase of faliure to load src or other error.
        Fragment will be removed, and contents will be put in its place.
    -->
</fragment>
```


### condition

The 'condition' attribute allows conditional rendering of fragments.

The value is a JavaScript expression evaluated in context.

Available variables: 
- frag  (fragment context object)
- el    (the <fragment> element itself)

If the condition evaluates:
    true  -> the 'src' is loaded and rendered.
    false -> the <fragment> is removed entirely from the DOM.

Example:
    condition="window.userLoggedIn === true"

```html
<fragment id="frag-conditional" src="/frags/index/hello.html" condition="window.userLoggedIn === true">
    <!-- Fallback content (only used if fetch fails or an error occurs, not for condition) -->
    <p>Could not load user content.</p>
</fragment>
```

### fallback
When both 'condition' and 'fallback' are defined:

- The 'condition' is evaluated as JavaScript.
- If true, loads 'src'.
- If false, loads the 'fallback' URL instead.
- If both fail to load, uses inline fallback content.

This enables graceful UI branching:
    e.g., load a "success" fragment if a user is logged in,
    or a "failure" fragment if not.

```html
<fragment id="frag-conditional-fallback" src="/frags/index/condition_success.html" condition="window.userLoggedIn === true" fallback="/frags/index/condition_fail.html">
    <!-- Fallback content if both src and fallback fail -->
    <p>Could not load either success or fail fragment.</p>
</fragment>
```



### onload

The 'onload' handler is executed after the fragment's content
has been fetched, substituted, parsed, and inserted into the DOM.

It receives the following arguments:

    onload(el, nodes, src, frag)

    el    - The original <fragment> element before it was replaced.
    nodes - An array of the new DOM nodes that replaced the fragment.
    src   - The loaded source URL.
    frag  - Fragment metadata object (id, params, src, etc.)

The handler can be a function call or inline JavaScript.
Useful for initializing widgets, binding events, or logging success

```html
<fragment id="frag-onload-example" src="/frags/widgets/chart.html" param-chart-id="sales-2025" onload="handleChartLoad(el, nodes, src, frag)">
    <!-- Fallback content -->
    <p>Chart failed to load.</p>
</fragment>
```


### onerror

The `onerror` attribute defines a handler that runs if fragment loading fails  
(e.g., network error, invalid source, or condition failure without fallback).

This allows custom error handling such as logging, retrying, or dynamically
rendering alternate content.

The handler receives the same arguments as `onload`:


| Argument | Description |
|-----------|--------------|
| **el** | The original `<fragment>` element before it was removed |
| **err** | The caught error object or failure reason |
| **src** | The source URL that failed to load |
| **frag** | Fragment metadata object (id, params, src, etc.) |

**Example:**

```html
<fragment
    id="frag-with-error"
    src="/frags/missing.html"
    onerror="console.error('Fragment failed:', src, err)"
>
    <p>Sorry, content could not be loaded.</p>
</fragment>
```

## Markdown Fragments (`.md`, `.markdown`, `.mkd`)

Fragments can load Markdown files directly.  
If the `src` ends with `.md`, `.markdown`, or `.mkd`, the content is automatically
passed through the registered Markdown processor (`Frontend.renderMarkdown()`).

**Behavior:**
- Fetches and converts Markdown to HTML.  
- Applies parameter substitution (`{{param}}`).  
- Replaces the `<fragment>` element with the rendered HTML.  
- Highlights `<code>` blocks via Highlight.js if available.  

### Example

````html
<fragment src="/docs/intro.md" param-version="1.2.0">
    <p>Could not load documentation.</p>
</fragment>
````



## Nested Fragments

Fragments may contain other `<fragment>` tags.  
When a parent fragment loads, the framework recursively loads any nested fragments inside it.

### Example

````html
<fragment src="/frags/dashboard.html">
    <p>Loading dashboard...</p>
</fragment>
````

If `/frags/dashboard.html` itself contains nested fragments, each is also resolved and replaced.


## Event: `fragment:loaded`

This global event is dispatched whenever a fragment successfully loads and replaces
its `<fragment>` element in the DOM.

It fires **after**:
1. The source (HTML or Markdown) has been fetched.
2. Any `{{param}}` substitutions have been applied.
3. The new content has been parsed and inserted.
4. Code highlighting and trigger bindings have run.

**Event Target:** `document`  
**Event Type:** `CustomEvent`

**Event Detail Object:**

```
{
  id: string | null,    // fragment id, if one was set
  src: string,          // resolved source URL that was loaded
  nodes: Node[]         // DOM nodes that replaced the <fragment> element
}
```

##### Example Listener

````js
document.addEventListener("fragment:loaded", (e) => {
    const { id, src, nodes } = e.detail;
    console.log("Fragment loaded:", id || "(no id)", "from", src);
    console.log("Inserted nodes:", nodes);
});
````

**Notes:**
- Fired once per fragment as soon as its DOM replacement completes.
- Not fired if the fragment falls back to inline content or is removed due to `condition`.
- Nested fragments emit their own `fragment:loaded` events independently.
