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

## When does the function you pass to useEffect run?

After React has rendered the component to the screen. Effects run after render. That is why they are the place for work that reaches outside React, like logging, a timer, or a fetch.

## What does an empty dependency array, [], tell React to do?

Run the effect once, after the first render. An empty array lists no values that change, so the effect runs on mount and never re-runs. It is the common choice for fetching once.

## Your app freezes in an endless loop of re-renders. Which mistake most likely caused it?

An effect with no dependency array that calls setState, so each render runs the effect, which sets state, which renders again

Setting state in an effect that runs every render is the classic infinite loop. The fix is a dependency array so the effect only runs when it needs to.

## Why do you define an async function inside the effect and call it, instead of making the effect's own function async?

An async function returns a promise, but React expects the effect to return nothing or a cleanup function. React reads the effect's return value as a cleanup function. An async function returns a promise instead, so you nest an async function and call it.

## What is a cleanup function for, and when does React run it?

It stops what the effect started, like a timer; React runs it before the effect re-runs and when the component unmounts. Returning a function from an effect gives React a cleanup to run before the next effect run and on unmount, so nothing keeps running after it should.

## Two sibling components need to read and change the same value. Where should that state live?

In their closest common parent, passed back down as props. Siblings cannot see each other's state, so you lift it up to the parent they both sit inside. That parent owns the one copy and passes it down.

## What is prop drilling?

Passing a prop down through components that do not use it, just to reach a deeper one. The intermediate components accept and forward a prop they never use, only so it can reach the component at the bottom that needs it.

## What does the useContext hook do?

Reads the value from the nearest matching Provider above the component. useContext(SomeContext) reaches up the tree to the closest SomeContext.Provider and returns its value, with no props threaded through the middle.

## Which component can read a context's value with useContext(MyContext)?

Any component rendered inside that context's Provider, at any depth. The Provider makes its value available to everything in the tree beneath it, however deep, without passing props through the middle.

## How do you let a deep component update shared state held in a context?

Keep the state in the provider and pass an updater function through the context value, then call it from the consumer. Put both the value and a function like toggleTheme or setUser in the provider's value. A consumer reads the function with useContext and calls it to update the shared state.

## What does useRef give you?

An object with a current property that stays the same across renders. useRef returns a stable box, { current }. The same object persists across every render, and you read or write whatever you keep in current.

## You attach a ref to an input with ref={inputRef}. When can you safely call inputRef.current.focus()?

In an event handler or an effect, after the element has rendered. React sets current to the DOM node once the element mounts, so by the time a click handler or effect runs, the node is there.

## What happens when you change a ref's current value?

The value is remembered across renders, but the component does not re-render. That is exactly what makes a ref different from state: it persists like state, but updating current never triggers a render.

## Why keep a setInterval id in a ref instead of in state?

It has to survive between renders so you can clear it later, but updating it should not cause a re-render. The id is plumbing the user never sees. A ref remembers it across renders without the pointless re-render that state would cause every time you saved it.

## What makes a function a custom hook?

Its name starts with use and it calls other hooks inside. The use prefix is how React knows to apply the rules of hooks to it. Inside, it calls hooks like useState or useContext.

## Two different components each call useToggle(). What do they share?

The logic, but each gets its own independent state. A custom hook packages shared logic, not shared state. Every call runs its own useState, so the two toggles are completely independent.

## You move the data, loading, error, and fetching effect into a useFetch hook. What does that buy you?

Any component can load data in one line, instead of repeating all that logic. The whole pattern lives in one place. A component just calls useFetch(url) and reads back data, loading, and error, no copied boilerplate.

## What does client-side routing do when the URL changes?

The router swaps which component renders, with no full page reload. The page loads once. When the URL changes the router just renders a different component in place, so there is no reload and your state survives.

## What is the job of Routes and Route?

Routes holds a list of Route elements, and each Route maps one path to the component it renders. Routes picks the first Route whose path matches the URL and renders that Route's element.

## Why use Link instead of a plain anchor tag to move between pages?

Link navigates on the client without reloading the page, so state is kept and there is no flash. A plain anchor loads a whole new page from the server. Link intercepts the click and lets the router swap the page in place.

## A route is defined as path="/products/:id". On the URL /products/mouse, how do you read the id, and what is its value?

const { id } = useParams(), and id is the string "mouse". useParams returns an object keyed by the names in the path. The :id segment matched mouse, and URL params are always strings.

## What does NavLink give you that Link does not?

It adds an active class to itself when its target matches the current URL. That lets you style the current page's link, so a nav bar can show where you are.

## When is useNavigate the right tool instead of a Link?

When you need to navigate from code after something happens, like a form submit. useNavigate gives you a navigate function you call yourself, so you can move to a route once your own logic runs.
