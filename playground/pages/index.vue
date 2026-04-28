<template>
  <section class="test-card">
    <h2>
      <span class="section-icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        ><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
      </span>
      Convenience methods
    </h2>
    <p class="hint">
      Each prompt method returns <code>Promise&lt;T | null&gt;</code> —
      the captured value if confirmed, <code>null</code> if cancelled.
    </p>
    <div class="grid cols-3">
      <button
        class="btn btn-info"
        @click="onPromptText"
      >
        promptText()
      </button>
      <button
        class="btn btn-warning"
        @click="onPromptPassword"
      >
        promptPassword()
      </button>
      <button
        class="btn btn-info"
        @click="onPromptNumber"
      >
        promptNumber()
      </button>
      <button
        class="btn btn-info"
        @click="onPromptSelect"
      >
        promptSelect()
      </button>
      <button
        class="btn btn-success"
        @click="onPromptSaveAs"
      >
        promptSaveAs()
      </button>
      <button
        class="btn btn-outline"
        @click="onPromptForm"
      >
        promptForm()
      </button>
    </div>
    <div
      v-if="lastResult !== null"
      class="result-box"
    >
      Last result: <code>{{ JSON.stringify(lastResult) }}</code>
    </div>
  </section>

  <section class="test-card">
    <h2>
      <span class="section-icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        ><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
      </span>
      Custom <code>show()</code>
    </h2>
    <p class="hint">
      <code>useInputDialog().show({ ... })</code> resolves with
      <code>{ action, values }</code>. Use it for multi-field forms,
      custom buttons, or autocomplete fields with create-new logic.
    </p>
    <div class="grid cols-2">
      <button
        class="btn btn-outline"
        @click="onAutocompletePath"
      >
        Autocomplete path (create new)
      </button>
      <button
        class="btn btn-outline"
        @click="onPersian"
      >
        Persian (RTL)
      </button>
    </div>
    <div
      v-if="lastAction !== null"
      class="result-box"
    >
      Last action: <code>{{ lastAction }}</code>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const dialog = useInputDialog()

const lastResult = ref<unknown>(null)
const lastAction = ref<string | null>(null)

const onPromptText = async () => {
  lastResult.value = await dialog.promptText('Rename file', 'New file name', {
    defaultValue: 'untitled',
    rules: [v => (typeof v === 'string' && v.length > 0) || 'Name is required'],
  })
}

const onPromptPassword = async () => {
  lastResult.value = await dialog.promptPassword('Authentication required', {
    message: 'Enter your password to continue.',
  })
}

const onPromptNumber = async () => {
  lastResult.value = await dialog.promptNumber('Quantity', 'How many?', {
    defaultValue: 1,
    rules: [v => Number(v) > 0 || 'Must be greater than 0'],
  })
}

const onPromptSelect = async () => {
  lastResult.value = await dialog.promptSelect(
    'Theme color',
    'Pick a theme',
    ['Default', 'Light', 'Dark', 'High contrast'],
    { defaultValue: 'Default' },
  )
}

const onPromptSaveAs = async () => {
  lastResult.value = await dialog.promptSaveAs('document', {
    extensions: ['.txt', '.md', '.json', '.xml'],
    defaultExtension: '.md',
  })
}

const onPromptForm = async () => {
  lastResult.value = await dialog.promptForm(
    'Edit profile',
    [
      { key: 'name', type: 'text', label: 'Full name', rules: [v => (typeof v === 'string' && v.length > 0) || 'Name is required'] },
      { key: 'email', type: 'email', label: 'Email', placeholder: 'you@example.com', rules: [v => /\S+@\S+\.\S+/.test(String(v)) || 'Invalid email'] },
      { key: 'bio', type: 'textarea', label: 'Bio', placeholder: 'Tell us about yourself…', rows: 4 },
      { key: 'role', type: 'select', label: 'Role', items: ['Owner', 'Admin', 'Member', 'Guest'], defaultValue: 'Member' },
    ],
    {
      initialValues: { name: '', email: '', bio: '', role: 'Member' },
    },
  )
}

const onAutocompletePath = async () => {
  const result = await dialog.show({
    type: 'info',
    title: 'Pick or create a folder',
    message: 'Type a path. If it doesn\'t exist, you can create it.',
    fields: [{
      key: 'path',
      type: 'autocomplete',
      label: 'Folder path',
      placeholder: '/var/log/myapp',
      items: ['/var/log/', '/var/log/nginx/', '/etc/', '/home/user/'],
      createNew: 'path',
      rules: [v => (typeof v === 'string' && v.length > 0) || 'Path is required'],
    }],
    confirmText: 'Use path',
  })
  lastAction.value = `${result.action} → ${JSON.stringify(result.values)}`
}

const onPersian = async () => {
  const result = await dialog.show({
    type: 'info',
    title: 'تغییر نام فایل',
    message: 'نام جدید را وارد کنید',
    fields: [{
      key: 'fileName',
      type: 'text',
      label: 'نام فایل',
      placeholder: 'بدون-نام',
      rules: [v => (typeof v === 'string' && v.length > 0) || 'نام فایل الزامی است'],
      defaultValue: 'گزارش',
    }],
    confirmText: 'ذخیره',
    cancelText: 'انصراف',
  })
  lastAction.value = `${result.action} → ${JSON.stringify(result.values)}`
}
</script>
