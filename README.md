# Checklist Specification v1.0

[![Validate](https://github.com/AsperAdAstra/checklist-specs/actions/workflows/validate.yml/badge.svg)](https://github.com/AsperAdAstra/checklist-specs/actions/workflows/validate.yml)

A JSON-based format for interoperable, LLM-friendly checklists.

## Quick Start

The smallest valid checklist:

```json
{
  "$spec": "checklist/1.0",
  "id": "1",
  "title": "My Tasks",
  "items": [
    {"id": "1", "text": "Buy groceries"}
  ]
}
```

Only four fields are required: `$spec`, `id`, `title`, and `items`. Everything else is optional and can be omitted to save tokens.

> **Looking for examples?** See the [`examples/`](examples/) directory for minimal, standard, full-featured, and LLM-optimized checklists.

## Goals

1. **Interoperability** — Works across desktop, web, and mobile applications.
2. **LLM Optimization** — Minimal tokens while maintaining clarity.
3. **Full-Featured** — Supports real-world checklist and to-do requirements.
4. **Validation** — Machine-verifiable via JSON Schema.

## Design Decisions

### Abbreviations

The spec uses abbreviated field names to reduce token count in LLM contexts:

| Short Field | Long Equivalent | Rationale |
|-------------|-----------------|-----------|
| `pri` | `priority` | Saves ~5 tokens per item; context is clear from values 1–4 |
| `desc` | `description` | Saves ~7 tokens; unambiguous in a checklist context |
| `status` | `status` | 4-state status (`todo`, `in-progress`, `done`, `cancelled`) replaces boolean `done` |
| `recur` | `recurrence` | Saves ~5 tokens; domain-specific term familiar from iCal |
| `after` | `dependsOn` | Saves ~3 tokens; directionally clear ("after X completes") |
| `attach` | `attachments` | Saves ~4 tokens; common abbreviation |
| `ext` | `extension` | Saves ~5 tokens; reserved for custom/extension data |

### Omission Over Null

All optional fields default to **omitted** (not present in the JSON), not `null`. This keeps serialized output compact:

- **Producers should:** Simply leave optional fields out rather than setting them to `null`.
- **Consumers should:** Treat missing fields as their default values (e.g., missing `status` → `"todo"`, missing `pri` → `3`).

**Example:**
```json
// Preferred (omitted)
{"id": "1", "text": "Task"}

// Avoid (null values waste tokens)
{"id": "1", "text": "Task", "status": null, "pri": null, "due": null}
```

### Why 4-State Status?

The `status` field uses 4 states instead of a boolean `done` field to support real-world workflows:

- `todo` → Not started (default, omitted for token efficiency)
- `in-progress` → Actively being worked on
- `done` → Completed
- `cancelled` → Abandoned (distinct from done; useful for tracking)

This provides better granularity than a simple true/false while still being LLM-friendly.

## File Format

| Property | Value |
|----------|-------|
| Extension | `.checklist.json` or `.json` |
| Encoding | UTF-8 |
| MIME Type | `application/vnd.checklist+json` (preferred) or `application/json` |
| Schema | [`schema.json`](schema.json) (JSON Schema Draft-07) |

## Schema Reference

### Checklist (Root Object)

| Field | Type | Required | Default if omitted | Description |
|-------|------|----------|---------------------|-------------|
| `$spec` | string | ✅ | — | Specification version. Must be `"checklist/1.0"`. |
| `id` | string | ✅ | — | Unique identifier for this checklist. Non-empty. |
| `title` | string | ✅ | — | Human-readable title. Non-empty. |
| `desc` | string | ❌ | *(omitted)* | Description or summary. |
| `created` | string | ❌ | *(omitted)* | Creation timestamp (ISO 8601). |
| `modified` | string | ❌ | *(omitted)* | Last modification timestamp (ISO 8601). |
| `author` | string | ❌ | *(omitted)* | Author name, email, or identifier. |
| `tags` | string[] | ❌ | *(omitted)* | Categorization tags. |
| `items` | Item[] | ✅ | — | Array of checklist items. Must contain ≥ 1 item. |
| `ext` | object | ❌ | *(omitted)* | Extension data for custom fields. |

> **Key constraints** (enforced by the JSON Schema):
> - No additional properties are allowed on any object (`additionalProperties: false`).
> - `id`, `title`, and `text` must be non-empty strings (`minLength: 1`).
> - `items` must contain at least one entry (`minItems: 1`).
> - All item IDs within a checklist must be unique (across all nesting levels).
> - `after` references must point to existing item IDs.
> - No circular `after` dependency chains.

### Item Object

| Field | Type | Required | Default if omitted | Description |
|-------|------|----------|---------------------|-------------|
| `id` | string | ✅ | — | Unique identifier within this checklist. Non-empty. |
| `text` | string | ✅ | — | Item content or description. Non-empty. |
| `status` | string | ❌ | *(omitted)* | Completion status: `todo`, `in-progress`, `done`, `cancelled`. |
| `completed` | boolean | ❌ | *(omitted)* | Derived: `true` when `status` is `done`. |
| `pri` | integer | ❌ | *(omitted)* | Priority: `1` (urgent) → `4` (low). |
| `due` | string | ❌ | *(omitted)* | Due date/time (ISO 8601). |
| `tags` | string[] | ❌ | *(omitted)* | Item-level tags. |
| `assignee` | string | ❌ | *(omitted)* | Assigned person or entity. |
| `notes` | string | ❌ | *(omitted)* | Additional notes or details. |
| `recur` | string | ❌ | *(omitted)* | Recurrence rule (iCal RRULE subset). |
| `after` | string | ❌ | *(omitted)* | ID of an item that must be `done` before this one can start. |
| `attach` | Attachment[] | ❌ | *(omitted)* | File attachments. |
| `items` | Item[] | ❌ | *(omitted)* | Nested sub-items. |
| `ext` | object | ❌ | *(omitted)* | Extension data for custom fields. |

### Attachment Object

| Field | Type | Required | Default if omitted | Description |
|-------|------|----------|---------------------|-------------|
| `name` | string | ✅ | — | Filename or display name. Non-empty. |
| `url` | string | ✅ | — | URL, relative path, or data URI. Non-empty. |
| `type` | string | ❌ | *(omitted)* | MIME type (e.g., `application/pdf`). |

## Field Details

### Priority (`pri`)

| Value | Label | Suggested Display |
|-------|-------|-------------------|
| 1 | Urgent | Red / `!!` |
| 2 | High | Orange / `!` |
| 3 | Normal | Default (no indicator) |
| 4 | Low | Gray / dimmed |

### Status (`status`)

The `status` field replaces the boolean `done` field with a 4-state system:

| Value | Description | Suggested Display |
|-------|-------------|-------------------|
| `todo` | Not yet started (default) | Empty checkbox |
| `in-progress` | Currently being worked on | Checkbox with dash or spinner |
| `done` | Completed | Checked checkbox |
| `cancelled` | Abandoned or no longer needed | Strikethrough or grayed out |

**Omission rule:** When `status` is omitted, consumers should treat it as `todo`. Producers should omit `status: "todo"` to save tokens.

### Completed (`completed`)

The `completed` field is a derived boolean field:

- `completed: true` when `status` is `"done"`
- `completed: false` or omitted when `status` is anything else

This field is provided for compatibility with systems that use a boolean completion flag.

### Extension Data (`ext`)

The `ext` field (at both root and item levels) allows custom extension data:

```json
{
  "$spec": "checklist/1.0",
  "id": "1",
  "title": "My Tasks",
  "ext": {
    "customField": "value",
    "anotherField": 123
  },
  "items": [
    {
      "id": "1",
      "text": "Task with extensions",
      "ext": {
        "estimatedHours": 2,
        "customTag": "important"
      }
    }
  ]
}
```

**Rules:**

- `ext` is an object with no schema enforcement (any key-value pairs allowed).
- Applications should preserve `ext` data during round-trips even if they don't use it.
- Avoid storing large data in `ext` to maintain token efficiency.

### Dates

All date and datetime fields use ISO 8601 format:

| Format | Example | When to use |
|--------|---------|-------------|
| Date only | `2024-01-15` | When time is irrelevant (saves tokens) |
| Date and time (UTC) | `2024-01-15T09:00:00Z` | When time matters |
| Date and time (offset) | `2024-01-15T09:00:00-05:00` | When local timezone matters |

### Recurrence Rules (`recur`)

Uses a subset of the iCal RRULE format. Properties are separated by semicolons.

**Supported properties:**

| Property | Values | Required | Description |
|----------|--------|----------|-------------|
| `FREQ` | `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY` | ✅ | Recurrence frequency |
| `DTSTART` | ISO 8601 date | ❌ | Start date/time for recurrence |
| `INTERVAL` | integer | ❌ | Repeat every N periods (default: 1) |
| `BYDAY` | `MO`, `TU`, `WE`, `TH`, `FR`, `SA`, `SU` | ❌ | Day(s) of week, comma-separated |
| `BYMONTHDAY` | 1–31 | ❌ | Day(s) of month, comma-separated |
| `BYMONTH` | 1–12 | ❌ | Month(s) of year, comma-separated |
| `UNTIL` | ISO 8601 date | ❌ | End date for recurrence |
| `COUNT` | integer | ❌ | Total number of occurrences |

**Examples:**

```
FREQ=DAILY                          # Every day
FREQ=WEEKLY;BYDAY=MO,WE,FR          # Mon, Wed, Fri each week
FREQ=MONTHLY;BYMONTHDAY=1           # 1st of each month
FREQ=WEEKLY;INTERVAL=2              # Every 2 weeks
FREQ=DAILY;COUNT=30                 # Daily for 30 occurrences
FREQ=WEEKLY;UNTIL=2024-12-31        # Weekly until end of year
```

> **Note:** For yearly recurrence on a specific date, use `FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=15` for January 15th annually.

### Dependencies (`after`)

The `after` field creates a dependency between items. The referenced item must have `status: "done"` before this item can be started.

**Rules:**

- The value must be a valid item ID within the same checklist.
- Nested items can reference items at any level (parent, sibling, or elsewhere).
- Circular dependencies are invalid and must be rejected by validators.
- All item IDs within a checklist must be unique (including across nesting levels).

### Nested Items

Items can contain sub-items via the `items` field, creating a parent-child hierarchy.

**Conventions:**

- There is no enforced ID format for nested items. Common patterns include dot notation (`"2.1"`, `"2.2"`) or flat IDs (`"a"`, `"b"`).
- The spec does not define semantics for parent `status` — applications may choose to treat a parent as `done` when all sub-items are `done`, or independently.

### Attachments (`attach`)

The `url` field supports three formats:

| Format | Example | Use case |
|--------|---------|----------|
| HTTP/HTTPS URL | `https://example.com/file.pdf` | Remote resources |
| Relative path | `./attachments/file.pdf` | Local files bundled with the checklist |
| Data URI | `data:image/png;base64,...` | Embedded content (use sparingly — large data URIs hurt token efficiency) |

## LLM Guidelines

### For LLM Producers (Generating Checklists)

1. **Omit default values.** Don't include `"status": "todo"` or `"pri": 3`. Consumers will assume defaults.
2. **Use simple IDs.** Prefer `"1"`, `"2"`, `"3"` over UUIDs. Use dot notation (`"2.1"`) for sub-items only when needed.
3. **Use date-only format.** Write `"2024-01-15"` when time is irrelevant.
4. **Flatten when possible.** Only nest `items` for true parent-child relationships.
5. **Skip empty arrays.** Don't include `"tags": []` or `"items": []`.
6. **Be concise.** Item `text` should be actionable and brief (e.g., `"Fix login bug"` not `"We need to fix the login bug that was reported yesterday"`).
7. **Preserve `ext` data.** When modifying existing checklists, preserve any `ext` fields even if you don't use them.

**Before (verbose — ~150 tokens):**

```json
{
  "$spec": "checklist/1.0",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Sprint Tasks",
  "desc": null,
  "created": null,
  "modified": null,
  "author": null,
  "tags": [],
  "items": [
    {"id": "a1b2c3", "text": "Fix login bug", "status": "todo", "pri": 3, "tags": [], "notes": null, "assignee": null, "due": null, "recur": null, "after": null, "attach": [], "items": [], "ext": null}
  ]
}
```

**After (optimized — ~40 tokens):**

```json
{"$spec":"checklist/1.0","id":"1","title":"Sprint Tasks","items":[{"id":"1","text":"Fix login bug"}]}
```

### For LLM Consumers (Parsing Checklists)

1. **Assume defaults.** Missing `status` → `"todo"`; missing `pri` → `3`.
2. **Handle missing fields.** All optional fields may be absent — never assume they are present.
3. **Validate IDs.** Check that `after` references exist before processing dependencies.
4. **Parse dates flexibly.** Accept both date-only (`2024-01-15`) and full datetime (`2024-01-15T09:00:00Z`) formats.
5. **Treat omitted arrays as empty.** If `tags`, `attach`, or `items` is missing, treat it as `[]`.
6. **Preserve `ext` data.** When modifying checklists, preserve any `ext` fields even if you don't use them.

### Token Efficiency Comparison

| Format | Approx. tokens |
|--------|---------------|
| Minimal Checklist JSON | 60–80 |
| Verbose JSON (all fields) | 120–150 |
| YAML equivalent | 80–100 |
| XML equivalent | 150–200 |

## Examples

### Minimal Valid Checklist

```json
{
  "$spec": "checklist/1.0",
  "id": "1",
  "title": "Quick Tasks",
  "items": [
    {"id": "1", "text": "Buy groceries"},
    {"id": "2", "text": "Call mom"}
  ]
}
```

### Standard Checklist

```json
{
  "$spec": "checklist/1.0",
  "id": "weekly-review",
  "title": "Weekly Review",
  "desc": "End of week review tasks",
  "tags": ["weekly", "review"],
  "items": [
    {"id": "1", "text": "Review completed tasks", "status": "done"},
    {"id": "2", "text": "Plan next week", "pri": 1, "after": "1"},
    {"id": "3", "text": "Update project status", "due": "2024-01-19"},
    {"id": "4", "text": "Send weekly summary", "assignee": "me", "after": "2"}
  ]
}
```

### Full-Featured Checklist

```json
{
  "$spec": "checklist/1.0",
  "id": "proj-001",
  "title": "Project Launch",
  "desc": "Tasks for Q1 product launch",
  "created": "2024-01-01T09:00:00Z",
  "modified": "2024-01-15T14:30:00Z",
  "author": "team@company.com",
  "tags": ["project", "q1", "launch"],
  "items": [
    {
      "id": "1",
      "text": "Finalize requirements",
      "status": "done",
      "pri": 1,
      "assignee": "alice",
      "notes": "Approved by stakeholders on Jan 5"
    },
    {
      "id": "2",
      "text": "Development phase",
      "due": "2024-01-19",
      "after": "1",
      "items": [
        {"id": "2.1", "text": "Backend API", "assignee": "bob"},
        {"id": "2.2", "text": "Frontend UI", "assignee": "carol", "after": "2.1"},
        {"id": "2.3", "text": "Integration testing", "after": "2.2"}
      ]
    },
    {
      "id": "3",
      "text": "Daily standup",
      "recur": "FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR",
      "notes": "9:00 AM team sync"
    },
    {
      "id": "4",
      "text": "Review design docs",
      "attach": [
        {"name": "design-spec.pdf", "url": "https://example.com/design-spec.pdf", "type": "application/pdf"},
        {"name": "wireframes.png", "url": "./assets/wireframes.png", "type": "image/png"}
      ]
    }
  ]
}
```

> See the [`examples/`](examples/) directory for standalone files you can use in tests and implementations.

## Validation

Implementations **SHOULD** validate checklists against the provided [`schema.json`](schema.json) (JSON Schema Draft-07).

### Required Validations

These are enforced by the JSON Schema and must pass for a checklist to be considered valid:

1. `$spec` must equal `"checklist/1.0"`.
2. `id` and `title` must be non-empty strings (`minLength: 1`).
3. `items` must be a non-empty array (`minItems: 1`).
4. Each item must have `id` and `text` as non-empty strings.
5. `pri` must be an integer between 1 and 4 (inclusive).
6. `after` references must point to an item ID that exists within the same checklist.
7. No circular dependencies in `after` chains (e.g., A→B→C→A is invalid).
8. No additional properties on any object (strict schema).

### Optional Validations

1. Dates should be valid ISO 8601 format.
2. `recur` should follow the RRULE subset syntax (enforced by regex in the schema).
3. Attachment URLs should be valid URIs.
4. **ID uniqueness:** All item IDs must be unique across the entire checklist, including across all nesting levels.

### Conformance

An implementation **conforms** to Checklist Specification v1.0 if it:

- Accepts all valid v1.0 checklists without error.
- Applies the documented defaults for omitted optional fields.
- Rejects checklists that fail required validations.
- Does not produce additional properties beyond those defined in this spec.

## Versioning

The `$spec` field indicates the specification version using the format `checklist/MAJOR.MINOR`.

| Change type | Version bump | Example |
|-------------|-------------|---------|
| Backwards-compatible additions | Minor | `checklist/1.0` → `checklist/1.1` |
| Breaking changes | Major | `checklist/1.0` → `checklist/2.0` |

**Implementation guidance:**

- **Reject** checklists with an unknown major version (e.g., a v1.0 parser receiving `checklist/2.0`).
- **Warn** on an unknown minor version (e.g., a v1.0 parser receiving `checklist/1.1`), but process the checklist using known fields only.
- **Ignore** unrecognized fields if processing a newer minor version (forward compatibility).

## MIME Type

| Type | When to use |
|------|-------------|
| `application/vnd.checklist+json` | Preferred — use when the content is specifically a Checklist v1.0 document (e.g., API responses, file associations). |
| `application/json` | Fallback — use when generic JSON handling is required (e.g., web APIs that don't support vendor types). |

## License

This specification is released under [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/) (Public Domain).
