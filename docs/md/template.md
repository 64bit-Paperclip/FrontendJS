# Template

Templates define reusable chunks of HTML that can be instantiated dynamically at runtime.  
They provide a way to separate markup structure from logic, and are used by components,
fragments, and direct calls to `Frontend.loadComponent()`.

At initialization, all `<template>` and `<templates>` elements found in the document are
collected, normalized, and moved into a single global container:

```html
<templates id="templates"></templates>
```

This ensures that all templates are globally accessible by ID and can be safely referenced
anywhere in your app.



## Attributes

### id

Each `<template>` element must have a unique `id`.  
This ID is used to locate and instantiate the template later.

```html
<template id="user-card">
  <div class="user-card">
    <h3>{{name}}</h3>
    <p>{{email}}</p>
  </div>
</template>
```

---

### template-containers (`<templates>`)

Templates can be grouped inside `<templates>` containers.  
At startup, all containers are merged into the global `<templates id="templates">` container.  
This helps keep document structure clean and avoids inline duplication.

```html
<templates>
  <template id="alert">
    <div class="alert {{type}}">{{message}}</div>
  </template>
</templates>
```



### Inline vs External Templates

Templates can be defined inline in the HTML document, or loaded externally
using a `<link>` tag with `type="templates"`.

#### Inline Definition

```html
<template id="note">
  <div class="note">
    <p>{{content}}</p>
  </div>
</template>
```

#### External Definition

```html
<link type="templates" src="/templates/ui.html">
```

In external files, you can include multiple templates:

```html
<template id="button">
  <button class="btn {{style}}">{{label}}</button>
</template>

<template id="card">
  <div class="card">
    <h4>{{title}}</h4>
    <p>{{body}}</p>
  </div>
</template>
```

When loaded, they are merged into the global template registry automatically.



## Usage

### Loading a Template into the DOM

Use `Frontend.loadComponent(destinationID, templateID, params, clearParent)`  
to inject a template’s contents into a live element.

```js
Frontend.loadComponent("target", "user-card", {
  name: "Alice",
  email: "alice@example.com"
});
```

**Arguments:**

| Parameter | Type | Description |
|------------|------|-------------|
| `destinationID` | string | The ID of the DOM element to insert into |
| `templateID` | string | The ID of the template to instantiate |
| `params` | object | Optional parameter object for `{{substitution}}` |
| `clearParent` | boolean | If `true`, clears existing content first |



### Parameter Substitution

Like fragments, templates support `{{placeholders}}` that are replaced at runtime.  
Values come from the provided `params` object or from global state (`Frontend.getData()`).

```html
<template id="greeting">
  <h2>Hello, {{user.name}}!</h2>
</template>
```

```js
Frontend.setData("user", { name: "Charlie" });
Frontend.loadComponent("welcome", "greeting");
```



### Duplicate Handling

If a duplicate template ID is found during loading:
- The **first** version is kept.  
- The duplicate is **ignored** with a console warning.  

This ensures predictable behavior and avoids accidental overrides.



### Lifecycle and Management

- Templates are collected once at initialization via `Frontend.initialize()`.  
- Inline `<templates>` containers are removed after merging.  
- The global container is always appended to the end of `<body>`.  
- Templates can be used multiple times without redefinition.



### Summary

| Element | Purpose |
|----------|----------|
| `<template>` | Defines a reusable HTML snippet |
| `<templates>` | Groups multiple templates for organization |
| `<link type="templates" src="...">` | Loads external template definitions |
| `Frontend.loadComponent()` | Instantiates a template into a DOM element |
| `{{placeholder}}` | Parameter substitution syntax within templates |



### Example

````html
<!-- External link -->
<link type="templates" src="/templates/common.html">

<!-- Inline definition -->
<template id="profile-card">
  <div class="profile-card">
    <img src="{{avatar}}" alt="{{name}}">
    <h3>{{name}}</h3>
    <p>{{role}}</p>
  </div>
</template>

<!-- Destination -->
<div id="content"></div>

<script>
Frontend.loadComponent("content", "profile-card", { name: "Dana", role: "Engineer", avatar: "/img/dana.png" });
</script>
````

---

Templates are one of the core primitives of the Frontend runtime —
simple, declarative, and composable.
They make it easy to construct UI fragments dynamically while keeping
markup clean and maintainable.
