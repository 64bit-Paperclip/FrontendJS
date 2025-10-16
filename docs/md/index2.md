# Frontend Runtime: Core Concepts and Architecture

The Frontend Runtime is a lightweight, **HTML-like, declarative system** for building reactive web interfaces using **vanilla JavaScript**.  
It extends the standard HTML model with a few new, intuitive elements such as `<fragment>`, `<template>`, `<component>`, and `<behavior>`.  

These extensions behave exactly like native HTML elements: they live in the DOM, can be queried and manipulated normally, and follow the same lifecycle rules.  
The runtime processes these elements at load time to turn static markup into a dynamic, data-driven interface.

The result is a system that feels native to HTML but provides the modularity and reactivity normally associated with a framework.

---

## The Core Building Blocks

There are four main concepts in the Frontend Runtime:

1. **Fragment** – Loads and renders external HTML or Markdown content.
2. **Template** – Defines reusable markup blocks that can be instantiated later.
3. **Component** – Instantiates a template dynamically.
4. **Behavior** – Defines reusable event logic.

Together they form an extended HTML vocabulary for building interactive, composable pages without leaving the browser’s native environment.

---

## Fragment

A `<fragment>` element loads content from an external file and merges it into the current document.  
It can load HTML, Markdown, or any other compatible format.

Example:

```html
<fragment src="/docs/intro.html"></fragment>
```

When processed, the runtime:

- Fetches and parses the external file.
- Replaces any `{{placeholders}}` with parameter or state values.
- Executes inline scripts and triggers inside the loaded content.
- Loads nested fragments recursively.
- Replaces the `<fragment>` element with the rendered nodes.

Fragments remove the need to write fetch logic manually and make it easy to structure a page from smaller, independent files.

---

## Template

A `<template>` defines a reusable HTML block that can be cloned and rendered later.  
Templates are inert until they are instantiated, which allows them to safely hold markup, triggers, and scripts.

Templates can be defined inline or imported using:

```html
<link type="templates" src="/templates/ui.html">
```

Example:

```html
<template id="userCard">
  <div class="user-card">
    <h3>{{name}}</h3>
    <p>{{email}}</p>
  </div>
</template>
```

Templates act as blueprints. They define what something should look like, but not when or where it appears.

---

## Component

A `<component>` renders a template into the page.  
It behaves like a fragment, but instead of loading a file, it clones an existing template and substitutes parameters.

Example:

```html
<component template="userCard"
  param-name="Alice"
  param-email="alice@example.com">
</component>
```

When processed, the runtime:

1. Finds the template with `id="userCard"`.
2. Clones its content.
3. Performs parameter substitution (`{{name}}`, `{{email}}`).
4. Builds triggers and data bindings.
5. Runs inline and external scripts.
6. Loads any nested fragments.
7. Replaces the `<component>` element with the rendered HTML.

Components do **not cache**.  
Each instance is rendered fresh, ensuring that parameters, bindings, and scripts are always applied cleanly.

---

## Behavior

A `<behavior>` defines reusable event logic using `<trigger>` elements.  
This allows you to describe how elements react to events without writing imperative JavaScript for each one.

Behaviors can be defined inline or imported using:

```html
<link type="behaviors" src="/behaviors/common.html">
```

Example behavior file:

```html
<behavior id="highlightOnHover">
  <trigger on="mouseenter" action="this.classList.add('hover')"></trigger>
  <trigger on="mouseleave" action="this.classList.remove('hover')"></trigger>
</behavior>
```

Behaviors are registered globally. The runtime compiles triggers into equivalent declarative attributes (`on-click`, `on-change`, etc.) so that elements can attach these actions directly in markup or within templates.

This makes event wiring declarative and predictable, without ever losing the ability to write plain JavaScript.

---

## How They Work Together

| Concept | Purpose | Typical Usage |
|----------|----------|----------------|
| **Fragment** | Load and render external HTML or Markdown | `<fragment src="/path.html">` |
| **Template** | Define reusable markup | `<template id="card">...</template>` |
| **Component** | Instantiate a template | `<component template="card">` |
| **Behavior** | Encapsulate event logic | `<link type="behaviors" src="...">` |

These primitives form an **HTML-like declarative system**:

1. **Fragments** bring in content dynamically.
2. **Templates** define the structure of reusable elements.
3. **Components** render those templates into the live DOM.
4. **Behaviors** attach logic and interactivity.

The runtime orchestrates these steps, handling substitution, event wiring, and script execution automatically.

---

## Example

```html
<link type="templates" src="/templates/ui.html">
<link type="behaviors" src="/behaviors/common.html">

<fragment src="/partials/header.html"></fragment>

<component template="userCard"
  param-name="Alice"
  param-email="alice@example.com">
</component>

<fragment src="/partials/footer.html"></fragment>
```

- The header and footer load dynamically as fragments.  
- The main content renders a component instance from a template.  
- Common behaviors handle user interactions.

All of this runs on standard DOM and browser APIs. There is no build step, no virtual DOM, and no external framework.

---

## HTML-Like, Not HTML-Locked

The Frontend Runtime extends HTML in a way that feels natural but goes beyond what the current standard provides.

- Elements like `<fragment>` and `<component>` are not part of official HTML but follow the same conventions.
- The runtime’s JavaScript makes them behave as if they were native.
- The browser still parses them normally, because unknown tags are valid under the HTML spec.

This approach keeps the system forward-compatible with the web platform while introducing new declarative capabilities.

---

## Why HTML-First with Vanilla JavaScript

The runtime is **HTML-first** because structure and intent are described declaratively in markup.  
It is **JavaScript-powered** because the browser needs a small amount of logic to make those declarations come alive.

- HTML describes **what** should exist.
- The runtime’s JavaScript defines **how** it behaves.
- Developers can still use JavaScript directly anywhere they need to.

This balance provides the simplicity of markup with the flexibility of code.

---

## Summary

| Concept | Description |
|----------|-------------|
| Fragment | Loads and renders external HTML or Markdown content |
| Template | Defines reusable markup blueprints |
| Component | Instantiates templates with parameter substitution |
| Behavior | Declares reusable event logic and triggers |

Together these form an **intuitive, HTML-like extension of the web platform**, enabling reactive and modular user interfaces using nothing but HTML syntax and vanilla JavaScript.
