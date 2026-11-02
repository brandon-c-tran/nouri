# Claude Code handoff — Make Nouri usable, not just presentable
**Read first:** \`docs/NOURI_PRODUCT_EXPERIENCE_BIBLE.md\` (primary product contract), \`CLAUDE.md\`, \`PRODUCT_BLUEPRINT.md\`, and \`docs/TOOLKIT.md\`.

## Your assignment

The founder has started using V0 and reports: **“It feels like an AI-sloppy frontend demo, not a usable app.”**

Treat this as serious product feedback. Your goal is **not** another cosmetic refresh, landing page, generic AI chat, or expansion of features. Your goal is the first version a real food-loving person would open while hungry, scrolling inspiration at midnight, shopping at the grocery store, or cooking.

**What must happen on the first truly useful day?** The founder sees a mouth-watering recipe/video, saves it with almost no effort, rediscovers it when deciding what to eat, adds it to a flexible plan, and eventually records whether it was actually delicious. Each part is linked, persisted, and easier to repeat next time.

Do not promise these capabilities—implement and verify them.

## Before touching code: discover current reality

- Inspect the **actual active branch/worktree** and recent changes. Other cloud sessions may be modifying \`claude/nouri-v0\`, \`claude/mobile-basics\`, \`claude/today-prototypes\`, \`claude/install-impeccable\`, and/or \`main\`. Don't reset another session's work or blindly merge over uncommitted edits.
- Read the product bible in full. Read current \`index.html\` and any newer app files that exist.
- Run the app and *use it* in the browser. Inspect iPhone-size and desktop screenshots, then try the real flows. If a browser is unavailable, say so.
- Make a compact truth table: **works today / partially works / fake or seeded / missing / broken**, with file/flow evidence.
- Identify the three biggest reasons a real user wouldn't choose to use the current build tomorrow. Don't confuse aesthetic symptoms with underlying functionality failures.

## Order of operations: a vertical slice, not a sprawling redesign

**First target:** Save a spark → find it again → choose it for a flexible week → get an accurate and editable grocery list → log the resulting meal → rate it → retrieve that source-linked history.

Prioritize whichever missing piece most prevents this loop from working today. Build the minimum necessary foundation for that piece and complete it. Every user-facing button must do real work. Treat the linked photo, source and rating as durable personal data.

### Quality bar for that first slice

1. A hungry person lands on **Today**, not a marketing pitch. One obvious next decision, three maximum appealing candidates, and easy “not tonight / surprise me / quick / project” paths. Personalization reasons must cite actual data, not generic flattery.
2. Capture is **low friction**: URL-only, text thought or photo saves immediately; no forced multi-field recipe form. Preserve the original spark; parsing can follow or fail without losing the capture.
3. **Saved** is a beautiful, searchable source memory, not a pile of emoji placeholder cards. Honor the user-provided image; mark missing images gracefully.
4. **Week** means a portfolio of swappable candidates, not a calendar or set of commitments. Shopping ingredients are derived, traceable and correct when plans change, including shared and already purchased ingredients.
5. **History** links what was wanted to what was eaten, where, the real photo and actual rating. Home, work and restaurant experiences all belong.
6. The UI respects **user time**: no huge hero, no endless feeds, no unnecessarily prominent KPI dashboard, no overlong forms, no decorative AI features.
7. The **mascot** adds charm in small moments without intruding or making food behavior moralized.
8. Data survives refresh and obvious edge cases; prior local user data is preserved or properly migrated. Never silently clear data during a refactor.

## Evidence-led design direction

Original green onion mascot; genuine food images; warm, nuanced greens and creamy neutrals; curvy, slightly asymmetrical, playful but elevated editorial layouts; immersive food imagery with functional hierarchy. Reject unconsidered SaaS cards, stock art standing in for memories, generic gradients, rainbow tags, fake personalized stats, and overanimated UX.

Make the active task the visual centerpiece. This is an **app**: information scent, tap economy, accessibility, consistency and trust matter more than a first-impression Dribbble shot.

Pick 1–2 relevant skills for each stage: frontend-design or emil-design-eng to establish craft; mobile-native to handle iPhone ergonomics; animate for purposeful motion; agent-browser for real QA; Impeccable when its separate installation is actually present. Don't spend the whole session installing more skills or generating abstract aesthetic concepts.

## Implementation approach

- Architect for an actual maintained product. The repository initially contained a ~94KB single HTML file with inline UI/state/storage and seeded dishes; new work may supersede it. Inspect current code before deciding whether to refactor.
- If the current architecture makes safe iteration materially worse, modernize toward testable modules/components and explicit persistence boundaries. **Preserve existing state and photos**, provide migration/export, and avoid needless setup scaffolding.
- No hard-coded “my data” pretending the user personally saved or enjoyed it. Seed/demo objects should be explicitly labeled and separated.
- Real input and reliable storage first. Layer AI extraction, recommendations or visual inference only when they tangibly reduce work. No secrets in the frontend.
- A URL that cannot be parsed must still save. Grocery suggestions from incomplete recipes must visibly say incomplete. Don't guess exact servings, groceries, macros or prices.
- Preserve identifiers and source provenance so restaurant→recreation and multi-attempt Cook history remain feasible.

## Test these real scenarios, not mockups

**A. Midnight save:** Paste a real food video URL with only a one-line thought, save, refresh, find the link and why it was interesting.

**B. Dinner choice:** With a few real saves, choose from a tiny, grounded shortlist, reject an idea, and finish the choice without being dumped into a blank AI chat.

**C. Grocery pivot:** Add dishes A and B with shared garlic/rice, check off garlic, swap A for C; garlic stays bought if still needed and unrelated lines recompute correctly.

**D. Cook memory:** Start a cook, add multiple photos/notes, close and reopen, finish with rating, then locate the entire timeline in history.

**E. Restaurant discovery:** Log a restaurant dish, photograph and rate it, then initiate “recreate” with the source preserved.

**F. New user and failures:** Try empty state, broken metadata URL, interrupted upload, no network and a page reload. Never show false success or destroy an entry.

**G. Phone:** On a real iPhone or simulated narrow viewport, test safe areas, keyboard, bottom navigation, uploads, real scroll behavior and accessibility. Record what was actually exercised.

These tests needn't all be implemented in one giant PR. However, **the current chosen vertical slice must be actually complete and tested** before describing the task as finished.

## How to report back

1. **Diagnosis** — three concrete root causes of “demo-ness” found in actual code/UX.
2. **Decision** — what you chose to fix first and what you intentionally left for later.
3. **Changes** — user journeys now working end-to-end, with code/files, not just visual adjectives.
4. **Verification** — tests, commands, browser viewport, screenshots, failure checks, and any \`NOT VERIFIED\` limitations.
5. **Data trust** — where saves/photos live, backup/export, migration and offline behavior.
6. **Next move** — one highly leveraged feature based on actual usage friction.

## Don't get trapped

**Bad approach:** rewrite everything, create 20 screens, invent AI personalization, paste abstract product copy, ship pretty but nonfunctional screenshots.

**Better approach:** discover the largest lived friction → build an actual narrow, reliable experience → test it like a user → make it distinctive → repeat.

The founder is willing to iterate extensively. Your job is to make the *next* iteration something they want to dogfood, not something they merely admire.

**Pass/fail question:** “When I'm standing in a grocery store with no idea what to make, could I trust Nouri to help me make a better decision in under a minute?”
