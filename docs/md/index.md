# FrontendJS 

FrontendJS is a **declarative, lightweight runtime** for building dynamic web interfaces and full single-page applications using nothing but **HTML and vanilla JavaScript** — no build tools, no imports, no dependencies, and no virtual DOM.

It upgrades ordinary HTML into a modular, data-driven environment that supports:

- **Live content composition** through `<fragment>` tags  
- **Reusable markup** via `<template>` and `<component>` elements  
- **Declarative interactivity** with `<trigger>` and `<behavior>`  
- **Reactive state updates** through data bindings (`data-bind-*`)  

Everything runs **natively in the browser**, at runtime, powered only by standard web APIs.  
You can build anything — from static pages to complex SPAs — without a bundler, framework, or compile step.




## Why Frontend Exists

Most modern frameworks require build pipelines, transpilers, and virtual DOM layers.  
Frontend takes the opposite approach: it **embraces native browser features** and enhances them
with a small, declarative layer that feels like HTML itself — not a re-implementation of it.

Instead of managing “components” in JavaScript, you write **semantic HTML** that the runtime
understands and upgrades.

**No compilation. No JSX. No dependencies. Just HTML that does more.**


## Why It’s Better

### 1. Pure HTML, No Build Step
You write real HTML files — the browser does the rest.  
No bundlers, preprocessors, or JavaScript transpilation required.

### 2. Runtime Composition
Fragments and templates load dynamically as the page runs, enabling true
multi-page modularity without a single-page-app router.

### 3. Declarative Logic
Behaviors and triggers replace scattered event listeners.
Your UI logic stays **in the markup**, not in an external JS file.

### 4. Reactive State
A tiny reactive core updates bound elements automatically when data changes.
No heavy re-rendering, no synthetic DOM diffing.

### 5. Extensible, Not Opinionated
Frontend doesn’t dictate routing, theming, or data models.  
It’s a foundation — not a full ecosystem — designed to fit into *any* project.


## Key Concepts

| Concept | Tag / API | Description |
|----------|------------|-------------|
| **Fragments** | `<fragment>` | Load external HTML or Markdown dynamically, with params and conditions |
| **Templates** | `<template>` | Define reusable markup and inject it with data |
| **Components** | `<component>` | Define reusable markup and inject it with data |
| **Behaviors** | `<behavior>` | Attach event logic declaratively — no inline JavaScript needed |
| **Triggers** | `<trigger>` | Attach event logic declaratively — no inline JavaScript needed |
| **Data Bindings** | `<data-binding>` + `data-bind-*` | Bind DOM elements to global state |
| **State** | `Frontend.setData() / getData()` | Manage global app data and trigger reactive updates |

Together, these primitives form a minimal declarative system for assembling and updating pages.




## Example: A Live, Declarative Page

````html
<!-- Load global templates -->
<link type="templates" src="/templates/ui.html">

<!-- Display a user profile -->
<fragment src="/frags/user/profile.html" param-id="42">
  <p>Loading user...</p>
</fragment>

<!-- Simple trigger behavior -->
<div>
  <button id="reload-btn">
    Reload
    <trigger on="click" action="Frontend.initialize()"></trigger>
  </button>
</div>
````

Everything above works as soon as the page loads —  
no imports, no frameworks, no build step.



## Events and Lifecycle

The framework emits key lifecycle events that can be listened to anywhere:

| Event | Description |
|--------|-------------|
| `fragment:loaded` | Fired when a fragment finishes loading |
| `component:loaded` | Fired when a fragment finishes loading |
| `page:load_complete` | Fired after all fragments and templates are processed |
| `data:changed` | Fired when global state updates |
| `data:added` | Fired when global state updates |
| `data:deleted` | Fired when global state updates |

These let you hook into page initialization, analytics, or UI synchronization.



## Performance Philosophy

Frontend leverages the browser’s native rendering pipeline instead of re-implementing it.
By operating directly on DOM nodes (not a virtual copy), it:

- Minimizes memory overhead  
- Avoids patching DOM trees unnecessarily  
- Remains extremely small and fast (under 10 KB compressed)

You get dynamic UI composition with **zero framework tax**.



## Getting Started

Add the core script to any HTML page:

```html
<script src="/frontend.js"></script>
```

Optionally include your behaviors and templates:

```html
<link type="behaviors" src="/behaviors/global.html">
<link type="templates" src="/templates/common.html">
```

Then write declarative markup:

```html
<fragment src="/frags/index/intro.html"></fragment>
```

That’s it — Frontend will initialize automatically on `DOMContentLoaded`.

---


## See Also

- [Fragments](Fragment.md)
- [Templates](Template.md)
- [Behaviors](Behavior.md)
- [Data Bindings](DataBinding.md)
- [State API](State.md)
