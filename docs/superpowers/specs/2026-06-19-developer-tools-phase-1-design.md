# Developer Tools Phase 1 Design

## Goal

Build 4 offline-first Developer Tools as separate pages: Regex Tester, Cron Expression Helper, MIME Type Lookup, and URL Parser.

## Scope

- `regex-tester`: regex pattern + flags + text input, highlight matches, show match count/groups, replace preview.
- `cron-expression-helper`: parse 5-field cron expression, show human summary, next 10 run times from current local time.
- `mime-type-lookup`: local extension/MIME lookup table, search either direction, show copyable result.
- `url-parser`: parse URL into protocol, host, port, path, query params, hash; rebuild after edits.

## UX

Each tool follows current tool conventions: one folder under `src/tools`, header actions via `useToolActions`, local draft storage where useful, `SplitWorkspace` for input/result, and no network calls.

## Constraints

- No new dependency.
- Keep parsers small and deterministic.
- Use Playwright tests for user-visible behavior.
- Move completed Phase 1 items from planned README list to existing Developer Tools section.
