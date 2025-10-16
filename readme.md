
# Frontend.js

Frontend.js is a tiny, dependency-free framework for composing web pages from reusable HTML fragments and creating reactive data driven pages.

It uses the <fragment> element with a src attribute to include external pieces of markup directly in your page, letting you assemble complete layouts from modular parts without any build step or framework overhead. Each fragment remains a valid, standalone HTML file — making your site natively composable, inspectable, and portable.

Alongside composition, Frontend.js provides a minimal state and data layer for simple reactive behavior. Changes to data emit clear, structured events that update bound elements or trigger custom logic, allowing dynamic pages and live UI updates without hidden watchers or virtual DOMs.

---

## Table of Contents
1. [Design Goals and Philosophy](#design-goals-and-philosophy)
2. [Core Concepts](#core-concepts)
3. [Fragments](#fragments)
4. [State and Data Binding](#state-and-data-binding)
5. [Framework Events](#framework-events)
6. [Public API](#public-api)
7. [License](#license)

---

## 1. Design Goals and Philosophy

Frontend.js was created around a simple idea:  The modern web browser already provides everything needed to build modular, reactive interfaces without layers of abstraction or complex build tooling.

Its design focuses on four core principles:

1. **IJFW&trade;** – It Just F@#*$&! Works.
2. **Declarative composition** – use plain HTML as the structure of your application.  
3. **Explicit reactivity** – data changes trigger events, not hidden updates.  
4. **Zero ceremony** – no compilers, no configs, no invisible runtime behavior.


Frontend.js exists to restore simplicity to front-end development.  To let developers build real applications in plain HTML and JavaScript, without toolchains or mental overhead.  To bring the web back to something you can view, edit, and understand directly; the way it was meant to be.

Most frameworks try to be “smart,” automatically watching data, managing lifecycles, and updating views.  
That works until it doesn’t. The moment you need behavior outside the expected path, you end up fighting the framework instead of using it.

Frontend.js takes the opposite approach: it stays predictable.  When you call `setData`, an event fires. Elements that listen react. That’s it.  

No hidden watchers. No background updates. No surprises.  You decide what belongs in state, when it changes, and how the page responds.  If you want automation, you can build it on top. The foundation always stays simple though, and that’s the point.

### 1.1. IJFW™ | The Core Principle

***Frontend.js*** is built on one idea: **It Just F@#*$&!  Works.**

The web was meant to be simple. HTML, CSS, and JavaScript already form a complete, open platform.  
Yet modern front-end development has buried that simplicity under layers of abstraction, tooling, and dependencies that serve the framework instead of the developer.  

Every year, a new "solution" appears claiming to fix the mess left by the last one.  It arrives with 10x as many new concepts to learn as the last version, 20x the configuration files, 100x more dependencies, and endless promises of stability, while breaking something in every minor release for two years straight.  Then, once it finally reaches "stable," the author announces that the next major version will be a complete rewrite.  

What used to be a straightforward craft has turned into a midwit's playground of complexity.  Endless build systems, virtual DOMs, reactive proxies, and lifecycles that need lifecycles.  All to replicate what the browser already does natively.  

***Frontend.js*** rejects all of it.  No hidden reactivity. No virtual layer. No build tools pretending to be innovation.  
It keeps the browser in charge and the developer in control.  

**It Just F@#*$&!  Works** means exactly that: it just works.  You do not need to learn twenty new concepts.  You do not need to memorize a framework's design patterns that will change again next year.  You already know HTML, JavaScript, and CSS. You can write them, and your site just works.



### 1.2. Declarative Composition | HTML as the Application Language

Frontend.js treats HTML as the structure of your application.  
There are no custom components, virtual DOMs, or build steps — everything you write remains valid, readable HTML that runs natively in the browser.

- **Fragments** are just HTML files.  
- **Parameters** are just attributes.  
- **Bindings** are just attributes that respond to data events.  

If you know HTML, you already know how to build with Frontend.js.

#### 1.2.1 Minimal by Design

***Frontend.js*** extends HTML rather than replacing it.  Its few new ideas, fragments, parameters, and bindings, are not inventions, but natural continuations of what HTML was always meant to do: compose structure, pass data, and react to change.

This is what “minimal” means here: not fewer features, but fewer concepts to learn.  
Everything builds on the language the browser already understands.

By keeping the mental model rooted in HTML itself, ***Frontend.js*** makes composition truly declarative.  
You describe structure, relationships, and behavior directly in markup — without an extra framework layer or new syntax in between.

#### 1.2.2 Progressive by Nature

Because it builds on native concepts, ***Frontend.js*** enhances the platform without locking you in.  Remove it, and your markup still makes sense.  Flatten your fragments, and you are left with static, valid HTML that works on its own.

That is declarative composition taken to its logical conclusion:  
you can assemble complex pages from simple parts, but the result is still just a web page — readable, portable, and native.


### 1.3. Explicit Reactivity | Event-Driven Not Black-Box Magic

Most frameworks hide reactivity behind declarative bindings or diffing engines.  
Frontend.js takes the opposite stance: it exposes reactivity as plain, observable events.

When data changes, the framework dispatches structured events (`data:added`, `data:changed`, `data:removed`) and lets you decide how to respond.  
Handlers are written inline, as direct expressions or function calls, so the logic is transparent and localized.

This design avoids the complexity of “magic” reactive systems while keeping reactivity first-class and predictable.

#### 1.3.1. Minimal State Layer

The state system in Frontend.js is intentionally small and predictable.  It is built around a single idea: ***data should be explicit***.

There are no proxies, observers, or dependency trackers hidden under the surface.  The framework never decides when to update. You do. You decide what belongs in state, and when it should change.  Every data access flows through two clear operations:

```js
Frontend.setData(path, value);
Frontend.getData(path);
```
This simple get/set model is the backbone of all reactivity in Frontend.js.  
Because the data layer is so direct, it is both transparent and reliable.  

#### 1.3.2. Transparency Over Abstraction

Every behavior in Frontend.js can be explained in a few lines of JavaScript.  
There is no compiler, no runtime diffing, and no framework magic.  
The entire library is small enough to read and understand — and that is by design.

You can inspect the network requests for fragments, read the substituted HTML, and even watch data events in the browser console.  
This level of transparency helps developers trust what the framework is doing and modify it safely.


### 1.4. Zero Ceremony | Compose, Don’t Compile

Every `<fragment>` tag is a promise of composition — the ability to assemble entire pages from reusable parts.  
Because fragments load natively in the browser, there are no bundlers, imports, or dependency graphs to manage.

You can build an entire multi-page site or SPA as a collection of self-contained HTML fragments that reference one another directly.  
The system processes nested fragments, executes scripts, and resolves styles automatically — so your pages remain modular, but your workflow stays frictionless.

#### 1.4.1 Built by the Browser

Frontend.js relies on the platform, not on a build system.  
HTML, CSS, and JavaScript already know how to work together. ***Frontend.js*** simply lets them do so declaratively.  

No build steps. No “dev mode.” No toolchain between your code and what the user sees.  
What you author in HTML is what actually runs in the browser.

#### 1.4.2 Inspectable by Design

Because composition happens in the open, you can view every fragment request, inspect substituted markup, and see the live DOM exactly as it’s built.  
There’s no virtual layer or compiler hiding your structure — just HTML doing HTML’s job.  

This transparency makes debugging and iteration immediate: open DevTools, and you’re looking at the real thing.  

#### 1.4.3 The Web as It Is

Frontend.js doesn’t abstract the web; it restores it.  
Your code isn’t transformed, compiled, or interpreted — it’s simply *used*.  
Composition, state, and behavior all happen in the language of the browser itself.

Zero ceremony isn’t about doing less work — it’s about removing everything that isn’t necessary to build.


## 2. Core Concepts

Frontend.js is built around a few small but powerful ideas.  Each concept exists to make building with plain HTML and JavaScript more modular, predictable, and maintainable.

### 2.1. Fragments

**Fragments** are the foundation of Frontend.js.  They let you break a page into modular, reusable HTML files and load them dynamically at runtime.  

Each `<fragment>` tag acts as a declarative include:  it fetches an external HTML file, injects it into the document, and processes any scripts, styles, or placeholders inside.  

Fragments can accept parameters, load conditionally, and even contain other fragments, making them flexible enough to represent layouts, widgets, or entire views. In short, fragments let you compose a full application from plain HTML files without a build system or component framework.

### 2.2. State and Data

Frontend.js includes a minimal reactive state layer.  It provides a simple way to store, retrieve, and react to shared data across fragments.

Instead of introducing complex data models or watchers, the framework exposes a small set of functions (`setData`, `getData`, `removeData`, `resetState`) that control global state.  
When data changes, Frontend.js dispatches clear, structured events, giving you full control over how the page responds.

This direct approach keeps data flow easy to reason about.  There is no hidden magic or automatic rendering, just predictable cause and effect.


### 2.3. Events and Bindings

Events and bindings form the reactive core of ***Frontend.js***.  Whenever data changes through `Frontend.setData`, `Frontend.removeData`, or similar calls, the framework does two things:

1. It dispatches a structured global event (for example, `data:added`, `data:changed`, or `data:removed`) on the `document`.
2. It finds all elements bound to that data path and triggers any matching inline handlers defined on them.

A **binding** is an attribute on an element that declares interest in a specific piece of data.  
For example, `data-binding="user.name"` means the element listens for events affecting that key.  
Each element can define what to do when those events occur through attributes such as `on-data-change`, `on-data-add`, or `on-data-delete`.

**Example:**

```html
<span data-binding="user.name"
      on-data-change="this.textContent = value"
      on-data-delete="this.textContent = ''">
</span>
```

---

Together, these three ideas — **fragments**, **state**, and **events** — form the entire foundation of Frontend.js.  
They are small by design, but powerful enough to build complete, modular, reactive interfaces in plain HTML.

---



## 3. Fragments

Fragments are the foundation of Frontend.js.  They let you build pages from modular HTML files that are loaded, parameterized, and processed directly in the browser. No build tools, imports, or virtual components required.

A fragment is simply an HTML include with a few optional attributes that control how and when it loads.  
Together, these provide declarative composition for your site: structure through markup, not JavaScript.


### 3.1. Declaration & Basic Attributes

A fragment is declared with the `<fragment>` tag and at least a `src` attribute.  
It can also define an `id`, `condition`, and `fallback` for more controlled behavior.

```html
<fragment src="header.html"></fragment>
<fragment id="sidebar" src="sidebar.html"></fragment>
<fragment id="page_footer" src="footer.html"></fragment>
<fragment src="admin-panel.html" fallback="not-authorized.html" condition="Frontend.getData('user.role') === 'admin'"></fragment>
```

Each attribute serves a specific role:

-   **`src`** – The path to the HTML file to include.
-   **`id`** – A unique identifier, useful for event targeting and parameter passing.
-   **`condition`** – A JavaScript expression that decides whether the fragment should load.
-   **`fallback`** – A backup file that loads if the condition fails.
    
Fragments are processed in document order and can contain other fragments, allowing you to compose entire sites from nested, reusable HTML pieces.

#### 3.1.1. Identifier Attribute

`id="..."`  Gives a fragment a unique name within the document.  This ID is useful for identifying fragments in lifecycle events or for injecting parameters.

**Example:**

```html
<fragment id="sidebar" src="sidebar.html"></fragment>

<script>
  Frontend.on("fragment:loaded", e => {
    if (e.detail.id === "sidebar") {
      console.log("Sidebar fragment loaded");
    }
  });
</script>
```

#### 3.1.1. Src Attribute
Each `<fragment>` has a `src` attribute that points to an external HTML file.  
When the page is loaded, Frontend.js fetches the referenced file, parses its contents, and replaces the `<fragment>` element with the resulting DOM nodes.

The `id` is also passed automatically as the built-in `{{frag_id}}` parameter.

#### 3.1.1. Condition Attribute
`condition="..."`  Specifies a JavaScript expression that determines whether the fragment should load.

If the expression evaluates to `false`, the fragment is skipped.  If the expression throws or fails, the fragment is removed silently unless a **fallback** is provided.

**Example:**
```html
<fragment src="admin-panel.html" condition="Frontend.getData('user.role') === 'admin'"></fragment>
```
This loads the admin panel only when the user’s role is `"admin"`.

#### 3.1.1. Fallback Attribute

`fallback="path.html"`  Specifies an alternate file to load if the `condition` fails.

Example:

```html
<fragment src="admin-panel.html" fallback="not-authorized.html" condition="Frontend.getData('user.role') === 'admin'"></fragment>
```

If the user is not an admin, `not-authorized.html` is loaded instead. This provides a clean declarative way to handle conditional layouts, permission checks, and feature gating directly in markup.



### 3.2. Fragment Parameters 
Fragments can receive data through attributes and dynamic substitution.  
This system allows each fragment to be customized at load time, without requiring a templating engine or build process.

#### 3.2.1. Parameter Attributes
Attributes prefixed with `param-` define key/value pairs passed into the fragment.  
Inside the fragment’s HTML, placeholders wrapped in `{{...}}` are replaced with these values.

**Example:**

```html
<fragment src="profile.html" param-name="Alice"  param-theme="dark"></fragment>
```

Then inside `profile.html`:

```html
<div class="{{theme}}">
  <h2>{{name}}</h2>
</div>
```

After loading, this renders as:

```html
<div class="dark">
  <h2>Alice</h2>
</div>
```

#### 3.2.2. Built-in Parameters

Each fragment automatically receives two built-in variables:

| Placeholder | Description |
|--------------|--------------|
| `{{frag_id}}`  | The fragment’s `id`, if set |
| `{{frag_src}}` | The original `src` path that was loaded |

These are injected automatically and available to use in any fragment template.

Example:

```html
<fragment id="footer" src="footer.html"></fragment>
```

In `footer.html`:

```html
<footer>Fragment: {{frag_id}} (source: {{frag_src}})</footer>
```

---

#### 3.2.3. State Substitution and Global Fallback

If a placeholder does not match any fragment-level parameter, ***Frontend.js*** attempts to resolve it from the **global state**.

**Example:**

```js
Frontend.setData("user.name", "Alice");
Frontend.setData("settings.theme", "dark");
```

```html
<fragment src="profile.html"></fragment>
```

**profile.html:**

```html
<div class="{{settings.theme}}"> Welcome back, {{user.name}}! </div>
```

Even though no `param-*` attributes were defined, the placeholders resolve automatically using global state values. This makes it trivial to build fragments that are both reusable and globally aware.


### 3.3. Fragment Parsing & Recursive Evaluation

Fragments are processed in document order, and the system supports **nested fragments**, so you can compose complex layouts recursively. When Frontend.js loads a fragment, it automatically scans the new content for additional `<fragment>` tags and processes them recursively.

This means you can build complete layouts out of independent, reusable partials:

```html
<!-- main.html -->
<fragment src="layout/header.html"></fragment>
<fragment src="content/home.html"></fragment>
<fragment src="layout/footer.html"></fragment>
```

If `home.html` contains its own fragments (for example, widgets or components), they are also loaded automatically. This recursive behavior lets you think of your site as a tree of fragments rather than a single static page.

---

### 3.4. Dynamic Fragment Loading with JavaScript

Fragments can also be loaded programmatically using the API method `Frontend.loadInto(parent, src, extraParams)`.

Example:

```js
const container = document.querySelector("#content");
Frontend.loadInto(container, "profile.html", { userId: 42, theme: "dark" });
```

This behaves exactly like a declarative fragment, but gives you control at runtime.



### 3.5. Lifecycle and Events

Each fragment triggers a lifecycle event once it finishes loading:

```js
Frontend.on("fragment:loaded", e => {
  console.log("Fragment loaded:", e.detail.src, "id:", e.detail.id);
});
```

Event detail includes:
```js
{
  id: "profile",
  src: "profile.html",
  nodes: [ ...inserted DOM nodes... ]
}
```

When all fragments on the page have been processed, Frontend.js dispatches a single global event:

```js
Frontend.on("page:load_complete", e => {
  console.log("All fragments loaded:", e.detail.count);
});
```

---
### 3.6. Error Handling

***Frontend.js*** follows a non-blocking design philosophy:  a single failed fragment should never stop the rest of the page from rendering.

If a fragment fails to load (for example, due to a network error, missing file, or invalid path), it is automatically removed from the DOM and an error message is written to the console.  
The message includes the fragment `id` (if present) and the `src` that failed, making it simple to identify and correct.

This approach ensures that even if one fragment fails, the rest of the page continues to function normally.  
The framework prioritizes resilience and user experience over strict rendering completeness.

> **Roadmap Note**
> A future update will introduce a dispatched event when a fragment fails to load, allowing applications to detect and respond programmatically (for example, to show a placeholder or retry automatically).

### 3.7. Script and Link Handling

Frontend.js manages scripts and styles within fragments so they behave predictably when loaded dynamically.  
This makes each fragment self-contained and capable of acting like a reusable component without duplicate imports or execution issues.

#### 3.7.1. External Scripts

`<script src="..."></script>`  
External scripts are promoted to the `<head>` element and only loaded once per unique `src`.  
This prevents duplicate network requests and ensures libraries or utilities shared by multiple fragments are only initialized once.

#### 3.7.2. Inline Scripts

`<script> ... </script>`  
Inline scripts are reinserted during fragment injection so they execute every time the fragment is loaded.  
This guarantees that initialization code inside a fragment runs as expected, even when fragments are reloaded or swapped dynamically.

#### 3.7.3. Stylesheets

`<link rel="stylesheet" href="...">`  
Stylesheets are promoted to the `<head>` and deduplicated based on their `rel` and `href` attributes.  
This avoids redundant CSS imports while allowing each fragment to include its own style references without conflicts.

Together, these rules make fragments portable and independent.  
A fragment can include its own scripts and styles, and when reused elsewhere, everything "just works" without requiring manual dependency management.

---


## 4. State and Data Binding

Frontend.js includes a small, event-based data layer that lets you build reactivity without a virtual DOM or any internal templating system.

It does **not** automatically modify elements when data changes.  
Instead, it dispatches structured events for state mutations, and elements (or external code) define inline event handlers that decide what to do.

This pattern keeps your data model separate from rendering logic while still being fully declarative in HTML.

### 4.1. How It Works

Frontend.js maintains a global state tree that stores arbitrary key/value pairs.  Keys can use dot paths such as `"user.name"` or `"settings.theme"` to represent nested data.

Whenever you call `Frontend.setData`, `Frontend.removeData`, or `Frontend.resetState`, the framework:

1. Updates the global state tree.
2. Dispatches one or more `data:*` events on the `document` object.
3. Finds elements bound to that path (`data-binding="..."`) and triggers their corresponding lifecycle handlers.

This system gives you fine-grained, explicit control over what happens when your data changes.

### 4.2. Declaring a Binding

To bind an element to a specific key in the global state, use `data-binding`:

```html
<div data-binding="user.name"
     on-data-change="this.textContent = value"
     on-data-add="console.log('Added new key:', value)"
     on-data-delete="this.textContent = ''">
</div>
```

This element will react to any change in the path `user.name`.  The attributes `on-data-add`, `on-data-change`, and `on-data-delete` contain code snippets that are executed when the respective events occur.

---

### 4.3. Triggering Events Through State Changes

When you update the state:

```js
Frontend.setData("user.name", "Alice");
```

Frontend.js will:

1. Store the new value in the internal state object.
2. Dispatch `data:added` if the key did not exist, or `data:changed` if it did.
3. Execute the inline handler(s) on elements that have `data-binding="user.name"`.

In the example above, the handler sets the text of the element:

```html
on-data-change="this.textContent = value"
```

so the visible text becomes “Alice”.

---

### 4.4. Parent Bindings and Child Events

Bindings can listen not only to their direct key but also to nested changes within it.  
For example, an element bound to `"user"` will receive child-level notifications when properties like `"user.name"` or `"user.age"` change if it  has the appropriate listeners attributes defined.

```html
<div data-binding="user"
     on-data-child-add="console.log('child added', key, value)"
     on-data-child-change="console.log('child changed', key, oldValue, '->', value)"
     on-data-child-delete="console.log('child deleted', key, oldValue)">
</div>
```

This enables you to observe structured data and react to complex updates without needing a dedicated reactive framework.

---

### 4.5. Fragment Attribute Event Types and Their Handlers

The following handlers can appear on elements with `data-binding`:

| Attribute               | Triggered When                           | Provided Variables                           |
|--------------------------|------------------------------------------|----------------------------------------------|
| `on-data-add`            | A new key is added                       | `el, value, oldValue`                        |
| `on-data-change`         | An existing key changes value            | `el, value, oldValue`                        |
| `on-data-delete`         | A key is deleted or set to null/undefined| `el, value, oldValue`                        |
| `on-data-child-add`      | A subkey under this path is created      | `el, key, value, oldValue`                   |
| `on-data-child-change`   | A subkey under this path changes value   | `el, key, value, oldValue`                   |
| `on-data-child-delete`   | A subkey under this path is removed      | `el, key, value, oldValue`                   |

The handlers are evaluated as JavaScript in the context of the element.  
For example, `this` refers to the element itself.

---

### 4.6. Global Event Dispatch

In addition to per-element handlers, Frontend.js emits global events on `document` for any state mutation:

```js
document.addEventListener("data:added", e => {
  console.log("Added key:", e.detail.path, "=", e.detail.value);
});
```

Available events:
- `data:added`   `{ path, value }`
- `data:changed` `{ path, value, oldValue }`
- `data:removed` `{ path, oldValue }`

This global event system allows you to integrate Frontend.js with any other JavaScript logic, reactive system, or analytics tool.

---

### 4.7. Updating and Removing Data

```js
Frontend.setData("settings.theme", "dark");
Frontend.setData("settings.theme", "light");
Frontend.removeData("settings.theme");
Frontend.resetState();
```

Each call triggers events and handlers for affected keys.  
When data is deleted or reset, all corresponding `on-data-delete` and `on-data-child-delete` handlers are executed.

---

### 4.8. Example: Reactive UI Tile

Below is an example of an element that reacts to data changes by calling a function instead of using inline code:

```html
<div data-binding="stats.users.count"
     on-data-change="updateTile(el, value, oldValue)">
  <div class="label">Active Users</div>
  <div class="value">0</div>
</div>
```

```js
function updateTile(el, value, oldValue) {
  el.querySelector('.value').textContent = value;
}
```

And to update it:

```js
Frontend.setData("stats.users.count", 245);
```

The `updateTile` function runs automatically whenever the value changes.

---



## 5. Framework Events

Frontend.js emits structured events to signal changes in fragments, page assembly, and global state.  
These events can be handled using `Frontend.on(event, handler)` or standard `document.addEventListener` calls.

**Event Summary**

| Event Name | Trigger | Detail Fields | Description |
|-------------|----------|----------------|--------------|
| `fragment:loaded` | When a fragment is successfully fetched and injected into the DOM | `id`, `src`, `nodes` | Fired once per fragment after it loads. |
| `page:load_complete` | After all fragments (including nested) are fully loaded | `count`, `finishedAt` | Indicates that the entire page structure is ready. |
| `data:added` | When a new key is added to global state | `path`, `value` | Signals the creation of new reactive data. |
| `data:changed` | When an existing state value is updated | `path`, `value`, `oldValue` | Indicates a state change for an existing key. |
| `data:removed` | When a state key is deleted or cleared | `path`, `oldValue` | Fired when data is removed from the global store. |


### 5.1. Fragment and Page Events

#### `fragment:loaded`

Fired when a fragment finishes loading and is inserted into the DOM.

**Detail:**
```js
{
  id: "profile",       // fragment id, if present
  src: "profile.html", // path that was loaded
  nodes: [ ... ]       // DOM nodes injected
}
```

Use this event to perform post-load initialization, attach listeners, or modify loaded content.

---

#### `page:load_complete`

Fired once when all fragments in the document (including nested fragments) have finished loading.

**Detail:**
```js
{
  count: 5,            // total number of fragments processed
  finishedAt: Date     // timestamp of completion
}
```

Useful for actions that depend on the entire page structure being available, such as analytics hooks or layout adjustments.

---

### 5.2. State and Data Events

State events are dispatched whenever data in the global store changes.  
They include both a global event on `document` and per-element callbacks for any elements bound to the affected key.

---

#### `data:added`

Fired when a new key is created in the global state.

**Detail:**
```js
{
  path: "user.name",
  value: "Alice"
}
```

---

#### `data:changed`

Fired when an existing key changes value.

**Detail:**
```js
{
  path: "user.name",
  value: "Bob",
  oldValue: "Alice"
}
```

---

#### `data:removed`

Fired when a key is deleted from the global state or set to null or undefined.

**Detail:**
```js
{
  path: "user.name",
  oldValue: "Bob"
}
```

---

These events provide full visibility into fragment and data lifecycles.  
You can listen globally, react locally through bindings, or combine both approaches for precise, event-driven control.

---

## 6. Public API

```js
Frontend.load(root = document)
```
Manually process fragments inside a root node.

```js
Frontend.loadInto(parent, src, extraParams)
```
Programmatically load a fragment into a given parent element.

```js
Frontend.setData(path, value)
Frontend.getData(path)
Frontend.removeData(path)
Frontend.resetState()
```
Manage global reactive state.

```js
Frontend.on(eventName, handler)
```
Listen for framework events (fragment, page, data).


---
## 7. Caveats and Tradeoffs

Frontend.js is designed for simplicity, flexibility, and direct control.  That comes with a few practical tradeoffs that are worth understanding.

>These tradeoffs are intentional.  Frontend.js favors transparency and developer control over heavy abstraction or build-time magic.  The same qualities that make it simple also make its limitations clear and easy to manage.

#### 7.1. SEO and Delayed Content

Because fragments are loaded dynamically after the main document is parsed, the raw HTML that search engines first see does not contain the full page content.  

In theory, this can hurt traditional SEO because crawlers might index the page before all fragments have loaded.  
In practice, most modern search engines render JavaScript and delay indexing until after the page finishes loading.  
Google, Bing, and others already account for delayed DOM updates and asynchronous rendering.

If search visibility is critical, you can pre-render or flatten your fragments during deployment.  
Flattening means replacing each `<fragment>` tag with the HTML it loads so that crawlers see the full content immediately.  
This gives you the best of both worlds: maintainable modular templates during development, and static HTML for indexing.

#### 7.2. The State of SEO Today

Modern SEO is not what it used to be.  Search ranking is now influenced far more by paid placement, brand authority, and ad relationships than by the technical details of how a page is built.  Unless you are paying for ads or operating at large scale, SEO "optimization" rarely provides meaningful results.

Frontend.js focuses on the things that actually matter to users: content quality, page speed, and maintainable structure.  
If search engine ranking is a primary concern, you can still generate static versions of your pages.  
But for most projects, simplicity and performance matter more than chasing SEO metrics.

#### 7.3. Loading Order

Since fragments load asynchronously, large pages may briefly show partial content as fragments are fetched and inserted.  
This is similar to how many single-page applications behave.  
You can minimize this by adding lightweight placeholders or loaders inside each fragment tag.

#### 7.4. Network Latency

Because fragments are individual HTTP requests, a large number of small fragments can increase network overhead.  
This is rarely noticeable on modern connections, but for heavily modular layouts, grouping related fragments or caching responses can help.


---



## 8. License

MIT License  
Copyright (c) 2025 Jason Penick


---


