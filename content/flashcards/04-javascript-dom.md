---
title: JavaScript DOM
order: 4
tags: [javascript-dom]
---

## How do you get a JavaScript file to run on an HTML page?

Add a script tag with a src attribute pointing at the file. The browser runs the file when it reaches the script tag while loading the page.

## Your code runs in the browser and calls console.log. Where does the output appear?

In the Console tab, next to Tests. The Console tab mirrors your live Preview. Every browser has the same console in its DevTools (F12) too.

## What is the DOM?

A tree of objects the browser builds from your HTML. Each tag becomes an object node in that tree, and your JavaScript reads and changes those objects.

## Which global object is your starting point for reaching the page from JavaScript?

document. document is the root of the DOM tree. document.body, for example, is the body element.

## You change the page with JavaScript, then reload it. What happens to your change?

It resets, because the browser rebuilds the DOM from the original HTML. DOM changes live only as long as the page is open. A reload rebuilds the tree fresh from the HTML.

## What does document.querySelector(".card") return when the page has three elements with class card?

The first .card element only. querySelector always returns the first match. Use querySelectorAll to get all of them.

## What does document.querySelectorAll(".feature") return?

A NodeList of every matching element. A NodeList you can loop with forEach and read with .length, though it is not a full array.

## Which call correctly selects the element with id product-2 using getElementById?

document.getElementById("product-2"). getElementById takes the bare id with no # symbol.

## You have a card element in a variable. How do you select the .price inside only that card?

card.querySelector(".price"). Calling querySelector on an element scopes the search to inside that element.

## You want a string that contains HTML tags to actually render as bold text and links on the page. Which property should you set?

innerHTML. innerHTML parses the string as markup, so a tag like strong becomes real bold text.

## You see the error Cannot read properties of null in the console. What most likely happened?

A selector above that line matched nothing and returned null, then you read a property off it. That is the classic cause. Log the element to confirm it is null, then fix the selector to match a real id or class.

## A card may or may not already have the featured class, and you want to flip it: add it if it is missing, remove it if it is present. Which classList method does that in one call?

classList.toggle. toggle adds the class when it is absent and removes it when it is present, in a single call.

## An element has a custom attribute data-rating. What is the shortcut property for reading it in JavaScript?

element.dataset.rating. Every data- attribute shows up on dataset with the prefix dropped, so data-rating becomes dataset.rating.

## You want to apply a reusable visual style to an element. Which approach is usually preferred?

Toggle a CSS class with classList so the look stays in the stylesheet. A class keeps styling in CSS, can change many properties at once, and is easy to turn back off.

## What does button.addEventListener('click', handler) actually do?

It hands the handler function to the browser to run each time the button is clicked. You register the function once, and the browser calls it for you on every click for as long as the page is open.

## Inside a click handler, what does event.target give you?

The element the event happened on, such as the button that was clicked. That is why one handler can serve many elements: event.target tells it which one it was called for.

## You want code to run on every keystroke as a user types in a search box. Which event should you listen for?

input. The input event fires every time the value changes, character by character, which is exactly what a live search needs.

## Which event is the right one to react to a checkbox being ticked or unticked, and how do you tell if it is on?

The change event, and you read event.target.checked. Checkboxes commit their value on change, and the checked property is true when the box is ticked.

## A search box sits in a form. Pressing Enter reloads the whole page and wipes your filtered results. What stops the reload?

Call event.preventDefault() inside the form's submit handler. preventDefault cancels the browser's built-in action for that event, here the form submit that reloads the page.

## What do you get back from document.createElement('article')?

A new article element that exists in JavaScript but isn't on the page yet. createElement builds the element in memory. It shows up only once you append it somewhere.

## You want a new element to become the FIRST child of a container. Which method places it there?

container.prepend(element). prepend adds the element as the first child. append would put it last instead.

## You have an existing card element and want to drop a new card right after it, as its sibling. What do you call?

card.after(newCard). after inserts the new element immediately after the element you call it on. before would put it just ahead of it.

## catalog.querySelector('[data-category="gaming"]') finds no match. What does it return, and what happens if you then call .remove() on it?

It returns null, and calling .remove() on null throws an error. A missed querySelector returns null, and null has no remove method, so it crashes. That's why you guard it.

## Which is a safe way to remove an element that might not exist?

Check it first: if (card) { card.remove() }, or use card?.remove(). Both only call remove when card is actually an element, so a null lookup does nothing instead of crashing.

## Your form's submit handler calls event.preventDefault(). What would happen if you removed that line?

The browser would run its default submit, reloading the page and wiping your validation. A form's default submit reloads the page to send it to a server. preventDefault cancels that so your JavaScript stays in control.

## You need the text a user typed into an input. Where do you read it from, and what type do you get back?

input.value, which is always a string. Every input exposes its current text on .value, and it always comes back as a string, even from a number input.

## A required field uses if (input.value.trim() === ""). Why call .trim() instead of comparing input.value to an empty string directly?

So a value of only spaces is treated as empty rather than slipping through. trim() removes leading and trailing whitespace, so " " becomes "" and is correctly caught as empty.

## You want a field to show its error the instant the user types, not only when they submit. Which event should the validator run on?

The input event, which fires on every keystroke. input fires each time the value changes, so the validator re-runs character by character and the message updates live.

## How does a confirm-password check decide whether the two boxes match?

It compares confirmInput.value with passwordInput.value and reports an error when they are not equal. Matching two fields means comparing their two .value strings, for example with !==, and showing an error when they differ.

## A question button sits right before its answer div, both inside the same .faq-item. From the button, how do you reach the answer?

button.nextElementSibling. The answer is the very next element after the button, so nextElementSibling steps straight to it.

## Inside a click handler, event.target is the span the user actually clicked, but you need the whole .faq-item around it. What does event.target.closest(".faq-item") do?

Climbs up through the ancestors from event.target until it finds the nearest .faq-item and returns it. closest() walks up the tree, so wherever the click landed, you get the surrounding item back.

## Event delegation means handling a list of elements by adding the click listener where, instead of one per item?

Once, on the parent element that contains them all. Clicks bubble up to the parent, so a single listener there can handle every child.

## You add a new question to the list with createElement after the page has loaded. With one delegated listener on the list, clicking the new question works immediately. Why?

The new question is inside the list, so its clicks bubble up to the listener already on the list. Delegation listens on the parent, so any child added later is covered with no extra wiring.

## In the accordion, clicking a question should open its answer and close any other open one. Before opening the clicked item, what should the handler do?

Loop the list's items and close every one, then open just the clicked item. Resetting all items first guarantees only the clicked one ends up open.

## What is event bubbling?

After an event fires on an element it travels up through every ancestor, firing the same event on each one. A click on a button inside a card also fires on the card, then the container, then `document`, which is exactly what makes event delegation work.

## What is the difference between `event.preventDefault()` and `event.stopPropagation()`?

`preventDefault()` cancels the browser's default behaviour for the event; `stopPropagation()` stops the event travelling up to ancestor elements. On a form submit it is `preventDefault()` that stops the page reloading. `stopPropagation()` would leave the reload happening and instead prevent any outer listener from hearing about the event at all.

## Inside a handler, what is the difference between `event.target` and `event.currentTarget`?

`target` is the deepest element the event actually started on; `currentTarget` is the element the listener is attached to. Click an icon inside a button and `target` is the icon while `currentTarget` is the button you bound to, which is why delegation reads `target` and a per-element handler usually wants `currentTarget`.

## Why prefer `textContent` over `innerHTML` when inserting text a user typed?

`innerHTML` parses the string as HTML, so anything markup-shaped in it becomes real elements; `textContent` inserts it as literal text. Feeding user input through `innerHTML` is how cross-site scripting gets in, so reach for `textContent` unless you specifically need the string to render as markup.

## What do `defer` and `async` change about a `<script>` tag?

Both let the HTML carry on parsing while the script downloads. `defer` runs the script after parsing finishes, in document order; `async` runs it the moment it arrives, in whatever order the downloads happen to land. A plain `<script>` with neither blocks parsing until it has downloaded and run.
