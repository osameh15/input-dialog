# Architecture

How the pieces of `nuxt-input-dialog` fit together at runtime.

## File layout

```
src/
├── module.ts                              # Nuxt module entry point
└── runtime/
    ├── components/
    │   ├── InputDialog.vue                # Main dialog: backdrop + card + form
    │   ├── _DropdownPicker.vue            # Custom dropdown (used by select & autocomplete)
    │   └── InputDialogContainer.vue       # Renders the active dialog from state
    ├── composables/
    │   └── useInputDialog.ts              # Public API + module-level state
    ├── assets/
    │   ├── fonts/Shabnam/*.woff2          # Bundled Persian font (5 weights)
    │   └── styles/input-dialog-fonts.css
    └── plugin.client.ts                   # Auto-mount client plugin
```

## Module lifecycle

`module.ts#setup` runs once at build time when a consumer adds `nuxt-input-dialog` to `modules`:

1. Merge user options with defaults.
2. Push runtime config under `runtimeConfig.public.inputDialog`.
3. Register `<InputDialog>` and `<InputDialogContainer>` via `addComponent`.
4. Auto-import `useInputDialog` via `addImports`.
5. If `loadShabnamFont`, push `input-dialog-fonts.css` onto `nuxt.options.css`.
6. If `loadInterFont`, append three `<link>` tags (preconnects + Google Fonts stylesheet) to `nuxt.options.app.head.link`.
7. If `autoMount`, register `runtime/plugin.client.ts`.

## Runtime state model

State lives at module scope in `useInputDialog.ts`:

```ts
const currentDialog = ref<InputDialogInstance | null>(null)
let resolveResult: ((result: InputDialogResult) => void) | null = null
```

By design, only one dialog is active at a time. Calling `show()` while another dialog is open cancels the previous one (its promise resolves with `{ action: 'cancel', values: {} }`) and replaces it.

Both bindings are top-level module exports — every `useInputDialog()` call returns a fresh object whose methods reach into the same shared state. This is what makes the auto-mount plugin's separate Vue app see the same dialog state as the consumer's app.

## Promise resolution flow

```
user code              composable                    container         dialog
─────────────────────────────────────────────────────────────────────────────────
const r =                                                                
  await show()                                                           
            ──→  set currentDialog                                       
                 create promise → save resolveResult                     
                                  ──→  v-if currentDialog renders        
                                       <InputDialog .../>                 
user types in field …                                                     
clicks Submit ──────────────────────────────────────────────→ form validates
                                                              if ok:
                                       ←──  emit('confirm', values)       
                 ←── confirm(values)                                      
                 resolveResult({ action: 'confirm', values })             
                 currentDialog = null                                     
            ←── promise resolves with { action, values }                  
caller's await                                                            
  resumes                                                                 
```

The promise **always resolves** — never rejects. Cancel resolves with `{ action: 'cancel', values: {} }`. Custom action buttons resolve with `{ action: <name>, values: {...} }`.

## Field rendering

`InputDialog.vue` does direct rendering for the simple input types:

| Field type   | Renders                                           |
| ------------ | ------------------------------------------------- |
| `text`       | `<input type="text">`                             |
| `password`   | `<input type="password">`                         |
| `email`      | `<input type="email">`                            |
| `number`     | `<input type="number">`                           |
| `textarea`   | `<textarea>`                                      |
| `select`     | `<DropdownPicker :allow-create="false">`          |
| `autocomplete`| `<DropdownPicker :allow-create="!!createNew">`   |

Both `select` and `autocomplete` use the same internal `_DropdownPicker.vue` — the only difference is whether the `allowCreate` prop is true. When true, the trigger has a `<input>` instead of a static label, the dropdown filters items as you type, and a "Create" item appears at the top when the typed value isn't in the list.

### `_DropdownPicker.vue` — internal dropdown

A standalone, no-Vuetify dropdown:

- `<div role="combobox">` trigger with click + keyboard handlers
- Click-outside closes via a `mousedown` listener on `document`
- Arrow Up/Down navigates the active item, Enter commits, Escape closes
- Keyboard support: ArrowDown / ArrowUp / Enter / Escape
- The "Create" item is computed from the search text, formatted via the field's `createNew` setting:
  - `'path'` → appends a trailing `/` if missing
  - function → calls the function with the raw text
  - `false` → no Create item

The component is "headless-ish" — no library dependency, but enough scoped CSS to match the dialog's dark-gradient look. It receives `formatCreate` from the parent so the same formatter is used for the "Create" suggestion and for committing the value on Enter.

## Validation

```ts
type InputFieldRule = (value: unknown) => true | string
```

Each field has zero or more rules. The dialog tracks per-field errors in a reactive `fieldErrors` map, plus a form-level `formError`.

- **On blur** — the field that just lost focus runs its rules. Errors render below the field with a red color and the input border turns red.
- **On submit** — every field's rules run. If any fail, `formError` is set to a generic message and the form does not emit `confirm`. Field-level errors stay visible.

Rules are not run on every keystroke — only on blur and on submit. This avoids flickering "required" errors while the user is still typing.

## The auto-mount plugin

If `autoMount: true` (default), `plugin.client.ts` runs once on the client and creates a separate Vue app instance rendering `<InputDialogContainer>` into a body-level div:

```ts
const root = document.createElement('div')
root.id = 'nuxt-input-dialog-root'
document.body.appendChild(root)

const app = createApp({
  render: () => h(InputDialogContainer, { ...cfgFromRuntime }),
})
app.mount(root)
```

State syncs across the consumer's app and the auto-mount app because `currentDialog` is a module-level `ref` — both apps import the same singleton.

## Teleport semantics

`<InputDialogContainer>` wraps `<InputDialog>` in `<Teleport to="body" :disabled="!teleport">`. This guarantees the dialog overlay covers the viewport even when the container is mounted inside an ancestor that creates a containing block (any element with `backdrop-filter`, `transform`, `filter`, `perspective`, `will-change`, or `contain`).

The dropdown panel inside `_DropdownPicker.vue` is **not** teleported — it positions itself relative to the trigger via plain CSS (`position: absolute; top: calc(100% + 4px)`). This works because the dialog card has `overflow-y: auto` (so dropdowns scroll with the content) and the panel z-indexes above everything else inside the dialog.

## RTL auto-detection

`InputDialog.vue` computes a per-dialog direction:

```ts
const RTL_SCRIPT = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻾]/
const direction = computed(() => {
  const allText = [
    props.title,
    props.message ?? '',
    props.warningText ?? '',
    ...props.fields.flatMap(f => [f.label, f.placeholder ?? '', f.hint ?? '']),
  ].join(' ')
  return RTL_SCRIPT.test(allText) ? 'rtl' : 'ltr'
})
```

Detection runs across **every text source** the user might see — title, message, warning, and every field's label / placeholder / hint. If any of them contains Arabic / Persian / Urdu script, the whole dialog flips to RTL.

Hebrew is not currently included; if you need it, extend the regex to cover U+0590–05FF.

## Focus management

When a dialog opens:

1. The previously-focused element is captured.
2. Focus moves to the dialog card (`tabindex="-1"`).
3. Focus moves to the **first interactive element** — input, textarea, or dropdown trigger.

When the dialog closes:

4. Focus is restored to the captured previous element.

Tab cycles naturally through fields → buttons. Esc cancels (toggleable via `escapeToCancel`).

## Build pipeline

`@nuxt/module-builder` (which wraps `unbuild`) handles packaging:

- `nuxt-module-build build` — emits `dist/module.mjs`, `dist/module.d.mts`, and copies `runtime/` (compiled `.ts` → `.mjs`, `.vue` files preserved, woff2 / css copied as static assets).
- `nuxt-module-build prepare` — generates type stubs in `.nuxt/`.
- `nuxt-module-build build --stub` — emits a stub `dist/module.mjs` that defers to source files via jiti, used during dev.

Output ends up in `dist/`, which is the only directory shipped to npm.
