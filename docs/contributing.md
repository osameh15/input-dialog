# Contributing

Local dev setup, conventions, and the release workflow.

## Prerequisites

- Node.js **20** or **22** (Nuxt 4 requires 20+, the linter needs 22+ for `Object.groupBy` — CI splits these into separate jobs)
- npm 10+ (ships with Node 20+)
- Git

## First-time setup

```bash
git clone https://github.com/osameh15/input-dialog.git
cd input-dialog
npm install
npm run dev:prepare
```

`dev:prepare` does three things:

1. Stubs `dist/` so the playground can resolve `nuxt-input-dialog` to `src/`.
2. Generates module type stubs into `.nuxt/`.
3. Runs `nuxt prepare playground` — generates the playground's Nuxt typing.

You only need to re-run `dev:prepare` after pulling changes that touch `package.json` deps or `src/module.ts`. Day-to-day dev doesn't need it.

## Project layout

```
.
├── src/
│   ├── module.ts                       # Nuxt module entry
│   └── runtime/
│       ├── components/
│       │   ├── InputDialog.vue         # Main dialog
│       │   ├── _DropdownPicker.vue     # Internal dropdown for select / autocomplete
│       │   └── InputDialogContainer.vue
│       ├── composables/
│       │   └── useInputDialog.ts
│       ├── assets/
│       │   ├── fonts/Shabnam/*.woff2
│       │   └── styles/input-dialog-fonts.css
│       └── plugin.client.ts
├── playground/                         # Runnable Nuxt app for live testing
│   ├── app.vue, nuxt.config.ts
│   ├── layouts/default.vue
│   ├── assets/css/playground.css
│   └── pages/                          # /, /test
├── test/                               # Vitest specs
├── docs/                               # This documentation set
├── .github/workflows/ci.yml
├── eslint.config.mjs
├── vitest.config.ts
├── tsconfig.json
└── package.json
```

## Day-to-day workflow

```bash
npm run dev          # Run the playground at http://localhost:3000

npm test             # Run the full Vitest suite once
npm run test:watch   # Vitest watch mode

npm run lint         # ESLint check
npm run lint:fix     # ESLint check + auto-fix

npm run prepack      # Build the module to dist/ (sanity check before publish)
```

Before opening a PR:

```bash
npm run lint && npm test && npm run prepack
```

## Code conventions

- **TypeScript everywhere.** All `.ts` and `<script setup lang="ts">`.
- **Single quotes, no semis, 2-space indent.** Enforced by `@nuxt/eslint-config` flat preset. Run `npm run lint:fix` if formatting is off.
- **Comments for the *why*, not the *what*.** Self-documenting names beat comments.
- **No `any` without a comment** — `@typescript-eslint/no-explicit-any` is `warn`.

## Testing

Tests live in `test/` and use Vitest + happy-dom + @vue/test-utils.

- `test/useInputDialog.test.ts` — composable: `show`, promise resolution, all 6 convenience methods, `formatCreateNewValue`.
- `test/InputDialog.test.ts` — single-dialog component: every field type, validation flow, RTL detection, custom buttons.
- `test/InputDialogContainer.test.ts` — container: rendering, button-click → state-update flow, Teleport.

When testing the container, prefer the `mountContainer({ ... })` helper which passes `teleport: false` so the rendered DOM stays inside the wrapper.

When adding tests for the composable, **always cancel any in-flight dialog in `beforeEach`** — module-level state persists across tests within a file.

## Adding a new feature

A typical feature touches 4 places:

1. **`src/runtime/...`** — implementation.
2. **`test/...`** — specs.
3. **`README.md`** — feature bullet, options table, API section.
4. **`docs/...`** — design decision (if notable) or architecture update (if structural).

Run the playground to verify visual changes manually:

```bash
npm run dev
# Open http://localhost:3000/test for the comprehensive demo
```

## Release workflow

The library uses semver:

- **patch** (`0.0.x`) — bug fixes, internal-only changes
- **minor** (`0.x.0`) — new features, backwards-compatible
- **major** (`x.0.0`) — breaking changes

```bash
git status
git pull --ff-only
npm run lint && npm test && npm run prepack

# Bump version (creates commit + tag automatically).
npm version patch -m "Release v%s"

# Push commits and tag.
git push origin main --follow-tags

# Publish to npm. The prepublishOnly hook re-runs lint + tests.
npm publish

# If 2FA enabled and using a normal token:
npm publish --otp=<6-digit-code>

# If using a granular token with "Bypass 2FA" enabled:
npm publish    # token in ~/.npmrc — never commit this!
```

Verify:

```bash
npm view nuxt-input-dialog
```

## Filing issues / PRs

- **Bugs** — open at https://github.com/osameh15/input-dialog/issues. Include Nuxt version, browser, and a minimal reproduction.
- **Features** — open an issue first to discuss scope before sending a PR.
- **PRs** — fork → branch → commit → PR. Keep commits focused.

## CI

`.github/workflows/ci.yml` runs on every push and PR against `main`:

- **Lint job** — Node 22 only.
- **Test/build job** — matrix across Node 20 and 22.

A green CI run is required before merging.
