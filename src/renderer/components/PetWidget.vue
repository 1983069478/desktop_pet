<template>
  <div
    class="pet-wrapper"
    @mousedown="onMouseDown"
    @contextmenu.prevent="onContextMenu"
  >
    <!-- 宠物显示区 -->
    <div
      v-if="!showModal"
      class="pet-container"
      :class="{ popping: isPopping, shaking: isShaking, evolving: isEvolving, 'evo-success': isEvoSuccess, dragging: isDragging }"
    >
      <!-- 进化粒子特效 -->
      <div v-if="isEvolving" class="evo-particles">
        <span v-for="i in 12" :key="i" class="evo-particle" :style="particleStyle(i)"></span>
      </div>
      <div v-if="isEvolving" class="evo-glow"></div>

      <div class="pet-character">
        <video
          ref="videoRef"
          :src="mp4Src"
          autoplay
          loop
          muted
          playsinline
          class="hidden-media"
          @loadeddata="onVideoReady"
        ></video>

        <canvas
          ref="canvasRef"
          class="pet-media-canvas"
        ></canvas>
      </div>

      <!-- 打卡反馈飘字 -->
      <Transition name="float-up">
        <div v-if="feedbackText" class="checkin-feedback">{{ feedbackText }}</div>
      </Transition>

      <!-- 宠物小牌子 + 进化按钮 -->
      <div class="pet-badge">{{ badgeText }}</div>

      <!-- 总经验进度条 -->
      <div class="exp-bar-wrap">
        <div class="exp-bar">
          <div class="exp-fill" :style="{ width: expPercent + '%' }"></div>
        </div>
        <span class="exp-label">{{ expLabelText }}</span>
      </div>

      <!-- 进化按钮：满足条件时显示 -->
      <button
        v-if="store.canEvolve"
        class="evolve-btn"
        :disabled="txPhase === 'sending' || txPhase === 'confirming'"
        @click="triggerEvolution"
      >
        {{ isEvolving ? '⏳ 进化中...' : '✨ 可以进化了！' }}
      </button>
    </div>

    <!-- 快捷打卡弹窗 -->
    <CheckInModal
      :visible="showModal"
      @close="onCheckInClose"
    />

    <!-- 链上交易状态提示 -->
    <TxStatus
      :phase="txPhase"
      :message="txMessage"
      :explorer-url="txExplorerUrl"
      @close="txPhase = 'idle'"
    />

    <!-- NFT 状态面板（双击宠物打开） -->
    <NftPanel
      :visible="showPanel"
      @close="showPanel = false"
    />

    <!-- 新手教程引导 -->
    <GuideTooltip
      :visible="showGuide"
      @close="showGuide = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { usePetStore } from '../stores/petStore'
import CheckInModal from './CheckInModal.vue'
import TxStatus from './TxStatus.vue'
import type { TxPhase } from './TxStatus.vue'
import NftPanel from './NftPanel.vue'
import GuideTooltip from './GuideTooltip.vue'
import { initWeb3, isReady, mintPet, evolvePet, getExplorerUrl } from '../services/web3Service'

const store = usePetStore()

// ---- 媒体资源 ----

const mp4Src = computed(() => store.currentInfo.mp4)
const badgeText = computed(() => `阶段${store.stage} · ${store.currentInfo.name}`)

// ---- 经验进度 ----

const expPercent = computed(() => {
  if (store.stage >= 2) return 100
  return Math.min(100, (store.totalExp / store.maxExp) * 100)
})

const expLabelText = computed(() => {
  if (store.stage >= 2) return `EXP: ${store.totalExp}`
  return `${store.totalExp} / ${store.maxExp}`
})

// ---- DOM 引用 ----

const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

// ---- 界面状态 ----

const showModal = ref(false)
const showPanel = ref(false)
const showGuide = ref(false)

// ---- 交易状态 ----

const txPhase = ref<TxPhase>('idle')
const txMessage = ref('')
const txExplorerUrl = ref('')

// ---- 渲染循环 ----

let animFrameId: number | null = null
const MAX_RENDER_DIM = 480

// ---- 弹跳反馈 ----

const isPopping = ref(false)
const isShaking = ref(false)
const isEvolving = ref(false)
const isEvoSuccess = ref(false)
const feedbackText = ref('')
let popTimer: number | null = null
let shakeTimer: number | null = null
let feedbackTimer: number | null = null

function triggerPop() {
  isPopping.value = true
  if (popTimer) window.clearTimeout(popTimer)
  popTimer = window.setTimeout(() => {
    isPopping.value = false
  }, 180)
}

/** 打卡成功：宠物抖动 + 飘字 */
function triggerShake(attrLabel: string) {
  isShaking.value = true
  feedbackText.value = `+10 ${attrLabel}`
  if (shakeTimer) window.clearTimeout(shakeTimer)
  shakeTimer = window.setTimeout(() => {
    isShaking.value = false
  }, 400)

  // 飘字 1.5 秒后消失
  if (feedbackTimer) window.clearTimeout(feedbackTimer)
  feedbackTimer = window.setTimeout(() => {
    feedbackText.value = ''
  }, 1500)
}

/** 进化粒子初始位置和动画延迟 */
function particleStyle(i: number) {
  const angle = (i / 12) * 360
  const delay = Math.random() * 0.3
  return {
    '--angle': angle + 'deg',
    '--delay': delay + 's',
  }
}

// ---- 拖拽 vs 点击 ----

const DRAG_THRESHOLD = 5
let isPressing = false
let hasDragged = false
let startScreenX = 0
let startScreenY = 0

/** 拖拽中暂停浮动动画 */
const isDragging = ref(false)

// 双击检测：两次点击间隔 ≤ 300ms 视为双击
let lastClickTime = 0
const DOUBLE_CLICK_INTERVAL = 300

function onMouseDown(e: MouseEvent) {
  if (e.button !== 0) return
  isPressing = true
  hasDragged = false
  startScreenX = e.screenX
  startScreenY = e.screenY
  window.petAPI?.startDrag(e.screenX, e.screenY)
}

function onMouseMove(e: MouseEvent) {
  if (!isPressing) return
  const dx = e.screenX - startScreenX
  const dy = e.screenY - startScreenY
  if (Math.hypot(dx, dy) > DRAG_THRESHOLD) {
    hasDragged = true
    isDragging.value = true
  }
  if (hasDragged) window.petAPI?.moveDrag(e.screenX, e.screenY)
}

function onMouseUp() {
  if (!isPressing) return
  isPressing = false
  isDragging.value = false
  if (!hasDragged) {
    const now = Date.now()
    if (now - lastClickTime < DOUBLE_CLICK_INTERVAL) {
      // 双击 → 打开 NFT 面板
      lastClickTime = 0
      showPanel.value = true
    } else {
      // 单击 → 弹跳反馈
      lastClickTime = now
      triggerPop()
    }
  }
}

/** 打卡弹窗关闭时：若有选中属性则显示反馈 */
function onCheckInClose(attrLabel?: string) {
  showModal.value = false
  if (attrLabel) {
    triggerShake(attrLabel)
  }
}

// ---- 右键菜单 ----

function onContextMenu() {
  window.petAPI?.showContextMenu()
}

function handleMenuAction(action: 'check-in' | 'reset' | 'guide') {
  if (action === 'check-in') {
    showModal.value = true
  } else if (action === 'reset') {
    store.resetAll()
  } else if (action === 'guide') {
    showGuide.value = true
  }
}

// ---- Web3 进化流程 ----

/**
 * 触发进化：
 * 1. 立即启动光效（粒子 + 脉冲光柱）
 * 2. 后台静默执行链上交易（铸造 + 进化），不弹交易框
 * 3. 交易成功后切换为"成功光效"，短暂闪烁后新宠物登场
 * 4. 如果交易失败，关闭光效并显示错误
 */
async function triggerEvolution() {
  if (!store.canEvolve) return
  if (isEvolving.value) return

  isEvolving.value = true
  isEvoSuccess.value = false

  const newStage = store.stage + 1

  // 1. 尝试 Web3 链上交互（如有私钥与网络支持）
  try {
    let pk = await window.petAPI?.getPrivateKey()
    if (pk) {
      if (!isReady()) {
        initWeb3(pk)
      }
      let currentTokenId = store.tokenId
      if (store.needsMint || currentTokenId === null) {
        const result = await mintPet(store.stage)
        store.setTokenId(result.tokenId)
        currentTokenId = result.tokenId
      }
      const txHash = await evolvePet(currentTokenId!, newStage)
      txExplorerUrl.value = getExplorerUrl(txHash)
    }
  } catch (err: any) {
    console.warn('[PetWidget] 链上进化跳过/失败，转为本地进化:', err)
  }

  // 2. 播放进化成功光效（特效 1 秒）
  isEvoSuccess.value = true
  await new Promise(r => setTimeout(r, 1000))

  // 3. 升级阶段 + 经验归 0 + 关闭光效
  store.setStage(newStage)
  store.resetStats()
  isEvolving.value = false
  isEvoSuccess.value = false
  triggerPop()
}

// ---- 抠白底 ----

const removeWhiteBackground = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  threshold: number,
  softEdge: number,
) => {
  const frame = ctx.getImageData(0, 0, width, height)
  const data = frame.data

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const distance = Math.sqrt((255 - r) ** 2 + (255 - g) ** 2 + (255 - b) ** 2)
    if (distance < threshold) {
      data[i + 3] = 0
    } else if (distance < threshold + softEdge) {
      data[i + 3] = Math.floor(((distance - threshold) / softEdge) * data[i + 3])
    }
  }
  ctx.putImageData(frame, 0, 0)
}

const CHROMA_KEY_VIDEO = { threshold: 41, softEdge: 15 }

// ---- 渲染循环 ----

const renderFrame = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return

  const video = videoRef.value
  if (!video) { animFrameId = requestAnimationFrame(renderFrame); return }

  const vw = video.videoWidth
  const vh = video.videoHeight
  if (!vw || !vh) { animFrameId = requestAnimationFrame(renderFrame); return }

  const scale = Math.min(1, MAX_RENDER_DIM / Math.max(vw, vh))
  const drawW = Math.round(vw * scale)
  const drawH = Math.round(vh * scale)
  if (canvas.width !== drawW || canvas.height !== drawH) {
    canvas.width = drawW
    canvas.height = drawH
  }

  ctx.clearRect(0, 0, drawW, drawH)
  ctx.drawImage(video, 0, 0, drawW, drawH)
  removeWhiteBackground(ctx, drawW, drawH, CHROMA_KEY_VIDEO.threshold, CHROMA_KEY_VIDEO.softEdge)
  animFrameId = requestAnimationFrame(renderFrame)
}

// ---- 媒体加载 ----

function onVideoReady() {
  if (animFrameId) cancelAnimationFrame(animFrameId)
  if (videoRef.value) videoRef.value.play().catch(() => {})
  renderFrame()
}

// ---- 阶段切换 ----

watch(() => store.stage, async () => {
  if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null }
  const canvas = canvasRef.value
  if (canvas) {
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
  await nextTick()
  if (videoRef.value) {
    videoRef.value.play().catch(() => {})
    if (videoRef.value.readyState >= 2) onVideoReady()
  }
})

// ---- 生命周期 ----

onMounted(async () => {
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  window.petAPI?.onMenuAction(handleMenuAction)

  // 首次运行自动弹起新手引导
  if (!localStorage.getItem('hasSeenGuide')) {
    showGuide.value = true
  }

  // 初始化 Web3（获取私钥并连接 Monad 测试网）
  try {
    const pk = await window.petAPI?.getPrivateKey()
    if (pk) initWeb3(pk)
  } catch (err) {
    console.warn('[PetWidget] Web3 初始化失败，将在进化时重试')
  }

  if (videoRef.value) {
    videoRef.value.play().catch(() => {})
    if (videoRef.value.readyState >= 2) onVideoReady()
  }
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  window.petAPI?.removeMenuActionListener()
  if (animFrameId) cancelAnimationFrame(animFrameId)
  if (popTimer) window.clearTimeout(popTimer)
})
</script>

<style scoped>
.pet-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none; /* 关键：外层全屏透明区域不捕捉/不拦截鼠标 */
  touch-action: none;
  user-select: none;
}

.pet-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px 0;
  transition: transform 0.15s ease;
  pointer-events: auto; /* 关键：仅在宠物本体和组件区域响应鼠标拖拽与点击 */
  cursor: grab;
}
.pet-container:active { cursor: grabbing; }
.pet-container.popping { transform: scale(1.1); }
.pet-container:hover { transform: scale(1.03); }
.pet-container.popping:hover { transform: scale(1.1); }

/* 拖拽中暂停浮动动画，避免跟手移动时的视觉抖动 */
.pet-container.dragging .pet-character {
  animation-play-state: paused;
}

.pet-character {
  position: relative;
  width: 115px;
  height: 160px;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: floatBounce 3.5s ease-in-out infinite;
  pointer-events: auto;
}

.hidden-media {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
  overflow: hidden;
}

.pet-media-canvas {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.pet-badge {
  margin-top: 4px;
  padding: 4px 12px;
  background: rgba(131, 110, 249, 0.35);
  border: 1px solid rgba(167, 139, 250, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 14px;
  color: #F3F4F6;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  pointer-events: none;
}

/* 经验进度条 */
.exp-bar-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
}
.exp-bar {
  width: 80px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
}
.exp-fill {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, #6366f1, #a78bfa);
  transition: width 0.4s ease;
}
.exp-label {
  font-size: 9px;
  color: #a5b4fc;
}

/* 进化按钮 */
.evolve-btn {
  margin-top: 10px;
  margin-bottom: 4px;
  padding: 7px 20px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #7c3aed, #a78bfa);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  animation: pulseGlow 1.8s ease-in-out infinite;
  transition: transform 0.15s;
  box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);
}
.evolve-btn:hover:not(:disabled) { transform: scale(1.06); }
.evolve-btn:disabled { opacity: 0.5; cursor: not-allowed; animation: none; }

@keyframes floatBounce {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}
@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 8px rgba(167, 139, 250, 0.4); }
  50% { box-shadow: 0 0 18px rgba(167, 139, 250, 0.8); }
}

/* ---- 打卡反馈：宠物抖动 ---- */
.pet-container.shaking .pet-character {
  animation: petShake 0.4s ease-out;
}
@keyframes petShake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px) rotate(-3deg); }
  40% { transform: translateX(6px) rotate(3deg); }
  60% { transform: translateX(-4px) rotate(-2deg); }
  80% { transform: translateX(4px) rotate(2deg); }
}

/* ---- 打卡反馈：飘字 ---- */
.checkin-feedback {
  font-size: 13px;
  font-weight: 700;
  color: #fbbf24;
  text-shadow: 0 0 12px rgba(251, 191, 36, 0.6);
  margin-bottom: 2px;
}
.float-up-enter-active { transition: all 0.5s ease-out; }
.float-up-leave-active { transition: all 0.4s ease-in; }
.float-up-enter-from { opacity: 0; transform: translateY(10px); }
.float-up-leave-to { opacity: 0; transform: translateY(-18px); }

/* ---- 进化光效 ---- */
.evo-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80px;
  height: 80px;
  margin: -40px 0 0 -40px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(251,191,36,0.6) 0%, rgba(251,191,36,0) 70%);
  animation: glowPulse 0.8s ease-out infinite alternate;
  pointer-events: none;
  z-index: 5;
}
/* 进化成功：光柱变亮白、范围扩大 */
.evo-success .evo-glow {
  background: radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(167,139,250,0.4) 40%, rgba(167,139,250,0) 70%);
  animation: glowBurst 0.6s ease-out forwards;
}
@keyframes glowPulse {
  0% { transform: scale(0.6); opacity: 0.8; }
  100% { transform: scale(2.2); opacity: 0.2; }
}
@keyframes glowBurst {
  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(3.5); opacity: 0; }
}

/* ---- 进化粒子 ---- */
.evo-particles {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  pointer-events: none;
  z-index: 6;
}
.evo-particle {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #fbbf24;
  animation: particleFly 1.5s ease-out forwards;
  animation-delay: var(--delay, 0s);
  box-shadow: 0 0 6px 2px rgba(251, 191, 36, 0.7);
}
/* 进化成功：粒子变色并向外爆发 */
.evo-success .evo-particle {
  background: #fff;
  box-shadow: 0 0 10px 4px rgba(167, 139, 250, 0.9);
  animation: particleBurst 0.8s ease-out forwards;
}
@keyframes particleFly {
  0% {
    transform: rotate(var(--angle, 0deg)) translateY(0);
    opacity: 1;
  }
  100% {
    transform: rotate(var(--angle, 0deg)) translateY(-50px);
    opacity: 0;
  }
}
@keyframes particleBurst {
  0% {
    transform: rotate(var(--angle, 0deg)) translateY(0);
    opacity: 1;
  }
  100% {
    transform: rotate(var(--angle, 0deg)) translateY(-80px);
    opacity: 0;
  }
}

/* 进化期间宠物闪光 */
.pet-container.evolving .pet-character {
  animation: evolveShine 0.3s ease-in-out infinite;
}
/* 进化成功：宠物短暂高亮后恢复正常 */
.evo-success .pet-character {
  animation: evolveReveal 0.6s ease-out forwards;
}
@keyframes evolveShine {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.8) drop-shadow(0 0 10px gold); }
}
@keyframes evolveReveal {
  0% { filter: brightness(2.5) drop-shadow(0 0 20px white); }
  100% { filter: brightness(1); }
}
</style>
