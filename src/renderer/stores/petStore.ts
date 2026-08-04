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

/** 本地存储 key：记住用户上次停留在哪个阶段 */
const STORAGE_KEY = 'pet_current_stage'

/**
 * 宠物状态仓库：
 * - 负责当前阶段 (0/1/2) 的状态管理
 * - 阶段变化后自动持久化到 localStorage，重启应用仍能记住
 */
export const usePetStore = defineStore('pet', () => {
  // 从本地存储读取上次阶段，若值非法则回退到阶段 0
  const savedStage = Number(localStorage.getItem(STORAGE_KEY))
  const stage = ref<number>(savedStage >= 0 && savedStage < PET_STAGES.length ? savedStage : 0)

  /** 当前阶段对应的完整信息（名字 + 素材路径） */
  const currentInfo = computed<PetStageInfo>(() => PET_STAGES[stage.value])

  /** 设置阶段（自动处理越界，保证始终落在 0 ~ length-1 范围内） */
  function setStage(next: number) {
    const wrapped = ((next % PET_STAGES.length) + PET_STAGES.length) % PET_STAGES.length
    stage.value = wrapped
    localStorage.setItem(STORAGE_KEY, String(wrapped))
  }

  /** 点击宠物：切换到下一阶段，最后一个阶段后回到第一个（循环） */
  function nextStage() {
    setStage(stage.value + 1)
  }

  return { stage, currentInfo, setStage, nextStage }
})
