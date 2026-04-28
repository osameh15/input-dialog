# Customization

Override styles, fonts, animations, and behavior.

## Where styles live

| Stylesheet | Scope | Loaded by |
| --- | --- | --- |
| `<style scoped>` inside `InputDialog.vue` | Component-scoped (Vue scoped CSS hash) | Bundled with the component |
| `<style scoped>` inside `_DropdownPicker.vue` | Component-scoped | Bundled with the component |
| `runtime/assets/styles/input-dialog-fonts.css` | Global `@font-face` rules for Shabnam | Pushed onto `nuxt.options.css` when `loadShabnamFont: true` |
| Inter via Google Fonts | Global stylesheet `<link>` | Appended to head when `loadInterFont: true` |

## Override pattern 1 — global stylesheet targeting the root

The auto-mounted container lives at `#nuxt-input-dialog-root`. Any global stylesheet (e.g. `assets/css/main.css` registered via `nuxt.config.ts#css`) can target descendants:

```css
/* assets/css/main.css */
#nuxt-input-dialog-root .dialog-card {
  max-width: 600px;
  border-radius: 16px;
}

#nuxt-input-dialog-root .dialog-input {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  background: rgba(0, 0, 0, 0.5);
}

#nuxt-input-dialog-root .dialog-input:focus {
  border-color: #10b981;
}
```

## Override pattern 2 — `:deep()` from a parent

If you mount `<InputDialogContainer />` manually, you can pierce its scope using `:deep()` from the parent component's `<style scoped>`.

## Class reference

| Class | Where | Description |
| --- | --- | --- |
| `.dialog-overlay` | `InputDialog` root | Full-viewport dim backdrop |
| `.dialog-card` | inside `.dialog-overlay` | The dialog card itself |
| `.dialog-{type}` | on `.dialog-card` | One of `dialog-success`, `dialog-warning`, `dialog-error`, `dialog-info` |
| `.dialog-icon-circle` | inside `.dialog-card` | Decorative top icon-circle |
| `.dialog-body` | inside `.dialog-card` | Padding wrapper |
| `.dialog-title` | the `<h3>` | |
| `.dialog-message` | the `<p>` | Optional message |
| `.dialog-fields` | form wrapper | Vertical stack of fields |
| `.dialog-field` | each field | |
| `.dialog-field.has-error` | each field | Set when validation fails |
| `.dialog-field-label` | the `<label>` | |
| `.dialog-input` | inputs + textarea | Base input style |
| `.dialog-textarea` | textarea | Adds `resize: vertical` |
| `.dialog-field-hint` | the hint `<p>` | |
| `.dialog-field-error` | the per-field error message | |
| `.dialog-form-error` | form-level error after failed submit | |
| `.dialog-warning-text` | optional yellow emphasis line | |
| `.dialog-actions` | grid containing buttons | |
| `.actions-{n}` | grid column count | `actions-1`, `actions-2`, `actions-3` |
| `.dialog-btn` + `.dialog-btn-flat` / `.dialog-btn-outlined` | each button | |
| `.dialog-btn-{color}` | flat buttons | success / warning / error / info / default |

The dropdown picker uses `.dd-*` classes (`.dd-trigger`, `.dd-panel`, `.dd-item`, `.dd-create-icon`, `.dd-create-badge`, etc.).

The card sets `[dir='rtl']` when text is RTL — use `.dialog-card[dir='rtl'] .your-rule` for direction-specific tweaks.

## Theming per type

```css
#nuxt-input-dialog-root .dialog-success      { border-color: #10b981; }
#nuxt-input-dialog-root .dialog-warning      { border-color: #f59e0b; }
#nuxt-input-dialog-root .dialog-error        { border-color: #ef4444; }
#nuxt-input-dialog-root .dialog-info         { border-color: #3b82f6; }

#nuxt-input-dialog-root .dialog-icon-success::before { border-color: #10b981; }
/* ... etc */
```

## Custom animations

Two transitions:

- `dialog-fade` on the overlay (opacity)
- `dialog-pop` on the card (scale + translateY + opacity, with overshoot)

Override globally:

```css
#nuxt-input-dialog-root .dialog-pop-enter-from {
  transform: translateY(-24px);
  opacity: 0;
}
#nuxt-input-dialog-root .dialog-pop-enter-active {
  transition: transform 0.25s ease, opacity 0.2s ease;
}
```

## Validation patterns

A few useful rule shapes:

```ts
// Required (string non-empty)
v => (typeof v === 'string' && v.length > 0) || 'Required'

// Length constraint
v => String(v).length >= 8 || 'At least 8 characters'

// Regex
v => /^[a-z0-9_]+$/.test(String(v)) || 'Only lowercase letters, numbers, and underscores'

// Range
v => Number(v) >= 1 && Number(v) <= 100 || 'Must be between 1 and 100'

// Async-like (synchronous check against an in-memory list)
v => !existingUsernames.includes(String(v)) || 'Username already taken'

// Compose with helper functions
const required = (msg = 'Required') => (v: unknown) =>
  (v !== null && v !== undefined && String(v).length > 0) || msg

const minLength = (n: number, msg?: string) => (v: unknown) =>
  String(v ?? '').length >= n || msg || `At least ${n} characters`

field.rules = [required(), minLength(3)]
```

For **truly async** validation (e.g. server-side username check), do it after the dialog confirms instead of inside a rule — rules are synchronous.

## Font replacement

### Disable the bundled fonts

```ts
// nuxt.config.ts
inputDialog: {
  loadShabnamFont: false,
  loadInterFont: false,
}
```

### Replace with your own

```css
/* assets/css/main.css */
@font-face {
  font-family: 'Vazirmatn';
  src: url('/fonts/Vazirmatn.woff2') format('woff2');
  font-weight: 100 900;
  font-display: swap;
}

#nuxt-input-dialog-root .dialog-card,
#nuxt-input-dialog-root .dialog-title,
#nuxt-input-dialog-root .dialog-message,
#nuxt-input-dialog-root .dialog-input,
#nuxt-input-dialog-root .dialog-warning-text {
  font-family: 'Vazirmatn', system-ui, sans-serif;
}
```

## Backdrop and Esc behavior

Default is **persistent** — clicking the backdrop does nothing, only a button click or Esc dismisses it. This matches industry convention and avoids losing typed input from a misclick.

```ts
// nuxt.config.ts (global)
inputDialog: {
  closeOnBackdropClick: true,
  escapeToCancel: false,
}
```

```vue
<!-- per container -->
<InputDialogContainer
  :close-on-backdrop-click="true"
  :escape-to-cancel="false"
/>
```

## Manual mounting

```ts
// nuxt.config.ts
inputDialog: { autoMount: false }
```

```vue
<!-- app.vue or a layout -->
<template>
  <NuxtLayout><NuxtPage /></NuxtLayout>
  <InputDialogContainer />
</template>
```

Only one dialog can be active at a time — the state is global. Multiple containers all show the same dialog. Useful for split layouts where you want the dialog rendered into a specific subtree.

## Accessibility

- The card has `role="alertdialog"`, `aria-modal="true"`, `aria-labelledby` (pointing at the title).
- Each field's `<label>` has a matching `for` referencing the field's `id` (auto-generated).
- Focus moves to the first interactive element on open, restored on close.
- Esc cancels by default. Disable with `escapeToCancel: false`.
- The dropdown picker uses `role="combobox"` + `aria-expanded` + `aria-haspopup="listbox"`, with `role="option"` and `aria-selected` on items.

## Localized labels

`title`, `message`, `warningText`, button `text`, and per-field `label` / `placeholder` / `hint` are all plain strings — feed them through your i18n layer:

```ts
const { t } = useI18n()
const dialog = useInputDialog()

const result = await dialog.show({
  title: t('user.edit.title'),
  fields: [
    { key: 'name', type: 'text', label: t('user.edit.name'), rules: [v => !!v || t('common.required')] },
  ],
  confirmText: t('common.save'),
  cancelText: t('common.cancel'),
})
```

Auto-RTL detection picks up the script of the rendered text whether it comes from i18n or hardcoded strings.
