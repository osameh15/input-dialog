# Design decisions

The major choices behind the module, and why each was picked over the obvious alternatives.

## Why no Vuetify dependency?

The original input dialog this module is descended from used Vuetify's `v-dialog`, `v-card`, `v-btn`, `v-text-field`, `v-textarea`, `v-select`, `v-autocomplete`, `v-form`, `v-icon`, plus the MDI icon font. Three problems with shipping that as a library:

1. **Hard peer dependency on Vuetify.** Every consumer would need Vuetify installed and registered.
2. **Larger bundle.** Vuetify components for a single dialog is overkill — `v-text-field` alone pulls in label-state machinery, density modifiers, prepend/append slots, and theming hooks the dialog doesn't use.
3. **Style coupling.** Vuetify's theme system and CSS variables would need to be respected.

The library uses plain HTML form controls (`<input>`, `<textarea>`) and a custom dropdown component for `select` / `autocomplete`. The visual contract — gradient, border colors, top icon-circle with half-arc decoration, sizing, animation — is preserved exactly.

**Trade-off:** the library can't reuse Vuetify's theme variables. For a single-component module this is acceptable.

## Why a custom dropdown instead of `<select>`?

Native `<select>` was considered. Three reasons it's wrong here:

1. **Styling.** Cross-browser, the native dropdown is a security-critical OS widget — you can't reliably style its options, only the closed input. The dialog's design needs a dark, gradient-themed dropdown, which native `<select>` cannot provide.
2. **Autocomplete with create-new.** Native `<select>` and `<datalist>` don't support a "Create new" item with custom formatting + `+` icon + "New" badge. That's the whole point of the autocomplete field.
3. **Search filtering.** Native `<datalist>` filters via prefix-only matching across all browsers. The custom dropdown supports substring search, which is what users expect.

The custom `_DropdownPicker.vue` is small (~150 lines of script + 100 lines of CSS) and handles both modes — `select` (with `allowCreate: false`) and `autocomplete` (with `allowCreate: true`).

## Why a single shared dropdown component?

Could have been two components: `_Select.vue` and `_Autocomplete.vue`. The differences between them are tiny — autocomplete has an `<input>` for typing and shows a "Create" item; select has a static label and no "Create" item.

Rather than maintain two near-duplicate components, one component branches on the `allowCreate` prop. Less code, single source of truth for dropdown styling, keyboard nav, click-outside, etc. The `_` prefix marks it as internal — it's not in the module's public component registry.

## Why module-level state (not Pinia, not provide/inject)?

Same answer as the toast and confirm-dialog libraries:

1. **Cross-Vue-app state sharing.** With module-level refs, the auto-mount plugin's separate Vue app sees the same `currentDialog.value` as the consumer's main app.
2. **Zero-config for consumers.** No need to install Pinia, no provider wrapping, no plugin registration.
3. **Simpler API surface.**

**Trade-off:** the state is global. A second `dialog.show()` call cancels the first.

## Why is the dialog single-instance (not a queue)?

Input dialogs **block the user** — they need to fill in fields. Stacking would create a confusing pile-up where the user can't see what they're submitting.

If you need multiple inputs sequentially:

```ts
const name = await dialog.promptText('Step 1', 'Name')
if (!name) return
const email = await dialog.promptText('Step 2', 'Email')
if (!email) return
```

If you need *all* the inputs together, that's exactly what `promptForm` is for — pass an array of fields and they all live in one dialog.

## Why `show()` always resolves (never rejects)?

The original `useInputDialog` rejected the promise on cancel. That forces every consumer into try/catch, which doesn't compose well with sequential prompts:

```ts
// Original — awkward
try {
  const result = await dialog.show({...})
  doStuff(result)
} catch {
  // user cancelled — but real errors get swallowed too
}
```

The library's `show()` always resolves with `{ action, values }`. Convenience methods always resolve with the value or `null`:

```ts
// New — natural async/await flow
const name = await dialog.promptText('Rename', 'Name')
if (name === null) return  // cancelled
await api.rename(name)

// or for show()
const { action, values } = await dialog.show({...})
if (action === 'cancel') return
if (action === 'confirm') doStuff(values)
if (action === 'save_draft') saveDraft(values)
```

Real errors come from the consumer's own code (network failures, etc.) and propagate normally. The dialog itself never rejects.

## Why convenience methods return primitives, not `{ action, values }`?

`promptText` could have returned `{ action: 'confirm' | 'cancel', value: string }` like `show()`. Two reasons it doesn't:

1. **Single value → single return.** The method asks for one piece of input. Forcing the caller to destructure `{ value }` from a wrapper object adds boilerplate without information.
2. **`null` is a clean cancel marker.** For string/number/object outputs, `null` is unambiguous — no real value can collide with it. The check is `if (result === null) return`.

For the multi-field `promptForm`, the contract is `Record<string, unknown> | null` — same pattern: `null` on cancel, full values object on confirm.

## Why is `createNew` a union type, not just a boolean?

The original Vuetify implementation hard-coded the "trailing slash for paths" behavior with a heuristic (`if (field.itemIcon === 'mdi-folder' || field.key === 'path')`). That's fragile — it only works if you happen to use those specific values.

The new design makes the formatting **explicit** through the `createNew` option:

```ts
createNew?: false | 'path' | ((rawValue: string) => string)
```

- `false` (default) — disable creation
- `'path'` — built-in trailing-slash formatter (the most common case)
- function — full custom control

This is a small API surface that covers the common cases without surprises. If we later need more presets, we can add string literals (`'kebab'`, `'snake'`, etc.) without breaking existing code.

## Why are validation rules synchronous?

Async rules (e.g., "check if username is available on the server") would create UX hazards:

- Showing/hiding a spinner per field
- Debouncing every keystroke
- Handling race conditions when the user types while a check is in flight
- Deciding whether submit waits for all checks to finish

All of those are real concerns, but they're better handled at the application level — after the dialog confirms — rather than inside the dialog. The dialog focuses on **format validation** (required, length, regex), which is fast and synchronous.

If you need server-side validation:

```ts
const values = await dialog.promptForm('Sign up', [...syncRules])
if (!values) return
const exists = await api.checkUsername(values.username)
if (exists) {
  toast.error('Username taken', 'Please pick another.')
  return // or re-open the dialog
}
await api.signup(values)
```

## Why Inter via Google Fonts but Shabnam bundled?

Same answer as the toast and confirm-dialog libraries:

- **Inter** — ubiquitous; many apps already load it; bundling would be wasted bytes when the consumer already has it; CDN caching helps cross-site.
- **Shabnam** — uncommon; bundling guarantees correct rendering offline; gated by `unicode-range` so English-only apps incur zero font download.

## Why woff2 only?

Browser support for woff2 is universal in modern browsers (Chrome 36+, Firefox 39+, Safari 12+). For a 2026 library targeting Nuxt 3.13+ / Nuxt 4 — which themselves require modern browsers — woff2 is enough. Adding woff fallbacks would roughly double the bundle weight.

## Why support Nuxt 3 AND 4 in the peer range?

`compatibility.nuxt: '^3.13.0 || ^4.0.0'`. The module API is identical between 3.13+ and 4.x, so there's no reason to fragment the user base.

Dev dependencies (`nuxt`, `@nuxt/schema`) are pinned to Nuxt 4 because that's what the official module starter uses. The `commander` peer mismatch this caused is documented in `package.json#overrides`.

## Why focus management?

Input dialogs are interruptive. Without explicit focus handling:

- The user clicks "Edit", the dialog appears, but **focus stays on the button** they just clicked. They have to Tab once to reach the first field.
- After they confirm, focus is lost — `<body>` is focused. They have no idea where they were before.

The dialog explicitly:
1. Captures `document.activeElement` before opening
2. Focuses the first input after the dialog renders
3. Restores focus to the captured element on close

This is also the WAI-ARIA expectation for `role="alertdialog"` — focus management is part of the dialog contract.
