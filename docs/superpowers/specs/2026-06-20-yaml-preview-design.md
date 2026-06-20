# YAML Preview Design

## Goal

Replace the simple YAML Formatter tool with a richer YAML Preview tool. The new tool keeps formatter behavior as toolbar actions while making preview the primary workflow.

## Scope

- Add a new `yaml-preview` tool under `src/tools/yaml-preview`.
- Register `YAML Preview` in `src/tools/registry.js`.
- Remove `YAML Formatter` from the visible tool registry and README listing.
- Prefer deleting the old `src/tools/yaml-formatter` folder during implementation unless tests or imports still depend on it.
- Keep all behavior offline-first. No upload APIs and no external network calls.

## Primary Behavior

The tool uses a custom two-panel grid, not `SplitWorkspace`:

- Left panel: YAML editor.
- Right panel: live preview output.
- Toolbar: file and transformation actions.
- Auto preview: enabled by default, with a toolbar toggle so large YAML files can be previewed manually.

Preview behavior is hybrid:

- If input is OpenAPI/Swagger YAML, render Swagger UI documentation.
- Otherwise, render a generic collapsible YAML tree.
- If parsing fails, show a clear YAML error in the preview panel.

## Toolbar Actions

Toolbar actions live in the existing tool function bar via `useToolActions`:

- `Open`: read `.yaml`, `.yml`, or `.txt` locally.
- `Preview`: manually refresh preview.
- `Format`: format editor content using selected indent.
- `Minify`: compact YAML while preserving valid YAML.
- `Validate`: parse YAML and show success/error feedback.
- `Copy`: copy formatted/preview source text, preferring current editor content after transformations.
- `Download`: download current YAML as `preview.yaml` or `formatted.yaml` depending on action state.
- `Example`: restore example YAML.
- `Auto preview`: toggle debounced live preview on/off.

Indent control stays in the left workspace toolbar:

- `2 spaces`
- `4 spaces`

## OpenAPI Preview

OpenAPI detection:

- Object has `openapi` or `swagger` top-level key.
- Object has `paths` top-level key.

Swagger-like preview sections:

- Title, version, description from `info`.
- Server list from `servers` or Swagger `host`/`basePath`.
- Tags grouped by tag name when available.
- Path and method cards for `get`, `post`, `put`, `patch`, `delete`, `options`, `head`, `trace`.
- Operation summary, description, operationId, tags.
- Parameters grouped by location: path, query, header, cookie.
- Request body content types and schema summaries.
- Responses by status code with description and schema summaries.
- Components/schemas panel with collapsible schema summaries.

Explicit exclusions:

- `Try it out` remains available for OpenAPI preview.
- Requests are initiated only by explicit user interaction inside Swagger UI.
- No upload APIs.
- No external schema dereferencing unless Swagger UI supports it from user-provided spec data.

## Generic YAML Tree Preview

For non-OpenAPI YAML:

- Render objects and arrays as nested collapsible rows.
- Show scalar values inline.
- Preserve key names and value types.
- Handle empty objects, empty arrays, null, booleans, numbers, and strings clearly.
- Keep large nested content scrollable inside the preview panel.

## UX Requirements

- Tool page remains task-first and calm.
- No horizontal page overflow at mobile `390x844`, tablet `768x1024`, desktop `1280x800`.
- Preview panel scrolls internally for long content.
- Error state replaces preview content and does not break layout.
- Formatting is an explicit toolbar option, not the main page purpose.

## Testing Plan

Start implementation with failing Playwright tests:

1. OpenAPI YAML renders Swagger-like title, server, endpoint method, and response status.
2. Generic YAML renders a nested tree with user-visible keys and values.
3. `Format` updates editor content and keeps preview valid.
4. `Auto preview` can be disabled and manual `Preview` refreshes output.
5. Mobile, tablet, and desktop viewports avoid horizontal overflow.

Run targeted E2E first and confirm expected failure before production changes. Before handoff, run:

- `npm run build`
- `npm run test:e2e`

## Risks

- `swagger-ui-react` adds bundle weight, but matches the requested Swagger Editor-style OpenAPI experience better than a custom renderer.
- YAML anchors, aliases, and complex custom tags may parse but preview as plain resolved values depending on the existing `yaml` package behavior.
- External `$ref` URLs are intentionally not resolved to preserve offline-first behavior.
