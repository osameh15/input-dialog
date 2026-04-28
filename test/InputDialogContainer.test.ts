import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import InputDialogContainer from '../src/runtime/components/InputDialogContainer.vue'
import { useInputDialog } from '../src/runtime/composables/useInputDialog'

const mountContainer = (props: Record<string, unknown> = {}) =>
  mount(InputDialogContainer, { props: { teleport: false, ...props } })

describe('InputDialogContainer', () => {
  beforeEach(() => {
    const { currentDialog, cancel } = useInputDialog()
    if (currentDialog.value) cancel()
  })

  it('renders nothing when no dialog is active', () => {
    const wrapper = mountContainer()
    expect(wrapper.find('.dialog-card').exists()).toBe(false)
  })

  it('renders the active dialog from useInputDialog state', async () => {
    const { show, cancel } = useInputDialog()
    show({
      title: 'What is your name?',
      fields: [{ key: 'name', type: 'text', label: 'Name' }],
    })

    const wrapper = mountContainer()
    await flushPromises()

    expect(wrapper.find('.dialog-card').exists()).toBe(true)
    expect(wrapper.text()).toContain('What is your name?')
    cancel()
  })

  it('confirm flow resolves the show() promise with values', async () => {
    const { show } = useInputDialog()
    const pending = show({
      title: 'A',
      fields: [{ key: 'x', type: 'text', label: 'X' }],
      initialValues: { x: 'hello' },
    })

    const wrapper = mountContainer()
    await flushPromises()

    // Click the confirm (second) button
    await wrapper.findAll('.dialog-btn')[1].trigger('click')
    await flushPromises()

    await expect(pending).resolves.toEqual({ action: 'confirm', values: { x: 'hello' } })
  })

  it('cancel flow resolves with action="cancel" and empty values', async () => {
    const { show } = useInputDialog()
    const pending = show({
      title: 'A',
      fields: [{ key: 'x', type: 'text', label: 'X' }],
    })

    const wrapper = mountContainer()
    await flushPromises()

    await wrapper.findAll('.dialog-btn')[0].trigger('click') // Cancel
    await flushPromises()

    await expect(pending).resolves.toEqual({ action: 'cancel', values: {} })
  })

  it('custom action button resolves with the action name + values', async () => {
    const { show } = useInputDialog()
    const pending = show({
      title: 'Save?',
      fields: [{ key: 'note', type: 'text', label: 'Note' }],
      initialValues: { note: 'wip' },
      buttons: [
        { text: 'Cancel', action: 'cancel', variant: 'outlined', color: 'default' },
        { text: 'Save', action: 'save', variant: 'flat', color: 'info' },
      ],
    })

    const wrapper = mountContainer()
    await flushPromises()

    await wrapper.findAll('.dialog-btn')[1].trigger('click') // "Save"
    await flushPromises()

    await expect(pending).resolves.toEqual({
      action: 'save',
      values: { note: 'wip' },
    })
  })

  it('teleports to document.body by default', async () => {
    const { show, cancel } = useInputDialog()
    show({
      title: 'Teleported',
      fields: [{ key: 'x', type: 'text', label: 'X' }],
    })

    const wrapper = mount(InputDialogContainer)
    await flushPromises()

    expect(wrapper.find('.dialog-card').exists()).toBe(false)
    expect(document.body.querySelector('.dialog-card')).not.toBeNull()
    expect(document.body.querySelector('.dialog-title')?.textContent)
      .toContain('Teleported')

    cancel()
    wrapper.unmount()
  })
})
