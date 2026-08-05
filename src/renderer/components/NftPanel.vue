<template>
  <Transition name="panel">
    <div v-if="visible" class="panel-overlay" @click.self="$emit('close')">
      <div class="panel-card">
        <!-- 标题栏 -->
        <div class="panel-header">
          <span class="panel-title">🐾 宠物身份证</span>
          <button class="close-btn" @click="$emit('close')">✕</button>
        </div>

        <!-- 链上信息 -->
        <div class="section">
          <div class="section-title">🔗 链上信息</div>
          <div class="info-row">
            <span class="label">Token ID</span>
            <span class="value highlight">{{ store.tokenId !== null ? '#' + store.tokenId : '未铸造' }}</span>
          </div>
          <div class="info-row">
            <span class="label">合约地址</span>
            <a class="value link" :href="contractUrl" target="_blank" @click.stop>
              {{ shortAddress }} ↗
            </a>
          </div>
          <div class="info-row">
            <span class="label">当前阶段</span>
            <span class="value">{{ store.currentInfo.name }}</span>
          </div>
        </div>

        <!-- 四维属性 -->
        <div class="section">
          <div class="section-title">📊 成长属性</div>
          <div class="attr-chart">
            <div v-for="attr in attributes" :key="attr.key" class="attr-row">
              <span class="attr-name">{{ attr.label }}</span>
              <div class="attr-bar-track">
                <div
                  class="attr-bar-fill"
                  :style="{ width: barWidth(store.stats[attr.key]) }"
                ></div>
              </div>
              <span class="attr-val">{{ store.stats[attr.key] }}</span>
            </div>
          </div>
          <div class="total-exp">
            累计经验：<strong>{{ store.totalExp }}</strong>
          </div>
        </div>

        <!-- 底部链接 -->
        <div class="panel-footer">
          <a
            v-if="store.tokenId !== null"
            class="footer-link"
            :href="nftUrl"
            target="_blank"
            @click.stop
          >
            🔍 在 Monad 浏览器查看 NFT →
          </a>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePetStore, ATTRIBUTE_LABELS, type AttributeKey } from '../stores/petStore'
import { CONTRACT_ADDRESS } from '../../contracts/address'

defineProps<{ visible: boolean }>()
defineEmits<{ close: [] }>()

const store = usePetStore()

// ---- 属性列表 ----

const attributes = (Object.entries(ATTRIBUTE_LABELS) as [AttributeKey, string][]).map(
  ([key, label]) => ({ key, label }),
)

// ---- 柱状图宽度（最大值按 50 封顶算百分比） ----

const MAX_BAR = 50

function barWidth(val: number): string {
  return Math.min(100, (val / MAX_BAR) * 100) + '%'
}

// ---- 地址显示 ----

const shortAddress = computed(() => {
  const addr = CONTRACT_ADDRESS
  return addr.slice(0, 6) + '...' + addr.slice(-4)
})

const contractUrl = computed(() => {
  return `https://testnet.monadvision.com/address/${CONTRACT_ADDRESS}`
})

const nftUrl = computed(() => {
  return `https://testnet.monadvision.com/address/${CONTRACT_ADDRESS}`
})
</script>

<style scoped>
.panel-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(6px);
  z-index: 100;
}

.panel-card {
  width: 210px;
  max-height: 95vh;
  overflow-y: auto;
  background: linear-gradient(160deg, #1e1b4b, #312e81);
  border: 1px solid rgba(167, 139, 250, 0.4);
  border-radius: 16px;
  padding: 14px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.panel-title {
  font-size: 14px;
  font-weight: 700;
  color: #e0e7ff;
}

.close-btn {
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  color: #a5b4fc;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover { background: rgba(255, 255, 255, 0.18); }

/* ---- 分区 ---- */

.section {
  margin-bottom: 12px;
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  color: #a78bfa;
  margin-bottom: 6px;
  letter-spacing: 0.3px;
}

/* ---- 信息行 ---- */

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 0;
  font-size: 11px;
}

.label { color: #a5b4fc; }

.value { color: #e0e7ff; }

.value.highlight {
  color: #fbbf24;
  font-weight: 700;
  font-size: 13px;
}

.value.link {
  color: #818cf8;
  text-decoration: none;
}

.value.link:hover { text-decoration: underline; }

/* ---- 属性柱状图 ---- */

.attr-chart {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.attr-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.attr-name {
  width: 50px;
  font-size: 10px;
  color: #c7d2fe;
  flex-shrink: 0;
}

.attr-bar-track {
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.attr-bar-fill {
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, #6366f1, #a78bfa);
  transition: width 0.5s ease;
}

.attr-val {
  width: 24px;
  text-align: right;
  font-size: 10px;
  color: #e0e7ff;
  font-weight: 600;
  flex-shrink: 0;
}

/* ---- 总经验 ---- */

.total-exp {
  margin-top: 6px;
  font-size: 10px;
  color: #a5b4fc;
  text-align: right;
}

.total-exp strong {
  color: #e0e7ff;
  font-size: 12px;
}

/* ---- 底部链接 ---- */

.panel-footer {
  margin-top: 4px;
}

.footer-link {
  display: block;
  text-align: center;
  font-size: 10px;
  color: #818cf8;
  text-decoration: none;
  padding: 6px 0;
  border-radius: 8px;
  background: rgba(99, 102, 241, 0.1);
}

.footer-link:hover {
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
}

/* ---- 过渡动画 ---- */

.panel-enter-active,
.panel-leave-active { transition: opacity 0.2s ease; }

.panel-enter-active .panel-card,
.panel-leave-active .panel-card { transition: transform 0.2s ease; }

.panel-enter-from,
.panel-leave-to { opacity: 0; }

.panel-enter-from .panel-card { transform: scale(0.9); }

.panel-leave-to .panel-card { transform: scale(0.9); }
</style>
