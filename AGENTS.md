# Windows PowerShell file editing rule

When editing or creating `.jsx`, `.tsx`, `.js`, `.ts`, `.css`, `.html`, or any file that may contain `${...}`, template literals, braces, quotes, or multiline content on Windows PowerShell:

- Do not use PowerShell heredoc / here-string to write the file.
- Do not use `echo`, `cat <<EOF`, `Set-Content @"..."@`, or inline PowerShell strings for large code blocks.
- Instead, create a temporary Python script that writes the target file using `Path.write_text(...)`.
- Run the Python script with `python script_name.py`.
- Delete the temporary Python script after writing the file.

Reason: PowerShell can interpret `${...}` inside expandable strings, which breaks JSX/template literal content.

```powershell
@'
from pathlib import Path

target = Path("src/pages/Home.jsx")

target.parent.mkdir(parents=True, exist_ok=True)

content = r'''PASTE_FULL_JSX_HERE'''

target.write_text(content, encoding="utf-8", newline="\n")
'@ | Set-Content -Encoding UTF8 codex_write_file.py

python codex_write_file.py

Remove-Item codex_write_file.py
```

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
