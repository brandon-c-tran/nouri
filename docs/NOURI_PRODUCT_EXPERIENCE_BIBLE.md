# Nouri — Product & Experience Bible
**Version:** 1.0 | **Date:** November 2, 2026 | **Owner:** Personal N=1 product | **Status:** Directional product contract, not a claim that features are already implemented

> **Nouri helps me eat more food I love, discover more food worth loving, and spend much less time deciding what to eat.**
>
> **Every meal makes the next decision better.**

This document is the enduring context for the product. Read it *before* redesigning screens, adding AI, changing the information architecture, or writing a large refactor. It should be used alongside \`CLAUDE.md\`, \`PRODUCT_BLUEPRINT.md\`, and the current code—not as permission to discard existing work or user data.

---

## 0. Why this document exists: stop building the demo

The initial V0 can demonstrate interactions, but it is not yet the lived experience the product promises. It currently includes a self-contained HTML app, seeded meal ideas, local browser state, and rule-based picks. These are useful scaffolds, not the product.

**We do not want:**
- A gorgeous landing-page hero in the place where a hungry person needs an answer.
- A faux-personalized feed populated mainly with hard-coded demo dishes.
- A set of separate, attractive CRUD pages that never help someone decide, shop, cook, or learn.
- An “AI” button that generates generic paragraphs without knowing what actually happened.
- Endless tags, forms, dashboards, badges, or mascot chatter that raise the cost of using the app.
- Over-eager framework/architecture churn that leaves core flows unfinished.
- Invisible data loss, broken offline photos, fake integrations, dead controls, or misleading success states.

**We do want:**
- The feeling of using a real, trusted personal tool on an iPhone.
- A fast, obvious next action within seconds of opening it.
- A product that is valuable after a single saved craving and steadily better after dozens of meals.
- Actual preserved memories: links, photos, cooking steps, ratings, notes, original sources, and corrections.
- Recommendations grounded in *my* accumulated interests and current context, with honest fallbacks when little is known.
- Cohesive, intentional, highly crafted UX that prioritizes delicious food and practicality over AI-app aesthetics.
- Reliable complete vertical slices, not a long menu of disconnected prospective features.

**The key test:** If the visual polish were removed, would Nouri still save me effort or help me eat something I would otherwise have forgotten? If not, the feature is not ready.

---

## 1. The founder/user: a concrete N=1 starting point

The initial user cooks regularly, from quick comfort food to elaborate multi-component weekend projects. He enjoys Vietnamese, Chinese, Japanese, Korean, Southeast Asian and other cuisines; spicy, rich, savory, texturally interesting food; and improving favorite dishes. These are starting hypotheses based on observed interests, **not immutable labels or dietary rules**.

Behavioral realities:
- Food inspiration arrives out of context: at midnight on TikTok, while scrolling recipes, looking at a friend's meal, traveling, or remembering a restaurant.
- The user often forgets those inspirations when in a grocery store or deciding dinner.
- He defaults to familiar, reliably good meals even when he *wants* to cook more widely.
- He likes photographing the *process* of cooking, not only the hero shot at the end.
- He improvises: ingredients, temperatures, steps, stock concentrations, and plans evolve mid-cook.
- He has distinct everyday contexts: eating at work, getting takeout, going to restaurants, quick weeknight cooking, long experimental weekend cooking, and sharing food with another person.
- He may love a restaurant dish that he can no longer easily order (far away, seasonal, inaccessible) and want to reverse-engineer it in his own kitchen.
- His cravings change quickly. A weekly calendar that forces Wednesday's dinner on Sunday is brittle.
- He is willing to invest time in *food* and the craft of cooking; he does not want to spend comparable time managing a food app.
- He cares about personal aesthetics: characterful, slightly abstract, curved, playful, asymmetrical, elevated and meticulously finished. The green-onion character is a meaningful element of the brand, not an excuse to gamify meals.

**Do not assume** this user wants calorie restriction, a meal-prep fitness dashboard, rigid grocery budgeting, seven-day scheduling, or food morality.

---

## 2. Founding problem and product thesis

### The fundamental mismatch

> *When I am excited to eat something, I am rarely ready to act. When I am ready to act, I often can't recall what excited me.*

A food idea saved at 12:30 AM is only valuable if the exact same desire can be reactivated when shopping or cooking later. Saving the title alone may not revive the excitement; the original image/video, sensory trigger, restaurant memory, or visual texture can.

### Why normal apps miss it

- Recipe managers know **instructions**, not how much you liked the result.
- Saved social posts know **inspiration**, not whether you ever ate the dish.
- Restaurant platforms know **where and what you ordered**, not how you cook it at home.
- Meal planners know **intentions**, not last-minute appetite changes.
- Food journals know **what you ate**, but rarely connect to why you chose it or what you want next.
- Nutrition trackers know **estimates of intake**, usually without rich personal taste or culinary context.

Nouri connects all these events into a unified learning loop:

**Notice desire → preserve its sensory source → recall in the right context → choose → obtain ingredients/order → cook/eat → rate/reflect → improve the next decision.**

That is the product. Everything else is a means to make the loop more effortless, enjoyable, and intelligent.

---

## 3. Goals, metrics and guardrails

### Product health / retention
- **Meaningful weekly active use**: a real food decision, inspiration captured/revisited, plan changed, cook documented, meal recorded, or memory used. Page views, number of tabs visited, hours engaged, and streaks are not success.
- For N=1, track weeks when Nouri genuinely helped and the qualitative story of how. Cohort W1/W4 retention only becomes meaningful with additional users.
- Ideally, a habitual user opens Nouri *briefly*, gets a good answer, and closes it.

### Human outcomes
1. **Enjoyable eating:** average user-provided meal enjoyment rating, shown with rating coverage and frequency. Do not optimize the average by making disliked meals harder to log.
2. **Culinary exploration:** distinct **new dishes** actually eaten and distinct cuisines explored over rolling 28 days; don't count an idea merely saved.
3. **Exploration that pays off:** percentage of new-to-user meals rated highly. Novelty without deliciousness is failure.
4. **Inspiration conversion:** percentage of captured inspirations that become an eaten meal or meaningful cooking experiment; preserve the link to original inspiration.
5. **Choice quality:** whether the meal chosen was appealing in hindsight, not only whether selection happened quickly.

### Effort/time guardrails
- Capture a craving in **~5–15 seconds** for the common case. No required multi-field setup.
- Choose something appealing in **~30–90 seconds** when enough data is available (aspirational, test with actual usage).
- Weekly planning should be doable in a few minutes, not a project.
- Logging a simple restaurant/work meal should feel possible in **~10–20 seconds** with optional enrichment later.
- No guilt for skipping days, eating familiar dishes, declining recommendations, or not logging every meal.
- Optional groceries/waste/spend measurements must never be required for basic usage.
- Preserve the option to skip and exit. Reduce *interaction cost per useful result*.

### Instrumentation discipline
Record source-linked events only when they correspond to an actual action. Start time-to-choice at the meaningful decision surface, not at app launch if the user came to log a meal. Track first-run/onboarding separately. Treat N=1 numbers as directional, not causal evidence.

---

## 4. Product principles (in priority order)

1. **A hungry user should see an answer, not a hero.** The home surface must be task-oriented, contextual, and responsive to the moment.
2. **Capture desire, not paperwork.** Saving should usually require one tap, paste, share or photo plus optional note; enrichment can happen later.
3. **Recreate the original spark.** Keep the original link, visual reference, caption and *why it appealed*. A bland dish title is insufficient.
4. **Options beat obligations.** Maintain 2–4 meals you would be happy to eat, with a flexible grocery basket, rather than a rigid calendar.
5. **Recommendations, not an infinite feed.** Show a small shortlist with real reasons; offer “not now”, “something different”, and quick constraints.
6. **Every meal is evidence, not just a log entry.** Connect meals to cravings, dishes, places, recipes, cooking sessions, ratings and preferences.
7. **Restaurant eating and home cooking belong to the same graph.** “I loved this at a restaurant” should naturally become “help me recreate it.”
8. **A cook is a real event.** Photo-by-photo history, step revisions, improvisation and final feedback matter more than static recipe display.
9. **Truth before magic.** Never present guesses as facts, fake AI outputs, fictitious grocery quantities, unsupported prices, or implausibly exact nutrients.
10. **The interface has a personality, but it's quiet when the user is busy.** Delight is a small, meaningful reward for success—not a layer to fight through.
11. **Memory should compound.** Preserve provenance, edits, confidence, and longitudinal history so that improvements are explainable and correctable.
12. **Trust is earned with boring reliability.** Real persistent data, rapid loading, recoverable failures, usable offline behavior, export, undo and no data loss.

---

## 5. The essential daily-life journeys: build and test these

Each journey describes an *end-to-end product contract*. UI should be judged by the entire chain, not by attractive individual screens.

### J1 — Midnight inspiration becomes future dinner

**Given** I see a TikTok/Instagram/YouTube recipe or a photo that looks delicious at midnight.

**When** I share, paste, or capture it in Nouri.

**Then** Nouri should:
- Save the **original URL/source**, photo/thumbnail when available, the timestamp, and my enthusiasm immediately.
- Extract a likely dish name, visible ingredients, prep estimate and cuisine *only if supported*; preserve them as editable guesses, not facts.
- Let me attach a one-line reason like “the crispy edges,” “deep red chili oil,” or “want this exact texture,” optionally by voice.
- Show a reassuring saved state that is true, then return me to what I was doing.
- Avoid forcing a full recipe, tags, ingredient list, rating, dietary profile or account workflow before saving.
- Resurface this exact inspiration—with its original imagery/clip/source—when relevant for dinner or groceries.

**Fallback:** If link metadata is blocked, still save the URL and user's note/photo; offer to add a screenshot later. Do not silently fail or invent the thumbnail. If it is a duplicate, make the repeated interest useful rather than creating arbitrary duplicates.

**Acceptance test:** Save a URL with nothing else. Close/reopen app. Find the exact URL and identify why it interested me. Mark it as an option for this week. Do this with unsupported/extraction-failing sources too.

### J2 — Standing in a grocery store, no idea what to cook

**Given** I have saved ideas but my cravings are fluctuating.

**When** I open Nouri to plan groceries.

**Then** show a small portfolio of **2–4 appealing, executable possibilities**, not seven prescribed dates:
- I can say quick/project, comfort/novel, cook/eat out, and whether I want to use existing groceries.
- Each candidate shows actual food imagery, source spark, a realistic effort estimate, and *why Nouri thinks it fits*.
- “Not in the mood” and “show me something else” work without punitive UX.
- I can add, swap, remove or defer ideas without destroying what I saved.
- Grocery list is a **derived, deduplicated list** from current options, with per-dish traceability and explicit distinction between known required, estimated, pantry, and already owned.
- Swapping a dish updates associated ingredients; ingredients shared by another selected dish stay.
- Purchased/checkmarked groceries should never silently vanish, uncheck, or be double-counted when I pivot.
- I can deliberately buy flexible ingredients with multiple possible uses.

**Fallback:** If recipe ingredients/quantities are missing, ask only for the genuinely missing information, mark the list incomplete, and let me shop the known items. No fabricated accurate quantities or pantry claims.

**Acceptance test:** Add two meals sharing rice/garlic. Check rice. Swap one meal. Shared items remain; unique items update; rice remains checked. Reload the browser and verify all state is intact.

### J3 — It's 6:30 PM and I want a good answer, now

**Given** I have some time, some energy and an uncertain craving.

**When** I open Today.

**Then** Nouri offers **three maximum** credible suggestions, perhaps:
- A recently saved spark I forgot about.
- A dependable comfort dish that fits tonight.
- A new but plausible exploration that broadens my food world.

The UI explains in plain language why each was selected (“saved this after seeing the sauce”, “you've got everything but basil”, “a new variation on a dish you rated highly”). The user can quickly reject the suggestion, adjust time/effort, or choose “surprise me.”

A suggestion should never claim personal understanding that has not been established. With no history, use explicit generic/onboarding choices rather than pretend to know me.

**Acceptance test:** Three choices appear based on my *own* data; dismiss one; next suggestion updates; select a dish; plan/cook/log path opens without reentering its name.

### J4 — Complex, improvisational cooking with rich photo history

**Given** I cook a multi-component dish like mì Quảng with stocks, braises, aromatics, seafood, noodles and separate finishing stages.

**When** I start a cook.

**Then**:
- A **Cook** is an independently addressable attempt, linked to a Dish and an optional recipe version.
- I can take multiple photos, timestamp stages and add a five-second note without switching to a form-heavy workflow.
- Photos preserve original or optimized usable quality; do not silently drop or flatten them into inaccessible text.
- I can annotate parallel components: stock, sauce, protein, garnishes. The sequence needn't pretend every dish is linear.
- I can revise the plan mid-cook and mark substitutions or mistakes without corrupting the canonical recipe.
- Active sessions are recoverable after an app reload/offline interruption; accidentally leaving a cook does not erase it.
- Finish with a result photo, quick enjoyment rating, and optional “change next time”.
- A later cook shows prior photos, differences, past mistakes, and the strongest specific improvement opportunities.
- Future voice/vision assistance must cite the correct step photo and explain uncertainty; a photo cannot reveal seasoning, oil amounts or actual internal temperature.

**Acceptance test:** Start a cook; take/attach at least 3 photos with notes; close/reopen; resume; finish; rate; find it in history; start another cook of the same dish and see the earlier attempt.

### J5 — Eat a restaurant/work lunch and don't let the insight evaporate

**Given** I ate an especially good meal at a restaurant, cafeteria, friend's home or at work.

**When** I log it.

**Then** I can record a photo, what it was, optional place, enjoyment rating, date, quick note, and whether I would repeat or recreate it. This shouldn't demand ingredients/precise macros I don't know.

- Eating out should create an experience linked to the same Dish model used by cooking.
- A photo of a dish at work is equally valid evidence; a restaurant name is optional.
- Repeated positive signals should strengthen taste hypotheses, while corrections/poor ratings counter them.
- It should be possible to transform an exceptional restaurant experience into a **recreation project**, carrying the photo, restaurant context, and flavor goals forward.
- Memory search should retrieve the original meal, not simply hallucinate a new recommendation.

**Acceptance test:** Log a 5-star restaurant noodle dish with a photo. Find it later, tap “recreate at home”, and see its source and tasting notes preserved as the target.

### J6 — Reconstruct an unforgettable dish from far away

**Given** I once ate a dish in a restaurant I can't easily revisit and want to approximate it myself.

**When** I choose “recreate this”.

**Then** create a **Recreation Project** linked to the original eating experience:
- **Target:** original venue/date/photos/sensory description and what made it special.
- **Hypotheses:** likely ingredients/techniques, distinguished from confirmed facts.
- **Plan:** plausible research-backed recipe approach, alternatives and shop list.
- **Attempts:** numbered Cooks with stage photos, modifications and outcome ratings.
- **Learning:** explicit “closer/further from target” and specific areas to tune.

A restaurant recreation need not be *perfectly faithful* to be delightful. “Great in my kitchen” and “faithful to restaurant” may be different objectives.

**Acceptance test:** Restaurant memory → recreation → ingredient plan → Cook #1 photos + notes → adjust plan → Cook #2. Preserve the parent target and comparison.

### J7 — Spontaneous change of mind

**Given** I planned char siu but now want something lighter/quick, or I already ate what I planned at work.

**When** I change the plan.

**Then** Nouri should gracefully update options/groceries, preserve prior purchased pantry items, suggest alternative uses of overlapping ingredients where useful, and never make the user feel they “failed the plan”.

**Acceptance test:** Pivot after checking several groceries; nothing purchased is lost; other available meals are recommended using the ingredients I already have.

---

## 6. The experiential center: Today is the product

Home should not feel like a startup landing page. It should resemble opening a trusted tool at the exact moment food becomes a decision.

**Proposed hierarchy** (adapt intelligently if usability research supports a better one):
1. A human, contextual question: “What sounds good tonight?” / “Shopping for the week?” / “Still cooking mì Quảng?”
2. **The primary action**: a shortlist of appealing possibilities with rich imagery, tiny factual explanations and one-tap actions.
3. The active, flexible meal portfolio and a directly useful grocery shortcut if appropriate.
4. Recently saved or resurfaced cravings, prioritized by relevance, not a feed.
5. Simple capture (+), always reachable, never buried.
6. Small, unobtrusive mascot behavior that signals useful progress or gentle guidance.

**Initial navigation hypothesis:** **Today · Saved · Week · History**; an always-available capture affordance; the active Cook gets a prominent contextual entry. Insights belong in an unobtrusive secondary area rather than occupying a primary slot before they have useful data. Do not lock this IA without testing.

### A good home example
“Tonight, 30 minutes”
- Pad kra pao: *A spicy weeknight idea you saved recently. Needs basil.*
- Ginger beef gyudon: *Comforting, quick, and you've cooked something similar.*
- Something new: *Try a noodle dish you haven't made yet.*

At the top: tap one button to change the constraint to “actually, I want a project.” No chatbot interrogation and no giant search box. If recommendations can't be earned from current data, ask one meaningful question and show a sensible starter shortlist, clearly labeled.

---

## 7. Interaction specs: make the common actions astonishingly easy

### The capture affordance
- Accessible from anywhere, mobile-first.
- Single primary field for paste/URL/natural-language thought/photo; attach optional note or upload.
- Supported inputs should expand over time: manual text, image, URL, native iOS share if PWA constraints allow, voice, existing photo gallery.
- “Saved” means durable storage has actually succeeded; handle errors, offline and retries.
- Auto enrichment happens asynchronously *after* saving, never blocks capture.
- Later, the user can organize; the first capture should not require manual categorization.

### A dish card should answer
- What is it, visually?
- What made me want it, or why would I like it?
- Can I eat it soon? Time/effort, essential missing ingredients if known.
- Have I saved/cooked/eaten it before?
- What is the next action? Choose, plan, cook, revisit source, or defer.

Do not render 10 different decorative badges. If an attribute does not affect a decision, remove it.

### Quick food rating
- Rating is optional and can be added later; ability to rate mediocre/bad meals matters.
- A fast signal like “loved / good / not for me” may be lower friction than mandatory 1–5. Preserve compatibility with numeric ratings for longitudinal metrics.
- Taste notes are optional. Ask “what stood out?” only when it would deepen a meaningful memory.
- Dish enjoyment and restaurant fidelity are distinct dimensions for recreation attempts.
- No overly social review-writing flow.

### Cooking photo capture
- Camera/library selection from within active cook, large capture target, minimal confirmation steps.
- Associate photo with a timestamp, optional component/stage and note. Make all metadata editable later.
- After capture, return to the cook view rather than forcing users through several detail screens.
- Show a beautiful, ordered visual timeline or grid that can handle parallel steps without implying false chronology.
- Use image thumbnails, lazy loading, secure storage, correct orientation, and resilient upload/resume handling.

---

## 8. The data model: simple initially, strong relationships always

The pivotal entity is **Dish**, a canonical idea of something one might eat. It is not identical to a recipe or one meal, and it may have synonyms/variants.

Minimum conceptual entities:

| Object | Essential fields / relationships | Why it exists |
| --- | --- | --- |
| **Food Source** | \`id, type, url/photo/text, attribution, raw content, capturedAt\` | Preserve the original sensory inspiration and provenance |
| **Inspiration** | \`id, sourceId, dishId?, cravingReason?, strength?, capturedAt, status\` | An unfulfilled food desire, distinct from having actually eaten it |
| **Dish** | \`id, name, cuisine?, image?, aliases?, identity-confidence\` | Common anchor across saving, eating out, plans and cooking |
| **Meal Experience** | \`id, dishId?, where(home/work/restaurant/other), place?, at, rating?, photoIds[], notes?, sourceInspirationIds[]\` | What happened and how much the user enjoyed it |
| **Recipe Version** | \`id, dishId, parentVersion?, ingredients, directions, source/provenance, editedAt\` | A proposed way to prepare a dish, not a record of an actual attempt |
| **Cook** | \`id, dishId, recipeVersionId?, startedAt, finishedAt?, status, stepIds[], finalPhotoIds[], rating?, nextTimeNotes?\` | A historical *attempt* with real deviations |
| **Cook Step** | \`id, cookId, at, component?, photoIds[], note?, substitutions?\` | Visual, time-linked evidence |
| **Recreation Project** | \`id, targetMealId, desiredTaste?, hypotheses[], attempts[]\` | Link an inspiring meal outside the home to iterative cooking experiments |
| **Week Option** | \`id, dishId, recipeVersionId?, status, priority?, addedAt\` | A flexible candidate, not a forced date |
| **Grocery Line** | \`id, ingredient, normalizedUnits?, quantity?, linkedOptionIds[], purchased?, pantry?\` | Shopping derived from real options, with source traceability |
| **Preference Evidence** | \`id, sourceMeal/Cook, hypothesis, dimension, polarity, confidence, userConfirmed?\` | Claims must be inspectable, revisable and evidence-linked |
| **Event** | \`id, action, at, context, linkedObjectId, duration?\` | Measure meaningful usage and time cost without making users log stats |

Don't implement 12 database tables merely because the design shows 12 conceptual entities. For V1, use minimal durable structures that preserve unique IDs, relationships, timestamps, versioning/provenance and room for migrations. Normalization can follow actual needs.

### Data truth hierarchy
1. **Observed/confirmed**: user entered/rated/corrected, original link, actual photo and timestamp.
2. **Extracted with support**: explicit recipe text, publisher metadata, restaurant menu nutrition when available.
3. **Inferred**: model guesses about dish, cuisine, techniques, ingredients, portions, preferences.
4. **Unknown**: represent it honestly rather than filling a template with invented values.

Store confidence and source on inferred claims; offer a lightweight correction mechanism. Personalization must use *eaten* and *rated* evidence differently from merely saved inspiration.

### Identity and duplicates
“Mì Quảng” as a dish, a specific restaurant's mì Quảng, a saved video of mì Quảng, your first Cook and your second Cook are related but not the same record. Preserve that distinction even if the UI groups them.

---

## 9. Recommendation intelligence: build grounded usefulness before complexity

A better recommendation is one that can be explained by data Nouri has genuinely observed. Early versions may use transparent scoring:
- Recent expressed craving/saved inspiration strength and visual spark.
- Recency of meals (avoid unrequested repetition).
- Actual enjoyment history and confidence/coverage.
- Time and active cooking effort constraint.
- Ingredient/pantry feasibility **only when known**.
- Newness versus familiar comfort, depending on present mood.
- Availability of a known recipe or user's previous successful cook.
- Budget or nutritional preferences **only if explicitly configured**.

The algorithm should preserve diversity within the top three: not three variants of the same noodle bowl unless that's clearly what the user wants.

**Every recommendation must be traceable**: “Because you saved this last night,” “You rated this version highly,” “uses your leftover pork,” or “a new Thai dish near flavors you liked.” If no real evidence supports the rationale, don't invent one.

Feedback signals: chose, dismissed, replaced, planned, purchased, cooked, eaten, rated, recreated. A dismissal may mean “not tonight,” not “I hate this dish forever.”

Start with rules if they are actually useful. Use LLMs for enrichment, parsing, reflection, and grounded explanations—not as a hidden source of random meal suggestions. Show thoughtful fallback when an API is offline.

---

## 10. The photo and memory engine

Photography is not a decorative garnish. It is a potentially unique, compounding dataset:
- **Process:** texture, browning, reduction, visual doneness, sauce appearance, plating evolution, sequence.
- **Result:** final dish, portion, plating, visual appeal and recurring style.
- **Context:** restaurant provenance, work lunch, ingredients, cooking setup.
- **Longitudinal comparison:** how a dish changed between Cook #1 and Cook #5.
- **Recovery:** what did the sauce look like when it came out glossy? Which stock stage worked better?

But an image does **not** reliably reveal flavor, seasoning, food safety, precise oils/macros, ingredient weights or the recipe used. Ask at the right moments rather than hallucinating. Keep originals or high-quality versions accessible and give users control over uploads/deletion. A future multimodal model can attach observations to individual images; it must never erase the underlying evidence.

**First useful photo feature** is *recall and comparison*, not image-AI spectacle.

---

## 11. Reverse-engineering food: a distinctive long-term wedge

This is not a random “AI recipe generator” button.

A passionate user ate something wonderful at a distant restaurant or on a trip. Nouri holds the *target experience* and helps conduct iterative kitchen experiments toward it. That connects:
- Restaurant discovery + tasting notes + ratings.
- Sensory preference modeling (savory depth, spice, texture, aromatics).
- Ingredients, sourcing, shopping and substitutions.
- Technique knowledge and cooking photo histories.
- Recipe experimentation and version control.
- Better future food choices and personalized cooking suggestions.

This can create durable, defensible learning **if** Nouri captures real outcomes and corrects errors rather than simply accumulating unstructured text. The wedge is strong as an N=1 use case even before considering a scalable moat.

A recreation project should explicitly display the original inspiration next to the current attempt; ask “closer to the original?” as a separate dimension from “delicious in its own right?”

---

## 12. Nutrition and well-being: future layer, not an obstacle to eating

Nouri can eventually help people pursue nourishment, food diversity, protein/fiber goals, and taste-preserving recipe improvements. But it must be a **user-controlled optional layer**.

- No default calorie ceilings, red food labels, moralized meals, streak pressure, mascot wilting, compensatory nudges, or mandatory macro input.
- No claim that a photo reveals precise calories, oil quantities or macros.
- Use known recipe quantities/servings or credible published nutrition with explicit uncertainty when available.
- Treat “slightly healthier, same delight” as a *testable personalized tradeoff*, not a guaranteed outcome.
- Don't make collecting sensitive health data a prerequisite for cooking or cravings.
- Nouri should remain profoundly useful when wellness tracking is completely off.

---

## 13. Information architecture and screen contracts

Recommended first-pass IA, subject to usability testing:

### Today (decision engine)
- One compelling context-based task.
- Maximum three actual meal choices, with clear reason + constraints.
- One-tap choice/plan/cook paths.
- Quick access to active Cook and active shopping list.
- Optional compact recently captured inspiration.
- No faux-landing-page introduction after first onboarding.

### Saved (Craving Shelf)
- Rich thumbnails/original source, searchable by dish/source/notes.
- “Want to eat this,” “Plan,” “Cook,” “Recreate,” “Not now.”
- Separate saved vs eaten status. No hard-coded seed pretending to be user's memory.
- Natural capture and dedupe.

### Week (flexible kitchen planning)
- 2–4 active options, no forced dates.
- Swapable options, ingredient overlaps, practical shopping checklist, plan confidence and pantry distinction.
- Purchased items protected through pivots.
- Explicit choice when a meal moves from plan to cooked/eaten.

### History (food memory)
- Visually rich, chronologically browsable meals across home, work and restaurant.
- Cooking-step galleries, source-linked original inspiration, ratings, notes.
- Search, re-cook, recreate, compare attempts.
- Insights in a secondary surface until there's actual evidence worth showing.

### Cook mode (contextual workflow, not permanent nav tab)
- Stage photo capture/notes, recipe and components, recoverable in-progress state.
- Real cooking utility, not an animated checklist pretending to manage multiple pots.
- Strong results screen and easy “change next time” note.

A radical IA change is welcome **if** it makes real user flows more effortless and passes the end-to-end tests.

---

## 14. Visual identity: make it unmistakably Nouri, not AI slop

### Art direction
Warm, culinary, optimistic, intimate, slightly nostalgic; beautiful photographic food is the star. Balance elegant restraint with whimsical character. Natural creams, nuanced greens, gentle earthy accents, unusually good typography and spacing. Allow curvature, small asymmetries and expressive composition. This is an expertly directed product, not a medical/fitness dashboard, pastel SaaS template or children's game.

### The mascot
The **original green onion** is a recognizable, beloved brand element. Its regrowth metaphor is *discovery and culinary learning*, not compliance. Use it sparingly and intentionally:
- At first-save success, as a friendly guide to a new capability.
- As a tiny, tasteful character reacting to exploration or a completed experiment.
- In the optional culinary garden/long-term progression system.

Avoid constant intrusive speech bubbles, progress coercion, or random mascots used in place of real content. Keep the source artwork and don't replace with unrelated stock/emoji images.

### Visual anti-patterns
- Giant homepage hero with “Good food. Less overthinking.” above the actual utility after onboarding.
- Every surface as the same rounded white card.
- An emoji standing in for a gorgeous food photo when a real source photo is available.
- Generic “✨ AI magic” badges or busy gradient backgrounds.
- Overdesigned dashboards packed with low-value KPIs.
- Long paragraphs where a tappable photo/action would communicate better.
- Animation that delays a meal decision or requires a user to wait.
- Stock food imagery implying a user's specific saved meal when the app has no rights/data to show it.

### Mobile craft bar
- Design for one-handed iPhone use first, with responsive desktop.
- Thoughtful bottom navigation and safe-area insets, especially for mobile Safari/PWA.
- No accidental horizontal scroll, tiny icons, hover-only controls, iOS input zoom or keyboard-obscured forms.
- Visible loading/success/failure, clear exit/undo, sensible offline handling.
- Tap targets around 44px where feasible; accessible contrast, labels, focus management and reduced-motion support.
- Motion should feel responsive and interruptible; make fewer things move, but make them *feel right*.

**Quality is judged through actual screenshots and tactile flows**, not a self-reported aesthetic score. Use Impeccable, frontend-design, Emil Design Engineering and mobile-native selectively; don't run every overlapping skill blindly.

---

## 15. Engineering floor: real app requirements

### Reality of current source
The accessible repository version includes a large single-file \`index.html\` experience with inline CSS/JS, hard-coded starter ideas, browser storage and some functioning interactions. Other Claude sessions may have newer unpushed changes. **Inspect the actual active branch and running app before deciding to keep or replace this architecture.**

### Non-negotiables for usability
1. **Durable user data**: ideas, links, meals, ratings, plans, steps/photos survive refresh, navigation and normal retries; failures are surfaced.
2. **Photo lifecycle**: images attach to correct records, survive reload, load efficiently, and can be removed intentionally. Storage exhaustion is handled.
3. **Portability**: offer readable export and reliable import/migrations. Before refactors, preserve compatibility with existing local data.
4. **Real functional integration**: no dead UI controls; no feature marked complete if it only opens a toast or static modal.
5. **Error/offline states**: a failed enrichment API does not lose the saved craving; app remains usable within its stated offline limits.
6. **Source preservation**: don't overwrite real URLs, user notes or actual photos with model-generated approximations.
7. **Security/privacy**: no secrets in client-side code, no public indexing of personal food history by default, scoped storage access, avoid surprise background capture.
8. **Testing**: automated tests around the core data transformations plus browser tests around complete flows. Verify on phone-size screen and actual touch device when possible.
9. **A sensible codebase**: source should be understandable and editable by Claude without fragile giant-string HTML patches. Split/modernize if the cost-benefit favors shipping and reliability, but avoid multi-week architecture theater.
10. **Device strategy**: local-first is acceptable for an earliest dogfood iteration **only if** backups/export are real and data risks are disclosed. For sustained iPhone + laptop usage, plan authenticated sync, durable image object storage and a robust migration path.

### Prefer architecture that supports real needs
- Structured dish/meal/cook data and a single reliable persistence abstraction.
- Reliable state derivation for groceries, with tests for shared ingredients and purchased status.
- Separate view rendering from business logic and future AI enrichment.
- An async job or service boundary for third-party extraction/AI enrichment, with retries and provenance.
- A measured, testable recommendation scorer before introducing complex personalization services.
- Image upload/compression/thumbnails handled intentionally, not embedded as giant strings in core state.
- Environment config and documented launch/deployment steps.
- No third-party APIs called deceptively; acknowledge platform scraping/access limitations.

Do **not** choose a trendy framework or backend solely to signal modernity. Choose what makes it possible to dogfood safely, iterate fast, and ship a delightful actual experience.

---

## 16. MVP, V1, later: strict sequencing

### Immediate objective: V0 → usable alpha
Build **one complete loop** before adding more concept surfaces:

**Save a craving (URL/photo/text) → resurface it → choose/plan → see accurate groceries → cook/eat → rate → find it in History and affect future suggestions.**

This is the first vertical slice. It must work on an actual phone with *actual persisted user entries*. It can use rule-based recommendations and manual link fallback as long as those are honest.

**Definition of done for usable alpha:**
- Open app on iPhone and immediately understand what to do.
- Save a real TikTok/recipe URL or thought with minimal friction.
- Return a day later and genuinely find it again.
- Select from a limited shortlist and assemble a flexible plan.
- Grocery list correctly responds to a plan pivot with shared/purchased items.
- Document a cook (including several photos) or a restaurant/work meal.
- Give an actual rating and have it persist.
- Retrieve the meal and original source, and get a better grounded suggestion next time.
- No silent data loss, fake AI outcomes or dead actions.

### Second objective: V1 compounding memory
- Real source-aware enrichment for supported links and photos, with fallback.
- Better photo galleries and previous-cook comparison.
- Dish identity/deduplication and cross-context meal linking.
- Taste insights with source citations and user corrections.
- Cross-device sync/backups when N=1 usage justifies it.
- Strong search/recall and lightweight versioned recipes.

### Third objective: distinctly Nouri
- Restaurant-to-home recreation projects.
- Dynamic grocery option optimization and flexible pantry reuse.
- Robust voice/photo sous-chef for multi-component cooking.
- Taste-aware suggestions grounded in measured outcomes.
- Optional nutrition personalization, with uncertainty, control and non-punitive defaults.
- The mascot's richer living culinary world.

**Do not build all three objectives simultaneously.** Keep vision broad and the shipped iteration narrow.

---

## 17. Prioritized first implementation work

**Phase 0 — audit (before rewriting):**
- Read current branch, inspect code and run app; identify real vs seeded content, functioning vs pretend controls, persistence limits and broken flows.
- Capture desktop/mobile screens and map all routes/screens. Distinguish verified findings from hypotheses.
- Identify the *single highest-friction user journey* and propose an implementation that solves it end-to-end.
- Preserve actual user data and avoid destroying in-progress work from other Claude sessions/branches.

**Phase 1 — make Today and capture genuinely useful:**
- Replace marketing-first homepage behavior with a quick meal-decision surface.
- Build “save a spark” with URL-only/text/photo input and instant durable save.
- Make saved ideas visually searchable and actionable; preserve original source.
- Show no more than three credible recommendations and honest “why now.”
- No fake population of the user's history with seeded content; if samples are offered, clearly label/onboard and keep them separate.

**Phase 2 — make the choice executable:**
- Flexible week options; real grocery derivation; purchase/pantry state.
- Correct behavior across swaps, shared ingredients, reload and incomplete data.
- Direct path from a chosen option to start a Cook or record that it was eaten elsewhere.

**Phase 3 — close the learning loop:**
- Quick meal capture at home, work and restaurant, with ratings.
- Photo-rich cooking timeline that survives reopen and is easy to review.
- Link the meal outcome to the original saved desire.
- Improve recommendations using only observed/explicit information.

**Phase 4 — differentiate and refine:**
- One restaurant→recreation slice, using actual meal → attempt links.
- Refinement of brand, movement, iPhone ergonomics, accessibility, search and responsiveness.
- AI enrichment only where it materially reduces entry work and handles failure gracefully.

This is an **order of operations**, not a mandate for week-long phases. Ship vertical, test, dogfood, learn.

---

## 18. Usability tests and acceptance gates for Claude

### Required journeys
- **A — Capture:** Open Nouri on iPhone, save a URL/photo/idea without recipe fields, close/reopen, retrieve source and content.
- **B — Decide:** Open Today with saved ideas, see 2–3 real relevant options, reject a candidate, choose a better one.
- **C — Pivot:** Add dishes A+B sharing ingredients; mark shared ingredient bought; swap A for C; verify overlap and bought state.
- **D — Cook:** Start a Cook, add several photos with notes, reload, resume, finish with rating, retrieve timeline from History.
- **E — Eat out:** Log work/restaurant meal in under a minute, optional rating, find it later, create recreation concept without losing source.
- **F — Trust:** Fail a metadata request/offline/network operation; saved ideas and notes remain intact; no false success.
- **G — Blank state:** New user sees a comprehensible immediate action, not a fictitious personalized dashboard.
- **H — Mobile:** Real 390px-ish viewport, safe area, keyboard, navigation, upload, large photos, long text, reduced motion and accessibility.
- **I — Migration:** Existing V0 export → upgraded app import; verify idea, meal, image, rating and grocery state survive.

### Deliverables after each meaningful implementation
1. What end-to-end user problem changed.
2. Screenshots or live preview of **real app states** (empty, populated, error) and what viewport was tested.
3. Functional test results, exact commands and observed outcomes. If no browser test was possible, write **NOT VERIFIED**.
4. What data is actually persisted, where, and what happens if offline/reloaded.
5. Known limits and the one highest-impact next fix.

**No “I polished it” report without demonstrating that the app helped complete a real food task.**

---

## 19. Anti-scope-creep rule: ask how each feature improves the loop

Before building a feature, answer:
1. **Which user moment?** Midnight inspiration, grocery store, dinner choice, actual cooking, restaurant/work eating, looking back, health decision?
2. **What user work is eliminated?** Typing, remembering, searching, deciding, planning, reproducing?
3. **What new useful evidence is collected?** Source, photo, actual rating, cooking lesson, preference correction?
4. **What changes next time?** Better decision, faster capture, fewer forgotten cravings, a better cook, more delicious variety?
5. **Is it worth the user's attention?** If no, de-scope.

An elegant “nothing to do here” state is better than a fake gamified task to keep the user engaged.

---

## 20. Product voice and interface copy

Nouri should sound like a smart, observant food-loving companion:
- Specific and concise: “You saved this for the crispy edges. Want to make it this week?”
- Curious, not omniscient: “I think this could be close to that bowl you loved. Want to try?”
- Helpful when plans change: “Not feeling char siu tonight? You can still use the pork for these.”
- Comfortable with uncertainty: “I couldn't read the video details, but your link is saved.”
- Warm but never preachy: “That looks delicious” is fine; “you earned this meal” is not.

Avoid repetitive exclamation points, relentlessly cute food puns, “AI-powered” self-congratulation, lengthy auto-generated rationales and compliance language.

---

## 21. How to use this document with Claude Code

**Step 1:** Inspect the active worktree/branch, any uncommitted changes, and recent Claude branches. Do not assume \`main\` contains the latest WIP. Do not reset, overwrite or rebase unsaved work.

**Step 2:** Read this, \`PRODUCT_BLUEPRINT.md\`, \`CLAUDE.md\`, and \`docs/TOOLKIT.md\`. Use \`docs/NOURI_EXECUTION_HANDOFF.md\` as the immediate task brief.

**Step 3:** Audit the running product against J1–J7 and the acceptance gates. Be decisive: separate visual problems from broken data/flow problems.

**Step 4:** Choose a practical architecture and complete the first vertical slice. Favor measurable user outcomes over breadth. Ask for no unnecessary clarifications when the brief already defines a sensible default; record remaining judgment calls.

**Step 5:** Validate the real application on mobile and document what is done vs not yet real. Don't claim “production ready” solely because static pages render.

**The ultimate benchmark:** *On an ordinary Tuesday, would the user actually open Nouri instead of spending ten minutes thinking about dinner—and feel better about what they ate?*
