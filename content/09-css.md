---
slug: css
order: 9
number: '10'
group: LANGUAGES & MARKUP
title: CSS
status: answered
---

## Center a div — give three methods (flex, grid, absolute plus transform) and say when each fits. (E)

Flexbox on the parent is my default for one child or a row of them, because it centres and also gives you gaps and direction control.

Grid is the shortest of the three — `place-items: center` does both axes in one declaration — and it is the right choice when the container is already a grid or when you want the centred thing to sit in a cell.

Absolute positioning with a translate is the one that does not touch layout, so it fits overlays, modals and anything sitting on top of other content rather than participating in the flow.

```
.parent { display: flex; align-items: center; justify-content: center; }

.parent { display: grid; place-items: center; }

.parent { position: relative; }
.child  { position: absolute; inset: 50% auto auto 50%; transform: translate(-50%, -50%); }
```

Worth knowing that `margin: auto` on a flex or grid child centres it on both axes too, and for a single line of text `line-height` equal to the container height is still the cheapest vertical centre.

### Which one works without knowing the element’s dimensions?

All three, which is the point of them. The absolute one is the interesting case: `top: 50%` positions the child's top edge at the container's midpoint, which is wrong by half the child's height, and `translate(-50%, -50%)` corrects it — percentages in `transform` resolve against the element's own size, so it does not need to be known in advance.

The old technique of `margin-top: -50px` needed a hard-coded height, and that is exactly what the translate version replaced.

Flex and grid never needed the dimensions at all, because the container is measuring the child as part of layout. That is why they are the better default, and the absolute version is reserved for when you specifically want the element out of flow.

## What is the box model, and how do you switch between box models? (M)

Every element is a set of nested boxes: the content box, then padding, then border, then margin. The box model is how `width` and `height` map onto those boxes.

By default, `box-sizing: content-box`, `width` sets the content box only — padding and border are added on top, so a `width: 200px` element with 20px padding and a 1px border occupies 242px. That is the CSS spec's original model and it makes sizing arithmetic annoying.

`box-sizing: border-box` makes `width` describe the content, padding and border together, so the element occupies exactly 200px and the content shrinks to fit.

Margin is outside both, always. In DevTools the box diagram in the layout panel shows the four rings, which is the fastest way to see where an unexpected 40px came from.

## What does * { box-sizing: border-box; } do, and what are its advantages? (M)

It switches every element to the border-box model, so declared widths are the final rendered widths.

The advantage is that sizing composes. You can put `width: 50%` and `padding: 1rem` on the same element and get a half-width column, instead of half plus two paddings plus two borders overflowing its parent. Grids built from percentages stop breaking when someone adds padding, and adding a 1px border on hover no longer nudges the layout.

The version I actually write inherits, so a component can opt out for a subtree if it needs to:

```
html { box-sizing: border-box; }
*, *::before, *::after { box-sizing: inherit; }
```

The universal selector cost is negligible — this is in every reset for a reason. The one thing to watch is that a fixed border-box height plus large padding can crush the content box to zero, and third-party embeds occasionally assume content-box.

## What’s the difference between em, rem, %, vh/vw, ch and fr? (M)

`em` is relative to the font size of the element itself, and `rem` to the root element's font size — usually 16px unless the user has changed it, which is the reason to prefer relative units over pixels at all.

`%` is relative to some property of the parent, and which property depends on what you are setting: width percentages resolve against the parent's width, and so, awkwardly, do horizontal *and vertical* padding and margin percentages.

`vh` and `vw` are one percent of the viewport height and width, so they are relative to the window rather than to any ancestor. `ch` is the width of the "0" character in the current font, which makes it the natural unit for line length — `max-width: 65ch` is a readable measure.

`fr` is grid-only: a fraction of the leftover space in the container after fixed tracks and gaps are taken out.

My default is `rem` for spacing and type, `ch` for text measure, percentages and `fr` for layout, and pixels only for things that genuinely are fixed, like a hairline border.

### What is em relative to for font-size versus for padding?

For `font-size`, `em` resolves against the parent's computed font size — that is what makes it compound. Nested elements each multiplying by 1.2 get away from you quickly, which is the classic argument for `rem`.

For every other property, including padding, margin, width and border-radius, `em` resolves against the element's own computed font size — which, if you also set `font-size` on that element, is the new value, not the parent's.

That is actually the useful case: `padding: 0.5em 1em` on a button scales the padding with the label, so one class gives you a small and a large button just by changing the font size.

### What is the problem with 100vh on mobile browsers?

`vh` is measured against the largest viewport, with the URL bar and toolbars collapsed. On a phone where those chrome elements are visible on load, `100vh` is taller than what you can actually see, so the bottom of a "full height" hero is cut off and a footer pinned there sits below the fold. Resizing as the bar hides would cause a reflow on every scroll, so browsers deliberately do not do it.

The fix is the newer viewport units: `svh` is the small viewport, with the chrome showing; `lvh` is the large one, matching the old `vh`; and `dvh` is dynamic, tracking the current state. `100dvh` is what most people want for a full-height panel, with `100svh` when it must never overflow.

There is also `100%` on a chain of parents up to `html`, which sidesteps the issue for simple cases, and for centring things `min-height: 100dvh` behaves better than a fixed height because content can still grow past it.

## What is the display property, and what are some of its values? (M)

`display` sets what box an element generates and how its children are laid out. It is really two things at once — the outer display type, which is how the element behaves in its parent's flow, and the inner one, which is the formatting context it establishes for its children. `display: inline flex` is the explicit two-value syntax for that; `inline-flex` is the legacy shorthand for the same thing.

The values I use: `block` and `inline` for the flow defaults, `inline-block` when something needs to sit in a line but take width and vertical padding, `flex` and `grid` for layout, `none` to remove the element entirely, and `contents` to make the box vanish while keeping its children in the parent's layout — useful for a wrapper that would otherwise break a grid.

`table` and friends still exist and are occasionally the pragmatic answer for genuine tabular layout, and `list-item` is what generates a marker.

Worth mentioning that `display` interacts with other properties: floats and absolute positioning force an element to a block-level box regardless of what you declared, and a flex or grid container blockifies its children.

## What’s the difference between block, inline and inline-block? (E)

A block element starts on a new line, takes the full available width by default, and respects width, height, and margin and padding on all sides.

An inline element flows within the line, is only as wide as its content, and ignores `width` and `height` entirely. Horizontal margin and padding apply; vertical padding renders but does not affect the line's height, and vertical margin does nothing at all.

`inline-block` is the hybrid: it sits in the line like an inline element but is a block box internally, so width, height and all margins and padding work as expected.

The one that trips people up in practice is that inline-block elements are affected by whitespace in the HTML, so a row of them has small gaps between them from the newlines in the source. That is a large part of why flexbox replaced them for layout.

### Why does vertical padding behave oddly on an inline element?

Because the height of a line box is determined by the font metrics and `line-height`, not by the padding of the inline boxes in it. So vertical padding on a `span` paints — you see the background extend — but it does not push the surrounding lines apart, and the result is a highlight that overlaps the lines above and below.

Vertical margins are dropped completely for the same reason: there is nothing in the inline layout model for them to act on.

If you want the padding to occupy space, the element has to generate a box that participates in block layout, which means `inline-block`, or making it a flex or grid item. Changing `line-height` is the other lever when what you actually wanted was more room in the line.

## What’s the difference between relative, fixed, absolute, sticky and static positioning? (M)

`static` is the default: the element sits in normal flow and `top`, `left`, `z-index` and friends do nothing.

`relative` keeps the element in flow — the space it occupied is preserved — but paints it offset from where it would have been. Its main job in real code is to establish a containing block for absolutely positioned children.

`absolute` removes the element from flow entirely, so it takes no space, and positions it against its nearest positioned ancestor.

`fixed` also leaves flow and positions against the viewport, so it does not move when the page scrolls — a header bar, a cookie banner.

`sticky` is a hybrid: it behaves as relative until its containing block scrolls past a threshold you set with `top`, `left`, `bottom` or `right`, then it behaves like fixed within that container, and stops at the container's edge. It is what you want for a table header or a section label that should stay visible only while its section is on screen.

### What is an absolutely positioned element positioned relative to?

Its containing block, which is the padding box of the nearest ancestor with a `position` other than `static`. If there is none, it falls back to the initial containing block — effectively the viewport at the document's origin, which is why a stray absolute element often ends up at the top of the page.

That is why `position: relative` on the parent is the ubiquitous pairing: it does not move the parent at all, it just makes it the reference point.

The wrinkle worth knowing is that `transform`, `filter`, `perspective`, `backdrop-filter`, `contain: paint` and `will-change` on those properties also create a containing block, even for `position: fixed`. So a fixed-position modal inside a transformed ancestor will be positioned against that ancestor instead of the viewport, which looks like the modal is broken. Moving it to the top level, or a dialog element with the top layer, is the fix.

### Why does position: sticky sometimes silently do nothing?

Usually one of four reasons. The first is no threshold — sticky does nothing without `top`, `bottom`, `left` or `right`, since that value is what it sticks at.

The second is an ancestor with `overflow` set to `hidden`, `scroll` or `auto`. That element becomes the scroll container, and if it is not the thing actually scrolling, the sticky element has nothing to stick within. This is the common one, and it is often an `overflow: hidden` added several levels up for an unrelated reason.

The third is the containing block being no taller than the sticky element itself — sticky only travels within its parent, so if the parent is exactly as tall as the child there is nowhere to go. That is the usual explanation for a sticky item in a flex or grid container, where a stretched sibling can also change the height.

The fourth is a fixed `height` on an ancestor that stops it scrolling at all. DevTools flags unsatisfied sticky elements now, which saves a lot of guessing.

## What is CSS selector specificity, and how does it work? (H)

Specificity decides which declaration wins when several target the same element. It is a three-part value — ids, then classes with attribute selectors and pseudo-classes, then element types and pseudo-elements — compared left to right, so a single id beats any number of classes.

The universal selector and combinators add nothing. The critical part is that the comparison is not decimal: eleven classes do not add up to an id.

Specificity is also only one step in the cascade, and it is nearly the last thing consulted. Origin and importance come first, then cascade layers, then specificity, and only if everything ties does source order decide.

```
a                     0,0,1
.nav a                0,1,1
#header .nav a        1,1,1
```

The practical takeaway is to keep specificity flat and roughly equal across your stylesheet, so that source order does the deciding — that is the whole idea behind BEM, CSS modules and layers.

### Where do inline styles and !important sit?

An inline `style` attribute is outside the three-part value and beats any selector from a stylesheet, which is a large part of why inline styles are hard to work with.

`!important` sits outside specificity entirely — it moves the declaration into a different origin bucket. Within your own stylesheet an important declaration beats every normal one regardless of selectors, and if two important declarations collide, specificity is compared between them.

The full order, weakest to strongest: user-agent normal, user normal, author normal, author important, user important, and user-agent important at the top. Notice that important reverses the order, which is deliberate — it is what lets a user's accessibility stylesheet override a site.

The other thing worth naming is that CSS transitions and animations sit in their own layers above all of this, which is why an animation can override an important declaration while it runs.

### What is the specificity of :is(), :where() and :not()?

`:where()` always contributes zero. Everything inside it is free, which makes it the tool for writing low-specificity defaults that authors can override with a plain class.

`:is()` and `:not()` take the specificity of their most specific argument. So `:is(#main, .card)` counts as an id everywhere it is used, which is a trap — one id in the list raises the whole selector. `:not(.foo)` counts as a class.

`:has()` behaves like `:is()`, taking its most specific argument.

The practical rule I follow is to reach for `:where()` in resets and base layers, and to keep the arguments to `:is()` at a consistent level so a list does not quietly become an id selector.

## How does a browser determine which elements match a CSS selector? (H)

At a high level: the browser parses the stylesheets into rules, indexes them by the rightmost part of each selector — mostly by id, class, tag and attribute — into hash maps. Then during style resolution, for each element it looks up only the small set of candidate rules whose key selector could match, and tests those properly.

Testing a candidate means walking leftwards through the combinators, checking ancestors or siblings as required. The matched declarations are then sorted by the cascade, and the winning values become the element's computed style, with inheritance filling in the rest.

Modern engines add a lot on top of that — style sharing between identical siblings, invalidation sets so that changing one class only restyles the elements that could be affected, and Bloom filters to reject ancestor-dependent selectors quickly. That is why "efficient selectors" is a much weaker concern than it was fifteen years ago.

### Why does the browser read selectors right to left?

Because it is matching from an element, not searching for elements. The question it needs to answer is "which rules apply to this div", and the fastest way to reject a rule is to test the part that describes the element itself.

Left to right you would have to start from the ancestor and walk down every possible descendant path, discovering only at the end whether any of it matched the element you cared about. Right to left, most rules are eliminated on the first test.

That is also why `.nav a` is fine but `div * span` is not: the key selector `span` matches many elements, and each one then requires walking the whole ancestor chain to find out it does not qualify. The lesson is to make the rightmost part specific — but again, this is rarely a real bottleneck today, and layout and paint are where the time actually goes.

## What is z-index, and how is a stacking context formed? (H)

`z-index` sets the painting order of positioned elements along the z axis. It only applies to elements that are positioned, or are flex or grid items, and it is meaningless anywhere else.

A stacking context is a self-contained group of layers. Everything inside it is painted as one unit relative to its siblings, and `z-index` values inside it are only compared with each other — they cannot interleave with elements outside.

The root element always forms one. Beyond that, a positioned element with a `z-index` other than `auto` creates one, and so do a number of properties independently of positioning.

Within a context the paint order is: the background and borders of the element itself, then negative z-index children, then in-flow block boxes, then floats, then inline content, then z-index 0 and `auto` positioned elements, then positive z-index in ascending order.

### Name three properties other than z-index that create a stacking context.

`opacity` less than 1, any `transform` other than `none`, and `filter`. Those are the three that catch people out, because none of them look like they have anything to do with layering — a fade-in animation on a card can change how its children stack.

There are plenty more: `will-change` naming any of those properties, `isolation: isolate`, `mix-blend-mode` other than `normal`, `contain: paint` or `content`, `backdrop-filter`, `perspective`, `position: fixed` and `sticky` unconditionally, and being a flex or grid child with a z-index.

`isolation: isolate` is the useful one to know deliberately — it creates a stacking context and nothing else, so it is how you fence off a component's internal z-indexes without side effects.

### Why can a child with z-index 9999 still sit behind another element?

Because it is trapped in an ancestor's stacking context. Once the parent forms a context, the child's z-index is only compared against its siblings inside that context — the whole group is then placed as a single unit at the parent's level.

So if the parent sits at `z-index: 1` and another element is at `z-index: 2`, everything in the parent is behind that element, no matter how large the numbers inside get.

Diagnosing it is a matter of walking up the tree looking for what created the context — often an `opacity`, `transform` or `filter` nobody connected to the problem. The fix is either to raise the ancestor, or to move the element out of that subtree entirely, which is why modals and tooltips are typically portalled to the body or rendered in the top layer with `dialog` or the Popover API, where z-index does not apply at all.

## What is a Block Formatting Context, and how does it work? (H)

A Block Formatting Context is a region of the page laid out independently, where the boxes inside it do not interact with boxes outside it. The root element establishes one, and various things create new ones: floats, absolutely positioned elements, inline-blocks, flex and grid items, table cells, `overflow` other than `visible`, `display: flow-root`, and `contain: layout`.

Two behaviours make it worth knowing. First, margins do not collapse across a BFC boundary — inside one, adjacent vertical margins collapse as usual, but they will not escape it. Second, a BFC contains its floats: it grows to include them rather than collapsing to zero height.

That second one is the old "clearfix" problem, and `display: flow-root` is the modern, side-effect-free way to solve it — `overflow: hidden` was the traditional trick, but it also clips content and can break sticky positioning.

A BFC also will not overlap a float, which is the basis of the classic two-column layout where a float sits beside a block that has been given its own BFC.

```
.container { display: flow-root; }   /* contains floats, no clipping */
```

Flex and grid have their own formatting contexts with their own rules — notably, margins never collapse between flex items — so most of this matters less than it once did, but it still explains a lot of surprising vertical space.

## What are pseudo-elements, and what are they used for? (M)

A pseudo-element addresses a part of an element that has no markup of its own, and in the case of `::before` and `::after` it generates a box that was not in the DOM at all. They need a `content` property to render, even if it is an empty string.

The ones I actually use: `::before` and `::after` for decoration — icons, quote marks, a gradient overlay, a required-field asterisk, and a common trick for maintaining aspect ratio before `aspect-ratio` existed. `::placeholder` and `::selection` for styling browser-provided bits. `::first-line` and `::first-letter` for typography. `::marker` for list bullets, and `::backdrop` for the area behind a dialog or a fullscreen element.

The important limitation is that generated content is not real content — it is not in the DOM, it cannot hold interactive elements, and it is inconsistently exposed to screen readers, so nothing meaningful should live there. Decoration only.

They also cannot be attached to replaced elements like `img` or `input`, because those have no children to insert into.

### What’s the difference between a pseudo-element and a pseudo-class?

A pseudo-class selects an existing element based on state or position — `:hover`, `:focus-visible`, `:checked`, `:disabled`, `:nth-child()`, `:first-of-type`, `:has()`. The element is already in the DOM; the pseudo-class is a condition on it.

A pseudo-element addresses a sub-part of an element, or creates a box that is not in the DOM.

The syntax convention is one colon for pseudo-classes and two for pseudo-elements, introduced in CSS3 to distinguish them. Single-colon `:before` still works for the four original pseudo-elements out of backwards compatibility, but two is correct.

They combine, which is where they get useful — `a:hover::after` styles the generated box only while the link is hovered.

## What’s the difference between resetting and normalizing CSS, and which would you choose? (M)

A reset strips browser defaults down to nothing — margins and padding to zero, headings to the same size as body text, lists without markers — so you start from a blank slate and everything is your decision.

Normalize keeps useful defaults and fixes inconsistencies between browsers instead. Headings still look like headings; what changes is the handful of places where browsers disagree.

I use a small modern reset of my own rather than either classic. Something like border-box on everything, margins zeroed, `line-height` and text-size-adjust set sensibly, `img` and `svg` set to `display: block` with `max-width: 100%`, form controls inheriting the font, and a `prefers-reduced-motion` block that disables animation. Josh Comeau's and Andy Bell's resets are both in that spirit.

The one caution with an aggressive reset is that removing all defaults also removes semantics people rely on visually — an unstyled `ul` in prose or a heading that no longer looks like one is an accessibility regression as much as a visual one. And these days a design system or Tailwind's preflight is usually doing this for you, so the real question is whether you know what your base layer is doing.

## What’s the difference between Flexbox and Grid, and when would you use each? (M)

Flexbox is one-dimensional: you lay out along a main axis and the cross axis follows. Grid is two-dimensional, with rows and columns defined together so items align in both directions at once.

The other distinction I find more useful in practice is that flex is content-driven and grid is layout-driven. In flex, the items' own sizes determine how the space is distributed; in grid, you define the tracks first and the items go into them.

So: flex for a row of buttons, a navbar, a card footer, anything where the number of items varies and they should size themselves. Grid for page layout, a card gallery with aligned rows, a form with aligned labels and inputs, or anything where things must line up across both axes.

They compose — a grid page layout with flex inside individual components is the normal arrangement, and neither is a replacement for the other.

Grid also does things flex simply cannot: overlapping items in the same cell, named template areas, and `auto-fit` with `minmax` for a responsive gallery without a single media query.

```
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}
```

### What does flex: 1 actually expand to?

`flex-grow: 1`, `flex-shrink: 1`, `flex-basis: 0%`. The basis is the part people miss — a bare number in the shorthand sets the basis to zero, not `auto`.

That matters because with a zero basis the items' content is ignored when distributing space, so `flex: 1` on three items gives three exactly equal columns. `flex: auto`, which is `1 1 auto`, distributes the *leftover* space instead, so an item with more text ends up wider.

`flex: none` is `0 0 auto`, which is how you stop something shrinking — worth knowing because flex items shrink below their content by default, and the usual fix for text overflowing a flex item is `min-width: 0`, since the automatic minimum size is `auto` rather than zero.

### What is the difference between fr and percentage in a grid track?

`fr` distributes the space left after fixed tracks and gaps are accounted for. A percentage resolves against the container's content box, and does not know about the gaps — so `repeat(3, 33.33%)` with a gap overflows, while `repeat(3, 1fr)` fits.

The second difference is that `1fr` is not simply "one third". It is shorthand for `minmax(auto, 1fr)`, so a track will not shrink below its content's minimum size — a long unbreakable word can push a `1fr` track wider than its share. `minmax(0, 1fr)` is the fix when you want a strictly equal track that permits its content to overflow or truncate.

Percentages still have their place for a track that must be an exact proportion of the container regardless of content, but `fr` is the right default because it composes with gaps and with fixed sidebars: `grid-template-columns: 240px 1fr` needs no arithmetic at all.

## How do you implement media queries or mobile-specific layouts? (M)

A `meta viewport` tag first, because without it a mobile browser renders at a virtual 980px and scales down, and no media query will behave as you expect.

Then media queries in the stylesheet, mobile-first, so the base styles are the narrow layout and `min-width` queries layer on the wider ones. I pick breakpoints where the design actually breaks rather than from a device list, since chasing device widths is a losing game.

```
.grid { display: grid; gap: 1rem; }

@media (min-width: 48rem) {
  .grid { grid-template-columns: 1fr 1fr; }
}
```

The more important point is that a lot of what people reach for media queries for no longer needs them. `clamp()` for fluid type, `minmax` with `auto-fit` for responsive grids, `flex-wrap`, and container queries for components all adapt continuously rather than at fixed jumps. I use media queries for page-level structural changes and let the smaller stuff be intrinsically responsive.

Breakpoints in `rem` rather than pixels is a small detail worth doing, so the layout responds to a user who has increased their default font size.

## Can you name an @media property other than screen? (M)

`screen` and `print` are the media types, along with `all` and the deprecated ones like `handheld`. `print` is the one that earns its keep: hiding navigation, expanding link URLs with a `::after` on `[href]`, and forcing black on white for a page people will actually print.

The features are the more interesting half. `prefers-reduced-motion` is the one I would call essential — it lets you disable transitions and parallax for users who get motion sickness, and it is a genuine accessibility requirement rather than a nicety. `prefers-color-scheme` for dark mode, `prefers-contrast`, and `forced-colors` for Windows high contrast mode.

Then the input capability queries: `hover` and `any-pointer`, which distinguish a mouse from a touchscreen far more reliably than guessing from width, so you can give touch devices larger hit targets and skip hover-only affordances.

And `orientation`, `aspect-ratio`, `resolution` for retina assets, plus `display-mode` for detecting when a PWA is running standalone.

```
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## What’s the difference between a responsive and a mobile-first strategy? (M)

Responsive describes the outcome — one codebase whose layout adapts to the viewport, using fluid grids, flexible images and media queries. Mobile-first describes the direction you write it in.

Mobile-first means the base styles outside any media query are the small-screen layout, and you add complexity upwards with `min-width` queries. Desktop-first is the reverse: the full layout is the default and `max-width` queries strip it back.

Mobile-first tends to produce less CSS and fewer overrides, because a narrow layout is usually the simpler one — a single column needs almost no declarations, so you are adding rather than undoing. It also means a device that does not support media queries at all gets the simple layout, which was the original argument, and it enforces a content-priority discipline: you have to decide what matters most when there is only one column.

The counter-case is a genuinely desktop-first product — a data-heavy internal dashboard — where the complex layout is the primary one and mobile is a reduced version. Being dogmatic about it is not useful; the direction should follow where the complexity lives.

## What’s the difference between responsive and adaptive design? (H)

Responsive is fluid and continuous: percentages, flexible units and media queries mean the layout reflows at every width, and there is one set of markup and one stylesheet.

Adaptive uses a set of discrete fixed-width layouts and snaps to whichever fits, and in its stronger form it means server-side detection — sniffing the user agent and sending different HTML, different assets or a different site entirely to a phone.

The trade-offs: adaptive can send a genuinely smaller payload, because the server never sends the desktop images or the desktop bundle, and it lets you tailor experiences precisely per device class. The costs are maintaining multiple layouts, relying on device detection that is unreliable and constantly out of date, awkward SEO with separate URLs needing canonical and alternate tags, and nothing sensible happening at widths you did not anticipate.

Responsive won as the default, and modern CSS narrows the gap further — container queries, `clamp()` and intrinsic sizing get you most of adaptive's per-context tailoring without the branching. Where the ideas survive is in things like `srcset` and code splitting, which is essentially adaptive asset delivery inside a responsive page.

## Is there any reason to prefer translate() over absolute positioning, or vice versa? (H)

For animation, yes, and it is not marginal. Animating `left` or `top` changes layout, so every frame runs layout, paint and composite on the main thread. Animating `transform: translate()` only affects compositing — the layer is already painted and the compositor just moves it, which can happen off the main thread and stays smooth even under some main-thread load.

`transform` also has the advantage of resolving percentages against the element's own size, which is what makes the centring idiom work, and it composes with scale and rotate in a single property.

Absolute positioning is the right tool for placing something, as opposed to moving it. It takes the element out of flow, which `transform` does not — a translated element still occupies its original space and can still be affected by, and affect, surrounding layout. If you want an overlay that does not push siblings around, you need positioning.

So the honest answer is that they solve different problems and are usually used together: position it with `absolute`, animate it with `transform`.

The cost of transforms is worth naming: they create a stacking context and a containing block for fixed children, they can blur text on a layer with a fractional offset, and promoting too many elements to their own layer eats memory. `will-change` should be applied narrowly and removed when the animation ends.

### Which properties can be animated without triggering layout, and why?

`transform` and `opacity`, essentially. Both can be handled entirely by the compositor: the element's painted texture already exists, and moving, scaling or fading it does not change any other element's geometry or pixels. `filter` is usually in the same bucket, though it is repaint-heavy for large areas.

Everything else falls into paint or layout. Changing `background-color`, `box-shadow` or `color` triggers paint — no geometry recalculation, but the pixels are redrawn. Changing `width`, `height`, `top`, `margin`, `padding` or `font-size` triggers layout, because the browser has to recompute the position and size of that element and potentially everything after it, and then paint and composite on top of that.

The reason it matters is the frame budget. At 60fps you have about 16ms, and a layout pass over a large tree can exceed that on its own, which is what jank looks like.

The practical version: use `transform` and `opacity` for anything that moves or fades, use the FLIP technique when you need to animate a layout change, and check in the Performance panel which of the three stages your animation is hitting. The other thing to watch is that reading a layout property from JavaScript mid-animation forces a synchronous layout and undoes the benefit.

## What are some gotchas for writing efficient CSS? (M)

The honest framing is that selector performance is mostly a solved problem, and the real costs are elsewhere: how much CSS you ship, how much of it blocks rendering, and how expensive the resulting layout and paint work is.

So: keep the stylesheet small and split it so a route only loads what it needs, since CSS is render-blocking and unused rules still cost parse time and memory. Avoid `@import` in CSS, which serialises requests instead of parallelising them.

On the rendering side, the expensive things are large-area `box-shadow` and `filter`, `backdrop-filter`, animating anything other than `transform` and `opacity`, and forcing layout in a loop. `contain: layout` or `content-visibility: auto` on long lists lets the browser skip work for off-screen content entirely.

For selectors, the guidance that still holds is to keep the rightmost part specific, avoid deeply descendant selectors, and be careful with `*` combined with descendant combinators. Also worth knowing that `:has()` and complex sibling selectors widen invalidation, so a small change can restyle more than you expect.

And the maintainability gotchas, which cost more in practice than any of the above: specificity escalation, `!important` used to win fights, and dead CSS nobody dares delete.

## What are the advantages and disadvantages of CSS preprocessors, and what do you like or dislike about the ones you have used? (M)

I have used Sass most. What it gave us was real: variables before custom properties existed, nesting, mixins for repeated patterns, partials with `@use` so files could be organised without extra HTTP requests, and functions for colour manipulation and maths.

The disadvantages are a build step, source maps between what you write and what ships, and a set of features that actively encourage bad output. Deep nesting is the main one — it reads nicely and compiles to long, high-specificity selectors that are miserable to override. `@extend` is worse, because it silently rewrites your selector groups and can move rules in ways that change the cascade. Mixins that get called fifty times duplicate every declaration into the bundle.

What I like is `@use` and the module system, and colour and maths functions. What I dislike is that it is easy to write Sass that looks tidy and produces terrible CSS, and that the abstraction hides the cascade from people learning it.

Nowadays I would reach for it less. Between native custom properties, native nesting, `@layer`, and modern colour functions, plus Lightning CSS or PostCSS for the tooling side, most projects do not need a preprocessor language any more.

### What do native CSS nesting and custom properties remove the need for?

Custom properties replace Sass variables for anything that should be dynamic — theming, dark mode, per-component overrides — because they live in the cascade, can be read and set at runtime, and inherit. A whole class of Sass mixins existed only to fake that.

Native nesting replaces the syntactic convenience, including nesting media queries inside a rule, with the `&` working essentially as it did. Because it is native, DevTools shows the nested structure directly rather than the flattened output.

Beyond those two, `@layer` handles what people used import order and specificity hacks for, `color-mix()` and relative colour syntax cover most of `lighten` and `darken`, `clamp()` and `min`/`max` cover the responsive maths, and `@container` covers what no preprocessor could do at all.

What is left for a preprocessor is loops, genuinely complex functions and build-time generation of long repetitive rules. Real, but a much smaller list than it used to be.

## How would you implement a design that uses non-standard fonts? (M)

Self-host with `@font-face` rather than pulling from a third-party service — it avoids a second connection, keeps things under your control, and sidesteps the privacy and GDPR questions that come with Google Fonts serving from their domain.

Use WOFF2, which is the only format worth shipping now, and prefer a variable font if the design uses several weights, since one file usually beats four static ones. Subset it to the characters you actually need, which for a Latin-only site can cut the file dramatically, and use `unicode-range` so the browser only downloads the subsets a page needs.

Preload the one or two fonts that appear above the fold, set `font-display` deliberately, and always specify a full fallback stack with a system font at the end.

```
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter.woff2') format('woff2');
  font-weight: 100 900;
  font-display: swap;
  size-adjust: 105%;
}
```

The finishing touch is matching the fallback's metrics with `size-adjust`, `ascent-override` and friends, so the swap does not shift the layout. And never let a font be a hard dependency for reading the page — text should be legible in the fallback.

### What are FOUT and FOIT, and how does font-display let you choose between them?

FOUT is the flash of unstyled text: the fallback font renders immediately and is swapped for the web font when it arrives. FOIT is the flash of invisible text: the text is hidden while the font loads, so the user sees nothing.

`font-display` controls the two periods that decide this. `block` gives a short invisible period then swaps — that is FOIT. `swap` renders the fallback immediately and swaps whenever the font arrives — that is FOUT, with no cutoff. `fallback` is a compromise: a very short invisible period, a short swap window, and after that it gives up and keeps the fallback for the rest of the page. `optional` gives the font almost no time and will simply not use it on a slow connection, but guarantees no layout shift.

Which to pick depends on what you are optimising. `swap` is the usual default because invisible text is the worse failure, and it is what keeps Largest Contentful Paint fast. The cost is a visible reflow, which is a Cumulative Layout Shift problem — mitigated by choosing a metrically similar fallback and using `size-adjust`. For an icon font, `block` is right, because the fallback is meaningless glyphs. For body text on an unreliable network, `optional` is the most respectful choice.

## How do you fix browser-specific styling issues? (M)

First, confirm it is actually browser-specific and reduce it to the smallest reproduction. Half the time it turns out to be a property that is unsupported rather than buggy, which is a different fix.

For unsupported features, `@supports` is the right tool — feature-detect and provide a fallback branch, rather than sniffing the browser. The natural cascade covers a lot too: declare the fallback first and the modern value second, and a browser that does not understand the second simply ignores it.

For genuine bugs, I look for the known workaround rather than inventing one — caniuse's notes and the browser's bug tracker usually have it. Vendor prefixes still matter in a couple of places, notably `-webkit-` on some iOS-specific behaviour, and Autoprefixer handles that from your browserslist rather than by hand.

Prevention is most of it: a good reset to flatten default differences, testing on real iOS Safari rather than a desktop pretending to be it, and having an agreed support matrix so there is a defined answer to "does this need to work in that". Where a difference is cosmetic and rare, the right answer is often to accept it.

## Are you familiar with styling SVG? (E)

Yes. The key thing is that SVG uses presentation attributes — `fill`, `stroke`, `stroke-width` — which are also CSS properties, so CSS can override them, and they sit at the very bottom of the cascade, below even a normal stylesheet rule.

That is what makes `fill: currentColor` so useful: the icon takes the text colour of whatever it sits in, so hover and theme states come for free with no extra rules.

It only works on inline SVG, though. An SVG loaded through an `img` tag or as a `background-image` is an isolated document your page's CSS cannot reach — you would need styles inside the file itself. That is the main reason icon systems inline their SVGs, usually via a sprite and `<use>`.

Beyond colour, the things worth knowing are `viewBox` and `preserveAspectRatio` for scaling, `stroke-dasharray` and `stroke-dashoffset` for line-drawing animations and progress rings, `vector-effect: non-scaling-stroke` to keep stroke width constant under a transform, and that transforms on SVG elements are relative to the SVG coordinate system rather than the CSS box.

For accessibility, a decorative icon gets `aria-hidden="true"` and a meaningful one gets a `title` element or an accessible name on the containing element.

## How do you visually hide content but keep it available for screen readers? (M)

The standard visually-hidden utility — clip the element to nothing while leaving it in the accessibility tree:

```
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
```

I use it for skip links that appear on focus, for labels where the design only shows an icon, for extra context in a link like "read more about pricing", for table captions, and for live-region announcements.

Two things people miss. The `white-space: nowrap` matters because without it text can wrap to one character per line in some screen reader implementations. And if the hidden element can receive focus — a skip link — it needs a `:focus` or `:focus-within` rule that restores it visually, otherwise a sighted keyboard user gets a focus ring around nothing.

The counterpart is `aria-hidden="true"`, which does the opposite: visible but not announced, for decoration and for text that duplicates an accessible name.

### Why not use display: none or visibility: hidden?

Because both remove the element from the accessibility tree as well as from the screen, so a screen reader will not announce them. They are the correct choice when you want content genuinely gone for everyone — a collapsed accordion panel, an inactive tab — but not when the point is to expose it to assistive technology.

`display: none` also removes it from layout entirely and makes it unfocusable, and content inside it cannot be found by in-page search. `visibility: hidden` keeps the space but is otherwise the same as far as assistive technology is concerned.

The other approaches that fail for their own reasons: `opacity: 0` and `transform: scale(0)` leave the element in the accessibility tree but also leave it clickable and in the tab order, which creates invisible focus traps; `text-indent: -9999px` causes horizontal scrolling issues and performance problems with painting; and moving something off-screen with a large negative `left` breaks in right-to-left layouts.

There is also `hidden="until-found"`, which hides content but lets browser find-in-page reveal it — useful for collapsed sections that should still be searchable.

## What CSS frameworks have you used, and how do utility-first frameworks compare to writing your own CSS? (M)

Tailwind most recently, Bootstrap on older projects, and various in-house systems built from Sass or CSS modules.

Utility-first works by giving you small single-purpose classes composed in the markup. The advantages are real: you stop naming things, which removes a genuine daily cost; styles are colocated with the markup, so deleting a component deletes its CSS; specificity is flat by construction, so no cascade fights; the output is bounded because utilities are reused rather than duplicated; and constraining values to a design scale is enforced by default rather than by convention.

The costs are verbose markup that is harder to scan, a build step and a learning curve, and the fact that reuse depends on component abstractions in your templating layer rather than on CSS itself — if you do not have components, you get copy-paste. It also gets awkward at the edges: complex selectors, nested state, and anything genuinely dynamic still needs real CSS or an escape hatch.

Where I land is that the choice matters less than consistency. Utility-first suits a component-based codebase with a team that agrees on it. A hand-rolled system with CSS modules or BEM and custom properties is perfectly good too, and is easier when the design is unusual. What is not fine is having both, half-applied.

## How would you architect the CSS for a design system to avoid specificity wars? (H)

The core principle is to keep specificity flat and predictable, so nothing ever needs `!important` to win. Concretely: a single-class convention for components, no ids in selectors, and no nesting beyond what is genuinely structural.

I would layer the system explicitly with `@layer` — reset, then base element styles, then design tokens, then components, then utilities — so the order of the layers decides precedence rather than a fight between selectors. Utilities last means a utility can always override a component without needing higher specificity.

Tokens as custom properties on `:root`, with components consuming them rather than hard-coded values, and each component exposing a small set of its own custom properties for the variations it is willing to support. That gives consumers a supported override mechanism, which is what stops them writing `.card .title { … !important }`.

Then scoping so overrides cannot leak: CSS modules, shadow DOM, or a naming convention that makes collisions impossible. And variants as data attributes or modifier classes on the component itself, not as descendant selectors from the outside.

Finally the process side, which matters as much: lint rules capping specificity and banning `!important`, a documented list of what is a public API of a component and what is internal, and a visual regression suite so people are not afraid to delete things.

### How do BEM, CSS modules and cascade layers each attack the problem?

BEM attacks naming. `block__element--modifier` makes every selector a single class carrying its context in the name, so specificity is uniformly one class and collisions are avoided by convention. It works and it is framework-free; the costs are long names and discipline, since nothing enforces it.

CSS modules attack scoping mechanically. Class names are hashed at build time, so a component's styles cannot collide with another's — the guarantee BEM asks you to maintain manually is now automatic. Specificity is still flat because everything is a single class, and `composes` handles reuse. What it does not solve is ordering between components, which is why import order can still surprise you.

Cascade layers attack precedence directly. `@layer` lets you declare that everything in one layer loses to everything in a later one, regardless of specificity — so a low-specificity utility beats a high-specificity third-party component, which no amount of naming discipline could achieve before. It is also the clean way to tame a vendor stylesheet: wrap it in an early layer and your own styles always win.

They are complementary rather than competing. A realistic setup is layers for global precedence, modules or scoping for isolation, and a naming convention inside a component for readability.

## What’s the difference between a CSS custom property and a Sass variable? (M)

A Sass variable is a build-time token. It is substituted during compilation and does not exist in the output at all — the browser only ever sees the final value. It has lexical scope in the source file, not in the DOM.

A custom property is a real CSS declaration. It lives in the cascade, inherits down the tree, can be redefined per selector or per media query, and can be read and written at runtime with `getComputedStyle` and `setProperty`.

That difference in nature drives everything else. Sass variables cannot be changed by a class or a media query — you can only produce different compiled output. Custom properties can be, and a single declaration can be overridden for one subtree.

```
:root { --gap: 1rem; }
.compact { --gap: 0.5rem; }   /* everything inside inherits the new value */
.stack { gap: var(--gap); }
```

Custom properties are also case-sensitive, need the double dash, take a fallback as the second argument to `var()`, and are substituted as raw tokens — so an invalid value fails at use time rather than at parse time, and they cannot be used for part of a property name or in a media query condition.

Where Sass variables still have an edge is anything that must be resolved at build time: values used in maths that must be computed once, in `@media` conditions, or as arguments to a Sass function.

### Which one can change at runtime, and what does that enable?

Custom properties. That enables theming without shipping two stylesheets — flipping a `data-theme` attribute on `html` redefines the tokens and everything inheriting them updates.

It enables component APIs, where a component exposes `--card-padding` and a consumer sets it without touching the component's internals or fighting specificity.

It enables passing values from JavaScript into CSS: a mouse position, a scroll progress, a computed height for an accordion animation. The JavaScript sets one property and the stylesheet decides what to do with it, which keeps the styling declarative.

And it makes some things possible that were not before — a single spacing scale that responds to a media query, or values that respond to `prefers-color-scheme` and `prefers-reduced-motion` at the token level rather than being duplicated in every rule. With `@property` you can also give a custom property a type, which is what makes gradients and other non-interpolable things animatable.

## What do CSS cascade layers (@layer) let you control that specificity alone does not? (H)

They let you set precedence explicitly, independently of how the selectors are written. Layer order is compared before specificity, so any declaration in a later layer beats any declaration in an earlier one — even a single class against a chain of ids.

```
@layer reset, base, components, utilities;

@layer components { #sidebar .nav a.link { color: blue; } }
@layer utilities  { .text-red { color: red; } }   /* wins */
```

That solves problems specificity cannot. Integrating a third-party stylesheet becomes a matter of putting it in an early layer instead of escalating your own selectors. Utility classes can be guaranteed to win without `!important`. And a reset can use whatever selectors it likes without leaking specificity into everything downstream.

The details worth knowing: the order is set by first declaration, so declaring the empty list up front is the pattern. Unlayered styles have the highest precedence of all normal declarations, which is deliberate but catches people out — anything not in a layer beats everything that is. Layers nest, and `!important` reverses the layer order just as it reverses the origin order, so an important declaration in an early layer beats an important one in a later layer.

What layers do not do is scoping. They control precedence, not collisions, so you still need modules, shadow DOM or a naming convention alongside them. `@scope` is the separate feature for that.

## What’s the difference between a container query and a media query, and when would you use each? (M)

A media query asks about the viewport or the device. A container query asks about the size of an ancestor element, so a component can respond to the space it has actually been given rather than to how wide the window is.

You opt in by declaring a containment context on the parent, then query it:

```
.card-wrapper { container-type: inline-size; container-name: card; }

@container card (min-width: 400px) {
  .card { display: grid; grid-template-columns: auto 1fr; }
}
```

Media queries are still right for page-level concerns: overall layout structure, how many columns the page has, the presence of a sidebar, and everything that is not about size at all — `prefers-color-scheme`, `prefers-reduced-motion`, `print`, pointer type.

Container queries are right for components. The same card in a wide main column and in a narrow sidebar should look different, and the viewport width cannot tell you which situation you are in.

The main constraint is that the container cannot query itself, so you need a wrapper element, and `container-type: inline-size` applies size containment on that axis, which means the container no longer sizes itself from its contents in that direction. Container query units — `cqw`, `cqi` and friends — come along with it and are handy for type that scales with the component.

### Why does this matter for a component library?

Because a library component does not know where it will be used, and with media queries its responsive behaviour is a guess about page context that the consumer can invalidate just by putting it somewhere narrower.

Before container queries the workarounds were all bad: variant props like `size="compact"` that push the decision onto the consumer, duplicated components, or a ResizeObserver in JavaScript that costs a render and can flicker. Every one of those leaks layout concerns into the component's API.

With container queries the component becomes genuinely self-contained — it carries its own breakpoints, adapts wherever it is dropped, and the consumer just places it. That is the difference between a component that is responsive and one that is merely styled for the pages you happened to test.

It also composes with the rest of the modern toolkit: the component uses container queries for its internal layout, the page uses media queries for its structure, and the two do not have to know about each other.
