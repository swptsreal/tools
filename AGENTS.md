# Agent Workflow

This project is an offline-first React/Vite toolkit. Keep changes small, fast, and easy to verify.

## TDD

- Start every feature, bug fix, and behavior change with a failing test.
- Prefer Playwright E2E tests for user-visible behavior: routing, rendering, copy/download controls, file input flows, and responsive layout.
- Keep each test focused on one behavior. Test what the user sees or does, not implementation details.
- Run the new test first and confirm it fails for the expected reason before changing production code.
- Write the smallest production change that makes the test pass, then refactor while keeping tests green.
- Add regression tests for every bug fix.

## Playwright

- Use `npm run test:e2e` for browser coverage.
- Tests live in `tests/e2e` and should use stable, user-facing locators where possible.
- Cover the core responsive breakpoints: mobile `390x844`, tablet `768x1024`, desktop `1280x800`.
- Keep tests deterministic and offline. Do not call external services.
- Capture screenshots, video, and traces only on failure unless a debugging task needs more detail.

## Code Quality

- Follow existing project patterns: one tool per folder under `src/tools`, register tools in `src/tools/registry.js`.
- Keep shared behavior in `src/shared` only when at least two tools need it.
- Avoid broad refactors while adding a single tool or fixing a narrow bug.
- Keep components readable, with clear names and minimal state.
- Do not add dependencies unless they remove real complexity or provide proven browser-side behavior.

## UI/UX Standards

- UI should feel light, quick, and calm: minimal chrome, immediate feedback, no unnecessary motion.
- Keep tool pages task-first: header actions, editor/input area, result area.
- Ensure text and controls do not overlap at mobile, tablet, or desktop widths.
- Avoid horizontal page overflow. Panels may scroll internally when content is large.
- Use familiar icons for common actions and concise labels for commands.
- Preserve offline-first behavior: user content stays local, drafts use browser storage, no upload APIs.

## Verification

- Before handing off, run `npm run build` and `npm run test:e2e`.
- If a command cannot run, state the exact blocker and what remains unverified.
