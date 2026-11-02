# Nouri's design & development toolkit

Updated: 2026-11-02. These are **repository-local Claude Code skills**. Claude discovers `.claude/skills/<name>/SKILL.md` in a new session. They are instructions and workflows; some still require optional CLI/browser dependencies at runtime.

## Installed in this repository
| Skill | Best use for Nouri | Invocation |
| --- | --- | --- |
| `frontend-design` (Anthropic) | Establish visually distinctive layout, type, imagery and page character | `/frontend-design` |
| `emil-design-eng` (Emil Kowalski) | Craft, tap/hover states, visual hierarchy, transitions, component detail | `/emil-design-eng` |
| `mobile-native` (Emil Kowalski) | iPhone safe areas, scrolling, keyboard, touch, viewport, PWA polish | `/mobile-native` |
| `animate` (Emil Kowalski) | Intentional component/mascot/transition motion | `/animate` |
| `review-animations` (Emil Kowalski) | Audit timing, curves, layering, interruption, accessibility | `/review-animations` |
| `find-animation-opportunities` (Emil Kowalski) | Identify valuable motion opportunities before writing animation code | `/find-animation-opportunities` |
| `prototype` (Emil Kowalski) | Compare radically different, genuinely playable UI alternatives | `/prototype` (explicit invocation only) |
| `agent-browser` (Vercel) | Real-browser interactions, snapshots, screenshots, visual QA | `/agent-browser`; requires browser CLI and browser runtime |
| `nouri-ship-check` (local) | Product-outcome and mobile QA before declaring a feature shipped | `/nouri-ship-check` |

**Impeccable:** A separate Claude session is handling its installation. Do not overwrite, rerun, or duplicate it unless its absence is established and the user specifically asks. It complements design/detail QA.

Do **not** invoke all skills on every feature. They can conflict and waste context. Pick 1–2 for design, 1 for motion or mobile, and a verification tool.

## Recommended workflow — use these in sequence only when needed
1. **Decide what to build:** follow `CLAUDE.md` and `PRODUCT_BLUEPRINT.md`. Write a narrow behavioral hypothesis (e.g. saved cravings actually become eaten meals).
2. **Make design direction:** `frontend-design` for a new surface; `emil-design-eng` for existing components. Use `prototype` only when multiple design approaches would teach us something.
3. **Implement:** stay focused, preserve actual app data, maintain accessibility.
4. **Craft and tactile feel:** `mobile-native`; `animate` where motion helps comprehension or delight.
5. **Verify:** `agent-browser` on the rendered app *if runtime is available* and `nouri-ship-check`. Supplement with `review-animations` for animated features. If runtime lacks a browser, report that as an unverified step, not a pass.

### Example prompts
- “Design three distinct, playable layouts for Nouri's flexible weekly food portfolio. Use /prototype. Prioritize real food imagery, quick swaps, and low decision friction; recommend a winner with tradeoffs.”
- “Refine the craving capture flow with /emil-design-eng and /mobile-native. Get a food idea from share → saved in under 15 seconds without a long form. Test on a 390px viewport.”
- “Use /animate to add a delightful, subtle scallion response when a craving is saved. Make it interruptible, accessible, and respectful of reduced motion.”
- “Run /nouri-ship-check on the new grocery planning flow. Include a real browser screenshot and working interactions where possible.”

## Other tools from the prior personal website stack — deliberately deferred
These are **not installed yet**. Install them only when the specific job appears; avoid a giant baseline bundle.

| Tool | Purpose | Why deferred / install when needed |
| --- | --- | --- |
| [Taste Skill](https://github.com/Leonxlnx/taste-skill) | Strong art direction and anti-generic design, including app screens | Heavy auxiliary scripts/assets/library; overlaps with Impeccable + frontend-design. For a dedicated art-direction sprint use `npx skills add https://github.com/Leonxlnx/taste-skill --skill design-taste-frontend` in the repo and review generated files. |
| [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | Design systems, heuristic audits, component/style references | Useful as a **secondary** reference and UX check, not Nouri's art director. Its CLI installs supporting scripts/data: `npx ui-ux-pro-max-cli init --ai claude`. Requires Python 3 for search scripts. |
| [Remotion Agent Skills](https://github.com/remotion-dev/skills) | Video, motion reels, launch video, explainers | Remotion is for composed video, not ordinary button and page transitions. Add when making a launch video or motion story. |
| [Scroll Craft](https://github.com/nateherkai/scroll-craft) | Spatial scrolling and storytelling | A compelling future marketing page or food history narrative, not needed for high-frequency meal decisions. Requires verification of plugin/install method in the intended environment. |
| [Agentation](https://github.com/benjitaylor/agentation) | Point-and-comment UI feedback | Particularly useful after adopting React and having a preview environment; don't add prematurely to current static app. |
| Context7 / Playwright MCP | Up-to-date library docs and browser automation | Add only if real friction emerges. `agent-browser` already provides browser QA workflows. |

## Runtime caveats
- A skill file **does not install** Chrome, the agent-browser CLI, Node packages, Python, runtime APIs, or third-party auth. The browser skill should first check `agent-browser --help`; where supported install CLI per [its official docs](https://github.com/vercel-labs/agent-browser).
- Claude Code **cloud/web/mobile sessions** may have different permissions and runtimes than local Claude Code. Never claim a browser test passed without actually running it.
- Reopen a new Claude session or refresh branch after skills are committed. A running session may still be using an older checkout.
- For tool additions, use reviewable, project-local installs rather than global scripts or opaque hooks; verify dependencies and avoid committing generated binaries/secrets.
- See `docs/third-party` for copied skill licenses. Source repositories: [Anthropic skills](https://github.com/anthropics/skills), [Emil Kowalski skills](https://github.com/emilkowalski/skills), [agent-browser](https://github.com/vercel-labs/agent-browser).

## Rule of thumb
**Use one craft skill to design, one platform skill to validate, and Nouri's actual product metrics to decide if the result is better.** More plugins are not the objective.
