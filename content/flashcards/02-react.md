---
title: React
order: 2
tags: [react]
---

## Why can't hooks be called conditionally? [hooks]

React associates a hook call with its stored state by _call order_, not by
name. Each fiber holds a linked list of hook objects and a cursor that advances
one node per call.

Skip a call on a later render and every hook after it shifts by one, so a
`useState` reads another hook's slot. React catches the common shape of this
("Rendered fewer hooks than expected") but the aligned case is a silent
wrong-value bug.

## What does the dependency array of `useEffect` actually control? [hooks]

Whether the effect re-runs after a render. React compares each entry to the
previous render's with `Object.is`; if all match, it skips both the cleanup and
the effect.

`[]` means "after mount only". Omitting the array means "after every render".
The array is not a list of things the effect is _allowed_ to read — reading a
value you left out gives you a stale one.

## What is reconciliation? [rendering]

The diff React runs between the previous element tree and the one your render
returned, to decide the smallest set of DOM operations.

It assumes two things: elements of different types produce different trees (so
a changed type unmounts the subtree), and children with stable `key`s can be
matched across renders. Using an array index as a key breaks the second
assumption the moment the list reorders.

## What is a React component?

A JavaScript function that returns JSX (markup) for React to render. A component is just a function whose job is to return the markup for one piece of the UI. React calls it and puts the result on the page.

## What is JSX?

JSX looks like HTML but lives in your JS. It is not a string and not a separate template language.

## Your component needs to return a heading and a paragraph. What do you do?

Wrap both elements in a single parent element, like one div. A component returns one top-level element, so multiple elements go inside a single parent such as a div.

## You wrote a component called Welcome. How do you render it inside another component?

Write it as a tag with a capital letter, like `<Welcome />`. You render a component by using its name as a tag. The capital letter is how React tells your components apart from regular HTML tags.

## What is the core idea behind building a UI with React?

You describe what the page should look like for the current data, and React updates the DOM to match. You write what the UI should look like for your data instead of hand-coding each DOM change. When the data changes, React re-renders and keeps the screen in sync.

## What can you put inside curly braces in JSX?

Any JavaScript expression: a variable, a calculation, a function call, a ternary. Curly braces evaluate a JavaScript expression and render the result. Anything that produces a value is fair game.

## In JSX, how do you set the CSS class on an element?

With className, because class is a reserved word in JavaScript. JSX is JavaScript, so it uses className to avoid the reserved word class.

## You want to show a Logout button only when the user is logged in, and show nothing otherwise. Which fits best?

`isLoggedIn && <button>Logout</button>`. The `&&` operator renders the right side only when the left side is truthy, and renders nothing when it is false. Perfect for show-or-nothing.

## How do you render an array of data as a list of elements in JSX?

Map the array to JSX elements, returning one element per item. `array.map(item => <li>...</li>)` returns an array of elements, and JSX renders each one.

## Why does each item in a mapped list need a key?

So React can identify which items changed, were added, or removed between renders. The key is a stable identity for each item, letting React update the list efficiently instead of rebuilding it.

## What are props in React?

Data a parent passes into a component, which the component reads to decide what to render. Props are the arguments to a component. The parent passes them as attributes, and the component receives them as an object.

## You render a component with `<Greeting name="Ada" />`. How does Greeting read that value?

From its props: props.name, or by destructuring the parameter as { name }. React passes everything you set as attributes in a single props object. You read props.name, or destructure { name } in the parameter list.

## You want to pass the number 49 as a price prop. Which is correct?

price={49}, because non-string values go in curly braces. Curly braces pass a real JavaScript value. price={49} passes the number 49.

## What is the children prop?

Whatever you nest between a component's opening and closing tags. Content placed inside a component's tags arrives as props.children, which lets you build reusable wrappers.

## You have an array of product objects. How do you render one ProductCard per product?

Map the array to ProductCard elements, passing each item's fields as props and a key. `products.map(p => <ProductCard key={p.id} name={p.name} price={p.price} />)` turns each object into a card. The key goes on the returned component.

## What does useState return?

A pair: the current state value and a function to update it. const [value, setValue] = useState(initial). The first item is the current value, the second is the setter.

## How do you change a piece of state so the component re-renders?

Call the setter function from useState. Calling the setter stores the new value and tells React to re-render with it.

## What is the difference between onClick={handleClick} and onClick={handleClick()}?

The first passes the function to run on click; the second calls it immediately during render. onClick wants a function to call later. handleClick passes it; handleClick() runs it right away and passes its return value instead.

## You need to update count three times in one handler, each based on the last. Which is correct?

setCount((prev) => prev + 1), called three times. The updater form receives the latest value each time, so three calls add three.

## You have an object in state and want to change one field. What should you do?

Pass the setter a new object: spread the old one, then override that field. setUser({ ...user, level: user.level + 1 }) makes a new object, so React sees a new value and re-renders.

## What makes an input a controlled input in React?

Its value comes from state, and onChange updates that state on every keystroke. value={state} sets what shows, and onChange writes each change back to state, so state is the single source of truth.

## You want one change handler for several text inputs in one object. What makes that possible?

Each input has a name attribute, and the handler uses a computed key: { ...form, [e.target.name]: e.target.value }. e.target.name tells the handler which field changed, and the computed key updates just that field in a new object.

## How is a controlled checkbox different from a controlled text input?

A checkbox binds to checked and reads e.target.checked, instead of value and e.target.value. A checkbox is a boolean, so it uses checked / e.target.checked. Text inputs and selects use value / e.target.value.

## Why do you call e.preventDefault() in a form's onSubmit handler?

To stop the browser's default form submission, which reloads the page and wipes your React state. Without it the page reloads on submit, so you call preventDefault and handle the submission in React instead.

## You want to show an error only when the typed email is invalid. What is the cleanest approach?

Derive the error from the value during render, then show it conditionally. The error is a calculation from state, recomputed each render, so it always matches what was typed. No separate state needed.
