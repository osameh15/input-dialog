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
      @confirm="onConfirm"
      @cancel="onCancel"
      @action="onAction"
    />
  </Teleport>
</template>

<script setup lang="ts">
import InputDialog from './InputDialog.vue'
import { useInputDialog } from '../composables/useInputDialog'

withDefaults(
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
  }>(),
  {
    teleport: true,
    closeOnBackdropClick: false,
    escapeToCancel: true,
  },
)

const { currentDialog, confirm, cancel, action } = useInputDialog()

const onConfirm = (values: Record<string, unknown>): void => confirm(values)
const onCancel = (): void => cancel()
const onAction = (name: string, values: Record<string, unknown>): void => action(name, values)
</script>
