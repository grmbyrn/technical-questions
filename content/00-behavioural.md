---
slug: behavioural
order: 0
number: "1"
group: BEHAVIOURAL & SCREENING
title: Behavioural & Screening
status: questions-only
---

## Tell me about a difficult technical problem you solved.

One example that comes to mind was at Permisso, where a PO raised a ticket about recurring failures in the identity-verification flow. I started investigating because we were seeing a lot of errors being reported as a missing second side of the document, and I found that passports were being affected by this.

The issue was that the flow was expecting two images, whereas a passport only requires one side to be scanned. So legitimate passport submissions were being rejected, which could cause the whole verification process to stop without being picked up again.

I traced the issue back to the validation logic and changed it so that a one-sided document could be accepted when the AI identified it as a passport. The AI itself was handled by another person on the team, so my part was making sure the application logic correctly handled that classification. I then tested it with a variety of valid and invalid IDs to make sure we weren't accidentally making the validation too permissive.

After the change, we got automated recovery coverage to around 90% of those recurring failure cases, which substantially reduced manual intervention. The main thing I learned was that software can be behaving exactly as designed while still producing the wrong result. The system was correctly checking for a second image, but the assumption behind that check didn't match the real-world requirements. So it taught me to question the assumptions behind an error, rather than just fixing the symptom.

### Connected questions

- "Tell me about a time you had to debug a problem." ⭐
- "Tell me about a time you identified the root cause of an issue." ⭐
- "Tell me about a time you had to question an assumption." ⭐
- "Tell me about a production issue you encountered and how you handled it."
- "Tell me about a time you took ownership of a problem."

**Secondary — this story can also work**

- "Tell me about a time you improved a process."
- "Tell me about a time you prevented a problem from happening again."
- "Tell me about a time you had to be particularly thorough with testing."
- "Tell me about a time you made a change that improved reliability."

---

## Tell me about a time you took initiative.

At Nautilus, part of my role was to look through our repositories and identify things that could be improved. I came across some older websites that were built using Python templates. They looked outdated, were slow to use, and the code had become difficult to work with because the implementation wasn't well understood anymore.

I raised the issue with the team and they agreed that the sites would benefit from being rebuilt. They had already started using SvelteKit in other parts of the organisation, so I took ownership of learning SvelteKit and using it to modernise the site rather than continuing with the existing templated approach.

I already had strong React experience, so I used that knowledge to get productive with SvelteKit quickly and learn the framework's way of doing things. I rebuilt the site around a component-based architecture, breaking the UI into reusable pieces and organising those components based on their scope and size.

I also looked for repeated code and, where something was appearing more than twice, I generally turned it into a reusable component rather than maintaining multiple copies. That made the codebase easier to maintain and gave us a much cleaner foundation for future changes.

As I became more comfortable with SvelteKit, I was able to take what I'd learned and apply the same approach to other SvelteKit sites we were building.

The new site was significantly faster and easier to maintain, even before the additional optimisation work. Lighthouse measurements showed an improvement of around **40% in median page-load performance**. The migration also gave us a more maintainable component-based structure that I could carry forward into the other SvelteKit sites.

The biggest thing I took from it was that existing framework experience can transfer surprisingly quickly when you understand the underlying concepts. I also learned the value of recognising when a system has become more expensive to maintain than it is worth preserving, and then taking the initiative to find a better approach rather than simply working around the existing problems.

### Connected questions

- “Tell me about a time you identified a problem that nobody had asked you to solve.”
- “Tell me about a technical challenge you faced.”
- “Tell me about a time you had to learn something quickly.”
- “Tell me about a time you improved a system.”

Also usable for:

- “Tell me about a time you improved performance.”
- “Tell me about a time you refactored or modernised a codebase.”
- “Tell me about a time you introduced a new technology.”
- “Tell me about a time you improved maintainability.”
- “Tell me about a time you reduced technical debt.”
- “Tell me about a time you had to work independently.”
- “Tell me about a time you identified an opportunity for improvement.”

---

## Tell me about a time you worked under pressure.

One example that comes to mind was when I was brought onto the 26th UN Tourism General Assembly project, where we had a fixed six-week deadline to take what was essentially a bare-bones website and make it ready for the event. The site needed to provide delegates from 114 countries with everything from the event schedule and information about Riyadh and Saudi Arabia to details about the assembly and an event-specific app. The deadline was completely fixed because the website needed to be useful from the moment the event began, so getting it live late wasn't really an option.

My initial responsibility was mainly around implementing the content and styling, but it quickly became clear that the CEO wouldn't have time to take that work into the project himself, so my role expanded to building the entire website from the Figma designs. I therefore owned the technical implementation across the frontend, including deciding how to structure components, use hooks, consume API data and turn the designs into a production-ready application.

To keep the deadline under control, I worked with the PO to create a Kanban board containing everything that needed to be delivered and used that to separate the important work from the lower-priority items. We had a planning meeting every morning to establish the day's priorities, stayed in communication throughout the day as requirements or designs changed, and reviewed what we'd completed at the end of each day so we could start the next morning with a clear plan. One particularly challenging area was the event schedule table, because the client changed the design several times and on a couple of occasions the layout had to be substantially reworked across different screen sizes. I'd already isolated that functionality into its own component, so I could make those changes without affecting the rest of the site. I also validated the site across different browsers and devices and paid particular attention to things like the event countdown, testing it with different times to make sure it would disappear at exactly the right point.

By the time the event started, the website was live and everything worked as expected. It handled the launch successfully, including 3,000+ concurrent users, with zero downtime. I was particularly proud that throughout the six weeks I never felt the need to panic about the deadline. I had a system, I trusted the prioritization we'd established, communicated closely with the team, and kept moving through the work. We received great feedback from the PO, CEO and others involved in the project, and I received a letter of recommendation at the end. The experience reinforced for me that when the pressure is high, the best thing I can do is stay calm, create structure, and focus on consistently executing the next most important thing.

---

## Tell me about a difficult technical problem you solved.

At Permisso, I worked on an identity-verification flow where the document-classification service needed to represent documents from countries that couldn't be reliably identified using a standard country code. The challenge was that the existing shared country model didn't accept the special XX value, and changing that shared model could have affected other parts of the system. My responsibility was to make XX flow correctly through the verification process while preserving the existing behavior for normal country codes. I traced the data flow from classification through the API and domain layer into document processing and the downstream verification service, then isolated the special case within the identity-verification domain instead of changing the shared country abstraction. I updated the relevant types and validation, added explicit handling for the unknown-country case, adjusted processing so we didn't perform country-specific extraction when the country wasn't known, and added unit and integration tests around the new behavior and existing flows. The change was production-ready, with the new country value flowing consistently through the system while existing country behavior remained intact, and the full test suite passed with no lint issues. What I took from it: I learned that solving a difficult engineering problem isn't always about writing more code; it's often about finding the right boundary for the change so you solve the requirement without weakening assumptions elsewhere.

### Connected questions

- “Tell me about a challenging bug or edge case you handled.”
- “Tell me about a time you had to modify an existing system without breaking it.”
- “Tell me about a time you had to make an architectural decision.”
- “Tell me about a time you worked with a complex or unfamiliar codebase.”
- “Tell me about a time you found a problem that wasn't immediately obvious.”
- “Tell me about a time you prevented a regression.”
- “Tell me about a time you had to balance a new requirement with existing functionality.”
- “Tell me about a time you had to work across multiple parts of a system.”
- “Tell me about a time you used testing to give yourself confidence in a change.”
- “Tell me about a time you disagreed with or avoided changing an existing abstraction.”
- “Tell me about a time you had to handle an edge case.”
- “Tell me about a feature where you had to consider backward compatibility.”
- “Tell me about a time you improved the reliability of an existing application.”
- “Tell me about a time you took ownership of a problem from investigation through completion.”

---

## Tell me about a time you improved the reliability of a system.

At Permisso, I was working on a mission-critical identity-verification flow where certain failures required manual intervention to recover. I wanted to understand why these failures were recurring and build a reliable way for the system to recover automatically rather than relying on someone to intervene each time. I investigated the failure patterns, identified the cases that could be safely recovered automatically, and designed a recovery mechanism around those scenarios while making sure we didn't blindly retry failures that required a different resolution. I implemented the recovery logic and added automated tests around the different failure paths so we could have confidence that the new behavior wouldn't introduce regressions. The solution automated recovery for roughly 90% of the recurring failure cases and significantly reduced manual intervention on a mission-critical flow. What I took from it: It reinforced for me that good engineering isn't just about making the happy path work; it's about understanding how software behaves when things go wrong and designing the system to recover intelligently.

### Connected questions

- “Tell me about a time you automated a manual process.”
- “Tell me about a production problem you solved.”
- “Tell me about a recurring problem you identified and fixed.”
- “Tell me about a time you improved an existing system.”
- “Tell me about a time you had to debug a production issue.”
- “Tell me about a time you designed for failure.”
- “Tell me about a time you improved system resilience.”
- “Tell me about a time you reduced manual work.”
- “Tell me about a time you prevented a problem from happening repeatedly.”
- “Tell me about a time you had to think about edge cases.”
- “Tell me about a time you took ownership of a production issue.”
- “Tell me about a time you used automation to improve efficiency.”
- “Tell me about a time you made a system more robust.”
- “Tell me about a technical problem that had a significant business impact.”

---

## Tell me about a time you improved the performance of an application.

At Nautilus, I worked on a large, data-dense application where frontend performance was becoming increasingly important as the application and its functionality grew. I took ownership of improving the frontend architecture and reducing the amount of work required to render and deliver the application to users. I analyzed where the performance cost was coming from, focusing on rendering behavior and how assets were being delivered to the browser. I then led a migration toward a more modular frontend architecture and optimized the rendering and asset-delivery paths, making sure the changes worked within the existing application rather than treating it as a greenfield rewrite. I validated the improvements against the application's existing behavior and used performance metrics to determine whether the architectural changes were actually producing a meaningful improvement. The work reduced median page-load time by 40%, giving users a significantly faster experience while also leaving the frontend architecture more modular and maintainable. It reinforced the importance of measuring performance problems first, finding the actual bottleneck, and then making targeted architectural changes rather than optimizing based on assumptions.

### Connected questions

- “Tell me about a time you optimized a piece of software.”
- “Tell me about a time you diagnosed a performance problem.”
- “Tell me about a time you made a significant improvement to an existing codebase.”
- “Tell me about a time you had to refactor an existing application.”
- “Tell me about a time you made an architectural change.”
- “Tell me about a time you used metrics to guide an engineering decision.”
- “Tell me about a time you improved user experience through engineering.”
- “Tell me about a time you dealt with technical debt.”
- “Tell me about a time you had to improve a large or complex application.”
- “Tell me about a time you made a trade-off between performance and maintainability.”
- “Tell me about a time you identified the root cause of a technical problem.”
- “Tell me about a time you led a technical improvement.”
- “Tell me about a time you had a measurable impact as an engineer.”
- “Tell me about a time you optimized frontend performance.”
- “Tell me about a time you improved an existing system rather than building something new.”
