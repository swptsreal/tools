# Developer Tools Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Unit Converter, Number Base Converter, and Escape / Unescape as separate offline Developer tools.

**Architecture:** Each tool uses `src/tools/<id>/index.jsx`, `style.css`, `example.js`, registers in `src/tools/registry.js`, follows existing SplitWorkspace/useToolActions/localDraft patterns.

**Tech Stack:** React, Vite, Ant Design, Lucide React, Playwright.

---

## Tasks

- [ ] Add failing E2E tests for all 3 routes.
- [ ] Implement Unit Converter with deterministic unit maps.
- [ ] Implement Number Base Converter with parse/output conversions.
- [ ] Implement Escape / Unescape with mode and direction controls.
- [ ] Move Phase 2 tools from README planned to existing Developer Tools.
- [ ] Run `npm run build` and `npm run test:e2e`.
