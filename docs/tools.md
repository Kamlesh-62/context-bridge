# Tools Reference

## `remember`

Save something to project memory. Only `title` is required — everything else is optional.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | **Yes** | What to remember |
| `content` | string | No | Details (defaults to title if omitted) |
| `type` | string | No | Memory type (default: `note`) |
| `tags` | string[] | No | Tags for search |
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
Saved: Use PostgreSQL for database (decision) -> a1b2c3d4-use-postgresql.md
```

---

## `recall`

Search and retrieve from project memory.

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

Show status, list all memories, or delete one.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | No | `status` (default), `list`, or `delete` |
| `id` | string | No | Memory ID (required for `delete`) |
| `projectRoot` | string | No | Project root path (auto-detected if omitted) |

### Actions

**`status`** (default) — Show project root, memory directory, and count by type.

**`list`** — Show all memories with title, type, tags, and ID.

**`update`** — Edit a memory's title, content, type, or tags. Requires `id`.

**`delete`** — Remove a memory by ID. Get the ID from `recall` or `list`.

### Examples

```
"Show memory status"
"List all memories"
"Update memory a1b2c3d4 with new content: now using port 8080"
"Delete memory a1b2c3d4"
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
    { "id": "...", "type": "decision", "title": "...", "content": "...", "tags": [...] }
  ]
}
```

---

## `import`

Restore memories from a previous export. Duplicates are skipped automatically (matched by title).

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `data` | string | **Yes** | JSON string from a previous export |
| `projectRoot` | string | No | Project root path (auto-detected if omitted) |

### Examples

```
"Import these memories: <paste exported JSON>"
```
