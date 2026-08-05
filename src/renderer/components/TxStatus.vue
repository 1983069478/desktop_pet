<template>
  <Transition name="toast">
    <div v-if="visible" class="tx-toast" :class="statusClass">
      <span class="tx-icon">{{ statusIcon }}</span>
      <div class="tx-content">
        <div class="tx-title">{{ statusTitle }}</div>
        <div v-if="message" class="tx-msg">{{ message }}</div>
        <a
          v-if="explorerUrl"
          :href="explorerUrl"
          class="tx-link"
          target="_blank"
          @click.stop
        >
          🔗 在 Monad 浏览器中查看 →
        </a>
      </div>
      <button v-if="closable" class="tx-close" @click="$emit('close')">✕</button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type TxPhase = 'idle' | 'sending' | 'confirming' | 'success' | 'error'

const props = defineProps<{
  phase: TxPhase
  message?: string
  explorerUrl?: string
}>()

defineEmits<{ close: [] }>()

const visible = computed(() => props.phase !== 'idle')
const closable = computed(() => props.phase === 'success' || props.phase === 'error')

const statusClass = computed(() => ({
  sending: props.phase === 'sending' || props.phase === 'confirming',
  success: props.phase === 'success',
  error: props.phase === 'error',
}))

const statusIcon = computed(() => {
  switch (props.phase) {
    case 'sending':
    case 'confirming':
      return '⏳'
    case 'success':
      return '✅'
    case 'error':
      return '❌'
    default:
      return ''
  }
})

const statusTitle = computed(() => {
  switch (props.phase) {
    case 'sending':
      return '正在发送交易...'
    case 'confirming':
      return '等待区块确认...'
    case 'success':
      return '交易成功！'
    case 'error':
      return '交易失败'
    default:
      return ''
  }
})
</script>

<style scoped>
.tx-toast {
  position: fixed;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 12px;
  background: rgba(30, 27, 75, 0.95);
  border: 1px solid rgba(167, 139, 250, 0.3);
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  z-index: 200;
  max-width: 190px;
  font-size: 11px;
}

.tx-toast.sending {
  border-color: rgba(250, 204, 21, 0.5);
}

.tx-toast.success {
  border-color: rgba(74, 222, 128, 0.5);
}

.tx-toast.error {
  border-color: rgba(248, 113, 113, 0.5);
}

.tx-icon {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}

.tx-content {
  flex: 1;
  min-width: 0;
}

.tx-title {
  font-weight: 600;
  color: #e0e7ff;
  margin-bottom: 2px;
}

.tx-msg {
  color: #a5b4fc;
  font-size: 10px;
  word-break: break-all;
}

.tx-link {
  display: inline-block;
  margin-top: 4px;
  color: #818cf8;
  text-decoration: none;
  font-size: 10px;
}

.tx-link:hover {
  color: #a5b4fc;
  text-decoration: underline;
}

.tx-close {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  color: #a5b4fc;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 过渡动画 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}
</style>
