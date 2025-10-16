# Behaviors `<behavior>`

Behaviors in the Frontend runtime are reusable, declarative logic containers that define how elements should react to user interactions or data changes.  
They allow logic such as event triggers and data bindings to be grouped, named, and reused across fragments, templates, and components.

A behavior is not just a set of triggers. It can also include data-binding elements that connect DOM elements to reactive state.  
This makes behaviors a unifying concept for both event-based and data-driven logic.

---

## What Is a Behavior

A `<behavior>` element groups one or more declarative logic definitions under a unique `id`.  
Each behavior can contain:

- `<trigger>` elements that describe what event to listen for and what action to perform.
- `<data-binding>` elements that define live data connections between the runtime state and the DOM.

Behaviors can be declared inline in the document or loaded from an external file.  
Once loaded, they are stored in the global registry `Frontend._behaviors` and can be referenced anywhere.

Example:

```html
<behavior id="userBehavior">
  <trigger on="click" action="console.log('User clicked')" />
  <data-binding key="user.name" target="text"></data-binding>
</behavior>
```

This behavior both listens for a click event and keeps an element’s text content in sync with `user.name` in the runtime data store.

---

## Loading Behaviors

Behaviors are loaded automatically when the page initializes.  
They can be declared directly in the HTML document or imported from external files.

### Inline Behaviors

You can define behaviors directly in your HTML using `<behavior>` elements with unique IDs:

```html
<behavior id="clickExample">
  <trigger on="click" action="console.log('Clicked')" />
</behavior>
```

All inline behaviors are discovered and registered automatically during initialization.

### External Behavior Packs

Behaviors can also be imported from separate files using a `<link>` element:

```html
<link type="behaviors" src="/behaviors/ui-behaviors.html">
```

The file should contain one or more `<behavior>` elements, just like inline definitions.  
All behaviors from the file are fetched, parsed, and registered globally.

### ID Requirements and Collisions

Each behavior must have a unique `id` attribute.  
The runtime uses this ID to identify and register the behavior.  
If multiple behaviors use the same ID, only the first one is kept.  
Later definitions with the same ID are ignored and a warning is logged in the console:

```
[Frontend] Duplicate behavior id "exampleBehavior" encountered — skipped
```

This rule prevents accidental overrides and ensures consistent, predictable behavior loading.


---
## Applying Behaviors

Once behaviors are loaded, they can be applied to any element by using the `behavior` attribute.  
The value of this attribute should be the `id` of a registered behavior.

When an element has a `behavior` attribute, the runtime looks up the corresponding `<behavior>` definition and automatically attaches all of its triggers and data bindings to that element.  
This makes it easy to reuse the same logic across multiple components, templates, or fragments without duplicating code.

Example:

```html
<behavior id="buttonBehavior">
  <trigger on="click" action="alert('Button clicked')" />
</behavior>

<button behavior="buttonBehavior">Click Me</button>
```

When the page initializes, the runtime finds the `<button>` with `behavior="buttonBehavior"`,  
and attaches all the triggers from the `buttonBehavior` definition.  
In this example, clicking the button will show an alert message.

You can attach the same behavior to multiple elements:

```html
<button behavior="buttonBehavior">Save</button>
<button behavior="buttonBehavior">Cancel</button>
```

Each button receives its own event listener instance, but both share the same logic defined in the behavior.

### Combining Behaviors

An element can use more than one behavior by separating them with spaces:

```html
<div behavior="userBehavior analyticsBehavior"></div>
```

In this case, both `userBehavior` and `analyticsBehavior` will be applied to the same element,  
merging their triggers and data bindings.

### Behavior Scope

Behaviors apply only to the element that declares them.  
They do not automatically propagate to child elements unless those elements also declare a `behavior` attribute of their own.

This makes behaviors predictable, composable, and easy to reason about in larger templates.


---

## Execution Flow Summary

1. `Frontend.initialize()`  
   Starts the runtime and behavior loading sequence.  
2. `loadBehaviorLinks()`  
   Fetches and parses external behavior files.  
3. `loadBehaviorsElements()`  
   Finds and registers inline `<behavior>` elements.  
4. `registerBehaviorElement()`  
   Extracts triggers and bindings and stores them in the registry.  
5. `buildTriggers()` and `buildBindings()`  
   Attach event listeners and set up live data bindings.

---

## Example: External Behavior Pack

Main document:

```html
<link type="behaviors" src="/behaviors/ui-behaviors.html">
```

Behavior pack (`/behaviors/ui-behaviors.html`):

```html
<behavior id="dialogBehavior">
  <trigger on="click" target="#dialog" action="targetElement.showModal()" />
  <trigger on="keydown" condition="event.key === 'Escape'" target="#dialog" action="targetElement.close()" />
  <data-binding key="dialog.open" target="attribute" attribute="open"></data-binding>
</behavior>
```

When loaded, the runtime registers the dialog behavior with both event triggers and a data binding for the dialog’s `open` state.

---

## Debugging Behaviors

To inspect registered behaviors, open the developer console:

```js
console.log(Frontend._behaviors);
```

Example output:

```
Map(1) {
  'dialogBehavior' => {
    triggers: [
      { on: 'click', target: '#dialog', action: 'targetElement.showModal()', ... },
      { on: 'keydown', target: '#dialog', condition: 'event.key === "Escape"', action: 'targetElement.close()', ... }
    ],
    bindings: [
      { key: 'dialog.open', target: 'attribute', attribute: 'open' }
    ]
  }
}
```

Warnings are logged for:
- Missing `id` attributes on `<behavior>` elements.
- Duplicate IDs.
- Behaviors that contain no triggers or bindings.

---

## Summary

| Feature | Purpose |
|----------|----------|
| `<behavior>` | Defines reusable declarative logic containers. |
| `<trigger>` | Handles event-based logic. |
| `<data-binding>` | Handles data-driven updates. |
| `Frontend._behaviors` | Global registry of all registered behaviors. |
| `loadBehaviorLinks()` | Loads external behavior packs. |
| `loadBehaviorsElements()` | Registers inline behaviors. |
| `registerBehaviorElement()` | Parses and stores triggers and bindings. |

---

In short, behaviors combine event and data logic into a single, declarative unit.  
They allow complex interactive behavior to be described in markup, reusable across fragments, templates, and components, without requiring manual JavaScript setup.
