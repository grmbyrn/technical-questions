---
title: Building APIs with Node and Express
order: 7
tags: [node-express]
---

## In the request/response cycle, who starts the conversation?

The client. A server can only answer requests, never start them. Right. Everything begins with a client's request. The server listens, answers, and then waits for the next one.

## Which request asks the server for one specific user, without changing anything?

GET /users/7. GET reads without changing anything, and /users/7 targets exactly one user in the collection.

## A response comes back with status 404. What does that family tell you?

The request has a problem: it asked for something that is not there. 4xx codes point at the request. 404 specifically says the path targets nothing on the server.

## What does the content-type: application/json header tell the client?

What the body is, so the client knows to parse it as JSON. Headers are metadata about the answer. This one says the body is JSON, which is the cue to reach for response.json().

## Where does a response's status code live?

On the Response object itself, read as response.status. The status arrives with the response, before any body parsing. That is why you can check it without touching response.json().

## The callback we hand to http.createServer runs...

Once for every request the server receives. That is the server's whole job: wait for a request, run the callback to answer it, repeat.

## A request arrives for a path no branch handles, and nothing calls res.end. What does the client see?

Nothing, it waits until it gives up. No response is sent until your code sends one. No error, no crash, just silence: the hand-rolled server's classic failure.

## The fallback branch runs res.end("Not found") but never touches res.statusCode. A client checking response.status sees...

200, so the failed lookup looks like a success. 200 is the default when nobody says otherwise. The body says not found; the machine-readable part says everything is fine. That mismatch is the lie.

## When must status and headers be set?

Before res.end, because an ended response is already on the wire. Status and headers travel at the front of the response. Once end sends it, there is nothing left to change.

## Sending an object as a JSON response takes which pair?

JSON.stringify for the body and a Content-Type: application/json header. The body must be text, so stringify converts the data, and the header tells the client to parse it as JSON.

## Which value does hand-rolled routing branch on?

req.url. The request carries the path it asked for, and req.url is where the server reads it.

## Express does not ship with Node.js. How does it normally get into a project?

You run npm install express once; it downloads the code into node_modules and records the dependency in package.json. One command, two results. The record is what lets plain npm install rebuild node_modules on any machine later.

## Which requests does app.get("/hours", handler) answer?

GET requests whose path is exactly /hours. A route matches on both halves of the request line: the method AND the path. Everything else passes it by.

## Which hand-written moves does res.json(spots) replace?

res.setHeader("Content-Type", "application/json") and res.end(JSON.stringify(spots)). One call stringifies the data, sets the JSON label, and ends the response. The whole manual dance from last chapter.

## A request arrives for a path with no matching route. What does Express do?

Answers it automatically with 404 Not Found and a Cannot GET /... body. The built-in catch-all. The final else you had to hand-write last chapter is now the framework's job.

## Compared to the hand-rolled node:http server, which jobs does Express now do for you?

- Matching each request's method and path to the right handler

- Labeling responses, via res.send and res.json

- Answering unmatched paths with a 404

Declaring the path in app.get IS the branch. The if chain on req.url is gone.

## What is the idiomatic Express way to answer a request with a 404 status and a JSON body, in one chained call?

res.status(404).json({ error: "Not found" }). res.status sets the code and hands res right back, so res.json chains straight onto it. One line, both halves of the answer.

## Why does the app.use catch-all belong below every route in the file?

Express checks in declaration order, and app.use matches every request that reaches it. Declared last, the only requests that ever reach it are the ones no route matched. Declared first, it would answer everything with a 404.

## A request for /api/trails/7 hits app.get("/api/trails/:id", ...). What is req.params.id?

"7", a string. Params are captured out of the URL, and a URL is text. That is why lookups convert with Number(req.params.id) before comparing against number ids.

## Inside a lookup route, what does the return in return res.status(404).json({ error: "Trail not found" }) prevent?

The route answering the same request twice. Without it, the guard's 404 goes out and execution continues into the res.json below, a second answer on a finished response. The client only ever sees the first answer, and the second one fails.

## Which route answers GET /api/trails?difficulty=easy?

app.get("/api/trails", ...); the query string is not part of the path. Options after the ? ride along for the handler to read in req.query. Same route with and without them.

## Which statements about route order are true?

(select multiple)

1. A :id route can swallow a fixed path like /api/trails/featured declared below it

2. The first route that matches a request is the one that answers

3. Express picks the most specific matching route, wherever it is declared

4. The app.use catch-all belongs after every route

---

**1, 2, 3** ':id' matches anything in its spot, featured included. The fixed route below never gets a turn, so fixed paths go above dynamic ones.

## A server declares both app.get("/api/orders", ...) and app.post("/api/orders", ...). How does Express decide which one answers a request?

The method and the path pick the route together; a route whose method does not match is not a candidate

GET /api/orders walks straight past the POST route and vice versa. Same path, two routes, no conflict.

## Without app.use(express.json()), what is req.body in a route?

undefined; Express never reads the body on its own

Not an empty object, not raw text: undefined, as in never looked. express.json() is what parses labeled JSON bodies into req.body.

## Why does a create route answer 201 with the new object in the body?

201 says a new resource now exists, and the body is the client's only way to learn the id the server assigned

The server builds the object and picks the id; the 201 response is where the client finds out what was made.

## A POST arrives with a body missing its required field. Which status tells the truth?

400: the request itself is broken; fix what you sent and try again

Bad input is a client-side problem with the request, which is exactly what 400 Bad Request names.

## What is the difference between PUT and PATCH?

PUT sends the complete new version of the resource; PATCH sends only the fields that changed

Same member path, same lookup, opposite contract about what the body carries.

## Which statements about DELETE and 204 are true?

(select multiple)

1. A DELETE for an id that matches nothing should answer 404

2. A 204 must include the deleted object so the client can restore it

3. 204 No Content is a success whose body is empty on purpose

4. An empty body in the HTTP Client after a delete means the request failed

---

**1 and 3** The miss guard works on every method: you cannot remove what does not exist, and the server should say so honestly.
