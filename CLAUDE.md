# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git & GitHub

**Remote:** `https://github.com/dylsonn/recipebook` (public, branch: `main`)

After every meaningful change, commit and push:
```bash
git add <files>
git commit -m "short description of what changed and why"
git push
```

To revert to a previous state:
```bash
git log --oneline          # find the commit to revert to
git revert <commit-sha>    # creates a new undo commit (safe)
# or to reset the working tree to a specific commit:
git checkout <commit-sha> -- <file>
```

## Running the app

Open `index.html` directly in a browser — no build step, no server required. All three files must stay in the same directory so the relative `href`/`src` references resolve.

## Architecture

This is a single-page vanilla JS app with no dependencies or build tooling.

**File roles:**
- `index.html` — static markup only; defines the three view containers (`#view-list`, `#view-detail`, `#view-form`) that are shown/hidden by JS
- `styles.css` — all visual styling including CSS custom properties (design tokens in `:root`), layout, and per-category color classes (`cat-breakfast`, `cat-dinner`, etc.)
- `script.js` — all application logic

**How views work:** Only one `div.view` has the `active` class at a time. `showView(id)` strips `active` from all views and adds it to the target. The three entry points are `showList()`, `showDetail(id)`, and `showForm(id)`.

**Data layer:** Recipes are stored as a JSON array in `localStorage` under the key `recipebook_v1`. `load()` reads and parses it; `save(data)` serializes and writes it. Each recipe object has: `id`, `name`, `category`, `servings`, `prep`, `cook`, `difficulty`, `desc`, `notes`, `ingredients` (string[]), `steps` (string[]), `createdAt`, `updatedAt`.

**Dynamic form fields:** Ingredients and steps are rendered as DOM rows by `addIngredient(val)` and `addStep(val)`. On save, `querySelectorAll` harvests their current values — there is no JS-side array tracking them.

**XSS:** All user content rendered into innerHTML is passed through `esc()`, which escapes `&`, `<`, and `>`.
