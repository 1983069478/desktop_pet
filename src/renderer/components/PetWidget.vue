<template>
  <div class="pet-wrapper">
    <div class="pet-container">
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
        ></video>
        
        <img 
          ref="imgRef"
          v-else
          :src="mediaSrc" 
          alt="Pet Stage 0" 
          class="hidden-media"
          @load="onMediaLoaded"
        />

        <!-- 过滤并抠掉白底后的透明 Canvas 渲染画板 -->
        <canvas 
          ref="canvasRef" 
          class="pet-media-canvas"
        ></canvas>
      </div>
      <div class="pet-badge">Stage 1 · Monad Pet</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// 当前阶段资源路径 (切换至阶段 1)
const mediaSrc = ref('/pets/stage_1.mp4')
const videoRef = ref<HTMLVideoElement | null>(null)
const imgRef = ref<HTMLImageElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

let animFrameId: number | null = null

// 判断当前媒体资源是视频还是图片
const isVideo = computed(() => {
  return mediaSrc.value.endsWith('.mp4') || mediaSrc.value.endsWith('.webm')
})

// 抠除白底算法 (Chroma Key Filter with Soft Alpha Edge)
const removeWhiteBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const frame = ctx.getImageData(0, 0, width, height)
  const data = frame.data
  const len = data.length

  // RGB 距离阈值设定：
  // threshold: 与纯白 (255,255,255) 距离小于此值的像素直接完全透明
  // softEdge: 边缘平滑过度带，消除锯齿白边
  const threshold = 45
  const softEdge = 35

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
      // 软边缘 Alpha 渐变过度
      const alphaRatio = (distance - threshold) / softEdge
      data[i + 3] = Math.floor(alphaRatio * data[i + 3])
    }
  }

  ctx.putImageData(frame, 0, 0)
}

// 逐帧渲染逻辑
const renderFrame = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return

  const source = isVideo.value ? videoRef.value : imgRef.value
  if (!source) return

  const width = (source as HTMLVideoElement).videoWidth || (source as HTMLImageElement).naturalWidth || 200
  const height = (source as HTMLVideoElement).videoHeight || (source as HTMLImageElement).naturalHeight || 300

  if (width === 0 || height === 0) {
    animFrameId = requestAnimationFrame(renderFrame)
    return
  }

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }

  // 1. 绘制当前视频帧/图像
  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(source, 0, 0, width, height)

  // 2. 抠掉白色与近白色背景像素
  removeWhiteBackground(ctx, width, height)

  // 3. 如果是视频，持续请求下一帧渲染
  if (isVideo.value) {
    animFrameId = requestAnimationFrame(renderFrame)
  }
}

const onMediaLoaded = () => {
  if (animFrameId) cancelAnimationFrame(animFrameId)
  if (videoRef.value) {
    videoRef.value.play().catch(() => {})
  }
  renderFrame()
}

onMounted(() => {
  if (videoRef.value) {
    videoRef.value.play().catch(() => {})
  }
})

onUnmounted(() => {
  if (animFrameId) cancelAnimationFrame(animFrameId)
})
</script>

<style scoped>
.pet-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  -webkit-app-region: drag;
  cursor: grab;
}

.pet-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.pet-container:hover {
  transform: scale(1.04);
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

```
