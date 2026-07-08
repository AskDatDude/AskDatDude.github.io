# Testing

The repository uses Deno tasks with Vitest, Testing Library, and JSDOM. Tests
focus on behavior and derive content expectations from repository indexes
instead of hardcoded page counts.

## Commands

```bash
deno task test
deno task test:unit
deno task test:components
deno task test:coverage
deno task test:all
```

`deno task test:all` runs the full test suite, validates local asset references,
and creates a production build. GitHub Pages deployment uses this command and
will stop before deployment if any check fails.

## Test Layers

- `tests/unit/` covers markdown rendering, frontmatter parsing, reading-time
  calculations, Prism integration, filename security, and repository integrity.
- `tests/components/` covers shared components, every application page state,
  filters, sorting, query-string synchronization, detail rendering, error
  handling, QR generation, and image-converter behavior.
- `tests/unit/repository.test.ts` dynamically checks every project, writing
  entry, and toolbox record against its source files. Adding indexed content
  automatically expands this coverage.

## Adding Features

- Add pure logic tests under `tests/unit/`.
- Add rendered interaction tests under `tests/components/`.
- Extend repository-integrity checks when introducing a new indexed content
  type.
- Avoid snapshots for behavior that can be asserted semantically.
