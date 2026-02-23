# Frontend.js

A tiny, dependency-free framework for composing pages from HTML fragments with lightweight state and data binding.

## What it does

- **Fragment includes** — use `<fragment src="header.html">` to pull in external HTML files at that location, no build step required
- **Reactive state** — set data, bind elements to it, and the DOM updates automatically
- **Declarative triggers** — attach event behavior in markup using `<trigger>` elements
- **Template system** — define and instantiate reusable `<template>` blocks
- **Markdown support** — load `.md` files as fragments and plug in your renderer of choice

## Quick start

```html
<script src="/js/frontend.js"></script>

<fragment src="nav.html"></fragment>
<fragment src="main.html" param-theme="dark"></fragment>
<fragment src="footer.html"></fragment>
```

Fragments load automatically on `DOMContentLoaded`. Nested fragments, `<script>`, and `<link>` tags are all handled correctly.

## Fragments

```html
<!-- Basic include -->
<fragment src="sidebar.html"></fragment>

<!-- With parameters (use {{theme}} inside sidebar.html) -->
<fragment src="sidebar.html" param-theme="dark" param-user="Alice"></fragment>

<!-- Conditional loading with fallback -->
<fragment src="dashboard.html" condition="isLoggedIn()" fallback="login.html"></fragment>
```

Built-in placeholders available inside every fragment: `{{frag_id}}` and `{{frag_src}}`.

Unresolved placeholders fall back to the global state — so `{{user.name}}` will pull from `Frontend.getData("user.name")` automatically.

## State & data binding

```js
Frontend.setData("user.name", "Alice");
Frontend.getData("user.name"); // → "Alice"
Frontend.removeData("user.name");
Frontend.resetState();
```

Bind an element to a key:

```html
<span data-bind-text="user.name"></span>
```

The span updates whenever `user.name` changes. Binding targets include `text`, `html`, `value`, `class`, `visible`, `style.*`, and `attr.*`.

## Events

```js
Frontend.on("fragment:loaded", e => {
  console.log("Loaded:", e.detail.src);
});

Frontend.on("page:load_complete", e => {
  console.log(`${e.detail.count} fragments loaded`);
});

// State events
Frontend.on("data:added",   e => { /* e.detail: { path, value } */ });
Frontend.on("data:changed", e => { /* e.detail: { path, value, oldValue } */ });
Frontend.on("data:removed", e => { /* e.detail: { path, oldValue } */ });
```

## Triggers

Declarative event bindings inside any element:

```html
<button>
  <trigger on="click" action="Frontend.setData('menu.open', true)"></trigger>
  Open Menu
</button>
```

Attributes: `on`, `action`, `target`, `condition`, `once`, `prevent`, `stop`.

## Markdown

Register any renderer:

```js
Frontend.setMarkdownProcessor(text => marked.parse(text));
```

Then load `.md` files as fragments normally — they'll be rendered to HTML automatically.

## API

| Method | Description |
|---|---|
| `Frontend.load(root)` | Process fragments inside a root node |
| `Frontend.loadFragmentInto(parent, src, params)` | Load a fragment programmatically |
| `Frontend.loadComponent(destId, templateId, params, clear)` | Instantiate a template into an element |
| `Frontend.setData(path, value)` | Set a state value |
| `Frontend.getData(path)` | Get a state value |
| `Frontend.removeData(path)` | Remove a state value |
| `Frontend.resetState()` | Clear all state |
| `Frontend.setMarkdownProcessor(fn)` | Register a Markdown renderer |
| `Frontend.on(event, handler)` | Listen for framework events |

## No dependencies

No npm, no bundler, no virtual DOM. Drop in `frontend.js` and go.