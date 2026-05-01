import { createApp, h } from 'vue'
import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import InputDialogContainer from './components/InputDialogContainer.vue'
import { _setInputDialogTheme } from './composables/useInputDialog'

export default defineNuxtPlugin(() => {
  const cfg = useRuntimeConfig().public.inputDialog as {
    closeOnBackdropClick: boolean
    escapeToCancel: boolean
    theme: 'dark' | 'light'
  }

  _setInputDialogTheme(cfg.theme)

  const root = document.createElement('div')
  root.id = 'nuxt-input-dialog-root'
  document.body.appendChild(root)

  const app = createApp({
    render: () => h(InputDialogContainer, {
      closeOnBackdropClick: cfg.closeOnBackdropClick,
      escapeToCancel: cfg.escapeToCancel,
    }),
  })
  app.mount(root)
})
