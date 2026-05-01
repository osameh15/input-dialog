import {
  defineNuxtModule,
  addComponent,
  addImports,
  addPlugin,
  createResolver,
} from '@nuxt/kit'

export interface ModuleOptions {
  /** Component name prefix. Defaults to `Input` (so components are `<InputDialog>` and `<InputDialogContainer>`). */
  prefix?: string
  /**
   * Initial visual theme. Can be changed at runtime via
   * `useInputDialog().setTheme(...)`. Defaults to `'dark'`.
   */
  theme?: 'dark' | 'light'
  /**
   * If true, an `<InputDialogContainer>` is mounted automatically on the
   * client and you only need to call `useInputDialog()`. If false, mount
   * `<InputDialogContainer />` yourself somewhere in your app
   * (e.g. `app.vue`). Defaults to `true`.
   */
  autoMount?: boolean
  /**
   * Whether the dialog can be dismissed by clicking the backdrop.
   * Defaults to `false` — dialogs containing form input should be
   * persistent so a misclick doesn't lose typed data.
   */
  closeOnBackdropClick?: boolean
  /** Whether pressing the Escape key cancels the dialog. Defaults to `true`. */
  escapeToCancel?: boolean
  /**
   * Inject bundled Persian "Shabnam" font (5 weights, woff2) via @font-face.
   * Uses unicode-range so the file is only downloaded for documents that
   * actually contain Arabic / Persian script. Defaults to `true`.
   */
  loadShabnamFont?: boolean
  /**
   * Add Inter (Google Fonts) as the modern English UI typeface via a
   * `<link>` in the document head. Set `false` if you self-host fonts
   * or want to avoid the network request. Defaults to `true`.
   */
  loadInterFont?: boolean
}

declare module '@nuxt/schema' {
  interface PublicRuntimeConfig {
    inputDialog: {
      closeOnBackdropClick: boolean
      escapeToCancel: boolean
      theme: 'dark' | 'light'
    }
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-input-dialog',
    configKey: 'inputDialog',
    compatibility: {
      nuxt: '^3.13.0 || ^4.0.0',
    },
  },
  defaults: {
    prefix: 'Input',
    autoMount: true,
    closeOnBackdropClick: false,
    escapeToCancel: true,
    theme: 'dark',
    loadShabnamFont: true,
    loadInterFont: true,
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    nuxt.options.runtimeConfig.public.inputDialog = {
      closeOnBackdropClick: options.closeOnBackdropClick!,
      escapeToCancel: options.escapeToCancel!,
      theme: options.theme!,
    }

    // Theme variables — must always load so var(--input-*) resolves.
    nuxt.options.css = nuxt.options.css || []
    nuxt.options.css.push(resolver.resolve('./runtime/assets/styles/input-dialog-theme.css'))

    addComponent({
      name: `${options.prefix}Dialog`,
      filePath: resolver.resolve('./runtime/components/InputDialog.vue'),
    })
    addComponent({
      name: `${options.prefix}DialogContainer`,
      filePath: resolver.resolve('./runtime/components/InputDialogContainer.vue'),
    })

    addImports({
      name: 'useInputDialog',
      from: resolver.resolve('./runtime/composables/useInputDialog'),
    })

    if (options.loadShabnamFont) {
      nuxt.options.css.push(resolver.resolve('./runtime/assets/styles/input-dialog-fonts.css'))
    }

    if (options.loadInterFont) {
      nuxt.options.app = nuxt.options.app || {}
      nuxt.options.app.head = nuxt.options.app.head || {}
      nuxt.options.app.head.link = nuxt.options.app.head.link || []
      nuxt.options.app.head.link.push(
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com',
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: '',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
        },
      )
    }

    if (options.autoMount) {
      addPlugin({
        src: resolver.resolve('./runtime/plugin.client'),
        mode: 'client',
      })
    }
  },
})
