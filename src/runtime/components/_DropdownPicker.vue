<template>
  <div
    ref="rootRef"
    class="dd-root"
    :class="{ 'is-open': isOpen, 'is-searchable': searchable }"
  >
    <div
      :id="id"
      ref="triggerRef"
      data-dropdown-trigger
      :tabindex="searchable ? -1 : 0"
      role="combobox"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      class="dd-trigger"
      @click="toggle"
      @keydown="onTriggerKeydown"
    >
      <input
        v-if="searchable"
        ref="inputRef"
        v-model="searchText"
        type="text"
        :placeholder="placeholder"
        class="dd-input dd-input-search"
        @focus="open"
        @input="onInput"
        @keydown.stop="onInputKeydown"
      >
      <span
        v-else-if="modelValue !== undefined && modelValue !== null && String(modelValue) !== ''"
        class="dd-value"
      >
        {{ modelValue }}
      </span>
      <span
        v-else
        class="dd-placeholder"
      >{{ placeholder }}</span>
      <span
        class="dd-caret"
        aria-hidden="true"
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
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </span>
    </div>

    <transition name="dd-fade">
      <div
        v-if="isOpen"
        class="dd-panel"
        role="listbox"
      >
        <ul class="dd-list">
          <li
            v-for="(item, idx) in displayItems"
            :key="`${idx}-${String(item.value)}`"
            role="option"
            :aria-selected="item.value === modelValue"
            :class="[
              'dd-item',
              { 'is-active': idx === activeIndex },
              { 'is-selected': item.value === modelValue },
              { 'is-create': item.isCreate },
            ]"
            @mousedown.prevent="pick(item)"
            @mouseenter="activeIndex = idx"
          >
            <span
              v-if="item.isCreate"
              class="dd-create-icon"
              aria-hidden="true"
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
              >
                <line
                  x1="12"
                  y1="5"
                  x2="12"
                  y2="19"
                />
                <line
                  x1="5"
                  y1="12"
                  x2="19"
                  y2="12"
                />
              </svg>
            </span>
            <span class="dd-item-text">
              {{ item.isCreate ? `Create "${item.value}"` : item.value }}
            </span>
            <span
              v-if="item.isCreate"
              class="dd-create-badge"
            >New</span>
          </li>

          <li
            v-if="displayItems.length === 0"
            class="dd-item is-empty"
          >
            <span class="dd-item-text">No options</span>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'

interface DisplayItem {
  value: unknown
  isCreate: boolean
}

const props = withDefaults(
  defineProps<{
    id?: string
    modelValue: unknown
    items: unknown[]
    placeholder?: string
    /**
     * When true, the trigger renders an `<input>` for typing. The list
     * filters as the user types. Used for `autocomplete` field type.
     */
    searchable?: boolean
    /**
     * When true, typing a value not in `items` surfaces a "Create" item
     * at the top of the dropdown. Independent of `searchable` — usually
     * paired with it (autocomplete + createNew). Ignored when not searchable.
     */
    allowCreate?: boolean
    /** Optional formatter for the new value before commit. */
    formatCreate?: (raw: string) => string
  }>(),
  {
    id: undefined,
    placeholder: 'Select…',
    searchable: false,
    allowCreate: false,
    formatCreate: undefined,
  },
)

const emit = defineEmits<{ 'update:modelValue': [unknown] }>()

const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

const isOpen = ref(false)
const searchText = ref('')
const activeIndex = ref(-1)

// Keep searchText in sync with the bound value when searchable.
watch(() => props.modelValue, (v) => {
  if (props.searchable && typeof v === 'string') {
    searchText.value = v
  }
}, { immediate: true })

// Items filtered by the current search text (only when searchable).
const filtered = computed<DisplayItem[]>(() => {
  const items = props.items ?? []
  if (!props.searchable || !searchText.value) {
    return items.map(value => ({ value, isCreate: false }))
  }
  const needle = searchText.value.toLowerCase()
  return items
    .filter(v => String(v).toLowerCase().includes(needle))
    .map(value => ({ value, isCreate: false }))
})

const displayItems = computed<DisplayItem[]>(() => {
  // Without create-new, just show the filtered items.
  if (!props.searchable || !props.allowCreate) return filtered.value
  if (!searchText.value) return filtered.value

  const formatted = props.formatCreate
    ? props.formatCreate(searchText.value)
    : searchText.value

  // Surface "Create" only if the formatted value isn't already in items.
  const exists = props.items.some(v => String(v) === formatted)
  if (exists) return filtered.value

  return [{ value: formatted, isCreate: true }, ...filtered.value]
})

const open = (): void => {
  isOpen.value = true
  activeIndex.value = displayItems.value.findIndex(item => item.value === props.modelValue)
}
const close = (): void => {
  isOpen.value = false
  activeIndex.value = -1
}
const toggle = async (): Promise<void> => {
  if (isOpen.value) {
    close()
  }
  else {
    open()
    await nextTick()
    if (props.searchable) inputRef.value?.focus()
  }
}

const pick = (item: DisplayItem): void => {
  emit('update:modelValue', item.value)
  if (props.searchable) {
    searchText.value = String(item.value)
  }
  close()
}

const onInput = (): void => {
  if (!isOpen.value) open()
  activeIndex.value = displayItems.value.length > 0 ? 0 : -1
}

const onInputKeydown = (e: KeyboardEvent): void => {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (!isOpen.value) open()
    activeIndex.value = Math.min(activeIndex.value + 1, displayItems.value.length - 1)
  }
  else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
  }
  else if (e.key === 'Enter') {
    e.preventDefault()
    const idx = activeIndex.value >= 0 ? activeIndex.value : 0
    const item = displayItems.value[idx]
    if (item) pick(item)
    else if (props.allowCreate && searchText.value) {
      const formatted = props.formatCreate ? props.formatCreate(searchText.value) : searchText.value
      pick({ value: formatted, isCreate: true })
    }
  }
  else if (e.key === 'Escape') {
    e.preventDefault()
    close()
  }
}

const onTriggerKeydown = (e: KeyboardEvent): void => {
  if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
    e.preventDefault()
    if (!isOpen.value) {
      open()
      if (props.searchable) {
        nextTick(() => inputRef.value?.focus())
      }
    }
    else if (e.key === 'ArrowDown') {
      activeIndex.value = Math.min(activeIndex.value + 1, displayItems.value.length - 1)
    }
  }
  else if (e.key === 'Escape') {
    e.preventDefault()
    close()
  }
}

const onClickOutside = (e: MouseEvent): void => {
  if (!rootRef.value) return
  if (!rootRef.value.contains(e.target as Node)) {
    close()
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    document.addEventListener('mousedown', onClickOutside)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    document.removeEventListener('mousedown', onClickOutside)
  }
})
</script>

<style scoped>
.dd-root {
  position: relative;
  width: 100%;
}

.dd-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 56px;
  padding: 22px 14px 8px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(127, 157, 187, 0.5);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
  box-sizing: border-box;
}

.dd-root.is-searchable .dd-trigger {
  cursor: text;
}

.dd-trigger:hover {
  border-color: rgba(255, 255, 255, 0.45);
}

.dd-trigger:focus,
.dd-root.is-open .dd-trigger {
  outline: none;
  border-color: #00ffff;
  background: rgba(0, 0, 0, 0.4);
}

.dd-input-search {
  flex: 1;
  background: transparent;
  border: 0;
  outline: none;
  color: white;
  font-size: 14px;
  font-family: inherit;
  padding: 0;
}

/* Hide the search input's own placeholder — the field's floating
 * label takes that role. */
.dd-input-search::placeholder {
  color: transparent;
}

.dd-value,
.dd-placeholder {
  flex: 1;
  text-align: start;
  pointer-events: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Static placeholder hidden in favor of the floating label */
.dd-placeholder {
  color: transparent;
}

.dd-caret {
  display: inline-flex;
  color: rgba(255, 255, 255, 0.55);
  transition: transform 0.18s ease, color 0.15s ease;
  flex-shrink: 0;
}

.dd-root.is-open .dd-caret {
  transform: rotate(180deg);
  color: #00ffff;
}

/* ----- Panel ----- */
.dd-panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 10;
  max-height: 220px;
  overflow-y: auto;
  background: radial-gradient(
    120% 104.06% at 50.07% -4%,
    rgba(51, 78, 104, 0.98) 1.9%,
    rgba(25, 29, 35, 0.98) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.18);
  -webkit-backdrop-filter: blur(12.5px);
  backdrop-filter: blur(12.5px);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.dd-fade-enter-active,
.dd-fade-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.dd-fade-enter-from,
.dd-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.dd-list {
  list-style: none;
  margin: 0;
  padding: 4px;
}

.dd-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 8px 12px;
  color: rgba(255, 255, 255, 0.92);
  cursor: pointer;
  border-radius: 6px;
  font-size: 14px;
  user-select: none;
  transition: background 0.1s ease;
}

.dd-item.is-active,
.dd-item:hover {
  background: rgba(0, 255, 255, 0.15);
}

.dd-item.is-selected {
  background: rgba(0, 255, 255, 0.25);
  color: #00ffff;
  font-weight: 600;
}

.dd-item.is-empty {
  color: rgba(255, 255, 255, 0.5);
  cursor: default;
}
.dd-item.is-empty:hover {
  background: transparent;
}

.dd-item-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dd-create-icon {
  display: inline-flex;
  color: #30e0a1;
  flex-shrink: 0;
}

.dd-create-badge {
  font-size: 10px;
  font-weight: 600;
  color: #30e0a1;
  background: rgba(48, 224, 161, 0.15);
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.dd-panel::-webkit-scrollbar {
  width: 6px;
}
.dd-panel::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}
.dd-panel::-webkit-scrollbar-thumb {
  background: rgba(0, 255, 255, 0.3);
  border-radius: 3px;
}
.dd-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 255, 255, 0.5);
}
</style>
