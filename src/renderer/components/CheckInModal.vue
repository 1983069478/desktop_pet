<template>
  <Transition name="modal">
    <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-card">
        <div class="modal-header">
          <span class="modal-title">📝 快捷打卡</span>
          <button class="close-btn" @click="$emit('close')">✕</button>
        </div>

        <div class="modal-body">
          <input
            v-model="taskName"
            class="task-input"
            type="text"
            maxlength="20"
            placeholder="今天做了什么？（选填）"
          />

          <div class="attr-list">
            <button
              v-for="attr in attributes"
              :key="attr.key"
              class="attr-btn"
              :class="{ selected: selectedAttr === attr.key }"
              @click="selectedAttr = attr.key"
            >
              {{ attr.label }}
            </button>
          </div>
        </div>

        <button
          class="submit-btn"
          :disabled="!selectedAttr"
          @click="onSubmit"
        >
          ✅ 打卡 (+10)
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePetStore, ATTRIBUTE_LABELS, type AttributeKey } from '../stores/petStore'

defineProps<{ visible: boolean }>()
const emit = defineEmits<{ close: [attrLabel?: string] }>()

const store = usePetStore()
const taskName = ref('')
const selectedAttr = ref<AttributeKey | null>(null)

const attributes = (Object.entries(ATTRIBUTE_LABELS) as [AttributeKey, string][]).map(
  ([key, label]) => ({ key, label }),
)

function onSubmit() {
  if (!selectedAttr.value) return
  const label = ATTRIBUTE_LABELS[selectedAttr.value]
  store.checkIn(selectedAttr.value)
  taskName.value = ''
  selectedAttr.value = null
  emit('close', label)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(6px);
  z-index: 100;
}

.modal-card {
  width: 180px;
  background: linear-gradient(145deg, #1e1b4b, #312e81);
  border: 1px solid rgba(167, 139, 250, 0.45);
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 13px;
  font-weight: 700;
  color: #e0e7ff;
}

.close-btn {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  color: #a5b4fc;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.18);
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.task-input {
  padding: 6px 8px;
  border: 1px solid rgba(167, 139, 250, 0.25);
  border-radius: 7px;
  background: rgba(0, 0, 0, 0.25);
  color: #e0e7ff;
  font-size: 11px;
  outline: none;
  box-sizing: border-box;
  width: 100%;
}

.task-input::placeholder {
  color: rgba(165, 180, 252, 0.35);
}

.task-input:focus {
  border-color: rgba(167, 139, 250, 0.6);
}

.attr-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.attr-btn {
  padding: 6px 10px;
  border: 1px solid rgba(167, 139, 250, 0.2);
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.03);
  color: #c7d2fe;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.12s;
  text-align: left;
  width: 100%;
}

.attr-btn:hover {
  background: rgba(167, 139, 250, 0.12);
  border-color: rgba(167, 139, 250, 0.35);
}

.attr-btn.selected {
  background: rgba(167, 139, 250, 0.22);
  border-color: rgba(167, 139, 250, 0.55);
  color: #fff;
  font-weight: 600;
}

.submit-btn {
  padding: 8px 0;
  border: none;
  border-radius: 9px;
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(124, 58, 237, 0.45);
}

.submit-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* 过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active .modal-card,
.modal-leave-active .modal-card {
  transition: transform 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal-card {
  transform: scale(0.85);
}
.modal-leave-to .modal-card {
  transform: scale(0.85);
}
</style>
