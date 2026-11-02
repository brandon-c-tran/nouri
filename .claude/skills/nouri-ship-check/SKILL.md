---
name: nouri-ship-check
description: Verify a Nouri feature against food decision effort, exploration, enjoyment, real mobile UI behavior and data safety, before claiming it's done. Use when asked to QA, ship, verify, audit or finish a product change.
disable-model-invocation: true
---

# Nouri ship check

Audit the *implemented application*, not a hypothetical design. Read `CLAUDE.md` and `PRODUCT_BLUEPRINT.md`, then produce a brief evidence-based pass/fail report with specific fixes.

## A. Product outcome: why does this exist?
- Which user problem does it solve? (forgotten craving, choice paralysis, weekly option flexibility, cooking memory, restaurant→home recreation)
- Does it **reduce** user time/mental effort, or merely create another form to fill out?
- Does it increase the probability of a pleasurable, varied food experience?
- Does it preserve room for changing cravings? Does it avoid forcing an unnecessary calendar or rigid food rules?
- Can you name at least one meaningful metric/event that the implementation can observe (choice made, inspiration used, meal rated, new dish enjoyed) without optimizing vanity time-in-app?

## B. Functional flows: click for real
Run the app with its documented commands. Prefer agent-browser when CLI/browser are available. Record **what ran**, URL, viewport and result. Do not fake screenshots or claim tests not performed.

Smoke-test the changed flow plus adjacent behaviors:
1. Capture inspiration rapidly, with source/type, and retrieve it later.
2. Resurface and choose a meal, move/swap from a flexible weekly list.
3. Inspect grocery list after swaps, preserving checked status when appropriate.
4. Record home cooking steps/photos and finished product, rate it.
5. Record a restaurant/work meal, retrieve it, observe correct Insights.
6. Export/import or migrate prior browser data if persistence changed.

Test at narrow iPhone dimensions (390x844 or similar) and a common desktop width. On mobile inspect safe areas, bottom navigation, keyboard, input zoom, horizontal overflow, tap target size, contrast, screen reader names and reduced motion. Check empty, loading, error and offline outcomes appropriate to the change.

## C. Visual craft
- Real food photography has clear visual priority; do not replace with random stock aesthetic thumbnails when user assets exist.
- The scallion mascot is intentionally used, not overused; no guilt/wilting mechanics.
- Visual language: characterful, elegant, curved, slightly asymmetrical, editorial, warm, not generic SaaS, not excessively cute.
- Text is concise and actionable. Interactions have clear affordances, feedback and exit.
- Animation is purposeful and interruptible, doesn't block speed or overwhelm.

## D. Data, safety and trust
- Avoid destructive schema updates or lost local photos/data.
- Mark unverified dish/ingredient inference as an estimate. Never imply photo-based nutrient precision, exact portions, or unknown taste.
- Do not commit keys or expose raw personally identifying food/history data without user intent.
- Keep optional nutrition goals non-punitive and avoid shame/streak pressure.

## Output format (concise)
- **Changed:** what was built (files/flows)
- **Verified:** actual commands/tests/browser widths and observed outcomes; screenshots if available
- **Passes / blockers:** product outcome, interaction quality, visuals, accessibility, data safety
- **Next highest-impact fix:** ONE prioritized action grounded in observed evidence

If actual browser QA or device verification was impossible, explicitly label it `NOT VERIFIED`. Passing a build/test alone does not prove the experience works.
