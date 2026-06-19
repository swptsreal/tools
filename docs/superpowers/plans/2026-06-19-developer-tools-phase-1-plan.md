# Developer Tools Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build separate offline tools for Regex Tester, Cron Expression Helper, MIME Type Lookup, and URL Parser.

**Architecture:** Each tool lives in `src/tools/<id>` with `index.jsx`, `style.css`, and `example.js`, then registers in `src/tools/registry.js` under group `Developer`. Use existing `SplitWorkspace`, `FormatterOutput`, `useToolActions`, local draft utilities, copy/download helpers, and deterministic browser-only logic.

**Tech Stack:** React 19, Vite, Ant Design, Lucide React, Playwright E2E.

---

## Tasks

### Task 1: Regex Tester

**Files:**
- Create: `src/tools/regex-tester/index.jsx`
- Create: `src/tools/regex-tester/style.css`
- Create: `src/tools/regex-tester/example.js`
- Modify: `src/tools/registry.js`
- Test: `tests/e2e/app.spec.js`

- [ ] Write failing E2E test for `/tools/regex-tester` that enters pattern `(user)@(example)\.com`, flags `gi`, sample text, clicks `Test Regex`, then expects `2 matches`, `user`, and replace preview.
- [ ] Run: `npm run test:e2e -- tests/e2e/app.spec.js --grep "regex tester"`. Expected fail: heading not found.
- [ ] Implement Regex Tester with pattern, flags, test text, replacement, match list, groups, highlighted output, copy/download/example.
- [ ] Run same test. Expected pass.

### Task 2: Cron Expression Helper

**Files:**
- Create: `src/tools/cron-expression-helper/index.jsx`
- Create: `src/tools/cron-expression-helper/style.css`
- Create: `src/tools/cron-expression-helper/example.js`
- Modify: `src/tools/registry.js`
- Test: `tests/e2e/app.spec.js`

- [ ] Write failing E2E test for `/tools/cron-expression-helper` with `*/15 9-17 * * 1-5`, expecting weekday/work-hour summary and 10 next runs.
- [ ] Run: `npm run test:e2e -- tests/e2e/app.spec.js --grep "cron expression helper"`. Expected fail: heading not found.
- [ ] Implement 5-field cron parser supporting `*`, `*/n`, comma lists, ranges, and single numbers; compute next 10 local datetimes by minute scan.
- [ ] Run same test. Expected pass.

### Task 3: MIME Type Lookup

**Files:**
- Create: `src/tools/mime-type-lookup/index.jsx`
- Create: `src/tools/mime-type-lookup/style.css`
- Create: `src/tools/mime-type-lookup/example.js`
- Modify: `src/tools/registry.js`
- Test: `tests/e2e/app.spec.js`

- [ ] Write failing E2E test for `/tools/mime-type-lookup` searching `json`, expecting `.json`, `application/json`, and `JavaScript Object Notation`.
- [ ] Run: `npm run test:e2e -- tests/e2e/app.spec.js --grep "mime type lookup"`. Expected fail: heading not found.
- [ ] Implement local lookup table and search by extension, MIME, or label.
- [ ] Run same test. Expected pass.

### Task 4: URL Parser

**Files:**
- Create: `src/tools/url-parser/index.jsx`
- Create: `src/tools/url-parser/style.css`
- Create: `src/tools/url-parser/example.js`
- Modify: `src/tools/registry.js`
- Test: `tests/e2e/app.spec.js`

- [ ] Write failing E2E test for `/tools/url-parser` parsing `https://example.com:8080/docs?q=tools&lang=vi#intro`, expecting protocol, host, port, path, query params, hash, and rebuilt URL.
- [ ] Run: `npm run test:e2e -- tests/e2e/app.spec.js --grep "url parser"`. Expected fail: heading not found.
- [ ] Implement URL parse and rebuild using browser `URL`, with query table display.
- [ ] Run same test. Expected pass.

### Task 5: Docs and Full Verification

**Files:**
- Modify: `README.md`

- [ ] Move Phase 1 tools from `Tools Sẽ Có > Developer Tools` to new `Tools Hiện Có > Developer Tools` section.
- [ ] Run: `npm run build`. Expected pass.
- [ ] Run: `npm run test:e2e`. Expected pass.

## Self-Review

- Scope covers exactly approved Phase 1 tools.
- No new dependency.
- Every tool starts with failing E2E test.
- README updates completed planned items.
