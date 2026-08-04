<template>
  <div
    class="pet-wrapper"
    @mousedown="onMouseDown"
  >
    <div class="pet-container" :class="{ popping: isPopping }">
      <div class="pet-character">
        <!-- MP4 视频源：隐藏的 <video> 元素，由 Canvas 逐帧抓取画面并抠白底 -->
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

        <!-- 过滤并抠掉白底后的透明 Canvas 渲染画板 -->
        <canvas
          ref="canvasRef"
          class="pet-media-canvas"
        ></canvas>
      </div>
      <div class="pet-badge">{{ badgeText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { usePetStore } from '../stores/petStore'

const store = usePetStore()

// MP4 视频资源路径
const mp4Src = computed(() => store.currentInfo.mp4)

// 宠物下方小牌子显示的文字（阶段 + 名字）
const badgeText = computed(() => `阶段${store.stage} · ${store.currentInfo.name}`)

const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

let animFrameId: number | null = null

// 画布最大边长：限制在合理尺寸内，避免大素材逐帧抠底导致卡顿
const MAX_RENDER_DIM = 480

// ===================== 点击切换形态的弹跳反馈 =====================
const isPopping = ref(false)
let popTimer: number | null = null

function triggerPop() {
  isPopping.value = true
  if (popTimer) window.clearTimeout(popTimer)
  popTimer = window.setTimeout(() => {
    isPopping.value = false
  }, 180)
}

// ===================== 拖拽移动 vs 点击切换 的智能区分 =====================
const DRAG_THRESHOLD = 5
let isPressing = false
let hasDragged = false
let startScreenX = 0
let startScreenY = 0

function onMouseDown(e: MouseEvent) {
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
    store.nextStage()
    triggerPop()
  }
}

// ===================== Canvas 抠白底算法 =====================
/**
 * 抠除白底算法 (Chroma Key Filter with Soft Alpha Edge)
 * 把接近纯白的像素变成透明，边缘做平滑过渡，消除白边锯齿。
 */
const removeWhiteBackground = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  threshold: number,
  softEdge: number,
) => {
  const frame = ctx.getImageData(0, 0, width, height)
  const data = frame.data
  const len = data.length

  for (let i = 0; i < len; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    const distance = Math.sqrt(
      (255 - r) * (255 - r) +
      (255 - g) * (255 - g) +
      (255 - b) * (255 - b)
    )

    if (distance < threshold) {
      data[i + 3] = 0
    } else if (distance < threshold + softEdge) {
      const alphaRatio = (distance - threshold) / softEdge
      data[i + 3] = Math.floor(alphaRatio * data[i + 3])
    }
  }

  ctx.putImageData(frame, 0, 0)
}

// 调低阈值：只抠除极度接近纯白的背景，保护人脸、浅色肤色及高光区域不被误判透明
const CHROMA_KEY_VIDEO = { threshold: 41, softEdge: 15 }

// ===================== 逐帧渲染主循环 =====================
const renderFrame = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return

  const video = videoRef.value
  if (!video) {
    animFrameId = requestAnimationFrame(renderFrame)
    return
  }

  const vw = video.videoWidth
  const vh = video.videoHeight

  if (!vw || !vh) {
    animFrameId = requestAnimationFrame(renderFrame)
    return
  }

  const scale = Math.min(1, MAX_RENDER_DIM / Math.max(vw, vh))
  const drawW = Math.round(vw * scale)
  const drawH = Math.round(vh * scale)

  if (canvas.width !== drawW || canvas.height !== drawH) {
    canvas.width = drawW
    canvas.height = drawH
  }

  // 从视频抓取当前帧
  ctx.clearRect(0, 0, drawW, drawH)
  ctx.drawImage(video, 0, 0, drawW, drawH)

  // 抠除白底
  removeWhiteBackground(ctx, drawW, drawH, CHROMA_KEY_VIDEO.threshold, CHROMA_KEY_VIDEO.softEdge)

  // 持续请求下一帧
  animFrameId = requestAnimationFrame(renderFrame)
}

// ===================== 媒体加载与切换 =====================
function onVideoReady() {
  if (animFrameId) cancelAnimationFrame(animFrameId)
  if (videoRef.value) {
    videoRef.value.play().catch(() => {})
  }
  renderFrame()
}

watch(
  () => store.stage,
  async () => {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId)
      animFrameId = null
    }

    const canvas = canvasRef.value
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    }

    await nextTick()

    if (videoRef.value) {
      videoRef.value.play().catch(() => {})
      if (videoRef.value.readyState >= 2) {
        onVideoReady()
      }
    }
  },
)

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)

  if (videoRef.value) {
    videoRef.value.play().catch(() => {})
    if (videoRef.value.readyState >= 2) {
      onVideoReady()
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
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

.pet-wrapper:active {
  cursor: grabbing;
}

.pet-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease;
}

.pet-container.popping {
  transform: scale(1.1);
}

.pet-container:hover {
  transform: scale(1.03);
}

.pet-container.popping:hover {
  transform: scale(1.1);
}

.pet-character {
  position: relative;
  width: 140px;
  height: 210px;
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
  margin-top: 6px;
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

@keyframes floatBounce {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-8px);
  }
}
</style>
