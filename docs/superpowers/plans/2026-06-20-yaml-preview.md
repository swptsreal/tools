# YAML Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace YAML Formatter with YAML Preview: hybrid Swagger UI OpenAPI docs plus generic YAML tree, formatter as toolbar actions.

**Architecture:** Build a new `src/tools/yaml-preview` tool using `useToolActions`, local draft, `yaml` parser, and `swagger-ui-react`. Keep renderer hybrid: Swagger UI for API specs, collapsible tree for other YAML.

**Tech Stack:** React, Vite, Ant Design, Playwright, `yaml`, `swagger-ui-react`, existing shared components/utilities.

---

## Files

- Create `src/tools/yaml-preview/index.jsx`: editor state, parsing, toolbar actions, OpenAPI/tree renderers.
- Create `src/tools/yaml-preview/style.css`: preview layout, method badges, tree rows, responsive overflow rules.
- Create `src/tools/yaml-preview/example.js`: OpenAPI sample YAML.
- Modify `src/tools/registry.js`: replace `yaml-formatter` entry with `yaml-preview`.
- Modify `README.md`: replace YAML Formatter listing with YAML Preview.
- Modify `tests/e2e/app.spec.js`: replace YAML Formatter test with YAML Preview behavior tests.
- Delete `src/tools/yaml-formatter/*`: old tool no longer visible or needed.

## Tasks

### Task 1: Write failing YAML Preview E2E tests

- [ ] Replace old YAML Formatter E2E test with tests for OpenAPI preview, generic YAML tree, format action, auto-preview/manual preview, and responsive overflow.
- [ ] Run `npm run test:e2e -- --grep "YAML Preview"`.
- [ ] Expected: fail because `/tools/yaml-preview` and `YAML Preview` do not exist.

### Task 2: Add YAML Preview tool shell

- [ ] Create `src/tools/yaml-preview/example.js`, `index.jsx`, and `style.css`.
- [ ] Register tool in `src/tools/registry.js` as `YAML Preview`.
- [ ] Run targeted E2E again.
- [ ] Expected: tests progress from missing page to renderer/action assertions.

### Task 3: Implement hybrid preview behavior

- [ ] Add YAML parse helpers, OpenAPI detection, OpenAPI docs renderer, and generic YAML tree renderer.
- [ ] Add debounced auto-preview and manual `Preview` behavior.
- [ ] Run targeted E2E.
- [ ] Expected: preview tests pass.

### Task 4: Move formatter into toolbar actions

- [ ] Add `Format`, `Minify`, `Validate`, `Copy`, `Download`, `Open`, `Example`, `Auto preview`, and indent controls.
- [ ] Run targeted E2E.
- [ ] Expected: format/manual preview tests pass.

### Task 5: Remove old formatter and update docs

- [ ] Remove `yaml-formatter` registry entry and files.
- [ ] Update README tool list.
- [ ] Run `npm run build`.
- [ ] Run `npm run test:e2e`.
