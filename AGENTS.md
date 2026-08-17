# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

## Durable visual decisions

- Use stronger display typography: `PORTFOLIO` at weight 800; the manifesto, selected-work, about, and footer display headings at weight 600.
- Keep the opening metadata visible while the light manifesto panel slides upward. Let the incoming panel naturally cover it; do not fade or translate the metadata out early.
- Featured project cards use supplied brand-specific hover artwork instead of the generic `VIEW` cursor. CASE.02 uses the JSC EXP artwork; CASE.03 uses the SONIQ artwork, both preserving source aspect ratio within a 260 x 92 px pointer area.
- Use 20px radii for the desktop navigation shell and manifesto panel top corners. Keep the existing 16px manifesto radius on mobile.
- On desktop, keep the opening `PORTFOLIO` title centered with responsive sizing and 20px minimum side space. Opening metadata begins 40px from the left; mobile keeps its compact edge alignment.
- Case detail overlays reproduce the portfolio PDF from each case's second page onward, excluding each case cover plus the final other-work and back-cover pages. Render every included page at equal width in source order with the same 5px radius as homepage project images.
- The about section includes a circular `点击认识我` CTA beneath the display heading, linking to the full PDF portfolio in a new tab.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
