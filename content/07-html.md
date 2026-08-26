---
slug: html
order: 7
number: "8"
group: LANGUAGES & MARKUP
title: HTML
status: answered
---

## What does a doctype do? (M)

It tells the browser to render the page in standards mode. It is not a DTD in any meaningful sense any more — `<!DOCTYPE html>` is just a switch, and the shortest string that flips it.

Without it, or with something the browser does not recognise, you fall into quirks mode, where the engine deliberately emulates the layout bugs of browsers from the late nineties so that old pages still look right.

There is also a third state, almost-standards mode, triggered by some of the older transitional doctypes. It behaves like standards mode except for the way inline images sit in a table cell. In practice the only sensible answer is to always write the HTML5 doctype as the first line of the document.

### What is quirks mode, and what actually changes in it?

The headline one is the box model: widths and heights include padding and border, the way `box-sizing: border-box` behaves today, rather than the CSS spec's content box. So every layout built for standards mode comes out the wrong size.

Beyond that, a scattering of legacy behaviours come back — percentage heights resolve differently, inline elements in table cells get extra space below them, some unitless lengths in CSS are accepted, and font sizes inherit into tables in the old way.

You can check which mode you are in with `document.compatMode`: `CSS1Compat` for standards, `BackCompat` for quirks.

## What are the main building blocks introduced in HTML5? (M)

The part I actually use daily is the semantic sectioning elements — `header`, `nav`, `main`, `article`, `section`, `aside`, `footer`, `figure` — which replaced a page built entirely from divs with class names, and give assistive technology real landmarks to navigate by.

Then the form improvements: input types like `email`, `date`, `number` and `search`, plus `required`, `pattern` and `placeholder`, so basic validation and appropriate mobile keyboards come for free.

Media is the third piece — native `audio`, `video` and `canvas` removed the need for plugins — and alongside the markup, the spec brought a set of APIs that people usually count as part of HTML5: local and session storage, web sockets, geolocation, history push state, drag and drop, and web workers.

## What’s the difference between script, script async and script defer? (M)

A plain script blocks the parser. The browser stops building the DOM, fetches the file, executes it, and only then carries on — which is why a script in the head delays everything after it.

`defer` fetches in parallel with parsing and runs the script after the document has been parsed, just before `DOMContentLoaded`. Deferred scripts keep their document order.

`async` also fetches in parallel but executes the moment the download finishes, interrupting parsing whenever that happens. Order is whatever finishes first.

```
<script src="a.js"></script>          <!-- blocks parsing -->
<script src="a.js" defer></script>    <!-- parses on, runs in order, before DOMContentLoaded -->
<script src="a.js" async></script>    <!-- parses on, runs whenever it lands -->
```

Both attributes are ignored on inline scripts. My default is `defer` for application code and `async` for genuinely standalone things like an analytics beacon.

### Which one preserves execution order across multiple scripts?

`defer`. Deferred scripts run in the order they appear in the document, so a library and the code that depends on it are safe.

`async` gives you no ordering guarantee at all — it is a race between downloads, so the small file usually wins. That makes it wrong for anything with a dependency and fine for anything that touches nothing else.

### Where does a module script sit by default?

`<script type="module">` is deferred automatically, even without the attribute. It always parses in strict mode, has its own top-level scope rather than sharing the global one, and its dependencies are fetched and evaluated before it runs.

You can write `type="module" async` if you want it to execute as soon as it and its imports are ready, but the deferred behaviour is the default and usually what you want.

## Why is it best practice to put CSS links in the head and scripts just before the closing body tag, and what are the exceptions? (M)

CSS goes in the head because it is render-blocking by design. The browser will not paint until it has the stylesheet, and that is the behaviour you want — discovering it late means the user sees a flash of unstyled content and then a reflow.

Scripts went at the end of the body because a classic script blocks the parser, so a script in the head delayed the whole page. Putting it last meant the markup was there before anything ran.

The exception is that `defer` largely solves this. A deferred script in the head starts downloading earlier — while the parser is still working — and still runs after parsing completes, so you get an earlier fetch with none of the blocking. That is strictly better than the end of the body.

The other exceptions are things that must run before paint: an inline snippet that sets the theme class to avoid a light-mode flash, a feature-flag or consent script, or an anti-flicker snippet for A/B testing. Those go in the head deliberately, and you accept the blocking cost because the alternative is a visible flash.

## What is progressive rendering? (M)

It is any technique for getting meaningful content in front of the user before the whole page is ready, rather than waiting for everything and painting once.

The browser does a lot of this by itself — HTML is parsed and painted incrementally as it streams in, which is why a server that flushes the head early lets the browser start fetching CSS while the body is still being generated.

The techniques you would name are lazy loading images and iframes below the fold, code splitting so the initial bundle only contains what the first screen needs, streaming server rendering where the server sends HTML in chunks and fills in slow parts later, and prioritising above-the-fold CSS so the first paint does not wait on the full stylesheet.

The point of all of it is perceived performance. Total load time might not change; the time until the user sees something useful does.

## Why would you use the srcset attribute on an image, and how does the browser evaluate it? (M)

To ship an appropriately sized image instead of one large file to everyone. A phone on a slow connection should not download a 2000px-wide hero.

`srcset` lists candidate files with descriptors. With `w` descriptors you state each file's intrinsic pixel width, and the browser works out which to use from the layout width of the image, the device pixel ratio, and sometimes network conditions. With `x` descriptors you state the pixel density each file targets, which is simpler but only handles the retina case.

```
<img
  src="photo-800.jpg"
  srcset="photo-400.jpg 400w, photo-800.jpg 800w, photo-1600.jpg 1600w"
  sizes="(max-width: 600px) 100vw, 50vw"
  alt="">
```

Crucially the browser chooses, not you. It is allowed to pick a larger file it already has cached, or a smaller one to save data, and once it has picked it will not downgrade on resize. `src` stays as the fallback for anything that does not understand `srcset`.

### What does the sizes attribute add, and why is it needed?

It tells the browser how wide the image will be laid out, expressed as media conditions. Without it the browser assumes `100vw`, which over-fetches for any image that only occupies part of the screen.

It is needed because of ordering. The preload scanner picks images up before the CSS has been parsed and before layout has happened, so at the moment it must choose a file it has no idea the image will end up in a 50% column. `sizes` is you telling it in advance.

The catch is that `sizes` duplicates information that really lives in your CSS, so it drifts when the layout changes. `sizes="auto"` on a lazily loaded image lets the browser use the real layout width instead, which removes the duplication where it is supported.

### When would you reach for picture instead of srcset?

When you need to decide, rather than let the browser decide. `srcset` is a hint about resolution; `picture` with `source` elements is a hard choice made in order, first match wins.

The two real cases are art direction — a wide crop on desktop and a tight square crop on mobile, which are different images rather than different sizes of one image — and format negotiation, offering AVIF then WebP then JPEG so a browser takes the first one it supports.

```
<picture>
  <source type="image/avif" srcset="hero.avif">
  <source media="(max-width: 600px)" srcset="hero-square.jpg">
  <img src="hero.jpg" alt="">
</picture>
```

The `img` inside is not optional — it is what actually renders, and where `alt` lives.

## What are data- attributes good for? (M)

Storing custom data on an element in a way that is valid HTML and won't collide with a future standard attribute. They are readable from CSS with attribute selectors, and from JavaScript through the `dataset` property, where `data-user-id` becomes `dataset.userId`.

The pattern I use them for most is event delegation: one listener on a container, and `event.target.closest('[data-action]')` to work out what was clicked, rather than a listener per row.

```
<button data-action="delete" data-id="42">Delete</button>
```

```js
container.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (el) run(el.dataset.action, el.dataset.id);
});
```

They are also useful as a styling hook for state — `data-state="loading"` targeted with `[data-state="loading"]` — which keeps state out of class name soup.

### When would a data attribute be the wrong tool?

When there is a real attribute for it. Anything to do with accessibility state belongs in ARIA, so `aria-expanded` rather than `data-expanded`, because only the former is exposed to assistive technology.

They are also the wrong place for anything sensitive or large. The value is plain text in the DOM, visible in the inspector and editable by the user, so it is not a security boundary and never the source of truth for authorisation. Serialising a whole object into an attribute is a smell too — that data should live in your application state, with the element holding just an id.

And in a component framework you usually already have props and state; reaching into the DOM to store things is a step backwards.

## What’s the difference between an attribute and a property in the DOM? (E)

Attributes are what is written in the HTML source — always strings. Properties live on the JavaScript object the browser creates for that element, and can be any type: booleans, numbers, references to other objects.

Many are mirrored, so setting `el.id` updates the `id` attribute and vice versa. But the mapping is not universal or symmetrical. `class` in HTML is `className` in JavaScript. `el.checked` is a boolean while the `checked` attribute is only a presence flag. `href` as an attribute may be relative while the property gives you the resolved absolute URL.

The rule of thumb is that attributes hold the initial value and properties hold the current one.

### What happens to the value attribute of an input after a user types in it?

Nothing — it stays at whatever the markup said. The attribute is the default value, so `getAttribute('value')` and `input.defaultValue` still give you the original.

The property `input.value` is what the user typed, and that is what you read to get the current state. Setting the attribute afterwards will not visibly change a field the user has already touched, because the two have been decoupled since the first edit.

This is exactly why `input.value = x` is the right way to set a field from script, and it is also the mechanism behind React's controlled inputs — React drives the property on every render and ignores the attribute.

## What’s the difference between innerHTML and textContent? (E)

`innerHTML` gets and sets markup: reading it serialises the children back to a string, writing it parses the string and builds real nodes. `textContent` deals in plain text only — writing it creates a single text node, and anything that looks like a tag stays literal.

`textContent` is also faster, because there is no parsing, and it returns text from every descendant including elements that are hidden with `display: none`.

The related one worth mentioning is `innerText`, which is layout-aware — it reflects what is actually rendered, skipping hidden elements and normalising whitespace. That makes it slower, since reading it can force a reflow. I use `textContent` unless I specifically want the rendered text.

### Which is the security risk, and why?

`innerHTML`, because it parses whatever you give it. Any untrusted string put through it can introduce markup, and that is the classic DOM-based XSS vector.

The common defence people cite — that `<script>` tags inserted via `innerHTML` do not execute — is true and irrelevant, because `<img src=x onerror=alert(1)>` works perfectly well, as do `svg/onload` and a dozen other variants.

So: `textContent` for text, `createElement` plus `setAttribute` for structure, and if you genuinely need to render user-supplied HTML, sanitise it with something like DOMPurify, or use the `setHTML` API where it is available. A content security policy is worth having as a second layer, and Trusted Types can make the unsafe sink impossible to reach at all.

## What is the DOM, and how is it structured? (E)

The DOM is the browser's in-memory representation of a parsed document, exposed as an object model that scripts can read and change. It is not the HTML source and it is not what you see on screen — the source is text, the DOM is a tree of objects, and rendering is a separate stage built from the DOM plus the CSSOM.

Structurally it is a tree of nodes. `document` is the root, and below it every element, text run, comment and attribute is a node with a type, a parent, and an ordered list of children. Elements are one kind of node, which is why `childNodes` includes text nodes for whitespace while `children` gives you only elements.

The interfaces inherit: `EventTarget` at the base, then `Node`, then `Element`, then `HTMLElement`, then the specific types like `HTMLInputElement`. That inheritance chain is why every element can take an event listener, and why an input has a `value` property that a div does not.

Worth adding that the browser also builds an accessibility tree from the DOM, which is what screen readers consume — semantic markup is what makes that tree useful.

## What is a single-page app, and how do you make one SEO-friendly? (H)

A single-page app loads one HTML shell and then handles navigation in JavaScript, swapping views and updating the URL with the History API instead of requesting a new document each time. The upside is fast in-app transitions and preserved state; the cost is that the initial page is nearly empty, everything depends on the bundle, and you have to reimplement things the browser gave you for free — scroll restoration, focus management, page titles, error states.

For SEO the fix is to make sure a real HTML document with the content in it is what gets served. In practice that means server-side rendering or static generation, so the crawler receives markup rather than an empty div. Frameworks like Next or Nuxt do this by default now, which is largely why they exist.

The rest is the ordinary hygiene that people forget in an SPA: real `<a href>` links so crawlers can follow them, unique titles and meta descriptions updated per route, canonical URLs, structured data, a sitemap, proper status codes for missing pages rather than a client-side 404 that returns 200, and server-rendered Open Graph tags since social scrapers do not run JavaScript at all.

### What does a crawler see if the content is client-rendered?

Initially, the shell — usually `<div id="root"></div>` and a script tag. Whether it ever sees more depends on the crawler.

Google will render JavaScript, but it happens in a second pass out of a queue that can lag behind the first crawl, and it is subject to timeouts and resource limits. So the content may be indexed late, partially, or not at all if it depends on something slow or on an interaction. Anything gated behind a click or an intersection observer is effectively invisible.

Most other crawlers and every social preview scraper do far less than that, so if link previews and non-Google search matter to you, client rendering alone is not enough.

### How do SSR, static generation and dynamic rendering each solve this?

Server-side rendering builds the HTML per request, so the crawler and the user both get a complete document, then the client hydrates it into an app. It handles personalised or frequently changing content, at the cost of server work on every request and a time-to-first-byte that depends on your data.

Static generation renders at build time to files that a CDN serves. It is the fastest and cheapest option and perfect for content that changes rarely — docs, marketing, blogs — but a change means a rebuild, which is what incremental regeneration exists to soften.

Dynamic rendering means detecting a bot by user agent and serving it a pre-rendered snapshot while humans get the SPA. Google has explicitly called it a workaround rather than a recommendation, it is fragile, and it sails close to cloaking if the two versions diverge. I would treat it as a stopgap for a legacy app that cannot be moved to real SSR.

## What’s the difference between the load and DOMContentLoaded events? (M)

`DOMContentLoaded` fires when the HTML has been fully parsed and the DOM is built. It waits for deferred and synchronous scripts, because those can change the document, but it does not wait for stylesheets except insofar as they block a script, and it does not wait for images or iframes.

`load` fires later, once every subresource the page depends on has finished — images, stylesheets, fonts, iframes. On an image-heavy page that can be seconds after the DOM was usable.

So `DOMContentLoaded` is when it is safe to query and manipulate elements, and `load` is when you need real dimensions of an image or the final laid-out page.

## What are the disadvantages of relying on the load event, and what are the alternatives? (M)

It is late and it is unpredictable. One slow third-party image, a hanging iframe or an ad script can push it out by seconds, so anything you hang off it is hostage to the slowest resource on the page. Users interact well before it fires, so initialising interactive behaviour there means a window where clicking does nothing.

It also does not fire again for a client-side route change, so in an SPA it is a one-time event that most of your navigation never sees. And on a page restored from the back/forward cache it does not fire at all — `pageshow` with `event.persisted` is what you need there.

The alternatives depend on what you actually wanted. For running code as early as it is safe, use a deferred script or `DOMContentLoaded`. For work that should not compete with startup, `requestIdleCallback`. For reacting to an element becoming visible, `IntersectionObserver`. For a single image, that element's own `load` event or the `decode()` promise. And for measuring real performance, the paint and layout-shift entries from `PerformanceObserver` describe the user's experience far better than a single load timestamp.

The one thing `load` is still right for is teardown-adjacent or measurement work that genuinely needs everything present — and even then `visibilitychange` and `pagehide` are the reliable exit hooks, not `unload`.

## Why does semantic HTML matter? (E)

Because the tag communicates what a thing is, and a lot of machinery downstream depends on that. Assistive technology builds its model of the page from the accessibility tree, which comes from the semantics — landmarks to jump between, headings to navigate by, roles that tell a user what they are focused on. A page made of divs gives a screen reader user nothing to work with.

You also get behaviour for free. A `button` is focusable, activates on Enter and Space, participates in the tab order and fires a click event from the keyboard. A `label` tied to an input extends the hit area and reads the name out. A `form` submits on Enter. Reimplementing all of that correctly is more work than using the right element.

Beyond that it helps crawlers and reader modes understand the document, and it makes the markup readable to the next developer — `<nav>` says something that `<div class="nav">` only implies.

### Give a case where a div with a click handler is meaningfully worse than a button.

A keyboard user cannot reach it. A div is not in the tab order, so someone navigating without a mouse simply never lands on it, and a screen reader announces it as nothing — no role, no indication it does anything.

To match a real button you would need `tabindex="0"`, `role="button"`, a keydown handler for both Enter and Space, matching `:focus-visible` styling, and a disabled state that also removes it from the tab order. Every one of those is a thing to get wrong, and the div still will not submit a form or respond to a voice-control command that says "click Save".

```
<div class="btn" onclick="save()">Save</div>   <!-- unreachable by keyboard -->
<button type="button" onclick="save()">Save</button>
```

The same argument applies to a div or a span used as a link — if it navigates, it should be an `a` with an `href`, so it can be opened in a new tab, copied, and followed by a crawler.
