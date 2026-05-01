import { ref, readonly } from 'vue'

export type InputDialogType = 'success' | 'warning' | 'error' | 'info'

export type InputDialogTheme = 'dark' | 'light'

export type InputFieldType
  = | 'text'
    | 'password'
    | 'email'
    | 'number'
    | 'textarea'
    | 'select'
    | 'autocomplete'

/** A validation rule. Returns `true` for valid, or a string error message. */
export type InputFieldRule = (value: unknown) => true | string

export interface InputField<TValue = unknown> {
  /** Unique key — values are returned as `Record<key, value>`. */
  key: string
  type: InputFieldType
  label: string
  placeholder?: string
  /** Optional help text displayed under the field. */
  hint?: string | null
  /** Validation rules. Each runs on blur and on submit. */
  rules?: InputFieldRule[]
  /** Initial value for this field. Overridden by `initialValues[key]`. */
  defaultValue?: TValue
  /** Items for `select` and `autocomplete` types. */
  items?: TValue[]
  /** Number of rows for `textarea` (default 3). */
  rows?: number
  /**
   * For `autocomplete`: when the user types a value not in `items`, suggest
   * "Create new" — and on confirm, format the value (e.g. add a trailing `/`).
   *
   * Pass a function to format custom values, `'path'` for the built-in
   * trailing-slash behavior, or `false` to disable creation entirely.
   * Defaults to `false`.
   */
  createNew?: false | 'path' | ((rawValue: string) => string)
}

export interface InputDialogButton {
  text: string
  /** Action returned to the caller when this button is clicked. */
  action?: string
  variant?: 'flat' | 'outlined'
  color?: InputDialogType | 'default'
  loading?: boolean
  disabled?: boolean
}

export interface InputDialogOptions {
  type?: InputDialogType
  title: string
  message?: string | null
  fields: InputField[]
  initialValues?: Record<string, unknown>
  /** Optional emphasis line shown below the form (yellow). */
  warningText?: string | null
  /** Text on the default confirm button. Ignored if `buttons` is set. */
  confirmText?: string
  /** Text on the default cancel button. Ignored if `buttons` is set. */
  cancelText?: string
  /** Custom buttons (1–3). */
  buttons?: InputDialogButton[] | null
}

export interface InputDialogInstance {
  type: InputDialogType
  title: string
  message: string | null
  fields: InputField[]
  initialValues: Record<string, unknown>
  warningText: string | null
  confirmText: string
  cancelText: string
  buttons: InputDialogButton[] | null
  visible: boolean
}

export interface InputDialogResult {
  /** Action — `'confirm'`, `'cancel'`, or any custom button action name. */
  action: string
  /** Field values — empty object on cancel. */
  values: Record<string, unknown>
}

const currentDialog = ref<InputDialogInstance | null>(null)
let resolveResult: ((result: InputDialogResult) => void) | null = null

const theme = ref<InputDialogTheme>('dark')

/** Switch the global theme. Reactive — every container re-renders. */
const setTheme = (next: InputDialogTheme): void => {
  theme.value = next
}

/** Internal: invoked by the auto-mount plugin to seed the theme from module options. */
export const _setInputDialogTheme = setTheme

export const useInputDialog = () => {
  const show = (options: InputDialogOptions): Promise<InputDialogResult> => {
    if (resolveResult) {
      resolveResult({ action: 'cancel', values: {} })
      resolveResult = null
    }

    currentDialog.value = {
      type: options.type ?? 'info',
      title: options.title,
      message: options.message ?? null,
      fields: options.fields,
      initialValues: options.initialValues ?? {},
      warningText: options.warningText ?? null,
      confirmText: options.confirmText ?? 'Submit',
      cancelText: options.cancelText ?? 'Cancel',
      buttons: options.buttons ?? null,
      visible: true,
    }

    return new Promise<InputDialogResult>((resolve) => {
      resolveResult = resolve
    })
  }

  const respond = (action: string, values: Record<string, unknown>): void => {
    if (resolveResult) {
      resolveResult({ action, values })
      resolveResult = null
    }
    currentDialog.value = null
  }

  const confirm = (values: Record<string, unknown>): void => respond('confirm', values)
  const cancel = (): void => respond('cancel', {})
  const action = (name: string, values: Record<string, unknown>): void => respond(name, values)

  // ----- convenience methods -----

  /** Single text field. Resolves with the string, or `null` on cancel. */
  const promptText = async (
    title: string,
    label: string,
    options: {
      message?: string
      placeholder?: string
      defaultValue?: string
      hint?: string
      rules?: InputFieldRule[]
      type?: InputDialogType
      confirmText?: string
      cancelText?: string
      warningText?: string
    } = {},
  ): Promise<string | null> => {
    const { action, values } = await show({
      type: options.type ?? 'info',
      title,
      message: options.message ?? null,
      fields: [{
        key: 'value',
        type: 'text',
        label,
        placeholder: options.placeholder,
        rules: options.rules,
        hint: options.hint,
        defaultValue: options.defaultValue ?? '',
      }],
      initialValues: options.defaultValue !== undefined ? { value: options.defaultValue } : {},
      confirmText: options.confirmText ?? 'OK',
      cancelText: options.cancelText ?? 'Cancel',
      warningText: options.warningText ?? null,
    })
    return action === 'confirm' ? String(values.value ?? '') : null
  }

  /** Single password field. Resolves with the string, or `null` on cancel. */
  const promptPassword = async (
    title: string,
    options: {
      label?: string
      placeholder?: string
      message?: string
      hint?: string
      rules?: InputFieldRule[]
      confirmText?: string
      cancelText?: string
    } = {},
  ): Promise<string | null> => {
    const { action, values } = await show({
      type: 'warning',
      title,
      message: options.message ?? null,
      fields: [{
        key: 'password',
        type: 'password',
        label: options.label ?? 'Password',
        placeholder: options.placeholder ?? 'Enter password',
        rules: options.rules ?? [v => (typeof v === 'string' && v.length > 0) || 'Password is required'],
        hint: options.hint,
      }],
      confirmText: options.confirmText ?? 'Confirm',
      cancelText: options.cancelText ?? 'Cancel',
    })
    return action === 'confirm' ? String(values.password ?? '') : null
  }

  /** Single number field. Resolves with the number, or `null` on cancel. */
  const promptNumber = async (
    title: string,
    label: string,
    options: {
      message?: string
      placeholder?: string
      defaultValue?: number
      hint?: string
      rules?: InputFieldRule[]
      confirmText?: string
      cancelText?: string
    } = {},
  ): Promise<number | null> => {
    const { action, values } = await show({
      type: 'info',
      title,
      message: options.message ?? null,
      fields: [{
        key: 'value',
        type: 'number',
        label,
        placeholder: options.placeholder,
        rules: options.rules,
        hint: options.hint,
        defaultValue: options.defaultValue,
      }],
      initialValues: options.defaultValue !== undefined ? { value: options.defaultValue } : {},
      confirmText: options.confirmText ?? 'OK',
      cancelText: options.cancelText ?? 'Cancel',
    })
    if (action !== 'confirm') return null
    const n = Number(values.value)
    return Number.isFinite(n) ? n : null
  }

  /** Single select field. Resolves with the picked item, or `null` on cancel. */
  const promptSelect = async <T = string>(
    title: string,
    label: string,
    items: T[],
    options: {
      message?: string
      placeholder?: string
      defaultValue?: T
      hint?: string
      rules?: InputFieldRule[]
      confirmText?: string
      cancelText?: string
    } = {},
  ): Promise<T | null> => {
    const { action, values } = await show({
      type: 'info',
      title,
      message: options.message ?? null,
      fields: [{
        key: 'selected',
        type: 'select',
        label,
        items: items as unknown[],
        placeholder: options.placeholder ?? 'Select an option',
        rules: options.rules,
        hint: options.hint,
        defaultValue: options.defaultValue,
      }],
      initialValues: options.defaultValue !== undefined ? { selected: options.defaultValue } : {},
      confirmText: options.confirmText ?? 'OK',
      cancelText: options.cancelText ?? 'Cancel',
    })
    return action === 'confirm' ? (values.selected as T) : null
  }

  /**
   * "Save As" dialog. Resolves with `{ fileName, extension?, fullName? }` or
   * `null` on cancel. If `extensions` is provided, an extra select field is
   * added and `fullName` combines the two.
   */
  const promptSaveAs = async (
    currentFileName = '',
    options: {
      title?: string
      message?: string
      placeholder?: string
      hint?: string
      extensions?: string[]
      defaultExtension?: string
      extensionHint?: string
      type?: InputDialogType
      confirmText?: string
      cancelText?: string
      warningText?: string
    } = {},
  ): Promise<{ fileName: string, extension?: string, fullName?: string } | null> => {
    const fields: InputField[] = [{
      key: 'fileName',
      type: 'text',
      label: 'File Name',
      placeholder: options.placeholder ?? 'Enter file name',
      rules: [v => (typeof v === 'string' && v.length > 0) || 'File name is required'],
      hint: options.hint,
      defaultValue: currentFileName,
    }]
    const initialValues: Record<string, unknown> = { fileName: currentFileName }
    const extensions = options.extensions ?? []
    if (extensions.length > 0) {
      fields.push({
        key: 'extension',
        type: 'select',
        label: 'File Type',
        items: extensions,
        rules: [v => !!v || 'File type is required'],
        hint: options.extensionHint,
        defaultValue: options.defaultExtension ?? extensions[0],
      })
      initialValues.extension = options.defaultExtension ?? extensions[0]
    }

    const { action, values } = await show({
      type: options.type ?? 'info',
      title: options.title ?? 'Save As',
      message: options.message ?? 'Enter a name for the file',
      fields,
      initialValues,
      confirmText: options.confirmText ?? 'Save',
      cancelText: options.cancelText ?? 'Cancel',
      warningText: options.warningText ?? null,
    })
    if (action !== 'confirm') return null
    const fileName = String(values.fileName ?? '')
    if (extensions.length === 0) return { fileName }
    const extension = String(values.extension ?? '')
    return { fileName, extension, fullName: fileName + extension }
  }

  /** Multi-field form. Resolves with the values object or `null` on cancel. */
  const promptForm = async (
    title: string,
    fields: InputField[],
    options: {
      message?: string
      type?: InputDialogType
      initialValues?: Record<string, unknown>
      buttons?: InputDialogButton[]
      confirmText?: string
      cancelText?: string
      warningText?: string
    } = {},
  ): Promise<Record<string, unknown> | null> => {
    const { action, values } = await show({
      type: options.type ?? 'info',
      title,
      message: options.message ?? null,
      fields,
      initialValues: options.initialValues ?? {},
      confirmText: options.confirmText ?? 'Submit',
      cancelText: options.cancelText ?? 'Cancel',
      warningText: options.warningText ?? null,
      buttons: options.buttons ?? null,
    })
    return action === 'confirm' ? values : null
  }

  return {
    /** The currently visible dialog instance, or null. Reactive. */
    currentDialog,
    /** Open a dialog. Resolves with `{ action, values }`. Always resolves, never rejects. */
    show,
    /** Resolve as confirmed with the given values. Used by the container — rarely called directly. */
    confirm,
    /** Resolve as cancelled. Used by the container — rarely called directly. */
    cancel,
    /** Resolve with a custom action name. Used by the container. */
    action,
    /** Single text input. Resolves with the string or `null` on cancel. */
    promptText,
    /** Single password input. Resolves with the string or `null` on cancel. */
    promptPassword,
    /** Single number input. Resolves with the number or `null` on cancel. */
    promptNumber,
    /** Single select. Resolves with the picked item or `null` on cancel. */
    promptSelect,
    /** "Save As" dialog with optional extension select. */
    promptSaveAs,
    /** Multi-field form. Resolves with values or `null` on cancel. */
    promptForm,
    /** Reactive global theme — `'dark'` or `'light'`. Read-only. */
    theme: readonly(theme),
    /** Switch theme at runtime. All containers reactively pick up the change. */
    setTheme,
  }
}

/**
 * Format a custom autocomplete value according to the field's `createNew`
 * setting. Used by both the dialog component (when accepting a typed value)
 * and exposed for advanced custom rendering.
 */
export const formatCreateNewValue = (field: InputField, raw: string): string => {
  const cn = field.createNew
  if (!cn) return raw
  if (cn === 'path') {
    return raw.endsWith('/') ? raw : raw + '/'
  }
  return cn(raw)
}
