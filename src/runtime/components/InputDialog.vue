<template>
  <transition name="dialog-fade">
    <div
      v-if="isVisible"
      class="dialog-overlay"
      role="presentation"
      @mousedown.self="onBackdropClick"
    >
      <transition name="dialog-pop">
        <div
          v-if="isVisible"
          ref="cardRef"
          :class="['dialog-card', `dialog-${type}`]"
          :dir="direction"
          role="alertdialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          tabindex="-1"
          @keydown.esc.stop.prevent="onEscape"
        >
          <div :class="['dialog-icon-circle', `dialog-icon-${type}`]">
            <span
              class="dialog-icon"
              :style="{ color: iconColor }"
            >
              <component :is="iconComponent" />
            </span>
          </div>

          <div class="dialog-body">
            <h3
              :id="titleId"
              class="dialog-title"
            >
              {{ title }}
            </h3>
            <p
              v-if="message"
              class="dialog-message"
            >
              {{ message }}
            </p>

            <form
              class="dialog-fields"
              novalidate
              @submit.prevent="onConfirm"
            >
              <div
                v-for="field in fields"
                :key="field.key"
                class="dialog-field"
                :class="[
                  `is-${field.type}`,
                  {
                    'has-value': isFilled(field),
                    'has-error': !!fieldErrors[field.key],
                  },
                ]"
              >
                <!--
                  The control comes BEFORE the label so the floating-label
                  CSS can use `:focus-within` + `.has-value` to push the
                  label up and shrink it. The label is rendered as a
                  visual placeholder when empty, and animates to a small
                  legend when the field is focused or filled.
                -->

                <!-- text / password / email / number -->
                <input
                  v-if="['text', 'password', 'email', 'number'].includes(field.type)"
                  :id="`${idBase}-${field.key}`"
                  v-model="values[field.key]"
                  :type="field.type"
                  :placeholder="field.placeholder ?? ''"
                  class="dialog-input"
                  @blur="validateField(field)"
                  @keydown.enter.prevent="onConfirm"
                >

                <!-- textarea -->
                <textarea
                  v-else-if="field.type === 'textarea'"
                  :id="`${idBase}-${field.key}`"
                  v-model="values[field.key]"
                  :placeholder="field.placeholder ?? ''"
                  :rows="field.rows ?? 3"
                  class="dialog-input dialog-textarea"
                  @blur="validateField(field)"
                />

                <!-- select — click-to-open dropdown, no typing -->
                <DropdownPicker
                  v-else-if="field.type === 'select'"
                  :id="`${idBase}-${field.key}`"
                  :model-value="values[field.key]"
                  :items="(field.items ?? []) as unknown[]"
                  :placeholder="''"
                  :searchable="false"
                  :allow-create="false"
                  @update:model-value="(v) => { values[field.key] = v; validateField(field) }"
                />

                <!-- autocomplete — typing-to-filter, optionally creates new -->
                <DropdownPicker
                  v-else-if="field.type === 'autocomplete'"
                  :id="`${idBase}-${field.key}`"
                  :model-value="values[field.key]"
                  :items="(field.items ?? []) as unknown[]"
                  :placeholder="''"
                  :searchable="true"
                  :allow-create="!!field.createNew"
                  :format-create="(raw) => formatCreate(field, raw)"
                  @update:model-value="(v) => { values[field.key] = v; validateField(field) }"
                />

                <label
                  class="dialog-field-label"
                  :for="`${idBase}-${field.key}`"
                >
                  {{ field.label }}
                </label>

                <p
                  v-if="field.hint && !fieldErrors[field.key]"
                  class="dialog-field-hint"
                >
                  {{ field.hint }}
                </p>
                <p
                  v-if="fieldErrors[field.key]"
                  class="dialog-field-error"
                >
                  {{ fieldErrors[field.key] }}
                </p>
              </div>

              <p
                v-if="formError"
                class="dialog-form-error"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                  />
                  <line
                    x1="12"
                    y1="8"
                    x2="12"
                    y2="12"
                  />
                  <line
                    x1="12"
                    y1="16"
                    x2="12.01"
                    y2="16"
                  />
                </svg>
                <span>{{ formError }}</span>
              </p>
            </form>

            <p
              v-if="warningText"
              class="dialog-warning-text"
            >
              {{ warningText }}
            </p>

            <div :class="['dialog-actions', `actions-${resolvedButtons.length}`]">
              <button
                v-for="(button, index) in resolvedButtons"
                :key="`${index}-${button.text}`"
                type="button"
                :class="getButtonClass(button)"
                :disabled="button.disabled"
                @click="onButtonClick(button)"
              >
                {{ button.text }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, h, nextTick, onMounted, onBeforeUnmount } from 'vue'
import type { FunctionalComponent } from 'vue'
import DropdownPicker from './_DropdownPicker.vue'
import {
  formatCreateNewValue,
  type InputField,
  type InputDialogButton,
  type InputDialogType,
} from '../composables/useInputDialog'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    type?: InputDialogType
    title: string
    message?: string | null
    fields: InputField[]
    initialValues?: Record<string, unknown>
    warningText?: string | null
    confirmText?: string
    cancelText?: string
    buttons?: InputDialogButton[] | null
    closeOnBackdropClick?: boolean
    escapeToCancel?: boolean
  }>(),
  {
    modelValue: false,
    type: 'info',
    message: null,
    initialValues: () => ({}),
    warningText: null,
    confirmText: 'Submit',
    cancelText: 'Cancel',
    buttons: null,
    closeOnBackdropClick: false,
    escapeToCancel: true,
  },
)

const emit = defineEmits<{
  'update:modelValue': [boolean]
  'confirm': [Record<string, unknown>]
  'cancel': []
  'action': [string, Record<string, unknown>]
}>()

const isVisible = ref(props.modelValue)
const cardRef = ref<HTMLElement | null>(null)
const previousFocus = ref<HTMLElement | null>(null)

const idBase = `input-dialog-${Math.random().toString(36).slice(2, 9)}`
const titleId = `${idBase}-title`

// Reactive state for the form
const values = reactive<Record<string, unknown>>({})
const fieldErrors = reactive<Record<string, string>>({})
const formError = ref('')

const initializeValues = (): void => {
  for (const field of props.fields) {
    const initial = props.initialValues[field.key] ?? field.defaultValue ?? ''
    values[field.key] = initial
    fieldErrors[field.key] = ''
  }
  formError.value = ''
}

initializeValues()

watch(() => props.modelValue, async (v) => {
  isVisible.value = v
  if (v) {
    initializeValues()
    await nextTick()
  }
})

watch(isVisible, async (v) => {
  emit('update:modelValue', v)
  if (v) {
    initializeValues()
    await nextTick()
    previousFocus.value = (document.activeElement as HTMLElement) ?? null
    cardRef.value?.focus()
    // Focus the first field's input
    const firstInput = cardRef.value?.querySelector<HTMLElement>(
      'input, textarea, [data-dropdown-trigger]',
    )
    firstInput?.focus()
  }
  else if (previousFocus.value) {
    previousFocus.value.focus()
    previousFocus.value = null
  }
})

const RTL_SCRIPT = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻾]/
const direction = computed<'rtl' | 'ltr'>(() => {
  const allText = [
    props.title,
    props.message ?? '',
    props.warningText ?? '',
    ...props.fields.flatMap(f => [f.label, f.placeholder ?? '', f.hint ?? '']),
  ].join(' ')
  return RTL_SCRIPT.test(allText) ? 'rtl' : 'ltr'
})

const iconColor = computed(() => ({
  success: '#30e0a1',
  warning: '#FFD700',
  error: '#DC143C',
  info: '#00FFFF',
}[props.type]))

const svgAttrs = {
  'width': 32,
  'height': 32,
  'viewBox': '0 0 24 24',
  'fill': 'none',
  'stroke': 'currentColor',
  'stroke-width': 2,
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
  'aria-hidden': 'true',
}

const CheckCircle: FunctionalComponent = () =>
  h('svg', svgAttrs, [
    h('path', { d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14' }),
    h('polyline', { points: '22 4 12 14.01 9 11.01' }),
  ])
const Alert: FunctionalComponent = () =>
  h('svg', svgAttrs, [
    h('path', { d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' }),
    h('line', { x1: 12, y1: 9, x2: 12, y2: 13 }),
    h('line', { x1: 12, y1: 17, x2: 12.01, y2: 17 }),
  ])
const AlertCircle: FunctionalComponent = () =>
  h('svg', svgAttrs, [
    h('circle', { cx: 12, cy: 12, r: 10 }),
    h('line', { x1: 12, y1: 8, x2: 12, y2: 12 }),
    h('line', { x1: 12, y1: 16, x2: 12.01, y2: 16 }),
  ])
const FormIcon: FunctionalComponent = () =>
  h('svg', svgAttrs, [
    h('rect', { x: 4, y: 4, width: 16, height: 16, rx: 2 }),
    h('line', { x1: 8, y1: 10, x2: 16, y2: 10 }),
    h('line', { x1: 8, y1: 14, x2: 16, y2: 14 }),
  ])

const iconComponent = computed(() => ({
  success: CheckCircle,
  warning: Alert,
  error: AlertCircle,
  info: FormIcon,
}[props.type]))

const resolvedButtons = computed<InputDialogButton[]>(() => {
  if (props.buttons && props.buttons.length > 0) return props.buttons
  return [
    { text: props.cancelText, action: 'cancel', variant: 'outlined', color: 'default' },
    { text: props.confirmText, action: 'confirm', variant: 'flat', color: props.type },
  ]
})

const getButtonClass = (button: InputDialogButton): string[] => {
  const classes = ['dialog-btn']
  if (button.variant === 'outlined' || button.action === 'cancel') {
    classes.push('dialog-btn-outlined')
  }
  else {
    classes.push('dialog-btn-flat')
    classes.push(`dialog-btn-${button.color ?? props.type}`)
  }
  return classes
}

const formatCreate = (field: InputField, raw: string): string =>
  formatCreateNewValue(field, raw)

const isFilled = (field: InputField): boolean => {
  const v = values[field.key]
  if (v === null || v === undefined) return false
  if (typeof v === 'string') return v.length > 0
  if (typeof v === 'number') return Number.isFinite(v)
  return true
}

const validateField = (field: InputField): boolean => {
  const value = values[field.key]
  for (const rule of field.rules ?? []) {
    const r = rule(value)
    if (r !== true) {
      fieldErrors[field.key] = r
      return false
    }
  }
  fieldErrors[field.key] = ''
  return true
}

const validateAll = (): boolean => {
  let allValid = true
  for (const field of props.fields) {
    if (!validateField(field)) allValid = false
  }
  return allValid
}

const onConfirm = (): void => {
  if (!validateAll()) {
    formError.value = 'Please fix the errors above before submitting.'
    return
  }
  formError.value = ''
  emit('confirm', { ...values })
  isVisible.value = false
}

const onCancel = (): void => {
  emit('cancel')
  isVisible.value = false
}

const onCustomAction = (name: string): void => {
  emit('action', name, { ...values })
  isVisible.value = false
}

const onButtonClick = (button: InputDialogButton): void => {
  const action = button.action ?? 'confirm'
  if (action === 'confirm') onConfirm()
  else if (action === 'cancel') onCancel()
  else onCustomAction(action)
}

const onBackdropClick = (): void => {
  if (props.closeOnBackdropClick) onCancel()
}

const onEscape = (): void => {
  if (props.escapeToCancel) onCancel()
}

const handleGlobalEscape = (e: KeyboardEvent): void => {
  if (e.key === 'Escape' && isVisible.value && props.escapeToCancel) {
    e.preventDefault()
    onCancel()
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleGlobalEscape)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleGlobalEscape)
  }
})

defineExpose({
  confirm: onConfirm,
  cancel: onCancel,
  getValues: () => ({ ...values }),
  setValue: (key: string, value: unknown) => { values[key] = value },
})
</script>

<style scoped>
/* ----- Transitions ----- */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.2s ease;
}
.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-pop-enter-active {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease;
}
.dialog-pop-leave-active {
  transition: transform 0.18s ease, opacity 0.15s ease;
}
.dialog-pop-enter-from {
  transform: scale(0.92) translateY(8px);
  opacity: 0;
}
.dialog-pop-leave-to {
  transform: scale(0.96) translateY(4px);
  opacity: 0;
}

/* ----- Overlay -----
 * The overlay carries the scroll, NOT the card. The card stays
 * `overflow: visible` so the icon-circle can protrude above it.
 * `safe center` keeps short dialogs vertically centered while
 * letting tall forms align to the top so the icon stays in view.
 */
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: safe center;
  justify-content: center;
  padding: 48px 16px;
  background: rgba(15, 18, 24, 0.78);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  overflow-y: auto;
  /* Firefox */
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 255, 255, 0.3) rgba(0, 0, 0, 0.2);
}

/* WebKit / Blink scrollbars on the overlay */
.dialog-overlay::-webkit-scrollbar {
  width: 6px;
}
.dialog-overlay::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}
.dialog-overlay::-webkit-scrollbar-thumb {
  background: rgba(0, 255, 255, 0.3);
  border-radius: 3px;
}
.dialog-overlay::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 255, 255, 0.5);
}

/* ----- Card ----- */
.dialog-card {
  position: relative;
  width: 100%;
  max-width: 520px;
  margin-top: 32px;
  padding: 60px 32px 32px;
  background: radial-gradient(
    120% 104.06% at 50.07% -4%,
    rgba(51, 78, 104, 0.98) 1.9%,
    rgba(25, 29, 35, 0.98) 100%
  );
  -webkit-backdrop-filter: blur(12.5px);
  backdrop-filter: blur(12.5px);
  border-radius: 12px;
  color: white;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.55);
  font-family:
    'Inter',
    'Shabnam',
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI Variable Text',
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
  font-feature-settings: 'cv11', 'ss01', 'ss03';
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  box-sizing: border-box;
  /* `overflow: visible` (default) — must NOT be `auto`/`hidden` or the
   * top icon-circle (positioned at `top: -32px`) gets clipped. The
   * overlay handles scrolling for long forms. */
  overflow: visible;
}

.dialog-card:focus { outline: none; }

.dialog-success { border: 2px solid #30e0a1; }
.dialog-warning { border: 2px solid #ffd700; }
.dialog-error   { border: 2px solid #dc143c; }
.dialog-info    { border: 2px solid #00ffff; }

/* ----- Top icon circle ----- */
.dialog-icon-circle {
  position: absolute;
  top: -32px;
  left: 50%;
  transform: translateX(-50%);
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(
    120% 104.06% at 50.07% -4%,
    rgba(51, 78, 104, 0.98) 1.9%,
    rgba(25, 29, 35, 0.98) 100%
  );
  -webkit-backdrop-filter: blur(12.5px);
  backdrop-filter: blur(12.5px);
  z-index: 10;
}

.dialog-icon-circle::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid transparent;
  clip-path: polygon(0 0, 100% 0, 100% 50%, 0 50%);
}

.dialog-icon-success::before { border-color: #30e0a1; }
.dialog-icon-warning::before { border-color: #ffd700; }
.dialog-icon-error::before   { border-color: #dc143c; }
.dialog-icon-info::before    { border-color: #00ffff; }

.dialog-icon {
  display: inline-flex;
  align-items: center;
  line-height: 0;
}

/* ----- Body ----- */
.dialog-body {
  padding: 8px 0;
}

.dialog-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 12px;
  color: white;
  text-align: center;
  line-height: 1.3;
  font-family: inherit;
}

.dialog-message {
  font-size: 15px;
  line-height: 1.6;
  margin: 0;
  color: rgba(255, 255, 255, 0.85);
  text-align: center;
  font-family: inherit;
}

.dialog-warning-text {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  margin: 12px 0 0;
  color: #ffd700;
  text-align: center;
  font-family: inherit;
}

/* ----- Fields -----
 *
 * Filled floating-label design (Material "filled" variant). Both the
 * label and the input text live INSIDE the input box.
 *
 *   - Empty + unfocused: the label sits at the input's vertical
 *     center, looking like a placeholder.
 *   - Focused or filled: the label slides up to the top of the
 *     input (still inside the box), shrinks to a small legend in
 *     cyan. The actual typed text / placeholder occupies the area
 *     below the floated label.
 *
 * The input's padding-top reserves space for the small floated label
 * so the typed text and the floated label don't overlap.
 */
.dialog-fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 20px;
}

.dialog-field {
  position: relative;
  display: flex;
  flex-direction: column;
}

.dialog-input {
  width: 100%;
  height: 56px;
  padding: 22px 14px 8px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(127, 157, 187, 0.5);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.15s ease, background-color 0.15s ease;
  box-sizing: border-box;
}

/* Hide the native placeholder by default — the label acts as the
 * placeholder. The actual placeholder shows only when focused (so
 * the user sees it once they click in). */
.dialog-input::placeholder {
  color: transparent;
  transition: color 0.15s ease;
}

.dialog-input:focus::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.dialog-input:hover {
  border-color: rgba(255, 255, 255, 0.45);
}

.dialog-input:focus {
  outline: none;
  border-color: #00ffff;
  background: rgba(0, 0, 0, 0.4);
}

/* Textarea — taller, inherits the input's `22px 14px 8px` padding so
 * the floated label sits cleanly above the first text line. */
.dialog-textarea {
  height: auto;
  min-height: 96px;
  resize: vertical;
  font-family: inherit;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 255, 255, 0.3) rgba(0, 0, 0, 0.2);
}

.dialog-textarea::-webkit-scrollbar {
  width: 6px;
}
.dialog-textarea::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}
.dialog-textarea::-webkit-scrollbar-thumb {
  background: rgba(0, 255, 255, 0.3);
  border-radius: 3px;
}
.dialog-textarea::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 255, 255, 0.5);
}

/* ----- Label -----
 *
 * Default ("placeholder") position: vertically centered inside the
 * input (`top: 50%` is the input box's vertical center because the
 * field wrapper has no padding-top).
 *
 * Floated position: `top: 8px` — a small label at the top of the
 * input, inside the box. The input's `padding-top: 22px` ensures
 * the typed text / placeholder appears below this floated label.
 */
.dialog-field-label {
  position: absolute;
  top: 50%;
  left: 14px;
  transform: translateY(-50%);
  max-width: calc(100% - 28px);
  font-size: 14px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.55);
  letter-spacing: 0.01em;
  line-height: 1.2;
  pointer-events: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background: transparent;
  transition:
    top 0.18s ease,
    transform 0.18s ease,
    font-size 0.18s ease,
    color 0.18s ease;
}

/* Textarea label sits near the top of the textarea (matches where
 * the cursor / first line of text would naturally be). */
.dialog-field.is-textarea .dialog-field-label {
  top: 22px;
  transform: none;
}

/* RTL — anchor the label to the right edge */
.dialog-card[dir='rtl'] .dialog-field-label {
  left: auto;
  right: 14px;
}

/* Floating state — label small at the top INSIDE the input */
.dialog-field:focus-within .dialog-field-label,
.dialog-field.has-value .dialog-field-label {
  top: 8px;
  transform: none;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: rgba(0, 255, 255, 0.85);
}

/* Active focus — slightly stronger color */
.dialog-field:focus-within .dialog-field-label {
  color: #00ffff;
}

/* ----- Error state ----- */
.dialog-field.has-error .dialog-input {
  border-color: #ef5350;
}
.dialog-field.has-error .dialog-input:focus {
  border-color: #ef5350;
}
.dialog-field.has-error .dialog-field-label,
.dialog-field.has-error:focus-within .dialog-field-label {
  color: #ef5350;
}

/* Dropdown error border passes through the trigger inside */
.dialog-field.has-error :deep(.dd-trigger) {
  border-color: #ef5350;
}
.dialog-field.has-error:focus-within :deep(.dd-trigger) {
  border-color: #ef5350;
}

/* ----- Hint / per-field error messages ----- */
.dialog-field-hint {
  font-size: 12px;
  margin: 6px 0 0;
  color: rgba(255, 255, 255, 0.55);
}

.dialog-field-error {
  font-size: 12px;
  font-weight: 500;
  margin: 6px 0 0;
  color: #ef5350;
}

.dialog-form-error {
  font-size: 13px;
  font-weight: 500;
  margin: 4px 0 0;
  padding: 8px 12px;
  color: #ef5350;
  background: rgba(239, 83, 80, 0.12);
  border: 1px solid rgba(239, 83, 80, 0.3);
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: inherit;
}

.dialog-form-error svg {
  flex-shrink: 0;
}

/* ----- Actions ----- */
.dialog-actions {
  display: grid;
  gap: 12px;
  margin-top: 24px;
}
.actions-1 { grid-template-columns: 1fr; }
.actions-2 { grid-template-columns: 1fr 1fr; }
.actions-3 { grid-template-columns: 1fr 1fr 1fr; }

.dialog-btn {
  height: 42px;
  padding: 0 16px;
  border-radius: 8px;
  border: 1.5px solid transparent;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
  color: white;
}

.dialog-btn:focus-visible {
  outline: 2px solid rgba(0, 255, 255, 0.6);
  outline-offset: 2px;
}

.dialog-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dialog-btn-outlined {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}
.dialog-btn-outlined:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.5);
}

.dialog-btn-flat {
  border-color: transparent;
}

.dialog-btn-success { background: #30e0a1; color: #001a14; }
.dialog-btn-success:hover:not(:disabled) { background: #28c28f; }
.dialog-btn-warning { background: #ffd700; color: #1a1a1a; }
.dialog-btn-warning:hover:not(:disabled) { background: #e6c200; }
.dialog-btn-error { background: #dc143c; color: white; }
.dialog-btn-error:hover:not(:disabled) { background: #c01234; }
.dialog-btn-info { background: #00ffff; color: #003c3c; }
.dialog-btn-info:hover:not(:disabled) { background: #00e6e6; }
.dialog-btn-default { background: rgba(255, 255, 255, 0.12); color: white; }
.dialog-btn-default:hover:not(:disabled) { background: rgba(255, 255, 255, 0.2); }
</style>
