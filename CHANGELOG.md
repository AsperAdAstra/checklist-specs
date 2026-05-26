# Changelog

All notable changes to the Checklist Specification will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-05-26

This release supersedes all draft versions (0.x). It introduces breaking changes that require migration from the `done` boolean to the `status` enum. See the migration notes below.

### Added

- `ext` object property on both the root Checklist and individual Items, allowing application-specific extension data without conflicting with future spec fields. Implementations **MUST** preserve unknown `ext` data during round-trips.
- `status` string enum field on Items with four states: `todo`, `in-progress`, `done`, `cancelled`. Defaults to `todo` when omitted.
- `completed` ISO 8601 timestamp field on Items for tracking when an item's status transitioned to `done`.
- `DTSTART` property in the RRULE recurrence subset, defining the anchor date for recurrence calculations.
- `BYMONTH` property in the RRULE recurrence subset, enabling yearly recurrence on specific months (e.g., `FREQ=YEARLY;BYMONTH=3;BYMONTHDAY=15`).
- Global ID uniqueness constraint: all item IDs must be unique across the entire document, including all nesting levels. Implementations **MUST** reject checklists with duplicate IDs.
- Circular dependency validation for the `after` field: self-references, direct cycles, and indirect cycles are all prohibited. Implementations **MUST** detect and reject circular `after` chains.

### Changed

- **BREAKING:** Fields are now **omitted** when empty instead of being set to `null`. This applies to Checklist-level fields (`desc`, `created`, `modified`, `author`, `tags`) and Item-level fields (`due`, `tags`, `assignee`, `notes`, `recur`, `after`, `attach`). Saves approximately 6–10 tokens per omitted field.
- **BREAKING:** The `done` boolean field has been replaced by the `status` string enum. See migration table below.
- The `recur` pattern definition has been updated to support `DTSTART` and `BYMONTH` in addition to the existing RRULE subset properties (`FREQ`, `INTERVAL`, `BYDAY`, `BYMONTHDAY`, `UNTIL`, `COUNT`).
- LLM guidelines updated: omit `status` when it is `todo` (the default), instead of omitting `done: false`.

### Removed

- **BREAKING:** `done` boolean field removed from Items. Use `status` with values `"todo"` or `"done"` instead.

### Migration Guide

| Old (`done` boolean) | New (`status` enum) |
|----------------------|---------------------|
| `done: false` or omitted | `status: "todo"` or omitted |
| `done: true` | `status: "done"` |

**Example — Before (draft):**
```json
{"id": "1", "text": "Task", "done": true}
```

**Example — After (v1.0.0):**
```json
{"id": "1", "text": "Task", "status": "done", "completed": "2024-01-15T09:30:00Z"}
```

**Example — Minimal (status omitted, defaults to `todo`):**
```json
{"id": "1", "text": "Task"}
```

### Fixed

- Resolved inconsistency between README (stating defaults are `null`) and JSON Schema (using `type: "string"`, not nullable). Fields are now consistently described as omitted when empty.

### Security

- (none)

### Deprecated

- (none)

## [0.x.x] - Previous Draft Versions

Draft versions of the Checklist Specification used a `done` boolean field and explicit `null` values for empty fields. These versions are superseded by v1.0.0. No formal changelog was maintained for draft releases.
