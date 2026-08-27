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
