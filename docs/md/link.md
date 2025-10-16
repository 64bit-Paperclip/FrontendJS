# Link Elements in the Frontend Runtime

The Frontend Runtime extends the standard HTML `<link>` element with new `type` values that control how templates, behaviors, and other resources are loaded.  

These new `type` values let you include external resource packs declaratively without writing custom JavaScript for each one.

---

## Overview

In regular HTML, `<link>` is mainly used for stylesheets and icons.  
For example:

```html
<link rel="stylesheet" href="/site.css">
```

In the Frontend Runtime, additional `type` values are supported to load **behaviors**, **templates**, and other runtime resources directly into the application environment.

The runtime scans the document for all `<link>` elements and processes them according to their `type`.

---

## Supported Link Types

| Type | Purpose | Example |
|------|----------|---------|
| `behaviors` | Loads external `<behavior>` definitions | `<link type="behaviors" src="/ui/behaviors.html">` |
| `templates` | Loads external `<template>` definitions | `<link type="templates" src="/ui/templates.html">` |

---

## type="behaviors"

The `behaviors` type allows you to package reusable event logic in separate HTML files and import them once into your application.

Example:

```html
<link type="behaviors" src="/common/behaviors.html">
```

### Behavior Pack Format

The file referenced by the `src` attribute should contain one or more `<behavior>` elements, each with a unique `id` and one or more `<trigger>` children.

Example `/common/behaviors.html`:

```html
<behavior id="hoverEffect">
  <trigger on="mouseenter" action="this.classList.add('hover')"></trigger>
  <trigger on="mouseleave" action="this.classList.remove('hover')"></trigger>
</behavior>
```

### How It Works

- When `Frontend.initialize()` runs, it finds all `<link type="behaviors" src="...">` elements.
- Each file is fetched once.
- Every `<behavior>` element inside it is registered globally.
- Duplicates are ignored with a warning.
- Once loaded, behaviors can be referenced anywhere in the application.

This mechanism allows you to organize event logic into small reusable files without inline JavaScript.

---

## type="templates"

The `templates` type is used to import external HTML template definitions.  

Templates define reusable blocks of markup that can later be instantiated into components using `Frontend.loadComponent()`.

Example:

```html
<link type="templates" src="/ui/templates.html">
```

### Template Pack Format

The file referenced by the `src` attribute should contain one or more `<template id="...">` elements.  

Example `/ui/templates.html`:

```html
<template id="userCard">
  <div class="user-card">
    <h3>{{name}}</h3>
    <p>{{email}}</p>
  </div>
</template>
```

### How It Works

- The runtime fetches the file and parses its contents.
- Each `<template>` element is moved into a global container:

  ```html
  <templates id="templates"></templates>
  ```

  This container is automatically created in the document if it does not already exist.

- Duplicate template IDs are ignored to prevent conflicts.
- You can then instantiate templates dynamically with:

  ```js
  Frontend.loadComponent("targetId", "userCard", { name: "Alice", email: "alice@example.com" });
  ```

---

## Duplicate Handling

When the runtime loads a `<link>` pack (for either behaviors or templates), it checks for duplicates:

- If a behavior or template with the same ID already exists, the new one is skipped.
- A warning is printed to the console identifying the duplicate.
- This prevents accidental overwrites when multiple resources import similar content.

---

## Error Handling

If the file referenced by a `<link>` element fails to load:

- A console warning is printed including the HTTP status code.
- The runtime continues initialization instead of failing entirely.
- The system will simply skip the missing pack.

This ensures that missing or temporary files do not break the entire page.

---

## Execution Order

The runtime processes links during initialization in this order:

1. `loadBehaviorLinks(document)`  
   Finds and loads all `<link type="behaviors">` packs.
2. `loadTemplateLinks(document)`  
   Finds and loads all `<link type="templates">` packs.
3. Behaviors and templates are then available for fragments, components, and triggers loaded afterward.

This ensures that dependent content can reference already-registered behaviors and templates.

---

## Summary

| Type | Description | Load Order | Typical Content |
|------|--------------|-------------|------------------|
| `behaviors` | Defines reusable event triggers | First | `<behavior>` elements |
| `templates` | Defines reusable HTML blocks | Second | `<template>` elements |

---

In short:  
The extended `<link>` element types let you load reusable behavior and template packs declaratively, without writing custom JavaScript.  
This keeps your HTML clean, modular, and maintainable while allowing the Frontend Runtime to manage all resource loading automatically.
