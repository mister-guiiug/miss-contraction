---
name: readme-webapp
description: 'Improve or create a README for a web application project. Use when: writing a README, restructuring docs, improving project documentation, adding badges, table of contents, or getting-started sections for a web app, PWA, SPA, or frontend project.'
argument-hint: 'Optional: language (fr/en), target audience (dev/public), or specific sections to include'
---

# README — Web Application

Skill for writing and restructuring README files for web application projects (PWA, SPA, vanilla JS, framework-based).

## When to Use

- Creating a README from scratch for a web project
- Restructuring or improving an existing README
- Adding missing sections: TOC, stack table, quick-start, deploy steps
- Updating badges, feature tables, or architecture diagrams

## Procedure

### 1. Gather context

Read in parallel:

- `package.json` → project name, scripts, dependencies/devDependencies
- Existing `README.md` (if any) → current language, tone, and content to preserve
- `docs/context.md` or `docs/*.md` (if present) → product context and functional scope
- `vite.config.js` / `next.config.*` / build config → base URL, framework
- `.github/workflows/` → CI/CD pipeline details

### 2. Determine language and audience

- If the existing README or `docs/` is in French, write in French. Otherwise use English.
- Adjust technicality based on audience (developer vs. end-user).

### 3. Apply the standard structure

Use this section order (skip sections that genuinely don't apply):

```
# Project Name
badges
> one-line description (blockquote)
[▶ Live demo link]
---
## Table of Contents
## Features          ← tables grouped by theme
## Tech Stack        ← table: Layer | Technology
## Quick Start       ← prerequisites + bash code block (clone/install/dev/build/preview)
## Debugging         ← editor launch configs if .vscode/ exists
## Tests             ← commands + what is covered
## Repository Structure  ← tree or table
## External API / Proxy  ← if applicable
## Deployment        ← step-by-step for CI/CD
## Privacy / Security    ← data flows, especially for health/medical apps
## Contributing      ← if open to contributions
## License
```

### 4. Feature tables

Group features into themed sub-sections with two-column tables (`| Feature | Description |`) instead of flat bullet lists. Typical groups for web apps: Analysis / Core, Validation, Productivity, Export, Application.

### 5. Badges

Include at minimum:

- CI/CD status badge (GitHub Actions) if a workflow exists
- License badge
- Optional: version, coverage, buy-me-a-coffee, etc.

Format: `[![Label](badge-url)](link-url)`

### 6. Quick Start code block

Always include a single, copy-paste-ready bash block:

```bash
git clone <repo-url>
cd <project>
npm install        # or pnpm / yarn / bun

npm run dev        # → http://localhost:5173
npm run build      # → dist/
npm run preview
```

### 7. Stack table

```markdown
| Layer   | Technology                    |
| ------- | ----------------------------- |
| Build   | Vite 6                        |
| Tests   | Vitest 3                      |
| Runtime | Vanilla JS / React / Vue …    |
| Deploy  | GitHub Actions → GitHub Pages |
```

### 8. Privacy / security note

For apps handling personal or medical data, add a **Confidentialité / Privacy** section that clearly describes:

- What is processed locally vs. sent over the network
- What external services receive user data and under what conditions

### 9. Validate

Before finalising:

- [ ] All internal links (`docs/context.md`, `.github/workflows/…`) resolve to real files
- [ ] Code blocks use correct language identifiers (`bash`, `js`, etc.)
- [ ] Anchor links in TOC match actual heading text (GitHub-flavored markdown slugs)
- [ ] No duplicate sections
- [ ] Language is consistent throughout

## Reference: GitHub Markdown anchor rules

GitHub slugifies headings: lowercase, spaces → `-`, accented chars kept, punctuation removed.  
Example: `## Démarrage rapide` → `#démarrage-rapide`

## Anti-patterns

- Flat bullet list for all features (use themed tables instead)
- Missing Quick Start (most common omission)
- Live URL buried at the bottom (put it near the top)
- Mixing languages in the same README
- Generic placeholders left unfilled (`<your-repo>`, `TODO`)
