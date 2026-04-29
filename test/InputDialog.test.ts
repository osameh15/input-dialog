import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import InputDialog from '../src/runtime/components/InputDialog.vue'
import type { InputField } from '../src/runtime/composables/useInputDialog'

const renderField = (field: InputField, overrides: Record<string, unknown> = {}) =>
  mount(InputDialog, {
    props: {
      modelValue: true,
      title: 'Test',
      fields: [field],
      ...overrides,
    },
    attachTo: document.body,
  })

describe('InputDialog', () => {
  it('renders title and message when modelValue is true', () => {
    const wrapper = renderField(
      { key: 'x', type: 'text', label: 'X' },
      { title: 'Hello', message: 'World' },
    )
    expect(wrapper.find('.dialog-card').exists()).toBe(true)
    expect(wrapper.text()).toContain('Hello')
    expect(wrapper.text()).toContain('World')
  })

  it('does not render the card when modelValue is false', () => {
    const wrapper = mount(InputDialog, {
      props: {
        modelValue: false,
        title: 'A',
        fields: [{ key: 'x', type: 'text', label: 'X' }],
      },
    })
    expect(wrapper.find('.dialog-card').exists()).toBe(false)
  })

  it.each([
    ['success', 'dialog-success'],
    ['warning', 'dialog-warning'],
    ['error', 'dialog-error'],
    ['info', 'dialog-info'],
  ] as const)('applies "%s" class for type "%s"', (type, className) => {
    const wrapper = renderField(
      { key: 'x', type: 'text', label: 'X' },
      { type },
    )
    expect(wrapper.find('.dialog-card').classes()).toContain(className)
  })

  describe('field rendering', () => {
    it('renders a text input', () => {
      const wrapper = renderField({ key: 'name', type: 'text', label: 'Name' })
      const input = wrapper.find('input[type="text"]')
      expect(input.exists()).toBe(true)
    })

    it('renders a password input', () => {
      const wrapper = renderField({ key: 'pw', type: 'password', label: 'Pass' })
      expect(wrapper.find('input[type="password"]').exists()).toBe(true)
    })

    it('renders an email input', () => {
      const wrapper = renderField({ key: 'em', type: 'email', label: 'Email' })
      expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    })

    it('renders a number input', () => {
      const wrapper = renderField({ key: 'n', type: 'number', label: 'Num' })
      expect(wrapper.find('input[type="number"]').exists()).toBe(true)
    })

    it('renders a textarea with rows', () => {
      const wrapper = renderField({ key: 'note', type: 'textarea', label: 'Note', rows: 5 })
      const ta = wrapper.find('textarea')
      expect(ta.exists()).toBe(true)
      expect(ta.attributes('rows')).toBe('5')
    })

    it('renders a select dropdown trigger', () => {
      const wrapper = renderField({ key: 'opt', type: 'select', label: 'Opt', items: ['a', 'b'] })
      expect(wrapper.find('[data-dropdown-trigger]').exists()).toBe(true)
    })

    it('renders an autocomplete with a search input field', () => {
      const wrapper = renderField({
        key: 'p',
        type: 'autocomplete',
        label: 'Path',
        items: ['/a/', '/b/'],
        createNew: 'path',
      })
      // Autocomplete uses an <input> inside the trigger for typing
      expect(wrapper.find('.dd-input-search').exists()).toBe(true)
    })

    it('autocomplete is searchable even when createNew is false', () => {
      const wrapper = renderField({
        key: 'fruit',
        type: 'autocomplete',
        label: 'Fruit',
        items: ['Apple', 'Banana'],
        createNew: false,
      })
      // The user must still be able to type to filter — even without
      // the create-new option enabled. This is the key distinction
      // between `select` and `autocomplete`.
      expect(wrapper.find('.dd-input-search').exists()).toBe(true)
    })

    it('select renders without a search input', () => {
      const wrapper = renderField({
        key: 'opt',
        type: 'select',
        label: 'Opt',
        items: ['a', 'b'],
      })
      // Select has no typing input — just a static label/value.
      expect(wrapper.find('.dd-input-search').exists()).toBe(false)
      expect(wrapper.find('[data-dropdown-trigger]').exists()).toBe(true)
    })
  })

  describe('default buttons', () => {
    it('renders Cancel + Submit by default', () => {
      const wrapper = renderField({ key: 'x', type: 'text', label: 'X' })
      const buttons = wrapper.findAll('.dialog-btn')
      expect(buttons).toHaveLength(2)
      expect(buttons[0].text()).toBe('Cancel')
      expect(buttons[1].text()).toBe('Submit')
    })

    it('honors custom confirm/cancel text', () => {
      const wrapper = renderField(
        { key: 'x', type: 'text', label: 'X' },
        { confirmText: 'Yes', cancelText: 'No' },
      )
      const buttons = wrapper.findAll('.dialog-btn')
      expect(buttons[0].text()).toBe('No')
      expect(buttons[1].text()).toBe('Yes')
    })

    it('emits cancel when Cancel button is clicked', async () => {
      const wrapper = renderField({ key: 'x', type: 'text', label: 'X' })
      await wrapper.findAll('.dialog-btn')[0].trigger('click')
      expect(wrapper.emitted('cancel')).toBeTruthy()
    })
  })

  describe('custom buttons', () => {
    it('renders the supplied buttons in order', () => {
      const wrapper = renderField(
        { key: 'x', type: 'text', label: 'X' },
        {
          buttons: [
            { text: 'Cancel', action: 'cancel', variant: 'outlined', color: 'default' },
            { text: 'Discard', action: 'discard', variant: 'flat', color: 'default' },
            { text: 'Save', action: 'save', variant: 'flat', color: 'info' },
          ],
        },
      )
      const buttons = wrapper.findAll('.dialog-btn')
      expect(buttons).toHaveLength(3)
      expect(buttons.map(b => b.text())).toEqual(['Cancel', 'Discard', 'Save'])
    })

    it('emits action with the action name + values for non-confirm/cancel buttons', async () => {
      const wrapper = renderField(
        { key: 'x', type: 'text', label: 'X' },
        {
          initialValues: { x: 'hello' },
          buttons: [{ text: 'Save', action: 'save', variant: 'flat', color: 'info' }],
        },
      )
      await wrapper.find('.dialog-btn').trigger('click')
      const events = wrapper.emitted('action')
      expect(events).toBeTruthy()
      expect(events![0][0]).toBe('save')
      expect(events![0][1]).toEqual({ x: 'hello' })
    })
  })

  describe('validation', () => {
    it('blocks confirm and shows error when a required rule fails', async () => {
      const wrapper = renderField({
        key: 'x',
        type: 'text',
        label: 'X',
        rules: [v => (typeof v === 'string' && v.length > 0) || 'Required'],
      })
      // Confirm with empty value
      await wrapper.findAll('.dialog-btn')[1].trigger('click')
      expect(wrapper.emitted('confirm')).toBeFalsy()
      expect(wrapper.text()).toContain('Required')
    })

    it('allows confirm when all rules pass', async () => {
      const wrapper = renderField(
        {
          key: 'x',
          type: 'text',
          label: 'X',
          rules: [v => (typeof v === 'string' && v.length > 0) || 'Required'],
        },
        { initialValues: { x: 'hello' } },
      )
      await wrapper.findAll('.dialog-btn')[1].trigger('click')
      expect(wrapper.emitted('confirm')).toBeTruthy()
      expect(wrapper.emitted('confirm')![0][0]).toEqual({ x: 'hello' })
    })

    it('shows the form-level error message when rules fail', async () => {
      const wrapper = renderField({
        key: 'x',
        type: 'text',
        label: 'X',
        rules: [v => (typeof v === 'string' && v.length > 0) || 'Required'],
      })
      await wrapper.findAll('.dialog-btn')[1].trigger('click')
      expect(wrapper.find('.dialog-form-error').exists()).toBe(true)
    })
  })

  describe('direction (RTL auto-detection)', () => {
    it('uses dir="ltr" for Latin text', () => {
      const wrapper = renderField(
        { key: 'x', type: 'text', label: 'Name' },
        { title: 'Save file' },
      )
      expect(wrapper.find('.dialog-card').attributes('dir')).toBe('ltr')
    })

    it('switches to dir="rtl" when title contains Persian script', () => {
      const wrapper = renderField(
        { key: 'x', type: 'text', label: 'X' },
        { title: 'تغییر نام' },
      )
      expect(wrapper.find('.dialog-card').attributes('dir')).toBe('rtl')
    })

    it('detects RTL in field label', () => {
      const wrapper = renderField({ key: 'x', type: 'text', label: 'نام فایل' })
      expect(wrapper.find('.dialog-card').attributes('dir')).toBe('rtl')
    })
  })

  it('has role="alertdialog" and aria-modal="true"', () => {
    const wrapper = renderField({ key: 'x', type: 'text', label: 'X' })
    expect(wrapper.find('.dialog-card').attributes('role')).toBe('alertdialog')
    expect(wrapper.find('.dialog-card').attributes('aria-modal')).toBe('true')
  })
})
