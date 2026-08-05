import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/**
 * 单个成长阶段的描述信息
 */
export interface PetStageInfo {
  /** 阶段编号：0 = 宠物蛋，1 = 幼体，2 = 进化体 */
  stage: number
  /** 阶段中文名（显示在宠物下方小牌子上） */
  name: string
  /** 该阶段的 mp4 动画资源路径 */
  mp4: string
}

/**
 * 全部成长阶段配置。
 * 素材都放在 public/pets/ 目录下，通过相对路径直接引用。
 */
export const PET_STAGES: PetStageInfo[] = [
  { stage: 0, name: '宠物蛋', mp4: '/pets/stage_0.mp4' },
  { stage: 1, name: '幼体', mp4: '/pets/stage_2.mp4' },
  { stage: 2, name: '进化体', mp4: '/pets/stage_3.mp4' },
]

// ===================== 打卡四维属性 =====================

/** 四项属性键名 */
export type AttributeKey = 'focus' | 'wisdom' | 'creativity' | 'empathy'

/** 属性中文显示名称 */
export const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  focus: '🎯 专注',
  wisdom: '🧠 智慧',
  creativity: '🎨 创造',
  empathy: '💛 共情',
}

/** 四项属性经验值 */
export interface PetStats {
  focus: number
  wisdom: number
  creativity: number
  empathy: number
}

/** 创建初始零值经验 */
function createEmptyStats(): PetStats {
  return { focus: 0, wisdom: 0, creativity: 0, empathy: 0 }
}

// ===================== 本地存储 key =====================

const STORAGE_KEY_STAGE = 'pet_current_stage'
const STORAGE_KEY_STATS = 'pet_stats'
const STORAGE_KEY_TOKEN_ID = 'pet_token_id'

// ===================== Store =====================

export const usePetStore = defineStore('pet', () => {
  // ---- 阶段状态 ----
  const savedStage = Number(localStorage.getItem(STORAGE_KEY_STAGE))
  const stage = ref<number>(savedStage >= 0 && savedStage < PET_STAGES.length ? savedStage : 0)

  const currentInfo = computed<PetStageInfo>(() => PET_STAGES[stage.value])

  function setStage(next: number) {
    const wrapped = ((next % PET_STAGES.length) + PET_STAGES.length) % PET_STAGES.length
    stage.value = wrapped
    localStorage.setItem(STORAGE_KEY_STAGE, String(wrapped))
  }

  function nextStage() {
    setStage(stage.value + 1)
  }

  // ---- 经验值状态 ----

  /** 从 localStorage 读取经验值，若不存在或格式损坏则用零值初始化 */
  const stats = ref<PetStats>(loadStats())

  function loadStats(): PetStats {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_STATS)
      if (!raw) return createEmptyStats()
      const parsed = JSON.parse(raw)
      // 校验数据结构完整性
      const keys: AttributeKey[] = ['focus', 'wisdom', 'creativity', 'empathy']
      for (const k of keys) {
        if (typeof parsed[k] !== 'number' || parsed[k] < 0) {
          return createEmptyStats()
        }
      }
      return parsed as PetStats
    } catch {
      return createEmptyStats()
    }
  }

  /** 将经验值写入 localStorage */
  function saveStats() {
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats.value))
  }

  /**
   * 快捷打卡：给指定属性 +10 经验，立即持久化到本地存储
   * @param attr 要增加经验的属性键名
   */
  function checkIn(attr: AttributeKey) {
    stats.value[attr] += 10
    saveStats()
  }

  /** 总经验值（四维合计） */
  const totalExp = computed(() => {
    return stats.value.focus + stats.value.wisdom + stats.value.creativity + stats.value.empathy
  })

  // ---- NFT Token ID ----

  const tokenId = ref<number | null>(loadTokenId())

  function loadTokenId(): number | null {
    const raw = localStorage.getItem(STORAGE_KEY_TOKEN_ID)
    if (!raw) return null
    const num = Number(raw)
    return Number.isInteger(num) && num >= 0 ? num : null
  }

  function setTokenId(id: number) {
    tokenId.value = id
    localStorage.setItem(STORAGE_KEY_TOKEN_ID, String(id))
  }

  /** 是否需要铸造 NFT（首次使用且没有 Token ID） */
  const needsMint = computed(() => tokenId.value === null)

  /**
   * 是否满足进化条件：
   * - 总经验 ≥ 30
   * - 当前不是最高阶段（阶段 2 是最终形态）
   */
  const canEvolve = computed(() => totalExp.value >= 30 && stage.value < 2)

  /**
   * 重置所有经验值为 0，并持久化
   */
  function resetStats() {
    stats.value = createEmptyStats()
    saveStats()
  }

  /** 重置全部数据（包括阶段、经验、Token ID） */
  function resetAll() {
    resetStats()
    setStage(0)
    tokenId.value = null
    localStorage.removeItem(STORAGE_KEY_TOKEN_ID)
  }

  return {
    // 阶段
    stage,
    currentInfo,
    setStage,
    nextStage,
    // 经验
    stats,
    totalExp,
    checkIn,
    resetStats,
    // NFT
    tokenId,
    setTokenId,
    needsMint,
    canEvolve,
    resetAll,
  }
})
