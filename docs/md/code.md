# Code Elements in the Frontend Runtime

The Frontend Runtime provides a simple system for displaying code examples and documentation snippets without having to manually escape HTML or write custom fetch logic.

This feature exists because embedding code directly in HTML or Markdown often causes problems that make documentation harder to maintain.

---

## The Problem

When you write inline code examples inside HTML, the browser parses them as real markup instead of showing them as text. For example:

```html
<div>Hello</div>
```

will not appear as code. It will render as a real `<div>` element. To fix this, you would have to escape every character manually:

```html
&lt;div&gt;Hello&lt;/div&gt;
```

That is slow, messy, and hard to maintain.

In addition, many documentation sites or UI pages repeat small code examples that need to stay in sync with real files. If you update one copy, the others go stale.  

While it is possible to fetch and display code using a few lines of JavaScript, there is no reason to repeat that boilerplate everywhere. You should be able to simply say, "the code lives here" and let the system handle the rest.

---

## The Solution

The Frontend Runtime automatically finds and processes `<code>` elements in the document.  

You can use two main forms:

1. Inline `<code>` blocks for small examples.
2. External `<code src="...">` blocks that load content from a file.

---

## Inline Code

Inline code is used for short snippets written directly into the page or Markdown.

Example:

```html
<pre><code class="language-js">
console.log("Hello world");
</code></pre>
```

The runtime applies syntax highlighting automatically at page load. You do not need to escape tags or call Highlight.js yourself.

---

## External Code

For longer examples or real project files, you can load code from an external file by using the `src` attribute:

```html
<pre>
  <code src="/examples/demo.js" class="language-js"></code>
</pre>
```

When the page initializes, the runtime will:

1. Fetch the file from the given path.
2. Insert the code into the `<code>` block.
3. Run syntax highlighting.

If the file cannot be fetched, the system displays a simple error comment and logs a warning to the console.

This approach avoids escaping issues entirely. You keep your code examples in real `.js`, `.html`, or `.css` files and simply point to them.

---

## How It Works

- The runtime looks for any `<code>` tags in the document.
- If a tag has a `src` attribute, it loads the file and inserts it.
- If it is inline, it just highlights the content.
- The runtime marks processed elements so they are not reloaded twice.
- This process runs again automatically when new content is inserted from fragments or Markdown.

---

## Markdown Integration

When you render Markdown content, fenced code blocks are turned into `<code>` tags automatically.  
The runtime then highlights them just like inline HTML examples.

Example Markdown:

    ```html
    <div>Hello</div>
    ```

will become a highlighted code block in the browser without manual escaping.

---

## Requirements

Highlight.js must be loaded before the Frontend runtime runs.

```html
<script src="https://cdn.jsdelivr.net/npm/highlight.js/lib/common.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js/styles/github-dark.css">
```

Once it is available, the runtime will detect it automatically.

---

## Debugging

If highlighting does not appear:

- Confirm that Highlight.js is loaded before `Frontend.initialize()` runs.
- Ensure that `<code>` tags include a `language-...` class (for example, `language-js` or `language-html`).
- Check the console for `[Frontend]` messages showing load errors.

---

## Summary

| Feature | Description |
|----------|--------------|
| Inline `<code>` | For short examples written directly in HTML or Markdown |
| External `<code src>` | Loads and highlights content from a file |
| Automatic Highlighting | Runs Highlight.js automatically |
| No Escaping Required | Solves the HTML parsing problem for code samples |
| Works with Fragments and Markdown | Highlights newly loaded content automatically |

---

In short: instead of fighting the browser’s HTML parser or re-implementing fetch logic, you can just declare where your code lives and let the Frontend Runtime do the rest.
