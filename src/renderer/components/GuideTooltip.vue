<template>
  <Transition name="fade-guide">
    <div v-if="visible" class="guide-tooltip-overlay">
      <div class="guide-card">
        <div class="guide-header">
          <span class="guide-step-tag">Step {{ currentStep + 1 }}/{{ steps.length }}</span>
          <button class="skip-btn" @click="finishGuide">跳过 ✕</button>
        </div>

        <div class="guide-body">
          <div class="guide-icon">{{ steps[currentStep].icon }}</div>
          <div class="guide-text">
            <div class="guide-title">{{ steps[currentStep].title }}</div>
            <div class="guide-desc">{{ steps[currentStep].desc }}</div>
          </div>
        </div>

        <div class="guide-footer">
          <button
            v-if="currentStep > 0"
            class="guide-btn prev"
            @click="currentStep--"
          >
            ← 上一步
          </button>
          <button
            v-if="currentStep < steps.length - 1"
            class="guide-btn next"
            @click="currentStep++"
          >
            下一个 →
          </button>
          <button
            v-else
            class="guide-btn finish"
            @click="finishGuide"
          >
            🎉 开启体验
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ close: [] }>()

const currentStep = ref(0)

// 重置步骤
watch(() => props.visible, (val) => {
  if (val) currentStep.value = 0
})

interface GuideStep {
  icon: string
  title: string
  desc: string
}

const steps: GuideStep[] = [
  {
    icon: '💡',
    title: '单击宠物',
    desc: '鼠标左键单击宠物，触发萌趣跳跃与动画反馈。',
  },
  {
    icon: '📊',
    title: '双击身份证',
    desc: '快速双击宠物，打开宠物身份证查看属性与链上 NFT。',
  },
  {
    icon: '🖱️',
    title: '按住拖拽',
    desc: '按住宠物不放并拖动，可自由挪动宠物在桌面上的位置。',
  },
  {
    icon: '📝',
    title: '右键菜单',
    desc: '右键点击宠物，开启每日快捷打卡、积累经验与进化！',
  },
]

function finishGuide() {
  localStorage.setItem('hasSeenGuide', 'true')
  emit('close')
}
</script>

<style scoped>
.guide-tooltip-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  z-index: 150;
  pointer-events: auto;
}

.guide-card {
  width: 168px;
  background: linear-gradient(145deg, #2e1065, #4c1d95);
  border: 1px solid rgba(196, 181, 253, 0.5);
  border-radius: 14px;
  padding: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-sizing: border-box;
}

.guide-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.guide-step-tag {
  font-size: 10px;
  font-weight: 700;
  color: #ddd6fe;
  background: rgba(255, 255, 255, 0.12);
  padding: 2px 6px;
  border-radius: 8px;
}

.skip-btn {
  border: none;
  background: transparent;
  color: #a78bfa;
  font-size: 10px;
  cursor: pointer;
  padding: 2px 4px;
}
.skip-btn:hover {
  color: #fff;
}

.guide-body {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 2px 0;
}

.guide-icon {
  font-size: 22px;
  line-height: 1;
  flex-shrink: 0;
}

.guide-text {
  flex: 1;
  min-width: 0;
}

.guide-title {
  font-size: 12px;
  font-weight: 700;
  color: #f5f3ff;
  margin-bottom: 2px;
}

.guide-desc {
  font-size: 10px;
  color: #c4b5fd;
  line-height: 1.35;
}

.guide-footer {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 2px;
}

.guide-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.12s ease;
}

.guide-btn.prev {
  background: rgba(255, 255, 255, 0.1);
  color: #c4b5fd;
}
.guide-btn.prev:hover {
  background: rgba(255, 255, 255, 0.2);
}

.guide-btn.next, .guide-btn.finish {
  background: linear-gradient(135deg, #7c3aed, #a78bfa);
  color: #fff;
}
.guide-btn.next:hover, .guide-btn.finish:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.4);
}

/* 过渡动画 */
.fade-guide-enter-active,
.fade-guide-leave-active {
  transition: opacity 0.2s ease;
}
.fade-guide-enter-from,
.fade-guide-leave-to {
  opacity: 0;
}
</style>
