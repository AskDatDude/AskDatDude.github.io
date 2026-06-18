<!--- metadata
id: 009
title: DPM - Dumb Packet Manager
subtitle: Infrastructure project course
date: 12.05.2026
url: /work/project.html?project=dpm
image: /assets/projects/dpm/dpm.webp
imageAlt: DPM cover image
summary: DPM is a limited-scope production level tool for reproducible lab and CTF environment setup. It installs curated tools and profiles through a Go CLI, Rust TUI, signed remote index, and project website. My work focused on project management, presentations, website work, adapter internals, tests, CLI work, sync-index, and search.
tags: ["Go", "Rust", "CLI", "TUI", "Infrastructure", "Testing"]
creators: Ilja Ylikangas, Robin Niinemets, Henry Isakoff
duration: About 4 months
tools: ["Go", "Rust", "Ratatui", "Ansible-style profiles", "GitHub Actions", "Shell", "dpm.fi"]
buttons: [{"text": "DPM Website", "url": "https://dpm.fi/"}, {"text": "GitHub Repository", "url": "https://github.com/ilpakka/dpm"}]
category: infrastructure
type: academic
status: complete
featured: false
--->

# DPM - Dumb Packet Manager

DPM is a tool for reproducible lab environments. The idea is simple: when a course, CTF, workshop, or team needs the same tooling on multiple machines, setup should not be the hard part. Instead of giving students a long manual install list, DPM lets them install a single tool or apply a curated profile.

This was part of our larger infrastructure project course. The course ran through the spring, and our team worked on DPM for about 4 months. Unlike the hackathon projects, this was limited-scope production level work. We did not try to replace `apt`, Homebrew, `pip`, `cargo`, or every package manager. We built a narrow layer above them for repeatable security tooling.

The GitHub contributor history is not fully reliable because the project moved from an internal Git repository to GitHub midway through development. My contribution is better described by ownership areas: project management, presentations, website work, `internal/adapter`, tests, `cmd/dpm`, `sync-index`, and search.

![DPM TUI screenshot](/assets/projects/dpm/tui-screenshot.jpg)

---

### Problem

Tool setup wastes time at the start of technical work. In labs and CTF events, the first hour can disappear into package names, missing dependencies, version mismatches, wrong platforms, and different user environments.

DPM was built for that exact gap:

- students need course tools installed quickly,
- instructors need repeatable setup across a class,
- CTF learners need to try tool sets without permanently filling their machine,
- and small teams need consistent tooling without writing custom setup notes every time.

The project goal was not broad package management. The goal was controlled, repeatable setup for curated environments.

### Product Scope

DPM supports a focused set of workflows:

- install one curated tool,
- apply a profile that installs multiple tools,
- search tools and profiles,
- inspect entries before installing,
- refresh a signed remote index,
- list and remove DPM-managed installs,
- run a temporary Bubble environment,
- manage selected dotfiles,
- and use either the CLI or the TUI.

That scope was important. A full package manager is too large for a course project and too risky to build badly. DPM works because it accepts its limits: curated catalog, known install methods, explicit metadata, and a clear warning that it is not a replacement for the system package manager.

### My Role

I worked across both coordination and implementation.

On the coordination side, I helped with project management and presentations. That meant keeping the work explainable: what problem we were solving, what we were not solving, what should be shown in demos, and how to present the project as a useful tool instead of just a codebase.

On the implementation side, my main areas were:

- **Website:** project-facing communication around what DPM is, how to install it, and why it exists.
- **`internal/adapter`:** the internal interface between DPM's engine and platform-specific behavior, including install bundles, dotfiles, PATH handling, temp directories, and platform detection.
- **Tests:** coverage around core behavior so the project could be changed without guessing.
- **`cmd/dpm`:** CLI work, command wiring, user-facing commands, version/help behavior, and integration with the engine.
- **`cmd/sync-index`:** tooling for syncing the community profile index and writing a snapshot for releases.
- **Search:** ranking tools, profiles, dotfiles, and community entries with exact, prefix, contains, and trigram-style matching.

Because the project had production-level goals, the work had to stay more disciplined than a normal school prototype. We still had course constraints, but the code needed to be understandable, testable, and safe enough to install real tools on real machines.

### Architecture

DPM is split into a Go backend/CLI and a Rust TUI.

The Go side handles the package-management logic:

- catalog loading,
- profile loading,
- install method resolution,
- external package manager calls,
- metadata and lockfile state,
- remote index refresh,
- search,
- verification,
- restore/uninstall behavior,
- and the main CLI command surface.

The Rust side provides the terminal UI. The TUI gives users a browsable interface for tools, profiles, installed packages, settings, doctor checks, and Bubble controls.

The catalog is YAML based. Tools can use different install methods, including system package managers, direct HTTP downloads, GitHub releases, web release indexes, `pip`, and `cargo`. Profiles group tools together so a course or event can define a repeatable toolkit.

The adapter layer was important because DPM needs to operate across real systems. It cannot assume every install is just a file copy. The adapter boundary keeps platform behavior in one place: install directories, symlinks, PATH checks, backups, dotfile application, temp directories, and platform reporting.

### Implementation Details

The search flow was designed to be forgiving without becoming mysterious. Exact matches rank highest, then prefix matches, then contains matches, then trigram similarity. That makes searches like `nmap`, `wire`, or partial profile names feel natural in the TUI and CLI.

The index sync work exists because the catalog and profiles should be updateable without shipping a new DPM binary every time. `sync-index` can fetch community profile data, validate it, and write a snapshot for release use. Later release work added signed remote indexes, which fits the same design direction: update metadata, but keep trust boundaries clear.

The CLI work in `cmd/dpm` tied the product together. DPM supports normal commands like install, remove, update, list, search, inspect, verify, apply, config, restore, uninstall, bubble, and doctor. The CLI and TUI needed to expose the same product idea: make setup repeatable, inspectable, and recoverable.

Testing mattered because installers are easy to break. The repository includes tests for installers, engine behavior, metadata, profile behavior, manifest handling, version resolution, Bubble behavior, and server behavior. This was one of the signs that the project had moved beyond a demo.

### Result

By the end of the course project, DPM had a working public website, install script, Go CLI, Rust TUI, curated tool catalog, course profile support, search, update behavior, Bubble mode, and release workflow.

The most important result was that the product had a clear shape:

- a student can install DPM with one command,
- search or browse available tools,
- install a tool like `nmap`,
- apply a profile like `HT8CTF2026`,
- inspect what DPM knows before installing,
- and use the same flow from CLI or TUI.

That is the difference between a script collection and a product. DPM had a user-facing story, internal boundaries, tests, release paths, and a website that explained the tool.

### Limitations

DPM is intentionally limited.

It does not try to cover every tool in every ecosystem. It depends on catalog quality. Some install paths still rely on system package managers and elevated privileges. Windows is not a primary target; the recommended path is a Linux VM. Bubble mode is temporary DPM state, not a security sandbox.

Those limitations are part of the design. The project is strongest when it stays narrow: repeatable tooling for labs, courses, CTF practice, and small teams.

### What I Learned

This project taught me the difference between building a feature and building a product. A feature can work once. A product needs install paths, errors, docs, tests, update behavior, user expectations, and a clear scope.

I also learned how much value there is in saying no. DPM became better when we stopped treating it like a universal package manager and focused on the smaller problem: reproducible tool setup for controlled environments.

Personally, this project was useful because I worked on both the technical and organizational sides. I had to help shape the message, present progress, build real parts of the system, and keep the work understandable for users who only care about getting their lab tools installed.
