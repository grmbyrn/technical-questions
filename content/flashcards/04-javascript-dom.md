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

## What does document.querySelectorAll(".feature") return?

A NodeList of every matching element. A NodeList you can loop with forEach and read with .length, though it is not a full array.

## Which call correctly selects the element with id product-2 using getElementById?

document.getElementById("product-2"). getElementById takes the bare id with no # symbol.

## You have a card element in a variable. How do you select the .price inside only that card?

card.querySelector(".price"). Calling querySelector on an element scopes the search to inside that element.

## You want a string that contains HTML tags to actually render as bold text and links on the page. Which property should you set?

innerHTML. innerHTML parses the string as markup, so a tag like strong becomes real bold text.

## You see the error Cannot read properties of null in the console. What most likely happened?

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
