# Nouri — product blueprint (v0 → long-term)

## One-sentence product

Nouri turns fleeting food inspiration into enjoyable meals with minimal decision friction, using an accumulating memory of what a person wants, cooks, orders, and actually likes.

## Problem

People frequently want to cook/eat a dish when they can't act (a video at midnight, a memorable restaurant abroad), then forget what inspired them once they are ready to plan groceries, cook dinner, or choose where to eat. Rigid meal planning loses appeal when cravings change. Capturing food photos without connecting them to cooking stages, outcomes, and future choices leaves valuable personal history unused.

## Four jobs-to-be-done

1. **Catch desire:** Save food inspiration in under 15 seconds with the sensory spark intact.
2. **Make a confident choice:** Get a shortlist of appealing, feasible meals without a feed, decision rabbit hole, or rigid schedule.
3. **Execute flexibly:** Maintain a small portfolio of meal options and groceries that can adapt when cravings change.
4. **Learn from eating:** Preserve photographic cooking histories, restaurant/work meals, ratings, and lessons, so food decisions improve over time.

## Metric tree

### Product health: meaningful weekly retention

A retained week is one with at least one meal chosen through Nouri, plan updated, cooking session finished, or meal journaled. A page view alone is not success. Long-term compare W1/W4/W8 retention on cohorts after onboarding.

### Human outcomes: enjoyment & exploration

- **Enjoyment:** Average voluntarily submitted meal rating, with coverage = ratings / recorded meals. Control selection bias (people tend to log unusually good meals).
- **Breadth:** Distinct new dishes and cuisines actually eaten in trailing 28 days. Initially approximate from meal titles and cuisine labels; later use user-confirmed novelty and taxonomy.
- **Explore × enjoy:** Fraction of *novel* meals rated 4–5 stars. Maximizing variety without delight produces novelty chasing.
- **Inspiration conversion:** Captured craving → chosen → cooked/ordered/eaten, in 30 days; identify which inspiration sources lead to great meals.

### Guardrails: effort, spending, well-being

- P50 and P90 time from opening recommendations to choosing; the app should reduce decision paralysis.
- Median time to save an idea, median entry time for journal updates, and time spent planning per week. Aim for shorter, more successful sessions rather than maximizing screen time.
- Food waste and grocery spend over time if user opts into tracking; do **not** infer saving money from fewer grocery items automatically.
- No gamified restrictions, punitive nutrition targets, guilt for missed days, or pressure to log every meal. Optional health/nutrition data should preserve uncertainty and user control.

### Metric caveats

V0 measures shortlist-to-choice inside Nouri, not total time spent thinking or shopping. Meal ratings are self-selected. 'Distinct dishes' can be inflated by inconsistent names. The demo has a tiny sample size and cannot establish causation. Interpret trends directionally, paired with qualitative reflections.

## MVP interaction loop

**Save → Resurface → Choose → Cook/eat → Rate/review → Learn**

The home page should never require a blank prompt. It should show three good candidates with clear why/effort and a graceful 'Not now'. 'This week' is an option set, not binding calendar assignments.

## Data objects

- **Inspiration:** id, source URL/type, title, photo, reason for excitement, cuisine, ingredients, prep estimate, craving strength, createdAt.
- **Dish:** canonical dish identity with relationships to variants, restaurants, and recipe versions (future).
- **Plan option:** inspiration/dish linked to current flexible grocery portfolio.
- **Grocery item:** name, source dishes, pantry status, optional quantity (future), checked.
- **Cook:** date, linked dish/inspiration, chronological steps with photos and notes, final photo, outcome rating, improvement hypotheses.
- **Meal:** what and where eaten, photo, source (home/work/restaurant), rating, salient experience, linked Cook or restaurant discovery.
- **Food taste observations:** inferred claims backed by linked meals and corrections, with confidence and recency (future).
- **Event:** capture, choice, plan, cook, meal, rating; observed timings and metadata, subject to privacy defaults.

## Architecture (evolution)

v0: static PWA, localStorage and IndexedDB, transparent rule-based recommendations, no backend.

v1: signed-in cloud sync, image object storage, Postgres for meals/cooks/dishes, background photo ingestion, semantic retrieval with source-linked evidence, opt-in usage analytics; safe migration from JSON export.

v2: multimodal capture (iOS Share sheet, TikTok links where accessible, photo album import, restaurant receipts/menus), AI dish entity resolution with correction UI; only infer photo-visible facts, clearly label estimates.

v3: personalized ranking system grounded in sensory/taste preferences, time, intent, pantry, recent eating, novelty, prep effort, and enjoyment feedback. Learn which recommendation factors matter through dogfooding.

v4: cost-aware flexible groceries / pantry and ingredient overlap optimizer; household planning; taste-aware optional nourishment metrics. Never pretend photo-only calories/macros are exact.

## Important product hypotheses to test next

- Replaying the original source imagery/clip recovers craving better than a text-only dish card.
- A *portfolio* of 2–4 meals produces lower decision friction and less waste than an assigned 7-day calendar.
- Cooking step photos plus a single post-cook note are sufficient to improve later recipe execution.
- Meals ordered out are a more valuable predictor of cooking preferences than recipes merely bookmarked.
- Reverse engineering a restaurant dish creates bridges between restaurant memory, cook memory, shopping, technique discovery, and taste modeling.

## Scope constraints

Do not build a nutrition tracker, LLM agent, video parser, or meal-delivery integrations before validating weekly use of the core loop. Do not optimize screen time or number of notifications. Prioritize genuine food enjoyment and a tiny capture burden.