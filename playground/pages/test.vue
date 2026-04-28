<template>
  <!-- Field types -->
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
        ><rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="2"
        /><line
          x1="9"
          y1="9"
          x2="15"
          y2="9"
        /><line
          x1="9"
          y1="13"
          x2="15"
          y2="13"
        /></svg>
      </span>
      Field types — all 7 supported
    </h2>
    <div class="grid cols-3">
      <button
        class="btn btn-outline"
        @click="testText"
      >
        text
      </button>
      <button
        class="btn btn-outline"
        @click="testPassword"
      >
        password
      </button>
      <button
        class="btn btn-outline"
        @click="testEmail"
      >
        email
      </button>
      <button
        class="btn btn-outline"
        @click="testNumber"
      >
        number
      </button>
      <button
        class="btn btn-outline"
        @click="testTextarea"
      >
        textarea
      </button>
      <button
        class="btn btn-outline"
        @click="testSelect"
      >
        select
      </button>
      <button
        class="btn btn-outline"
        @click="testAutocomplete"
      >
        autocomplete
      </button>
    </div>
  </section>

  <!-- Validation -->
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
        ><circle
          cx="12"
          cy="12"
          r="10"
        /><line
          x1="12"
          y1="8"
          x2="12"
          y2="12"
        /><line
          x1="12"
          y1="16"
          x2="12.01"
          y2="16"
        /></svg>
      </span>
      Validation rules
    </h2>
    <p class="hint">
      Rules run on blur and on submit. Each rule is
      <code>(value) =&gt; true | string</code>. Multiple rules per field
      run in order.
    </p>
    <div class="grid cols-3">
      <button
        class="btn btn-outline"
        @click="testRequired"
      >
        Required
      </button>
      <button
        class="btn btn-outline"
        @click="testMinLength"
      >
        Min length 3
      </button>
      <button
        class="btn btn-outline"
        @click="testEmailRule"
      >
        Email format
      </button>
      <button
        class="btn btn-outline"
        @click="testNumberRange"
      >
        Number range 1-100
      </button>
      <button
        class="btn btn-outline"
        @click="testMultipleRules"
      >
        Multiple rules
      </button>
    </div>
  </section>

  <!-- Autocomplete with create new -->
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
        ><path d="M3 7h18" /><path d="M3 7v13a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
      </span>
      Autocomplete with create-new
    </h2>
    <p class="hint">
      Autocomplete fields with <code>createNew: 'path'</code> auto-format
      typed values with a trailing slash. <code>createNew</code> can also
      be a custom formatter function or <code>false</code> to disable.
    </p>
    <div class="grid cols-2">
      <button
        class="btn btn-outline"
        @click="testAutocompletePath"
      >
        Path (trailing /)
      </button>
      <button
        class="btn btn-outline"
        @click="testAutocompleteCustomFormat"
      >
        Custom formatter (uppercase)
      </button>
      <button
        class="btn btn-outline"
        @click="testAutocompleteSelectOnly"
      >
        Select only (no create)
      </button>
    </div>
  </section>

  <!-- Multi-field forms -->
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
        ><line
          x1="3"
          y1="6"
          x2="21"
          y2="6"
        /><line
          x1="3"
          y1="12"
          x2="21"
          y2="12"
        /><line
          x1="3"
          y1="18"
          x2="21"
          y2="18"
        /></svg>
      </span>
      Multi-field forms
    </h2>
    <div class="grid cols-2">
      <button
        class="btn btn-outline"
        @click="testProfile"
      >
        Profile form
      </button>
      <button
        class="btn btn-outline"
        @click="testSignup"
      >
        Sign-up form
      </button>
      <button
        class="btn btn-outline"
        @click="testServerConfig"
      >
        Server config
      </button>
      <button
        class="btn btn-outline"
        @click="testSaveAs"
      >
        Save As (file + ext)
      </button>
    </div>
  </section>

  <!-- Custom buttons -->
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
        ><rect
          x="3"
          y="6"
          width="18"
          height="12"
          rx="2"
        /></svg>
      </span>
      Custom buttons (3 actions)
    </h2>
    <div class="grid cols-2">
      <button
        class="btn btn-outline"
        @click="testThreeButtons"
      >
        3 actions on a draft
      </button>
    </div>
  </section>

  <!-- Persian / RTL -->
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
        ><circle
          cx="12"
          cy="12"
          r="10"
        /><line
          x1="2"
          y1="12"
          x2="22"
          y2="12"
        /></svg>
      </span>
      Persian / RTL
    </h2>
    <p class="hint">
      Detection runs across <strong>title, message, warning text, and every
        field's label / placeholder / hint</strong> — anywhere Arabic / Persian
      script appears, the dialog flips to <code>dir="rtl"</code> and Shabnam
      renders the text.
    </p>
    <div class="grid cols-2">
      <button
        class="btn btn-info"
        @click="rtlRename"
      >
        تغییر نام
      </button>
      <button
        class="btn btn-warning"
        @click="rtlForm"
      >
        فرم چندفیلدی
      </button>
    </div>
  </section>

  <div
    v-if="lastEvent !== null"
    class="result-box"
    style="max-width: 1080px; margin: 0 auto;"
  >
    Last event: <code>{{ lastEvent }}</code>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const dialog = useInputDialog()
const lastEvent = ref<string | null>(null)

const wrap = async (label: string, fn: () => Promise<unknown>) => {
  const result = await fn()
  lastEvent.value = `${label} → ${JSON.stringify(result)}`
}

// ---- Field types ----
const testText = () => wrap('text', () =>
  dialog.promptText('Text field', 'Type something', { placeholder: 'Hello' }))
const testPassword = () => wrap('password', () => dialog.promptPassword('Password field'))
const testEmail = () => wrap('email', () => dialog.show({
  title: 'Email field',
  fields: [{ key: 'email', type: 'email', label: 'Email address', placeholder: 'you@example.com' }],
}))
const testNumber = () => wrap('number', () =>
  dialog.promptNumber('Number field', 'Enter a number', { defaultValue: 42 }))
const testTextarea = () => wrap('textarea', () => dialog.show({
  title: 'Textarea field',
  fields: [{ key: 'note', type: 'textarea', label: 'Note', rows: 5, placeholder: 'Long text here…' }],
}))
const testSelect = () => wrap('select', () =>
  dialog.promptSelect('Select field', 'Pick one', ['Apple', 'Banana', 'Cherry', 'Date'], { defaultValue: 'Apple' }))
const testAutocomplete = () => wrap('autocomplete', () => dialog.show({
  title: 'Autocomplete field',
  fields: [{
    key: 'fruit',
    type: 'autocomplete',
    label: 'Fruit',
    items: ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Fig', 'Grape'],
    createNew: false,
  }],
}))

// ---- Validation ----
const testRequired = () => wrap('required', () =>
  dialog.promptText('Required', 'Required text', {
    rules: [v => (typeof v === 'string' && v.length > 0) || 'This field is required'],
  }))
const testMinLength = () => wrap('min-length', () =>
  dialog.promptText('Min length 3', 'At least 3 chars', {
    rules: [v => (typeof v === 'string' && v.length >= 3) || 'Must be at least 3 characters'],
  }))
const testEmailRule = () => wrap('email-format', () => dialog.show({
  title: 'Email format',
  fields: [{
    key: 'email',
    type: 'email',
    label: 'Email',
    placeholder: 'you@example.com',
    rules: [
      v => (typeof v === 'string' && v.length > 0) || 'Email is required',
      v => /\S+@\S+\.\S+/.test(String(v)) || 'Invalid email format',
    ],
  }],
}))
const testNumberRange = () => wrap('number-range', () =>
  dialog.promptNumber('Number 1-100', 'Pick a number', {
    rules: [
      v => Number(v) >= 1 || 'Must be at least 1',
      v => Number(v) <= 100 || 'Must be at most 100',
    ],
  }))
const testMultipleRules = () => wrap('multiple-rules', () =>
  dialog.promptText('Username', 'Username', {
    hint: '3–20 chars, lowercase letters, numbers, underscores only',
    rules: [
      v => (typeof v === 'string' && v.length >= 3) || 'At least 3 chars',
      v => (typeof v === 'string' && v.length <= 20) || 'At most 20 chars',
      v => /^[a-z0-9_]+$/.test(String(v)) || 'Only lowercase letters, numbers, and underscores',
    ],
  }))

// ---- Autocomplete ----
const testAutocompletePath = () => wrap('autocomplete-path', () => dialog.show({
  type: 'info',
  title: 'Output folder',
  message: 'Pick an existing folder or type a new path.',
  fields: [{
    key: 'path',
    type: 'autocomplete',
    label: 'Folder',
    placeholder: '/var/log/myapp',
    items: ['/var/log/', '/var/log/nginx/', '/etc/', '/home/user/', '/tmp/'],
    createNew: 'path',
  }],
}))
const testAutocompleteCustomFormat = () => wrap('autocomplete-uppercase', () => dialog.show({
  type: 'info',
  title: 'Pick or create a constant',
  fields: [{
    key: 'name',
    type: 'autocomplete',
    label: 'Constant name',
    items: ['MAX_RETRIES', 'TIMEOUT_MS', 'DEFAULT_PORT'],
    createNew: (raw: string) => raw.toUpperCase().replace(/\s+/g, '_'),
  }],
}))
const testAutocompleteSelectOnly = () => wrap('autocomplete-select-only', () => dialog.show({
  type: 'info',
  title: 'Country',
  fields: [{
    key: 'country',
    type: 'autocomplete',
    label: 'Country',
    items: ['Iran', 'Germany', 'Japan', 'Brazil', 'Australia', 'Canada', 'Mexico'],
    createNew: false,
  }],
}))

// ---- Multi-field forms ----
const testProfile = () => wrap('profile', () =>
  dialog.promptForm('Edit profile', [
    { key: 'name', type: 'text', label: 'Full name', rules: [v => !!v || 'Required'] },
    { key: 'email', type: 'email', label: 'Email', rules: [v => /\S+@\S+\.\S+/.test(String(v)) || 'Invalid email'] },
    { key: 'bio', type: 'textarea', label: 'Bio', rows: 3 },
  ], { initialValues: { name: 'Mostafa', email: 'mostafa@example.com' } }))

const testSignup = () => wrap('signup', () =>
  dialog.promptForm('Create account', [
    { key: 'username', type: 'text', label: 'Username', rules: [v => /^[a-z0-9_]{3,20}$/.test(String(v)) || 'Invalid username'] },
    { key: 'email', type: 'email', label: 'Email', rules: [v => /\S+@\S+\.\S+/.test(String(v)) || 'Invalid email'] },
    { key: 'password', type: 'password', label: 'Password', rules: [v => String(v).length >= 8 || 'At least 8 characters'] },
    { key: 'role', type: 'select', label: 'Role', items: ['Member', 'Admin'], defaultValue: 'Member' },
  ], { type: 'success', confirmText: 'Sign up' }))

const testServerConfig = () => wrap('server-config', () =>
  dialog.promptForm('Server configuration', [
    { key: 'host', type: 'text', label: 'Host', defaultValue: 'localhost' },
    { key: 'port', type: 'number', label: 'Port', defaultValue: 8080, rules: [v => (Number(v) >= 1 && Number(v) <= 65535) || 'Port 1-65535'] },
    { key: 'protocol', type: 'select', label: 'Protocol', items: ['http', 'https', 'ws', 'wss'], defaultValue: 'https' },
    { key: 'logPath', type: 'autocomplete', label: 'Log directory', items: ['/var/log/', '/tmp/'], createNew: 'path', defaultValue: '/var/log/' },
  ], { type: 'warning', warningText: 'Restart required for changes to take effect.' }))

const testSaveAs = () => wrap('save-as', () =>
  dialog.promptSaveAs('untitled', {
    extensions: ['.txt', '.md', '.json', '.yaml', '.xml'],
    defaultExtension: '.md',
    extensionHint: 'Pick a format',
  }))

// ---- Custom buttons ----
const testThreeButtons = () => wrap('3-buttons', () => dialog.show({
  type: 'info',
  title: 'Save changes?',
  message: 'You have unsaved edits to this draft.',
  fields: [
    { key: 'note', type: 'textarea', label: 'Optional note', rows: 2, placeholder: 'What changed?' },
  ],
  buttons: [
    { text: 'Cancel', action: 'cancel', variant: 'outlined', color: 'default' },
    { text: 'Discard', action: 'discard', variant: 'flat', color: 'default' },
    { text: 'Save', action: 'save', variant: 'flat', color: 'info' },
  ],
}))

// ---- Persian / RTL ----
const rtlRename = () => wrap('rtl-rename', () => dialog.show({
  type: 'info',
  title: 'تغییر نام فایل',
  message: 'نام جدید را وارد کنید',
  fields: [{
    key: 'fileName',
    type: 'text',
    label: 'نام فایل',
    placeholder: 'بدون-نام',
    defaultValue: 'گزارش',
    rules: [v => (typeof v === 'string' && v.length > 0) || 'نام فایل الزامی است'],
  }],
  confirmText: 'ذخیره',
  cancelText: 'انصراف',
}))

const rtlForm = () => wrap('rtl-form', () => dialog.promptForm('فرم اطلاعات کاربر', [
  { key: 'name', type: 'text', label: 'نام و نام خانوادگی', rules: [v => !!v || 'نام الزامی است'] },
  { key: 'email', type: 'email', label: 'ایمیل', placeholder: 'you@example.com' },
  { key: 'role', type: 'select', label: 'نقش کاربری', items: ['مدیر', 'ویرایشگر', 'مهمان'], defaultValue: 'مهمان' },
], { confirmText: 'ثبت', cancelText: 'انصراف' }))
</script>
