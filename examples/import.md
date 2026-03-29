# import — Restore memories from a backup

## Import from exported JSON

```
"Import these memories: { \"version\": 1, \"memories\": [...] }"
```

## Import from a teammate's export

```
"Import the memories from project-brain-backup.json"
```

## Duplicates are skipped

If a memory with the same title already exists, it won't be imported again. Safe to run multiple times.
