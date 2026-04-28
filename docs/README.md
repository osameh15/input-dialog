# Documentation

Technical reference for `nuxt-input-dialog`.

The main [README](../README.md) covers installation, options, and the public API. The pages here go deeper for users and contributors who need to understand how the module is built or want to customize it beyond the basics.

## Contents

| Doc | What's in it |
| --- | --- |
| [Architecture](./architecture.md) | How the module, runtime composable, dialog component, custom dropdown, and auto-mount plugin fit together. State sharing across Vue app instances. Promise resolution flow. Field rendering. Teleport. RTL detection. |
| [Customization](./customization.md) | Override styles, replace fonts, theme per-type, custom animations, manual mounting, validation patterns, accessibility, localized labels. |
| [Design decisions](./design-decisions.md) | Q&A on the major choices — no Vuetify, custom dropdown vs `<select>`, single-instance state, always-resolve Promise API, Teleport, auto-RTL, `createNew` API shape, font strategy. |
| [Contributing](./contributing.md) | Local dev setup, testing, conventions, release workflow. |
