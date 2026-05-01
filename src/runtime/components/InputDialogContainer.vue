<template>
  <Teleport
    to="body"
    :disabled="!teleport"
  >
    <InputDialog
      v-if="currentDialog"
      :model-value="currentDialog.visible"
      :type="currentDialog.type"
      :title="currentDialog.title"
      :message="currentDialog.message"
      :fields="currentDialog.fields"
      :initial-values="currentDialog.initialValues"
      :warning-text="currentDialog.warningText"
      :confirm-text="currentDialog.confirmText"
      :cancel-text="currentDialog.cancelText"
      :buttons="currentDialog.buttons"
      :close-on-backdrop-click="closeOnBackdropClick"
      :escape-to-cancel="escapeToCancel"
      :theme="effectiveTheme"
      @confirm="onConfirm"
      @cancel="onCancel"
      @action="onAction"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import InputDialog from './InputDialog.vue'
import { useInputDialog } from '../composables/useInputDialog'

const props = withDefaults(
  defineProps<{
    /**
     * Render into `document.body` via `<Teleport>` so the overlay always
     * covers the viewport even when the container is mounted inside an
     * ancestor that creates a containing block. Defaults to `true`.
     */
    teleport?: boolean
    /** Click on the dim backdrop cancels the dialog. Defaults to `false`. */
    closeOnBackdropClick?: boolean
    /** Pressing Escape cancels the dialog. Defaults to `true`. */
    escapeToCancel?: boolean
    /**
     * Override the global theme for this container. When set, takes
     * precedence over `useInputDialog().theme`. Defaults to following
     * the global theme (which is `'dark'` until changed via `setTheme`).
     */
    theme?: 'dark' | 'light'
  }>(),
  {
    teleport: true,
    closeOnBackdropClick: false,
    escapeToCancel: true,
    theme: undefined,
  },
)

const { currentDialog, confirm, cancel, action, theme: globalTheme } = useInputDialog()

const effectiveTheme = computed<'dark' | 'light'>(() => props.theme ?? globalTheme.value)

const onConfirm = (values: Record<string, unknown>): void => confirm(values)
const onCancel = (): void => cancel()
const onAction = (name: string, values: Record<string, unknown>): void => action(name, values)
</script>
