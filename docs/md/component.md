# Component `<component>`

A `<component>` element is a declarative way to instantiate a reusable block of markup from a `<template>` definition.  
It behaves like a fragment, but instead of loading external content from a file, it clones and renders the body of a template element that already exists in the document.

Components perform all the same processing steps as fragments, including parameter substitution, trigger setup, data binding, script execution, and recursive fragment loading.

---

## Overview

A component connects a `<template>` definition to a live element instance on the page.

Example:

```html
<component template="userCard" param-name="Alice" param-email="alice@example.com"></component>
```

When the page initializes, the Frontend runtime:

1. Looks for `<template id="userCard">`.
2. Clones its contents.
3. Substitutes parameter values for any `{{placeholders}}`.
4. Processes triggers, data bindings, scripts, and nested fragments.
5. Replaces the `<component>` tag with the rendered HTML.

---

## Template Source

Templates are defined in the document or imported from a `<link type="templates">` file.

Example template:

```html
<template id="userCard">
  <div class="user-card">
    <h3>{{name}}</h3>
    <p>{{email}}</p>
  </div>
</template>
```

This template can be used anywhere with:

```html
<component template="userCard" param-name="Bob" param-email="bob@example.com"></component>
```

Result after rendering:

```html
<div class="user-card">
  <h3>Bob</h3>
  <p>bob@example.com</p>
</div>
```

---

## Parameters

Components support parameter substitution using `param-*` attributes.  
Each `param-*` attribute defines a variable available to the template as `{{key}}`.

Example:

```html
<component template="alertBox"
  param-title="Warning"
  param-message="Something went wrong.">
</component>
```

Template:

```html
<template id="alertBox">
  <div class="alert">
    <h4>{{title}}</h4>
    <p>{{message}}</p>
  </div>
</template>
```

Rendered output:

```html
<div class="alert">
  <h4>Warning</h4>
  <p>Something went wrong.</p>
</div>
```

---

## Lifecycle and Behavior

Components go through the same processing steps as fragments:

1. **Parameter substitution**  
   Replaces `{{key}}` placeholders with parameter or state values.
2. **Trigger compilation**  
   Converts `<trigger>` elements into declarative event attributes.
3. **Data binding setup**  
   Translates `<data-binding>` elements into `data-bind-*` attributes.
4. **Script execution**  
   Runs inline or external scripts inside the cloned template.
5. **Recursive fragment loading**  
   Loads and renders any nested `<fragment>` elements.
6. **Link promotion**  
   Moves any `<link>` tags inside the template into `<head>` if not already present.

Because of this, templates can include scripts, triggers, or nested fragments and will behave exactly as if they were part of the main document.

---

## Conditional Rendering

A `<component>` can include an optional `condition` attribute to control whether it should render.

Example:

```html
<component
  template="userCard"
  param-name="Admin"
  condition="Frontend.getData('user.isAdmin')">
</component>
```

If the expression evaluates to false, the component is skipped and no output is rendered.

---

## Fallback Templates

If a component has a `fallback` attribute, it will use the fallback template if the main one is not found or if its condition fails.

Example:

```html
<component template="userCard" fallback="guestCard"></component>
```

If `userCard` is missing, the runtime will instantiate `guestCard` instead.

---

## Caching Behavior

Components **do not cache**.  
Each instance is fully rebuilt when processed. The runtime always clones the referenced template and performs a fresh substitution, trigger build, and script execution.

This ensures that components remain isolated, dynamic, and safe to modify at runtime.

---

## Inline Example

```html
<link type="templates" src="/templates/ui.html">

<component template="profileCard"
  param-username="Jane"
  param-bio="Frontend developer"
  param-avatar="/images/jane.png">
</component>
```

Template (in `/templates/ui.html`):

```html
<template id="profileCard">
  <div class="profile">
    <img src="{{avatar}}" alt="{{username}}">
    <h2>{{username}}</h2>
    <p>{{bio}}</p>
  </div>
</template>
```

Rendered output:

```html
<div class="profile">
  <img src="/images/jane.png" alt="Jane">
  <h2>Jane</h2>
  <p>Frontend developer</p>
</div>
```

---

## Summary

| Attribute | Description |
|------------|-------------|
| `template` | The template ID to instantiate (required) |
| `param-*` | Defines template substitution parameters |
| `condition` | Optional JavaScript expression to control rendering |
| `fallback` | Alternate template ID to use if the main one fails |
| `onload` | Optional lifecycle handlers |
| `onerror` | Optional lifecycle handlers |


---

In short:  
`<component>` elements let you render template content declaratively, with full support for triggers, scripts, and nested fragments. They are a dynamic, non-cached, self-contained way to build reusable UI blocks.
