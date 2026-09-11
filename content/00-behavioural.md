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
