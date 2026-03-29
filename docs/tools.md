# Tools Reference

## `remember`

Save something to shared project memory (.ai/memory/). Only `title` is required — everything else is optional.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | **Yes** | What to remember (max 200 chars) |
| `content` | string | No | Details (max 5000 chars, defaults to title if omitted) |
| `type` | string | No | Memory type (default: `note`) |
| `tags` | string[] | No | Tags for search (max 20) |
| `source` | string | No | Who saved this (e.g. `claude`, `codex`, `gemini`) |
| `projectRoot` | string | No | Project root path (auto-detected if omitted) |

### Memory Types

`note`, `decision`, `fact`, `constraint`, `todo`, `architecture`, `glossary`

### Examples

```
"Remember that we use PostgreSQL for the database"
"Remember as a decision: we chose PostgreSQL over MongoDB because our data is relational"
"Remember: API runs on port 3000, tag it as backend"
```

### Output

```
Saved: Use PostgreSQL for database (decision) -> #a1b2
```

---

## `recall`

Search shared project memory (.ai/memory/) accessible by all AI CLIs.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | No | Search keywords (case-insensitive) |
| `tags` | string[] | No | Filter by tags |
| `type` | string | No | Filter by memory type |
| `limit` | number | No | Max results (default: 10, max: 50) |
| `projectRoot` | string | No | Project root path (auto-detected if omitted) |

### Examples

```
"Recall everything about the database"
"What do you recall about our API?"
"Recall all decisions"
```

### Scoring

Results are ranked by relevance:
- **+3 points** per query keyword match (in title or content)
- **+4 points** per matching tag

---

## `memory`

Manage shared project memory. Actions: status, list, update, delete, compact.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | No | `status` (default), `list`, `update`, `delete`, or `compact` |
| `id` | string | No | Memory ID like `#a1b2` (for `update` and `delete`) |
| `title` | string | No | Title — for `update` or `delete`-by-title |
| `content` | string | No | New content (for `update`, max 5000 chars) |
| `type` | string | No | New type (for `update`) |
| `tags` | string[] | No | New tags (for `update`) |
| `projectRoot` | string | No | Project root path (auto-detected if omitted) |

### Actions

**`status`** (default) — Show project root, memory directory, and count by type.

**`list`** — Show all memories with short ID, type, title, and tags.

**`update`** — Edit a memory's title, content, type, or tags. Requires `id`.

**`delete`** — Remove a memory by ID or title. Accepts `id` (e.g. `#a1b2`) or `title`.

**`compact`** — Merge all individual files into a single `.ai/memory.md` file.

### Examples

```
"Show memory status"
"List all memories"
"Update memory #a1b2 with new content: now using port 8080"
"Delete memory #a1b2"
"Delete memory titled Use PostgreSQL"
"Compact memories"
```

---

## `export`

Back up all project memories as JSON.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projectRoot` | string | No | Project root path (auto-detected if omitted) |

### Examples

```
"Export all memories"
```

### Output format

```json
{
  "version": 1,
  "exported": "2024-01-15T10:30:00Z",
  "memories": [
    { "id": "a1b2", "type": "decision", "title": "...", "content": "...", "tags": [...] }
  ]
}
```

---

## `import`

Restore memories from a previous export. Duplicates are skipped automatically (matched by title, including duplicates within the same import payload).

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `data` | string | **Yes** | JSON string from a previous export |
| `projectRoot` | string | No | Project root path (auto-detected if omitted) |

### Examples

```
"Import these memories: <paste exported JSON>"
```
