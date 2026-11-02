# Ready-to-use Claude Code instruction for continuing Nouri

Open this codebase in Claude Code, then paste the following:

---

You're building **Nouri**, a highly opinionated mobile-first personal food decision and memory app. The foundational product statement and metric definitions are in `NOURI_PRODUCT_BRIEF.md`. Read that document, `README.md`, and the entire existing implementation before making changes.

**Product promise:** Nouri helps me eat more things I love, discover more things worth loving, and spend less time deciding. This is NOT a calorie tracker or generic recipe app.

**What already works:** A dependency-free local-first PWA prototype with my original scallion mascot, a craving shelf, heuristic recommendations, flexible weekly lineup with groceries, cooking photo steps, a meal journal across home/work/restaurants, ratings, recreation links, and export/import. Preserve functional parity as you improve its architecture. Do not replace a working feature with a mockup. The initial sample dish cards are explicitly illustrative, not real user data.

**Your first milestone: v0.2 with magical, truly low-friction ingestion**, with exceptional mobile UX. Implement in the following sequence:

1. Audit the existing UI, forms, storage and state for correctness and mobile ergonomics. Write tests around core flows and data migrations before major refactors.
2. Make **Save a craving** truly instantaneous: paste a URL or share an image; automatically identify a probable dish and recognizable cover image when a provider and its allowed metadata make this possible. Save the original source URL. If extraction fails, fall back to an editable, fast capture. Never fabricate access to private TikTok/Instagram data; obey provider constraints, and do not pretend browser-side scraping will reliably work.
3. Build a clean, privacy-conscious enrichment boundary for future AI. Text/photo/video information should carry `source`, `inferred_fields`, `confidence`, and `user_overrides` separately. Never overwrite user corrections with new guesses. Protect API keys server-side; add rate limits and enforce data limits. Don't call a language model until there is a user benefit.
4. Make **Today** an excellent decision experience: exactly 3 attractive, visual, varied options, reasons grounded in captured evidence, clear fast/comfort/explore controls, one-tap choose and one-tap "not now". Give a visual cue from the original saved content when available. No generic infinite recommendation feed.
5. Preserve and improve the **Flexible week** flow: swapping meals updates suggested groceries; prefer ingredient overlap and flexibility; avoid pretending the app knows exact quantities it hasn't been given.
6. Preserve the full **Cook → photo timeline → rating/outcome → Journal → Recreate** loop and persistent export/import. Test that user photos survive reloads, swaps and migrations.
7. Instrument meaningful events and simple longitudinal metrics. Distinguish application usage from actual food outcomes. Implement session-based planning time before claiming a weekly planning-time guardrail.
8. Keep visual craft high: reuse the user's supplied green onion artwork; the site should feel like a warm premium food companion. Subtle animation, strong food imagery, tactile buttons, beautiful typography, excellent safe-area handling, accessibility and touch targets. No bloated onboarding.

**Architecture:** Make principled technical decisions. Keeping the prototype local-first for now is acceptable. If migrating to React/Next.js and a synced backend, explain the migration, implement automatic migration/export compatibility, and maintain offline-friendly capture. Do not introduce costly services without a functional reason or expose personal food photos publicly by default.

**Success criteria:** I can save an idea in <10 seconds, get a shortlist in <60 seconds, pivot a grocery plan with one action, capture real cooking/restaurant photos, and later find that memory. The product should retain me because it makes eating better—not because it creates chores.

**Working style:** Execute and test rather than delivering a speculative plan. Create a polished runnable milestone, make sure everything existing still works, and summarize only what's new, what remains unimplemented, and how to dogfood the result. Don't ask me to micromanage trivial implementation choices.

---