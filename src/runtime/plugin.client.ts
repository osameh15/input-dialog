import { createApp, h } from 'vue'
import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import InputDialogContainer from './components/InputDialogContainer.vue'

export default defineNuxtPlugin(() => {
  const cfg = useRuntimeConfig().public.inputDialog as {
    closeOnBackdropClick: boolean
    escapeToCancel: boolean
  }

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
