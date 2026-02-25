# Checklist Specification v1.0

A JSON-based format for interoperable, LLM-friendly checklists.

## Goals

1. **Interoperability**: Works across desktop, web, and mobile applications
2. **LLM Optimization**: Minimal tokens while maintaining clarity
3. **Full-Featured**: Supports real-world checklist/todo requirements
4. **Validation**: Machine-verifiable via JSON Schema

## File Format

- **Extension**: `.checklist.json` or `.json`
- **Encoding**: UTF-8
- **MIME Type**: `application/json`

## Schema Reference

### Checklist (Root Object)

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `$spec` | string | Yes | - | Specification version. Must be `"checklist/1.0"` |
| `id` | string | Yes | - | Unique identifier for this checklist |
| `title` | string | Yes | - | Human-readable title |
| `desc` | string | No | `null` | Description or summary |
| `created` | string | No | `null` | Creation timestamp (ISO 8601) |
| `modified` | string | No | `null` | Last modification timestamp (ISO 8601) |
| `author` | string | No | `null` | Author name, email, or identifier |
| `tags` | string[] | No | `[]` | Categorization tags |
| `items` | Item[] | Yes | - | Array of checklist items |

### Item Object

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | Yes | - | Unique identifier within this checklist |
| `text` | string | Yes | - | Item content/description |
| `done` | boolean | No | `false` | Completion status |
| `pri` | integer | No | `3` | Priority: 1 (urgent) to 4 (low) |
| `due` | string | No | `null` | Due date/time (ISO 8601) |
| `tags` | string[] | No | `[]` | Item-level tags |
| `assignee` | string | No | `null` | Assigned person/entity |
| `notes` | string | No | `null` | Additional notes or details |
| `recur` | string | No | `null` | Recurrence rule (iCal RRULE subset) |
| `after` | string | No | `null` | ID of item that must complete first |
| `attach` | Attachment[] | No | `[]` | File attachments |
| `items` | Item[] | No | `[]` | Nested sub-items |

### Attachment Object

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | string | Yes | - | Filename or display name |
| `url` | string | Yes | - | URL, relative path, or data URI |
| `type` | string | No | `null` | MIME type |

## Field Details

### Priority (`pri`)

| Value | Meaning | Suggested Display |
|-------|---------|-------------------|
| 1 | Urgent | Red / !! |
| 2 | High | Orange / ! |
| 3 | Normal | Default (no indicator) |
| 4 | Low | Gray / dim |

### Dates

All dates use ISO 8601 format:
- **Date only**: `2024-01-15`
- **Date and time**: `2024-01-15T09:00:00Z`
- **With timezone**: `2024-01-15T09:00:00-05:00`

Use date-only format when time is not relevant (saves tokens).

### Recurrence Rules (`recur`)

Uses a subset of iCal RRULE format. Properties are separated by semicolons.

**Supported Properties:**

| Property | Values | Description |
|----------|--------|-------------|
| `FREQ` | `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY` | Recurrence frequency (required) |
| `INTERVAL` | integer | Repeat every N periods (default: 1) |
| `BYDAY` | `MO`, `TU`, `WE`, `TH`, `FR`, `SA`, `SU` | Day(s) of week (comma-separated) |
| `BYMONTHDAY` | 1-31 | Day(s) of month (comma-separated) |
| `UNTIL` | ISO 8601 date | End date for recurrence |
| `COUNT` | integer | Number of occurrences |

**Examples:**
```
FREQ=DAILY                          # Every day
FREQ=WEEKLY;BYDAY=MO,WE,FR          # Monday, Wednesday, Friday
FREQ=MONTHLY;BYMONTHDAY=1           # 1st of each month
FREQ=WEEKLY;INTERVAL=2              # Every 2 weeks
FREQ=YEARLY;BYMONTHDAY=15           # Yearly on the 15th
FREQ=DAILY;COUNT=30                 # Daily for 30 days
FREQ=WEEKLY;UNTIL=2024-12-31        # Weekly until end of year
```

### Dependencies (`after`)

The `after` field creates a dependency on another item. The referenced item must be completed before this item can be started.

- Value must be a valid item ID within the same checklist
- Circular dependencies are invalid
- Nested items can reference items at any level

### Attachments (`attach`)

The `url` field supports:
- **HTTP/HTTPS URLs**: `https://example.com/file.pdf`
- **Relative paths**: `./attachments/file.pdf`
- **Data URIs**: `data:image/png;base64,...`

## LLM Guidelines

These guidelines help LLMs produce and consume checklists efficiently.

### For LLM Producers (Generating Checklists)

1. **Omit default values**: Don't include `"done": false` or `"pri": 3`
2. **Use simple IDs**: Prefer `"1"`, `"2"`, `"3"` over UUIDs
3. **Use date-only format**: Use `"2024-01-15"` when time is irrelevant
4. **Flatten when possible**: Only nest items for true parent-child relationships
5. **Skip empty arrays**: Don't include `"tags": []` or `"items": []`
6. **Be concise**: Item text should be actionable and brief

### For LLM Consumers (Parsing Checklists)

1. **Assume defaults**: Missing `done` means `false`, missing `pri` means `3`
2. **Handle missing fields**: All optional fields may be absent
3. **Validate IDs**: Check `after` references exist before processing
4. **Parse dates flexibly**: Accept both date-only and full datetime formats

### Token Efficiency

A minimal checklist uses approximately 60-80 tokens:
```json
{"$spec":"checklist/1.0","id":"1","title":"Tasks","items":[{"id":"1","text":"Do thing"}]}
```

Compared to verbose alternatives:
- XML equivalent: ~150-200 tokens
- YAML equivalent: ~80-100 tokens
- Verbose JSON: ~120-150 tokens

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
    {"id": "1", "text": "Review completed tasks", "done": true},
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
      "done": true,
      "pri": 1,
      "assignee": "alice",
      "notes": "Approved by stakeholders on Jan 5"
    },
    {
      "id": "2",
      "text": "Development phase",
      "due": "2024-02-01",
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

## Validation

Implementations SHOULD validate checklists against the provided JSON Schema (`schema.json`).

### Required Validations

1. `$spec` must equal `"checklist/1.0"`
2. `id` and `title` must be non-empty strings
3. `items` must be a non-empty array
4. Each item must have `id` and `text` as non-empty strings
5. `pri` must be 1, 2, 3, or 4
6. `after` references must exist within the checklist
7. No circular dependencies in `after` chains

### Optional Validations

1. Dates should be valid ISO 8601 format
2. `recur` should follow the RRULE subset syntax
3. Attachment URLs should be valid URIs

## Versioning

The `$spec` field indicates the specification version. Future versions will use:
- `checklist/1.1` for backwards-compatible additions
- `checklist/2.0` for breaking changes

Implementations should reject unknown major versions and warn on unknown minor versions.

## MIME Type Registration

Recommended MIME type: `application/vnd.checklist+json`

Fallback: `application/json`

## License

This specification is released under CC0 1.0 Universal (Public Domain).
