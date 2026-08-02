---
slug: dom-web-apis
order: 8
number: '9'
group: LANGUAGES & MARKUP
title: DOM & Web APIs
status: answered
---

## What’s the difference between document.querySelector() and document.getElementById()? (E)

`getElementById` does one thing: look up an element by its id, using an internal map the browser maintains. It exists only on `document`, and returns the element or `null`.

`querySelector` takes any CSS selector and returns the first match in document order, or `null`. It also exists on every element, so you can scope a search to a subtree, which is the part I use most — `row.querySelector('.price')` rather than searching the whole document.

The pairs matter too. `querySelectorAll` returns a static NodeList — a snapshot that does not change as the DOM does — whereas `getElementsByClassName` and `getElementsByTagName` return live HTMLCollections that update underneath you. The live ones are a classic source of bugs in loops, because removing an element shifts the collection while you are iterating it.

```js
const el = document.getElementById('total');
const el2 = document.querySelector('#total');       // same element
const rows = document.querySelectorAll('tbody tr'); // static
```

### Is there a meaningful performance difference, and does it matter in practice?

`getElementById` is faster in a microbenchmark, because it is a hash lookup rather than selector parsing and tree matching. The gap widens with complex selectors and large documents.

In practice it almost never matters — you are talking about microseconds against a frame budget of sixteen milliseconds, and the query is rarely the expensive part of anything. What does matter is querying in a loop or on every scroll or resize event, and the fix there is to cache the reference rather than to pick a different method.

The case where it genuinely shows up is querying thousands of times, say per row in a large table. That is usually a signal to restructure — query the container once and work from there, or use delegation — rather than to micro-optimise the call.

## What’s the difference between mouseenter and mouseover? (E)

`mouseover` fires every time the pointer crosses into the element or any of its descendants, and it bubbles. So moving across a card with a heading and an image inside it fires it repeatedly, with `mouseout` in between, even though the pointer never left the card visually.

`mouseenter` fires once when the pointer enters the element's bounds and does not fire again for descendants. It does not bubble.

That makes `mouseenter` and `mouseleave` the right pair for hover behaviour on a component — a tooltip, a dropdown, a highlight — because they match the intuition of "the pointer is in this thing".

`mouseover` earns its keep with delegation: because it bubbles, one listener on a container can handle hover for every child, which `mouseenter` cannot do. If you use it directly, `event.relatedTarget` tells you where the pointer came from, so you can ignore movements that stayed inside.

## What’s the difference between event.preventDefault() and event.stopPropagation()? (E)

They address two unrelated things. `preventDefault` cancels the browser's built-in action for the event — following a link, submitting a form, ticking a checkbox, scrolling on a wheel event. The event still travels through the tree normally.

`stopPropagation` stops the event moving any further along its path, so ancestor listeners never see it. The default action still happens.

```js
form.addEventListener('submit', (e) => {
  e.preventDefault();  // don't navigate; still bubbles
});
```

Not every event is cancellable — you can check `event.cancelable`, and `defaultPrevented` afterwards tells you whether someone already called it. And passive listeners, which is the default for `touchstart` and `wheel` on the document, cannot cancel at all; calling `preventDefault` there does nothing but log a warning.

The advice worth adding is that `stopPropagation` should be rare. It breaks things at a distance — analytics, a click-outside handler, a framework's delegated root listener — because those listeners are higher up and now silently never fire. Usually the right fix is a condition in the outer handler rather than silencing the event.

### What does stopImmediatePropagation add?

It stops the other listeners on the same element too, not just the ancestors. Listeners on one element run in the order they were added, and `stopPropagation` still lets the rest of that group run; `stopImmediatePropagation` cuts the whole thing off immediately.

It is the sharper tool of the two and worth reaching for even less often. The legitimate use is when you are deliberately overriding another handler you do not control — a third-party widget, say — and need to be sure it does not also run.

## How do you add, remove and modify HTML elements with JavaScript? (E)

Create with `document.createElement`, set what you need on it, then insert it. The modern insertion methods are the ones worth knowing: `append` and `prepend` take multiple nodes or plain strings, `before` and `after` insert as siblings, `replaceWith` swaps an element out, and `remove` deletes it without needing a reference to the parent.

```js
const li = document.createElement('li');
li.textContent = item.name;
li.dataset.id = item.id;
list.append(li);

li.classList.add('done');
li.remove();
```

The older API — `appendChild`, `insertBefore`, `removeChild`, `parentNode.replaceChild` — does the same work more awkwardly and only accepts nodes.

For content, `textContent` for text and `createElement` for structure. `insertAdjacentHTML` is the pragmatic option when you genuinely have a trusted HTML string, and it is better than `innerHTML +=` because it does not destroy and rebuild the existing children — that pattern throws away event listeners and resets form state on everything inside.

And in any framework, none of this. Direct DOM manipulation fights the framework's own model of the tree; you change state and let it reconcile.

### Why is a DocumentFragment useful when inserting many nodes?

Because it is a lightweight container that is not part of the document, so building inside it costs nothing in layout terms. When you append the fragment, its children are moved into place in one operation and the browser does one round of style and layout work instead of one per node.

```js
const frag = document.createDocumentFragment();
for (const item of items) {
  const li = document.createElement('li');
  li.textContent = item.name;
  frag.append(li);
}
list.append(frag);   // one insertion
```

The fragment itself is not inserted — it empties into the parent — so you do not get a wrapper element, which is the same trick React fragments are named after.

Worth being honest that modern engines batch layout well, so the difference is smaller than it once was, and `list.append(...nodes)` in one call gets you most of the same benefit. The real killer for performance is not the insertions but interleaving reads and writes — appending a node then reading `offsetHeight` in the same loop forces a synchronous layout every iteration, which is layout thrashing.

## How can two iframes on a page communicate? (M)

If they are same-origin, they can reach each other directly through the frame relationships — `window.parent`, `window.top`, `window.frames`, or the `contentWindow` of the iframe element. At that point it is ordinary scripting: one document can call functions and read the DOM of the other.

Cross-origin, that is all blocked by the same-origin policy, and the sanctioned channel is `postMessage`. Frames cannot address each other directly, so the usual shape is child to parent and parent to the other child, with the parent acting as a broker.

There are other channels worth naming: `BroadcastChannel` for same-origin contexts including tabs and workers, a `SharedWorker` if you need shared logic rather than just messages, and the storage event, which fires in other same-origin contexts when localStorage changes — crude, but it is how a lot of cross-tab logout still works.

```js
child.contentWindow.postMessage({ type: 'resize', height }, 'https://widget.example.com');
```

### What does postMessage do, and why must you check the origin?

It sends a structured-cloneable message to another window, which receives it as a `message` event. The data is copied, not shared, so functions and DOM nodes do not survive the trip, though you can transfer things like an ArrayBuffer or a MessagePort explicitly.

Two checks matter and both get skipped. On the way out, pass a specific target origin rather than `'*'` — with a wildcard, if the frame has navigated somewhere you did not expect, you have just handed your message to whatever is there now.

On the way in, verify `event.origin` before doing anything, because any window with a reference to yours can post to you. Without that check, a message handler that acts on what it receives is a remote control anyone can pick up. In the same spirit, treat the payload as untrusted input — validate its shape, and never feed it into `innerHTML` or `eval`.

```js
window.addEventListener('message', (e) => {
  if (e.origin !== 'https://widget.example.com') return;
  handle(e.data);
});
```

## What is event delegation, and why is it useful? (M)

Instead of attaching a listener to each element, you attach one to a common ancestor and use the fact that events bubble to work out which descendant it came from — usually with `event.target.closest(...)`.

```js
list.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn || !list.contains(btn)) return;
  handle(btn.dataset.action, btn.dataset.id);
});
```

The reasons it is useful: one listener instead of hundreds, which is less memory and less setup work; it handles elements that do not exist yet, so anything added later just works without rebinding; and there is nothing to clean up per element when rows are removed, which removes a whole category of leak.

It is the mechanism frameworks use internally — React attaches its listeners at the root of the app rather than to each rendered element.

The caveats are that `event.target` may be a descendant of the thing you care about, which is what `closest` is for; that a `stopPropagation` anywhere below you silently breaks it; and that a very busy container handling something like `mousemove` can end up doing more work, not less.

### What are its limits — which events do not bubble?

`focus` and `blur` do not bubble — but `focusin` and `focusout` are the bubbling equivalents, so delegation is still possible if you use those. Same story with `mouseenter` and `mouseleave`, where `mouseover` and `mouseout` bubble.

`load`, `error`, `abort` and the media events do not bubble either. An image failing to load is a real case here: to catch those centrally you have to register in the capture phase, since capturing reaches the target on the way down even when the event will not bubble back up.

`scroll` does not bubble from an element, though the document's scroll event reaches `window`, and `resize` only fires on `window`. Some events on the document, like `DOMContentLoaded`, are one-offs where delegation is irrelevant.

There is also a practical limit rather than a spec one: a disabled form control does not fire mouse events at all, so its ancestors see nothing.

## What is event bubbling, what is event capturing, and what are the event phases? (M)

An event travels in three phases. Capturing goes from `window` down through each ancestor to the target's parent. Then the target phase, where the event is at the element itself. Then bubbling, back up through the ancestors to `window`.

Capturing exists so an ancestor can see an event before the target does, which is what makes it useful for intercepting. Bubbling is the default because it matches how people usually reason about it — the button was clicked, and its container can react to that.

`event.currentTarget` is the element whose listener is running; `event.target` is where the event originated. Mixing them up is the most common delegation bug. `event.eventPhase` tells you which phase you are in, and `event.composedPath()` gives the whole route, which is how you look through a shadow DOM boundary.

### How do you register a listener for the capture phase, and when would you?

Pass `true` as the third argument to `addEventListener`, or `{ capture: true }` in the options object. The flag is part of the listener's identity, so `removeEventListener` has to be given the same value or it will not match.

```js
el.addEventListener('click', handler, { capture: true });
el.removeEventListener('click', handler, { capture: true });
```

I reach for it when I need to act before anything below me can, or when the event will not bubble. The concrete cases: catching `error` on images or scripts centrally, since those do not bubble; a modal or overlay that needs to intercept clicks before an inner widget calls `stopPropagation`; and instrumentation or analytics that must observe events regardless of what handlers below decide to do.

The other options are worth knowing at the same time — `once` for auto-removal after the first call, `passive` to promise you will not call `preventDefault` so the browser can scroll without waiting, and `signal` so an AbortController can remove a group of listeners in one go.

## What’s the difference between a cookie, sessionStorage and localStorage? (M)

Cookies are the oldest and the only one the browser sends to the server. They are small — around 4KB — have an expiry, and carry attributes that matter for security: `HttpOnly` to hide them from JavaScript, `Secure` for HTTPS only, `SameSite` to control cross-site sending, plus path and domain scoping.

localStorage and sessionStorage share an API — `setItem`, `getItem`, `removeItem`, `clear` — hold roughly 5 to 10MB, are string-only so you serialise anything structured, and are never sent anywhere. They are scoped per origin.

The differences that decide which to use: lifetime, and whether the server needs it. There is also a shared drawback — the storage API is synchronous, so a large read or write blocks the main thread, and it is always readable by any script on the page, which makes it a poor place for tokens. IndexedDB is the answer for anything large or structured.

### Which is sent with every request, and what does that cost you?

Cookies, automatically, on every matching request — including images, stylesheets and API calls, whether or not that request needs them. So a few kilobytes of cookie is a few kilobytes added to every single request from that origin, which hurts most on upload-constrained mobile connections.

It also complicates caching: a response that varies by cookie is harder to serve from a CDN, and it is why static asset domains are often kept cookie-free.

The upside is exactly the same property. Because the browser attaches them without any script involvement, a cookie can be `HttpOnly` and still work, which is what makes cookie-based sessions more resistant to XSS than a token sitting in localStorage. The trade is that automatic sending is what enables CSRF, which is what `SameSite` and CSRF tokens exist to address.

### Which survives a tab close, and which survives a browser restart?

sessionStorage is scoped to the tab. Close the tab and it is gone; open the same site in a second tab and it starts empty, because each tab has its own store. It does survive a reload, and it is duplicated into a tab opened via a link from the original.

localStorage persists across tab closes and browser restarts, with no expiry — it stays until code removes it or the user clears site data. It is shared across all tabs on that origin, and the `storage` event lets other tabs react to changes.

Cookies are either: a session cookie with no expiry attribute dies with the browser session, and one with `Expires` or `Max-Age` persists until that time. Bear in mind "browser session" is fuzzy, since browsers that restore tabs on relaunch often restore session cookies with them.

## How do you manipulate CSS styles using JavaScript? (E)

The direct route is the `style` property, which reads and writes inline styles with camelCased names — `el.style.backgroundColor = 'red'`. Custom properties are the exception and need the bracket form: `el.style.setProperty('--gap', '8px')`.

Reading `el.style` only gives you inline styles, so it will be empty for anything set in a stylesheet. For the computed value you need `getComputedStyle(el)`, which returns the resolved value after the cascade — and reading from it forces the browser to flush pending layout, so it is not free.

Then `classList` — `add`, `remove`, `toggle`, `contains`, `replace` — which is what I use for almost everything, and `el.className` if I want to replace the lot.

For dynamic values, setting a custom property on an element or on `:root` and letting CSS use it keeps the actual styling in the stylesheet:

```js
el.classList.toggle('is-open', isOpen);
el.style.setProperty('--progress', `${pct}%`);
```

There is also `document.adoptedStyleSheets` with constructable stylesheets for injecting whole rules, which is mainly a web components concern.

### Why is toggling a class usually better than setting inline styles?

It keeps the styling in the stylesheet where it belongs, so the JavaScript expresses state — is this open, is this loading — and CSS decides what that looks like. A designer can change the appearance without touching the script.

Practically: inline styles carry very high specificity and are painful to override, they multiply when a component has several states, and removing them means setting each property back to an empty string, whereas removing a class undoes everything at once. A class can also change many properties at once, and can be paired with a transition cleanly.

Performance is a minor factor in the same direction — one class change is one style recalculation, where a run of individual property writes can be more. Not usually decisive, but it points the same way.

The exception is genuinely dynamic values that CSS cannot know: a position from a drag, a computed height for an animation, a progress percentage. Even there, writing them into a custom property and letting the class handle the rest is the tidier version.

## How does the IntersectionObserver API work, and what is it commonly used for? (M)

You create an observer with a callback and some options, then call `observe` on each element you care about. The browser watches the intersection between those elements and a root — the viewport by default — and calls you asynchronously when the overlap crosses a threshold you specified.

The callback receives entries, each with `isIntersecting`, `intersectionRatio`, the geometry rectangles and a timestamp. Crucially the work happens off the main thread and you are only told about changes, rather than asking constantly.

```js
const io = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      load(entry.target);
      io.unobserve(entry.target);
    }
  }
}, { rootMargin: '200px' });

document.querySelectorAll('img[data-src]').forEach((el) => io.observe(el));
```

The common uses are lazy loading images and content, infinite scroll with a sentinel element at the bottom of the list, tracking whether an ad or a section was actually seen, scroll-triggered animations, and highlighting the current section in a table of contents.

### Why is it better than listening to scroll events?

A scroll listener runs on the main thread, potentially many times per frame, and inside it you almost always call `getBoundingClientRect`, which forces layout. Multiply that by the number of elements you are tracking and you have built a jank machine. You can throttle and cache, but you are managing complexity that the browser can do for you.

IntersectionObserver inverts it: the browser already knows the geometry, does the comparison itself, and only calls you when something crosses a threshold. Nothing runs during quiet scrolling, and the callback is delivered outside the critical rendering path.

It is also less code and harder to get wrong — no throttling logic, no recomputing on resize, no bookkeeping about what has already fired.

### What do the root, rootMargin and threshold options control?

`root` is the element you are measuring against. `null`, the default, means the viewport; passing a scrollable ancestor lets you observe intersections inside a scroll container. The root has to be an ancestor of what you observe.

`rootMargin` grows or shrinks that box before the comparison, using CSS margin syntax. `'200px'` makes things count as intersecting 200px before they appear, which is how you preload images just off-screen; negative values shrink it, so you can require an element to be well inside the viewport before firing. With the viewport as root it must be in pixels or percentages, not other units.

`threshold` is how much overlap counts, from 0 to 1 — 0 fires as soon as a single pixel crosses, 1 needs the element fully visible, and an array like `[0, 0.5, 1]` gives you a callback at each crossing, which is how you build a visibility meter. Note that the ratio is relative to the observed element's size, so an element taller than the viewport can never reach 1.

## What is the MutationObserver API for, and when would you reach for it instead of an event listener? (M)

It watches for changes to the DOM itself — children added or removed, attributes changed, text data changed — and delivers a batch of records asynchronously as a microtask, once the current script has finished.

```js
const mo = new MutationObserver((records) => {
  for (const r of records) enhance(r.addedNodes);
});
mo.observe(container, { childList: true, subtree: true, attributes: true });
```

You reach for it when there is no event to listen to, which is the honest answer. The DOM does not fire events for structural changes, so if you need to know that something appeared, this is the only observer for it.

The real cases are code you do not control: a third-party widget or a legacy script injecting markup you need to hook into, an editor or CMS-rendered region you want to enhance, or a polyfill that must apply itself to elements as they arrive. It is also used for things like watching an attribute change on an element you did not render.

In your own application code it is nearly always the wrong tool — you know when you changed the DOM, so react at the source instead. Other reasons to be wary: the callback runs on the main thread and a broad `subtree` observation on a busy container can be expensive; it is easy to write an infinite loop by mutating inside the callback; and you must call `disconnect` when finished, plus `takeRecords` if you need anything still queued. Where a purpose-built observer exists — IntersectionObserver for visibility, ResizeObserver for size — use that instead, because those are cheaper and more precise.
