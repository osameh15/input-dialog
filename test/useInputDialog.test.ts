import { describe, it, expect, beforeEach } from 'vitest'
import {
  useInputDialog,
  formatCreateNewValue,
  type InputField,
} from '../src/runtime/composables/useInputDialog'

describe('useInputDialog', () => {
  beforeEach(() => {
    // Cancel any in-flight dialog so module-level state is clean.
    const { currentDialog, cancel } = useInputDialog()
    if (currentDialog.value) cancel()
  })

  describe('show()', () => {
    it('returns a Promise', () => {
      const result = useInputDialog().show({
        title: 'A',
        fields: [{ key: 'x', type: 'text', label: 'X' }],
      })
      expect(result).toBeInstanceOf(Promise)
      useInputDialog().cancel()
      return result
    })

    it('sets currentDialog with merged defaults', () => {
      const { show, currentDialog, cancel } = useInputDialog()
      show({
        title: 'Pick a name',
        fields: [{ key: 'name', type: 'text', label: 'Name' }],
      })
      expect(currentDialog.value).not.toBeNull()
      expect(currentDialog.value!.type).toBe('info')
      expect(currentDialog.value!.confirmText).toBe('Submit')
      expect(currentDialog.value!.cancelText).toBe('Cancel')
      expect(currentDialog.value!.fields).toHaveLength(1)
      expect(currentDialog.value!.message).toBeNull()
      cancel()
    })
  })

  describe('promise resolution', () => {
    it('resolves with action="confirm" and the values', async () => {
      const { show, confirm } = useInputDialog()
      const pending = show({ title: 'A', fields: [{ key: 'x', type: 'text', label: 'X' }] })
      confirm({ x: 'hello' })
      const result = await pending
      expect(result).toEqual({ action: 'confirm', values: { x: 'hello' } })
    })

    it('resolves with action="cancel" and empty values when cancelled', async () => {
      const { show, cancel } = useInputDialog()
      const pending = show({ title: 'A', fields: [{ key: 'x', type: 'text', label: 'X' }] })
      cancel()
      const result = await pending
      expect(result).toEqual({ action: 'cancel', values: {} })
    })

    it('resolves with custom action name and values', async () => {
      const { show, action } = useInputDialog()
      const pending = show({ title: 'A', fields: [{ key: 'x', type: 'text', label: 'X' }] })
      action('save_draft', { x: 'partial' })
      await expect(pending).resolves.toEqual({ action: 'save_draft', values: { x: 'partial' } })
    })

    it('clears currentDialog after resolution', async () => {
      const { show, confirm, currentDialog } = useInputDialog()
      const pending = show({ title: 'A', fields: [{ key: 'x', type: 'text', label: 'X' }] })
      confirm({ x: '1' })
      await pending
      expect(currentDialog.value).toBeNull()
    })

    it('cancels the previous dialog when show() is called again', async () => {
      const { show, confirm } = useInputDialog()
      const first = show({ title: 'A', fields: [{ key: 'x', type: 'text', label: 'X' }] })
      show({ title: 'B', fields: [{ key: 'y', type: 'text', label: 'Y' }] })

      await expect(first).resolves.toEqual({ action: 'cancel', values: {} })
      confirm({ y: 'second' })
    })
  })

  describe('promptText', () => {
    it('resolves with the string when confirmed', async () => {
      const { promptText, confirm } = useInputDialog()
      const pending = promptText('Title', 'Label')
      confirm({ value: 'hello world' })
      await expect(pending).resolves.toBe('hello world')
    })

    it('resolves with null on cancel', async () => {
      const { promptText, cancel } = useInputDialog()
      const pending = promptText('Title', 'Label')
      cancel()
      await expect(pending).resolves.toBeNull()
    })

    it('uses defaultValue as initial', () => {
      const { promptText, currentDialog, cancel } = useInputDialog()
      promptText('T', 'L', { defaultValue: 'preset' })
      expect(currentDialog.value!.initialValues).toEqual({ value: 'preset' })
      cancel()
    })
  })

  describe('promptPassword', () => {
    it('uses warning theme', () => {
      const { promptPassword, currentDialog, cancel } = useInputDialog()
      promptPassword('Authenticate')
      expect(currentDialog.value!.type).toBe('warning')
      cancel()
    })

    it('returns the password string when confirmed', async () => {
      const { promptPassword, confirm } = useInputDialog()
      const pending = promptPassword('Auth')
      confirm({ password: 'secret123' })
      await expect(pending).resolves.toBe('secret123')
    })

    it('returns null on cancel', async () => {
      const { promptPassword, cancel } = useInputDialog()
      const pending = promptPassword('Auth')
      cancel()
      await expect(pending).resolves.toBeNull()
    })
  })

  describe('promptNumber', () => {
    it('returns a number when confirmed', async () => {
      const { promptNumber, confirm } = useInputDialog()
      const pending = promptNumber('Quantity', 'How many?')
      confirm({ value: '42' })
      await expect(pending).resolves.toBe(42)
    })

    it('returns null when input is not a finite number', async () => {
      const { promptNumber, confirm } = useInputDialog()
      const pending = promptNumber('Quantity', 'How many?')
      confirm({ value: 'not-a-number' })
      await expect(pending).resolves.toBeNull()
    })

    it('returns null on cancel', async () => {
      const { promptNumber, cancel } = useInputDialog()
      const pending = promptNumber('Quantity', 'How many?')
      cancel()
      await expect(pending).resolves.toBeNull()
    })
  })

  describe('promptSelect', () => {
    it('returns the selected item', async () => {
      const { promptSelect, confirm } = useInputDialog()
      const pending = promptSelect('Color', 'Pick', ['red', 'green', 'blue'])
      confirm({ selected: 'green' })
      await expect(pending).resolves.toBe('green')
    })

    it('typed objects flow through', async () => {
      const { promptSelect, confirm } = useInputDialog()
      const items = [{ id: 1 }, { id: 2 }]
      const pending = promptSelect<{ id: number }>('Item', 'Pick', items)
      confirm({ selected: items[1] })
      await expect(pending).resolves.toEqual({ id: 2 })
    })
  })

  describe('promptSaveAs', () => {
    it('returns just fileName when no extensions', async () => {
      const { promptSaveAs, confirm } = useInputDialog()
      const pending = promptSaveAs('hello')
      confirm({ fileName: 'report' })
      await expect(pending).resolves.toEqual({ fileName: 'report' })
    })

    it('returns fileName + extension + fullName when extensions provided', async () => {
      const { promptSaveAs, confirm } = useInputDialog()
      const pending = promptSaveAs('hello', { extensions: ['.md', '.txt'] })
      confirm({ fileName: 'report', extension: '.md' })
      await expect(pending).resolves.toEqual({
        fileName: 'report',
        extension: '.md',
        fullName: 'report.md',
      })
    })

    it('returns null on cancel', async () => {
      const { promptSaveAs, cancel } = useInputDialog()
      const pending = promptSaveAs()
      cancel()
      await expect(pending).resolves.toBeNull()
    })
  })

  describe('promptForm', () => {
    it('returns the values object when confirmed', async () => {
      const { promptForm, confirm } = useInputDialog()
      const pending = promptForm('Form', [
        { key: 'a', type: 'text', label: 'A' },
        { key: 'b', type: 'text', label: 'B' },
      ])
      confirm({ a: '1', b: '2' })
      await expect(pending).resolves.toEqual({ a: '1', b: '2' })
    })

    it('returns null on cancel', async () => {
      const { promptForm, cancel } = useInputDialog()
      const pending = promptForm('Form', [{ key: 'a', type: 'text', label: 'A' }])
      cancel()
      await expect(pending).resolves.toBeNull()
    })
  })
})

describe('formatCreateNewValue', () => {
  const baseField: InputField = { key: 'p', type: 'autocomplete', label: 'P' }

  it('returns raw when createNew is false/undefined', () => {
    expect(formatCreateNewValue(baseField, 'foo')).toBe('foo')
    expect(formatCreateNewValue({ ...baseField, createNew: false }, 'foo')).toBe('foo')
  })

  it('appends a trailing slash for path mode', () => {
    expect(formatCreateNewValue({ ...baseField, createNew: 'path' }, '/var/log')).toBe('/var/log/')
  })

  it('does not add a slash if one is already present', () => {
    expect(formatCreateNewValue({ ...baseField, createNew: 'path' }, '/var/log/')).toBe('/var/log/')
  })

  it('runs a custom formatter function', () => {
    expect(formatCreateNewValue(
      { ...baseField, createNew: (raw: string) => raw.toUpperCase() },
      'hello',
    )).toBe('HELLO')
  })
})
