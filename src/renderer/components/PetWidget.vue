<template>
  <div
    class="pet-wrapper"
    @mousedown="onMouseDown"
    @contextmenu.prevent="onContextMenu"
  >
    <!-- 宠物显示区 -->
    <div v-if="!showModal" class="pet-container" :class="{ popping: isPopping }">
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

      <!-- 宠物小牌子 + 进化按钮 -->
      <div class="pet-badge">{{ badgeText }}</div>

      <!-- 总经验进度条 -->
      <div class="exp-bar-wrap">
        <div class="exp-bar">
          <div class="exp-fill" :style="{ width: expPercent + '%' }"></div>
        </div>
        <span class="exp-label">{{ store.totalExp }} / 30</span>
      </div>

      <!-- 进化按钮：满足条件时显示 -->
      <button
        v-if="store.canEvolve"
        class="evolve-btn"
        :disabled="txPhase === 'sending' || txPhase === 'confirming'"
        @click="triggerEvolution"
      >
        ✨ 可以进化了！
      </button>
    </div>

    <!-- 快捷打卡弹窗 -->
    <CheckInModal
      :visible="showModal"
      @close="showModal = false"
    />

    <!-- 链上交易状态提示 -->
    <TxStatus
      :phase="txPhase"
      :message="txMessage"
      :explorer-url="txExplorerUrl"
      @close="txPhase = 'idle'"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { usePetStore } from '../stores/petStore'
import CheckInModal from './CheckInModal.vue'
import TxStatus from './TxStatus.vue'
import type { TxPhase } from './TxStatus.vue'
import { initWeb3, isReady, mintPet, evolvePet, getExplorerUrl } from '../services/web3Service'

const store = usePetStore()

// ---- 媒体资源 ----

const mp4Src = computed(() => store.currentInfo.mp4)
const badgeText = computed(() => `阶段${store.stage} · ${store.currentInfo.name}`)

// ---- 经验进度 ----

const expPercent = computed(() => Math.min(100, (store.totalExp / 30) * 100))

// ---- DOM 引用 ----

const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

// ---- 界面状态 ----

const showModal = ref(false)

// ---- 交易状态 ----

const txPhase = ref<TxPhase>('idle')
const txMessage = ref('')
const txExplorerUrl = ref('')

// ---- 渲染循环 ----

let animFrameId: number | null = null
const MAX_RENDER_DIM = 480

// ---- 弹跳反馈 ----

const isPopping = ref(false)
let popTimer: number | null = null

function triggerPop() {
  isPopping.value = true
  if (popTimer) window.clearTimeout(popTimer)
  popTimer = window.setTimeout(() => {
    isPopping.value = false
  }, 180)
}

// ---- 拖拽 vs 点击 ----

const DRAG_THRESHOLD = 5
let isPressing = false
let hasDragged = false
let startScreenX = 0
let startScreenY = 0

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
  if (Math.hypot(dx, dy) > DRAG_THRESHOLD) hasDragged = true
  if (hasDragged) window.petAPI?.moveDrag(e.screenX, e.screenY)
}

function onMouseUp() {
  if (!isPressing) return
  isPressing = false
  if (!hasDragged) {
    // 取消点击直接切换形态，仅保留点击动画反馈
    triggerPop()
  }
}

// ---- 右键菜单 ----

function onContextMenu() {
  window.petAPI?.showContextMenu()
}

function handleMenuAction(action: 'check-in' | 'reset') {
  if (action === 'check-in') {
    showModal.value = true
  } else if (action === 'reset') {
    store.resetAll()
  }
}

// ---- Web3 进化流程 ----

/**
 * 触发进化：先判断是否需要铸造，再执行进化交易
 */
async function triggerEvolution() {
  if (!store.canEvolve) return
  if (txPhase.value === 'sending' || txPhase.value === 'confirming') return

  // 确保 Web3 已初始化
  if (!isReady()) {
    try {
      const pk = await window.petAPI?.getPrivateKey()
      if (!pk) {
        txPhase.value = 'error'
        txMessage.value = '未找到钱包私钥'
        return
      }
      initWeb3(pk)
    } catch {
      txPhase.value = 'error'
      txMessage.value = 'Web3 初始化失败'
      return
    }
  }

  try {
    let currentTokenId = store.tokenId

    // 如果还没有 NFT，先铸造
    if (store.needsMint || currentTokenId === null) {
      txPhase.value = 'sending'
      txMessage.value = '正在铸造宠物 NFT...'

      const result = await mintPet(store.stage)
      store.setTokenId(result.tokenId)
      currentTokenId = result.tokenId

      txPhase.value = 'confirming'
      txMessage.value = '铸造完成，开始进化...'
    }

    // 执行进化
    const newStage = store.stage + 1
    txPhase.value = 'sending'
    txMessage.value = `正在进化到阶段 ${newStage}...`

    const txHash = await evolvePet(currentTokenId!, newStage)

    txPhase.value = 'success'
    txMessage.value = `进化成功！`

    // 用 Monad 合约地址生成浏览器链接
    txExplorerUrl.value = getExplorerUrl(txHash)

    // 更新本地阶段并重置经验值（重新从 0 开始打卡积攒）
    store.setStage(newStage)
    store.resetStats()
    triggerPop()

  } catch (err: any) {
    console.error('[PetWidget] 进化失败:', err)
    txPhase.value = 'error'
    txMessage.value = err?.reason ?? err?.message ?? '交易失败，请重试'
  }
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
  cursor: grab;
  touch-action: none;
  user-select: none;
}
.pet-wrapper:active { cursor: grabbing; }

.pet-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px 0;
  transition: transform 0.15s ease;
}
.pet-container.popping { transform: scale(1.1); }
.pet-container:hover { transform: scale(1.03); }
.pet-container.popping:hover { transform: scale(1.1); }

.pet-character {
  position: relative;
  width: 140px;
  height: 190px;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: floatBounce 3.5s ease-in-out infinite;
  pointer-events: none;
}

.hidden-media {
  position: fixed;
  top: -9999px;
  left: -9999px;
  width: 480px;
  height: auto;
  opacity: 1;
  pointer-events: none;
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
</style>
