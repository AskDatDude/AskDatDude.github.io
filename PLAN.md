# Portfolio v3 — Build Plan

## Current state

The repo is a vanilla HTML/CSS/ES-module site already at v3.0.0. What exists:

| Item | Location | Notes |
|---|---|---|
| Home page | `index.html` | Root-level static HTML |
| Work index | `work/index.html` | Fetches `/projects/index.json` |
| Work detail | `work/project.html` | Fetches `/projects/:slug.md` via `?project=` query param |
| Writing index | `writing/index.html` | Fetches `/diary/index.json` |
| Writing entry | `writing/entry.html` | Fetches `/diary/entries/:slug.md` via `?entry=` query param |
| Tools index | `tools/index.html` | Fetches `/toolbox/index.json` |
| QR tool | `tools/qr-code-generator/` | Standalone HTML app |
| Image converter | `tools/image-converter/` | Standalone HTML app |
| JS modules | `src/modules/*.js` | DOM renderers, data fetchers |
| Styles | `src/styles.css` | Global CSS with design tokens |
| Technologies | `src/data/technologies.json` | Fetched at runtime |
| Project content | `projects/index.json` + `projects/*.md` | Auto-updated by GitHub Actions |
| Writing content | `diary/index.json` + `diary/entries/*.md` | Auto-updated by GitHub Actions |
| Tool content | `toolbox/index.json` | Manual |
| Custom domain | `CNAME` → `rbin.dev` | Root-level file |
| CI: content sync | `.github/workflows/update-diary-index.yml` | Parses MD frontmatter → JSON |
| CI: content sync | `.github/workflows/update-projects-index.yml` | Parses MD frontmatter → JSON |

No build step exists. Files are served directly as-is. No Vite. No Preact. No deploy workflow.

This plan migrates the site to Vite + Preact while keeping all content, all live URLs, and both GitHub Actions content workflows intact.

---

## Stack

| Concern | Choice |
|---|---|
| UI | Preact |
| Build | Vite |
| Components | JSX + TypeScript |
| Styling | Scoped CSS + CSS variables |
| Hosting | GitHub Pages (custom domain: `rbin.dev`) |
| Runtime | Bun |

Runtime deps: `preact`, `preact-iso`.
Dev deps: `vite`, `@preact/preset-vite`.

---

## Phase 0: Stack setup ✅

This phase installs the build toolchain into the existing repo root. Do not scaffold a new subdirectory.

### 0a. Install dependencies ✅

```bash
bun add preact preact-iso
bun add -D vite @preact/preset-vite
```

Do NOT run `bunx create-vite` — that creates a new project subdirectory and conflicts with the existing structure. Install into the existing root.

### 0b. Create `tsconfig.json` at the repo root ✅

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "jsxImportSource": "preact",
    "strict": true
  },
  "include": ["src"]
}
```

### 0c. Create `vite.config.ts` at the repo root ✅

```ts
import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig({
  base: '/',
  plugins: [preact()],
  build: {
    outDir: 'dist',
  },
})
```

`base: '/'` is correct. The site uses a custom domain (`rbin.dev`) via CNAME — custom domain deployments always sit at the root, never a subdirectory. Do not use `/your-repo-name/`.

### 0d. Update `package.json` scripts ✅

Replace the existing `scripts` block:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

Remove the old `dev` and `start` entries pointing to `scripts/dev-server.ts`. The Vite dev server replaces the custom Bun server entirely.

### 0e. Update root `index.html` for Vite ✅

Vite uses the root `index.html` as its entry point. Replace the existing `index.html` body content with:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Robin Niinemets</title>
    <link rel="shortcut icon" type="image/x-icon" href="/assets/LinkedIn Company Profile_1.png">
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

The existing page content (about blurb, featured sections) moves into `src/pages/Home.tsx` in Phase 3.

### 0f. Remove old static HTML pages ✅

These files will be replaced by the Preact SPA. Delete them before Phase 2:

```
work/index.html
work/project.html
writing/index.html
writing/entry.html
tools/index.html
```

Do NOT delete `tools/qr-code-generator/` or `tools/image-converter/` — those are standalone apps that stay (see Phase 1b).

### 0g. Rebuild `src/` ✅

The existing `src/` structure (`modules/`, `prism/`, `data/`, `styles.css`, `main.js`) gets replaced by the Vite + Preact structure. Old folder archived to `_old_src/` for reference during Phase 2.

**New `src/` layout:**

```
src/
├── app.css                  ← global reset + design tokens (ported from styles.css)
├── main.tsx                 ← entry point, mounts <App />
├── App.tsx                  ← root component, routing
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── PageWrapper.tsx
│   └── common/
│       ├── Card.tsx
│       ├── Tag.tsx
│       └── Button.tsx
├── pages/
│   ├── Home.tsx
│   ├── Work.tsx
│   ├── WorkDetail.tsx
│   ├── Writing.tsx
│   ├── WritingDetail.tsx
│   ├── Tools.tsx
│   ├── About.tsx
│   └── NotFound.tsx
├── utils/
│   └── frontmatter.ts       ← port extractFrontmatter() from old diaryViewer.js
└── data/
    └── technologies.json    ← imported at build time, not fetched
```

All page components are stubs — full implementation in Phases 2 and 3.

### 0h. Move static files to `public/` ✅

Vite serves `public/` at the site root. Move:

```
assets/          → public/assets/
CNAME            → public/CNAME
info/robots.txt  → public/robots.txt
```

**The `CNAME` file MUST be at `public/CNAME`.** If it stays at the repo root, Vite's `dist/` output will not include it, and GitHub Pages will lose the custom domain binding on every deploy.

### 0i. Routing with `preact-iso` ✅

Configure routes in `App.tsx`:

```tsx
import { LocationProvider, Router, Route } from 'preact-iso'

export function App() {
  return (
    <LocationProvider>
      <Navbar />
      <Router>
        <Route path="/" component={Home} />
        <Route path="/work" component={Work} />
        <Route path="/work/:slug" component={WorkDetail} />
        <Route path="/writing" component={Writing} />
        <Route path="/writing/:slug" component={WritingDetail} />
        <Route path="/tools" component={Tools} />
        <Route path="/about" component={About} />
        <Route default component={NotFound} />
      </Router>
      <Footer />
    </LocationProvider>
  )
}
```

**URL pattern change:** The old site used query params (`/work/project.html?project=H-T8`). The new site uses clean path params (`/work/H-T8`). Legacy query-param URLs are handled by the `NotFound` component (see 0k).

### 0j. Add a GitHub Actions deploy workflow ✅

**First: change the Pages source setting.**
The repo currently uses GitHub's built-in `pages-build-deployment` workflow, triggered by the **"Deploy from a branch"** source setting. It has no YAML file in the repo — GitHub manages it automatically and just publishes the branch files directly. That works fine with no build step.

Once Vite is added, raw source files can no longer be served directly — only `dist/` can. So before adding the workflow file:

1. Go to **Settings → Pages → Build and deployment → Source**
2. Switch from **"Deploy from a branch"** to **"GitHub Actions"**

This disables the built-in `pages-build-deployment` workflow. Then add the deploy workflow file below, which GitHub will run instead.

The existing content-generation workflows (`update-diary-index.yml`, `update-projects-index.yml`) are unaffected — they are not Pages deploy workflows.

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run build
      - name: Copy index.html to 404.html for SPA routing
        run: cp dist/index.html dist/404.html
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - uses: actions/deploy-pages@v4
        id: deployment
```

The `cp dist/index.html dist/404.html` step is essential for GitHub Pages SPA routing. Any URL that GitHub Pages does not recognize as a real file returns `404.html`. Since `dist/404.html` is the Preact app shell, the router takes over and renders the correct page or redirects as needed.

Do NOT add the `gh-pages` npm package. The Actions workflow above is the correct deploy mechanism.

### 0k. Preserve legacy URL redirects ✅

The old `404.html` contained an inline redirect table for legacy URLs (paths from `v1/v2`, old `diary/`, old `toolbox/`, old `school/answers/` pages). With the SPA approach, this logic moves into the `NotFound` component in `App.tsx`.

The `NotFound` component should:
1. Check `window.location.pathname` against the legacy route table (copy from old `404.html`)
2. Add two new entries for old query-param patterns:
   - `/work/project.html` + `?project=slug` → redirect to `/work/slug`
   - `/writing/entry.html` + `?entry=slug` → redirect to `/writing/slug`
3. If matched, call `window.location.replace(newUrl)`
4. If not matched, render the 404 error UI

Implemented in `src/pages/NotFound.tsx`.

---

## Phase 1: Content migration ✅

Move all content files into `public/` and normalize schemas before building any pages.

### 1a. Move content to `public/` ✅

```
projects/index.json         → public/projects/index.json
projects/*.md               → public/projects/*.md
diary/index.json            → public/writing/index.json
diary/entries/*.md          → public/writing/entries/*.md
diary/entries/assets/       → public/writing/entries/assets/
toolbox/index.json          → public/toolbox/index.json     ← keep path: public/tools/ is occupied
src/data/technologies.json  → src/data/technologies.json    ← stays in src/, imported at build time
```

**Why `toolbox/` stays as `toolbox/`:** `public/tools/` is already occupied by the standalone QR and image converter apps. Renaming toolbox content to `tools/` would create a path collision. Keep the content at `/toolbox/index.json`.

**Why diary becomes `writing/`:** The site's public-facing section is already called "Writing" (`/writing/`). Align the content path.

### 1b. Preserve standalone tool pages ✅

The existing tools are self-contained HTML applications. Move them as-is into `public/`:

```
tools/qr-code-generator/    → public/tools/qr-code-generator/
tools/image-converter/      → public/tools/image-converter/
```

These are NOT Preact pages. Do not rebuild them. The `Tools.tsx` page is only the index that lists and links to them.

### 1c. Update GitHub Actions workflows ✅

After moving content, update both workflow files to use new paths:

**`update-diary-index.yml`** (renamed to "Update Writing Index"):
- Path trigger: `public/writing/entries/*.md`
- Script reads from `public/writing/entries`, writes to `public/writing/index.json`
- Added `featured` field extraction
- Added date sort (descending)
- Upgraded to Node 18, removed unnecessary `npm install` step

**`update-projects-index.yml`** (renamed to "Update Projects Index"):
- Path trigger: `public/projects/*.md`
- Script reads from `public/projects`, writes to `public/projects/index.json`
- Added `summary`, `category`, `status`, `featured` field extraction
- Added date sort (descending)
- Upgraded to Node 18, removed unnecessary `npm install` step

### 1d. Normalize content models ✅

Ran `scripts/normalize-content.ts` which:
1. Added `category`, `status`, `featured` to all 6 project `.md` frontmatter files in `public/projects/`
2. Regenerated `public/projects/index.json` with all fields including `summary` (6 entries, sorted by date)
3. Added `featured: false` to all 29 entries in `public/writing/index.json`
4. Added `platform: "web"`, `status: "active"`, `featured: false` defaults to `public/toolbox/index.json`

### 1e. Frontmatter format ✅

The `.md` files use a custom comment block — not YAML `---`. Format:

```
<!--- metadata
title: My Project
date: 27.12.2024
...
--->
```

This format is parsed by the existing `extractFrontmatter()` function. Port that function to `src/utils/frontmatter.ts`. Do NOT change the frontmatter format in any `.md` file — the GitHub Actions auto-generation workflows parse this exact format.

Done in Phase 0g — `src/utils/frontmatter.ts` created.

### 1f. Content loading patterns ✅

Two distinct patterns — do not mix them:

**Static import** (build-time, bundled — for `technologies.json` only):
```ts
import technologies from '../data/technologies.json'
```
Use this only for `technologies.json` since it lives in `src/data/`.

**Runtime fetch** (for all other content in `public/`):
```ts
const res = await fetch('/projects/index.json')
const projects = await res.json()
```

**Markdown content** (fetched then parsed):
```ts
const res = await fetch(`/projects/${slug}.md`)
const raw = await res.text()
const { metadata, content } = parseFrontmatter(raw)   // from src/utils/frontmatter.ts
const html = renderMarkdown(content)                  // legacy-compatible formatter
```

The legacy-compatible custom formatter is preserved to keep existing writing and project formatting stable. Prism.js is ported from `_old_src/prism/` for code highlighting.

Patterns documented. Implementation in Phase 3.

---

## Phase 2: Foundation components ✅

Build shared components before any pages. Pages assemble components — they do not define them.

### Components built ✅

Each component has a `.tsx` file and a companion `.css` file imported alongside it. All CSS class names match the old site exactly for visual consistency.

1. **`app.css`** ✅ — Full rewrite: global reset, all `:root` tokens, pong loading-screen animation, typography scale, utility classes, `.link-style` underline animation, all `.markdown-*` classes, `.diary-entry` layout, `.search-wrapper`, `.back-to-top`, responsive breakpoints at 768px / 1024px / 1440px.
2. **`PageWrapper`** ✅ — `<main class="main-content"><div class="main">` wrapper. Margins: 10px → 10% → 15% → 20% across breakpoints.
3. **`Navbar`** ✅ — Uses `useLocation()` to detect detail routes (`/work/:slug`, `/writing/:slug`) and conditionally renders the `×` close button (absolutely positioned top-right, rotates on hover). 3-column grid for name / profession / location.
4. **`Footer`** ✅ — Polka-dot background, 3-column grid: version pill (`V3.0.0`), last-updated (`6-10-2025`), social icons (GitHub, LinkedIn, email).
5. **`Card`** ✅ — `variant="project"` → `.big-card-box` (with visible/hidden/loading state classes); `variant="list"` → `.diary-list` (absolute bottom bar for tags + read-time). Accepts `class` prop for caller-driven state management.
6. **`Tag`** ✅ — `<span class="tag">`. Companion `Tag.css` also includes `.tags` wrapper, `.tag-buttons` filter bar, and `.tag-button` (with `.active` state).
7. **`Button`** ✅ — Three exports: `Button` (generic with `.btn--primary/ghost/outline` variants), `LoadMoreButton` (`.load-more-button` style), `LinkButton` (`.button` CTA style with arrow).

Build output after Phase 2: **28 modules, 12.19 kB CSS, 22.26 kB JS** — clean, 0 errors.

---

## Phase 3: Page shells

Build pages in this order. Each one depends on Phase 2 being complete.

1. **`Home.tsx` ✅** — positioning statement, featured projects, latest writing, entry points.
2. **`Work.tsx` ✅** — project index, card list, filter by tag. Fetches `/projects/index.json`.
3. **`WorkDetail.tsx` ✅** — single project case study. Fetches `/projects/:slug.md`, parses custom frontmatter, renders content with the legacy-compatible formatter.
4. **`Writing.tsx` ✅** — writing index, card list, filter by tag and course id. Fetches `/writing/index.json`.
5. **`WritingDetail.tsx` ✅** — single entry. Fetches `/writing/entries/:slug.md`, parses frontmatter, renders markdown.
6. **`Tools.tsx` ✅** — toolbox index, grouped by category. Fetches `/toolbox/index.json`. Links to rebuilt standalone apps at `/tools/qr-code-generator/` and `/tools/image-converter/`.
7. **`About.tsx`** — deferred. Route currently renders the shared header, empty page shell, and footer.

Each page:
- Loads its own data
- Uses only shared components from `components/`
- Has no logic that belongs to another page

---

## Phase 4: Interaction

Only after all pages render correctly with real content:

- Filter and sort on Work index (by tag, date)
- Filter and sort on Writing index (by tag, course ID, date)
- Filter on Tools index (by category, platform)
- Search if needed (client-side, no external dependency)
- Verify all legacy URL redirects in `NotFound` still resolve correctly
- Verify both standalone tools (`/tools/qr-code-generator/`, `/tools/image-converter/`) still work independently

---

## Phase 5: Design

Only after Phase 4 is complete and stable.

- Refine spacing, type scale, and component aesthetics
- Transitions and micro-interactions (port loading screen animation from old site if desired)
- Mobile breakpoint polish
- Accessibility pass: focus states, ARIA labels, color contrast
- Refine Prism syntax highlighting and code-block controls

Keep design work entirely separate from structure work. Do not mix them.

---

## Dependency manifest

| Package | Type | Purpose |
|---|---|---|
| `preact` | runtime | UI rendering + JSX |
| `preact-iso` | runtime | client-side routing |
| `vite` | dev | build tool + dev server |
| `@preact/preset-vite` | dev | Preact JSX transform for Vite |

Total runtime deps: 2. Total dev deps: 2.

Do NOT add `gh-pages` — the GitHub Actions workflow in `0j` handles deployment.

---

## Rules

- Never mix content work and design work in the same session.
- Never build a page before its components exist.
- Never add a dependency without a concrete reason listed here.
- Design only starts in Phase 5. Not before.
- `public/CNAME` must always be present. Never delete it. Vite must include it in every `dist/` build.
- Never change the frontmatter format in `.md` files — the GitHub Actions workflows parse it.
- The standalone tools (`/tools/qr-code-generator/`, `/tools/image-converter/`) stay as plain HTML in `public/`. Do not rebuild them in Preact.
- The `toolbox/index.json` path stays as `/toolbox/index.json`. Do not rename it to `tools/` — that path is occupied by the standalone apps.
- After moving content to `public/`, update both GitHub Actions workflows (see 1c) before pushing.
