# Portfolio v3 plan

## Problem
The current portfolio has too much old structure baked into it. For v3, the content should stay, but the repo layout, page structure, shared modules, and most of the existing UI should be treated as disposable. This needs to become a clean rebuild, not a remix.

## Goal
Keep the existing content and rebuild everything else from the ground up.

## What stays
- Written content
- Project content
- Diary / report content
- Toolbox content
- Images and other media
- Any reusable factual data

## What goes
- Old page layout
- Old module structure
- One-off page logic
- Mixed-purpose homepage sections
- Anything that exists only because of the old architecture

## Approach
Treat v3 as a content extraction and rebuild project.

1. Keep the content, inventory it, and decide where each piece belongs.
2. Define a smaller and clearer page set.
3. Define the new content models.
4. Build a new repo structure around those models.
5. Rebuild the pages in the correct order.
6. Only after the structure is stable, start design work.

## Target page set
- **Home / landing**: short positioning, featured work, and clear entry points.
- **Work index**: focused list of project work only.
- **Project detail pages**: case-study style project pages.
- **Writing index**: reports, notes, and learning logs.
- **Writing detail pages**: markdown-driven content pages.
- **Tools index**: utility collection.
- **Tool detail pages**: only if a tool actually needs a dedicated page.
- **About / contact**: minimal profile and contact info.

## Reduced page set
These are the only page groups v3 should keep as first-class homes:

| Area | New home | Old content source |
| --- | --- | --- |
| Landing | `/` | current homepage content, trimmed down |
| Work | `/work/` | `projects/index.json` + existing project markdown |
| Work detail | `/work/project.html` | `projects/*.md` |
| Writing | `/writing/` | `diary/index.json` + diary entries |
| Writing detail | `/writing/entry.html` | `diary/entries/*.md` |
| Tools | `/tools/` | `toolbox/index.json` + tool metadata |
| Tool detail | `/tools/*/` only if needed | current toolbox subpages |
| About / contact | `/about/` or a section on `/` | profile content only |

Anything outside this list should be treated as legacy and routed or folded into one of these homes.

## Repo structure direction
- Separate **content** from **presentation**.
- Keep raw content in dedicated folders or data files.
- Keep page shells simple and page-specific.
- Shared logic should be minimal and intentional.
- Old structure should not dictate the new structure.

## Content model
The site should be driven by a small set of content types:

| Type | Purpose | Source |
| --- | --- | --- |
| Profile | Landing/about copy and contact identity | single profile record |
| Project | Project cards and project case studies | `projects/index.json` + `projects/*.md` |
| Writing entry | Writing index cards and long-form entries | `diary/index.json` + `diary/entries/*.md` |
| Tool | Toolbox cards and tool pages | `toolbox/index.json` + optional tool content |
| Technology | Skills / stack display | `src/data/technologies.json` or a new normalized equivalent |

### Profile
- name
- role
- location
- short bio
- focus areas
- links

### Project
- id
- slug
- title
- subtitle
- summary
- date
- category
- tags
- hero image
- screenshots
- stack
- links
- outcomes
- status
- featured flag

### Writing entry
- id
- slug
- title
- date
- week / course context
- summary
- tags
- body
- attachments
- reading time
- featured flag

### Tool
- id
- slug
- title
- description
- category
- tags
- icon
- link
- platform
- status
- featured flag

### Technology
- name
- category
- level
- link
- icon
- description

### Shared rules
- Keep front-matter or JSON metadata consistent across all content types.
- Keep slugs stable so redirects can survive future moves.
- Treat cards as summaries; keep full details in the detail pages.
- Separate presentation data from content data.

## Feature priorities
### MVP
- Clean homepage with one clear message.
- Projects index and project detail structure.
- Writing index and writing detail structure.
- Toolbox index.
- Shared navigation and footer.
- Consistent metadata and responsive behavior.

### Next
- Better archive/filter behavior.
- Stronger case-study layout for projects.
- Better markdown rendering for writing.
- Clearer contact/about section.

### Later
- Timeline or progress view.
- Metrics/highlights.
- Theme variants.
- Motion and polish after structure is settled.

## Concrete build plan
This is the order for removing the old structure and building the new one:

### Phase 1: foundation
- Keep the legacy redirects.
- Create the new route folders and page shells.
- Build the shared page frame only once.
- Keep header, footer, loading state, and back-to-top minimal.

### Phase 2: content plumbing
- Normalize the surviving JSON and markdown content.
- Load projects from `projects/index.json` and `projects/*.md`.
- Load writing from `diary/index.json` and `diary/entries/*.md`.
- Load tools from `toolbox/index.json`.
- Load technologies from one normalized source.

### Phase 3: page rendering
- Render the landing page from the new content model.
- Render work, writing, and tools indexes as clean card lists.
- Render project and writing detail pages from content data.
- Keep page logic specific to its own content type.

### Phase 4: interaction
- Add search, filter, and sort behavior where it matters.
- Add tag/category archives only after the core pages render correctly.
- Keep redirect behavior working for all old paths.

### Phase 5: cleanup
- Remove old page-specific layout that no longer belongs in v3.
- Delete or retire modules that only supported the old structure.
- Keep only reusable content data and the new route shells.

## Build order
1. Audit and extract the content that will survive the rebuild.
2. Finalize the reduced page set.
3. Define the new repo structure.
4. Set up legacy URL redirects to new routes.
5. Build the new page shells.
6. Rebuild project, writing, and toolbox data flows.
7. Add filtering, sorting, and archive behavior.
8. Add accessibility and responsive fixes.
9. Start design work only after the structure is stable.

## Progress
- Legacy URL redirects are in place.
- New canonical route folders exist for work, writing, and tools.
- Content model is now defined at the type level.
- Build phases are now concrete.
- Foundation shells are in place.
- Content plumbing is complete.
- Markdown asset paths are normalized for writing pages.
- The image converter now mounts its full UI from the module.
- Writing assets are migrated into the root asset tree.
- Legacy redirects are centralized in `404.html`.
- Old redirect stub pages and the legacy redirect module are removed.
- Next step: audit remaining stale links and prune any leftover legacy-only modules.

## Notes
- This should feel like a fresh portfolio with migrated content, not a refactor of the old one.
- Keep page responsibilities narrow.
- If a page or module is not needed in v3, remove it from the plan instead of carrying it forward.
