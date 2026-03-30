## AI-Assisted Workflow

I used OpenAI Codex with GPT-5.4 as an implementation and iteration partner during this project. I used 158k token during development of this entire project which costs $0.40. I set up the project direction and made the key product and engineering decisions, then used the agent to speed up implementation, refinement, testing, and documentation.

The AI was used as a coding collaborator, not as a black box. Major changes were followed by builds, tests, or direct code inspection. The content below is entirely made by my agent which is kind of reporting and explaining how it helped and what it did.


## What Was Done In This Project

Across the whole project, the work completed with my guidance and the agent's implementation support included:

1. Reviewed the existing backend and frontend structure to understand what was already built and what was missing.
2. Implemented backend loading of `bookings.json` into memory at startup.
3. Implemented backend cabana state derived from `map.ascii`.
4. Added backend booking validation:
   - room number and guest name must match a guest in memory
   - cabana must exist
   - cabana must not already be booked
5. Added and refined backend REST API behavior for:
   - `GET /api/health`
   - `GET /api/map`
   - `POST /api/book`
6. Added frontend map rendering using the API response.
7. Updated the frontend so cabana availability is driven by backend cabana data, not only the raw ASCII characters.
8. Added cabana interaction on click.
9. Reworked the booking UX several times based on product feedback:
   - initial map display
   - selection flow
   - popup-based booking interaction
   - unavailable-state popup
   - success confirmation popup
   - rejection popup for invalid guest details
10. Updated user-facing cabana labels from internal IDs like `W1` to friendlier labels like `Cabana 1`.
11. Improved layout and visual density so the app feels centered, smaller, and less scroll-heavy.
12. Added automated backend tests for booking rules and API behavior.
13. Added automated frontend tests for the main user flows and API-driven rendering behavior.
14. Updated project documentation in `README.md`.
15. Updated this `AI.md` file to document the workflow and collaboration.

## How I Guided The Agent

My guidance was iterative and product-oriented. I did not ask for one giant implementation all at once. Instead, I guided the project like an engineer working with a pair-programming assistant:

- I first clarified the desired architecture and whether `bookings.json` should live in backend memory.
- I pushed for backend ownership of validation and booking state instead of moving logic into the UI.
- I refined the UX in stages:
  - from generic interaction
  - to explicit booking button behavior
  - to popup interactions
  - to clearer success and failure states
- I challenged implementation details when they did not match the brief closely enough.
- I asked for review against the original code-test requirements rather than assuming the app was finished.
- I pushed to close the gap between “works” and “matches the assignment”, especially around:
  - API-driven rendering
  - automated tests
  - documentation completeness
  - confirmation/error states

This made the workflow feel less like “generate an app” and more like managing an implementation through incremental review and correction.

## Review Of My Guidance As An Engineer

My guidance was strong in a few important ways:

- I focused early on architecture and ownership boundaries, especially making the backend the source of truth.
- I kept returning to the original brief and used it as the standard for decisions.
- I gave concrete product feedback instead of vague comments, which made iteration efficient.
- I noticed UX mismatches quickly, such as when the flow felt too panel-based instead of popup-based.
- I asked for tests and documentation instead of stopping at “the UI works”.

Areas where my guidance showed good engineering instincts:

- separating internal identifiers from user-facing labels
- insisting on in-memory validation rather than client-side assumptions
- asking whether the implementation truly fulfilled the assignment
- pushing for graceful user feedback on both success and failure

One honest improvement area:

- a few interrupted turns and mid-stream changes created some churn and temporary inconsistencies. That is normal in iterative development, but tighter batching of related requests could reduce rework and keep the repo more stable between steps.

Overall review:

I guided the project like a hands-on engineer/product-minded tech lead. The direction was specific, quality-conscious, and aligned with the brief. The strongest trait in the workflow was not just asking for features, but repeatedly checking whether the implementation actually matched the assignment and the intended user experience.

## Prompt Style

The prompts were mostly short, concrete, and task-focused. Examples of the kind of guidance I gave:

- load `bookings.json` into backend memory
- should this be done in the UI or through the backend route
- make cabana interaction popup-based
- show a real success confirmation
- show booking rejection in a popup too
- tighten the layout and center everything
- do we fulfill every objective here
- add automated tests
- make cabana availability explicitly driven by API response
- rename `W1` to `Cabana 1` for the user

## Notes

- The agent helped with implementation speed, iteration, and test/documentation support.
- The architecture and direction were guided deliberately through review, not accepted blindly.
- This was a collaborative engineering workflow with the AI acting as an execution partner.
