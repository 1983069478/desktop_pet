<template>
  <div
    class="pet-wrapper"
    @mousedown="onMouseDown"
  >
    <div class="pet-container" :class="{ popping: isPopping }">
      <div class="pet-character">
        <!-- 隐藏的视频/图片渲染源，供 Canvas 抓取帧像素 -->
        <video
          ref="videoRef"
          v-if="isVideo"
          :src="mediaSrc"
          autoplay
          loop
          muted
          playsinline
          class="hidden-media"
          @loadeddata="onMediaLoaded"
          @error="onMediaError"
        ></video>

        <img
          ref="imgRef"
          v-else
          :src="mediaSrc"
          alt="Pet"
          class="hidden-media"
          @load="onMediaLoaded"
          @error="onMediaError"
        />

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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { usePetStore } from '../stores/petStore'

const store = usePetStore()

// 是否优先使用 mp4 动画（mp4 播放失败时自动退回 gif）
const useVideo = ref(true)

// 当前媒体资源地址：优先播放 mp4，失败则用 gif 兜底
const mediaSrc = computed(() => {
  return useVideo.value ? store.currentInfo.mp4 : store.currentInfo.gif
})

// 判断当前媒体资源是视频还是图片
const isVideo = computed(() => {
  return mediaSrc.value.endsWith('.mp4') || mediaSrc.value.endsWith('.webm')
})

// 宠物下方小牌子显示的文字（阶段 + 名字）
const badgeText = computed(() => `阶段${store.stage} · ${store.currentInfo.name}`)

const videoRef = ref<HTMLVideoElement | null>(null)
const imgRef = ref<HTMLImageElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

let animFrameId: number | null = null

// 画布最大边长：限制在合理尺寸内，避免大视频逐帧抠底导致卡顿
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
const DRAG_THRESHOLD = 5 // 按下后位移超过 5px 判定为拖动，否则视为点击
let isPressing = false
let hasDragged = false
let startScreenX = 0
let startScreenY = 0

function onMouseDown(e: MouseEvent) {
  isPressing = true
  hasDragged = false
  startScreenX = e.screenX
  startScreenY = e.screenY
  // 通知主进程记录拖拽起点（窗口当前位置 + 鼠标位置）
  window.petAPI?.startDrag(e.screenX, e.screenY)
}

function onMouseMove(e: MouseEvent) {
  if (!isPressing) return
  const dx = e.screenX - startScreenX
  const dy = e.screenY - startScreenY
  if (Math.hypot(dx, dy) > DRAG_THRESHOLD) hasDragged = true
  // 只有确实在拖动时才通知主进程移动窗口，避免误触发
  if (hasDragged) window.petAPI?.moveDrag(e.screenX, e.screenY)
}

function onMouseUp() {
  if (!isPressing) return
  isPressing = false
  // 没有拖动 = 单击 → 切换到下一阶段并播放弹跳反馈
  if (!hasDragged) {
    store.nextStage()
    triggerPop()
  }
}

// ===================== Canvas 抠白底渲染 =====================

/**
 * 抠除白底算法 (Chroma Key Filter with Soft Alpha Edge)
 * 把接近纯白的像素变成透明，边缘做平滑过渡，消除白边锯齿。
 *
 * @param threshold 与纯白 (255,255,255) 距离小于此值的像素直接完全透明
 * @param softEdge  与纯白距离落在 threshold ~ threshold+softEdge 之间的像素做半透明渐变
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

    // 计算当前像素颜色与纯白色 (255, 255, 255) 的三维欧氏色彩距离
    const distance = Math.sqrt(
      (255 - r) * (255 - r) +
      (255 - g) * (255 - g) +
      (255 - b) * (255 - b)
    )

    if (distance < threshold) {
      data[i + 3] = 0 // 变为完全透明
    } else if (distance < threshold + softEdge) {
      // 软边缘 Alpha 渐变过渡
      const alphaRatio = (distance - threshold) / softEdge
      data[i + 3] = Math.floor(alphaRatio * data[i + 3])
    }
  }

  ctx.putImageData(frame, 0, 0)
}

/**
 * 各媒体类型的抠白底参数：
 * - mp4 视频：背景通常略带浅灰/浅色，用较宽阈值才能去干净
 * - gif：背景是纯白色，用很小阈值即可，避免误删宠物身上偏浅的颜色
 */
const CHROMA_KEY_VIDEO = { threshold: 45, softEdge: 35 }
const CHROMA_KEY_GIF = { threshold: 8, softEdge: 8 }

/** 逐帧渲染逻辑：抓取视频/图片当前帧 → 画到画布 → 抠掉白底 */
const renderFrame = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return

  const source = isVideo.value ? videoRef.value : imgRef.value
  if (!source) return

  // 获取源媒体原始尺寸
  let width: number
  let height: number
  if (isVideo.value) {
    const v = source as HTMLVideoElement
    width = v.videoWidth
    height = v.videoHeight
  } else {
    const im = source as HTMLImageElement
    width = im.naturalWidth
    height = im.naturalHeight
  }

  // 尺寸还没就绪时，等待下一帧再试
  if (!width || !height) {
    animFrameId = requestAnimationFrame(renderFrame)
    return
  }

  // 等比缩放，限制最大边长，保证逐帧抠底流畅
  const scale = Math.min(1, MAX_RENDER_DIM / Math.max(width, height))
  const drawW = Math.round(width * scale)
  const drawH = Math.round(height * scale)

  if (canvas.width !== drawW || canvas.height !== drawH) {
    canvas.width = drawW
    canvas.height = drawH
  }

  // 1. 绘制当前视频帧/图像
  ctx.clearRect(0, 0, drawW, drawH)
  ctx.drawImage(source, 0, 0, drawW, drawH)

  // 2. 抠掉白色背景像素（gif 只去纯白，mp4 用较宽阈值）
  const chroma = isVideo.value ? CHROMA_KEY_VIDEO : CHROMA_KEY_GIF
  removeWhiteBackground(ctx, drawW, drawH, chroma.threshold, chroma.softEdge)

  // 3. 如果是视频，持续请求下一帧渲染（实现动画）
  if (isVideo.value) {
    animFrameId = requestAnimationFrame(renderFrame)
  }
}

/** 媒体就绪回调：开始播放并渲染 */
const onMediaLoaded = () => {
  if (animFrameId) cancelAnimationFrame(animFrameId)
  if (videoRef.value) {
    videoRef.value.play().catch(() => {})
  }
  renderFrame()
}

/** 媒体加载失败：mp4 播放不了就退回 gif */
const onMediaError = () => {
  if (useVideo.value) {
    useVideo.value = false
  }
}

// 阶段切换后：重新尝试用 mp4，清空旧画布等待新素材
watch(
  () => store.stage,
  () => {
    useVideo.value = true
    if (animFrameId) {
      cancelAnimationFrame(animFrameId)
      animFrameId = null
    }
    const canvas = canvasRef.value
    if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
  },
)

onMounted(() => {
  // 鼠标移动 / 松开监听在 window 上，保证拖出组件边缘也能持续跟手
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  if (videoRef.value) {
    videoRef.value.play().catch(() => {})
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

/* 点击切换形态时的弹跳反馈 */
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

/* 隐藏原始含背景媒体，专供 Canvas 逐帧抓取 */
.hidden-media {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

/* 展示扣除白底后的透明 Canvas */
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
