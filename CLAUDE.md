# Nouri — Claude Code project instructions

## Mission
Build **Nouri**, a deeply personal, mobile-first food companion. Nouri bridges the gap between *being inspired to eat something* and *actually eating it*: catch fleeting cravings (TikTok/video/photo/restaurant/memory), resurface the right options when groceries or a meal decision are due, adapt flexibly as cravings change, and learn from meals at home, at work, and out.

**Desired outcome:** Eat a broader variety of genuinely enjoyable food while making fewer, faster decisions and spending less time managing an app.

## Success criteria and counter-metrics
- Product retention: meaningful weekly usage (choosing, planning, cooking, logging, or reflecting), **not** opens, streaks, or screen time.
- Culinary breadth: distinct new dishes/cuisines actually tried, **not** ideas saved.
- Enjoyment: actual meal ratings plus rating coverage; novel meals rated highly is especially valuable.
- Inspiration conversion: saved craving → eaten within a practical window.
- Guardrails: time-to-choice; time to capture/log; weekly planning overhead; optional food spend and waste; no guilt or burdensome tracking.
- Prefer **3 strong contextual options** over endless feeds; a weekly plan is a portfolio of swappable possibilities, not a rigid calendar.

## Design direction — strongly opinionated
- Mobile-first, exceptionally tactile and fast. The visual center is **beautiful real food imagery and a delightful green-onion mascot**.
- Feel **playful yet elevated**, with gentle asymmetry, curvature, character, editorial taste, and thoughtful restraint. Not bland SaaS, not over-cute, not an over-decorated gamified dashboard. Avoid generic gradients and repeated cards with identical treatments.
- Make navigation and food choices obvious at a glance. Capture should require minimal typing.
- Motion: responsive, interruptible, purposeful; emphasize cooking progress, adding a craving, changing a meal option, small mascot behaviors, and state transitions—not fireworks on every tap.
- Celebrate exploration and deliciousness; never punish skipped days, imperfect meals, or indulgent choices. Avoid shame-based nutrition or growth mechanics.
- Design for iPhone first: safe areas, 44px+ touch targets, readable inputs (avoid iOS zoom), keyboard behavior, scroll, reduced-motion, accessible semantics, large photos, low-latency perceived response.

## Architectural reality
- V0 currently starts as a working **self-contained `index.html` app**, with local browser storage. Respect it as real user data. Do not wipe or rewrite storage format casually; implement export/import or migration before changes that could orphan local records.
- Before a major refactor, inspect actual code, demonstrate working flows, and weigh a framework migration against shipping the next useful dogfood improvement.
- Prefer source-linked, user-correctable AI inferences. A food photo cannot reliably reveal macros, seasoning, oil quantity, temperature, or whether something tasted great. Never invent confidence or precision.
- AI should improve actual meal outcomes, not just dress up generic recommendations. For import from third-party platforms, honor available metadata, access limitations, and attribution.
- Keep secrets off client code, and do not commit credentials. Use env vars and server-side proxying for future API calls.

## Skill routing: choose the right specialist, don't invoke everything
Project-local skills are available under `.claude/skills/`. Read the applicable skill instructions on demand:
- `/frontend-design` — direction-setting and distinctive visual design.
- `/emil-design-eng` — craftsmanship, visual hierarchy, interaction detail, sensible components.
- `/mobile-native` — make the PWA actually feel native on iPhone.
- `/animate` — intentionally implement motion.
- `/review-animations` — rigorous motion audit after implementation.
- `/find-animation-opportunities` — read-only proposals; use selectively.
- `/prototype` — **explicit request only**: several distinct, playable design options.
- `/agent-browser` — inspect actual rendered pages and verify real interactions when the CLI/browser is available.
- Impeccable is being handled in a separate Claude Code session; use it when the installed skill becomes available. **Do not reinstall or overwrite its files.**

## Quality workflow
1. Understand the specific user problem and current application behavior.
2. Make the smallest meaningful implementation that moves a user outcome. For bigger visual shifts, present 2–3 genuinely distinct concepts *before* committing to one.
3. Implement and test complete flows, with empty/loading/error/offline states and accessibility.
4. Run the app, inspect a real mobile viewport, interact with core flows, collect screenshots, and fix visible issues. If a browser is unavailable, say so and don't claim visual verification.
5. Report what changed, what was actually verified, and remaining limitations. Don't claim production-readiness after only a build passing.

### Default dogfood smoke tests
- Save a new inspiration, including its source.
- Retrieve the saved inspiration and choose it for this week.
- Pivot to a different meal and update the grocery list.
- Log a home-cooked meal with steps and finished photos, then rate it.
- Log a restaurant/work meal and confirm Insights update.
- Test tiny-screen layout, touch targets, and keyboard behavior.

## Reference files
- `PRODUCT_BLUEPRINT.md` contains the full product model and metrics.
- `docs/TOOLKIT.md` documents installed and optional design tools.
- Use original user-supplied mascot art when available; do not silently replace it with unrelated stock imagery.

## Build philosophy
A completed feature should reduce mental effort or increase food enjoyment. No unnecessary features, gratuitous dependencies, premature platform abstractions, or long setup rituals. **More delicious, less deciding.**
