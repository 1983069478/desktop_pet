# 📋 Day 2 开发任务清单：本地打卡与经验系统

> **关联文档**：[桌面宠物成长 DApp 产品需求文档 (PRD v0.2)](../桌面宠物成长%20DApp%20产品需求文档%20%28PRD%29.md)  
> **日期**：Day 2  
> **核心交付物**：支持快捷打卡、四维属性经验累加、LocalStorage 持久化与打卡反馈动效的本地闭环桌面挂件

---

## 一、 开发目标 (Day 2 Goal)

- **核心产出**：可持续打卡并累加经验的本地数据闭环。
- **关键特性**：
  - **低打扰打卡**：点击宠物或右键菜单一键调出极简打卡弹窗。
  - **四维属性增长**：支持“专注 / 智慧 / 创造 / 共情”单选打卡，每次打卡增加 10 点对应属性经验。
  - **数据持久化**：使用 Pinia + LocalStorage 实时保存宠物状态与历史打卡记录。
  - **即时交互反馈**：打卡成功后播放 2 秒宠物高兴/跳跃动效与 `+10 EXP` 漂浮文字。
  - **右键上下文菜单**：提供快捷打卡、重置数据与退出应用入口。

---

## 二、 详细任务拆解 (Task Checklist)

### 1. 状态管理与数据结构设计 (State & Store Setup)

- [ ] **定义 TypeScript 类型规范** (`src/renderer/types/pet.ts`)：
  - 定义四维属性结构 `PetStats` (`focus`, `wisdom`, `creativity`, `empathy`)
  - 定义打卡记录结构 `CheckInRecord` (`id`, `timestamp`, `category`, `note`, `expGained`)
  - 定义宠物核心状态 `PetState` (`name`, `stage`, `totalExp`, `stats`, `history`)
- [ ] **创建 Pinia Pet Store** (`src/renderer/stores/petStore.ts`)：
  - 实现核心 State 初始化（默认阶段 0 宠物蛋/幼体，初始经验 0）
  - 实现 `addCheckIn(category, note)` Action：计算属性增加、总经验累加、追加历史记录
  - 实现 `resetData()` Action：一键重置本地属性与打卡历史
  - 计算属性 `isReadyToEvolve`：根据总经验值（例如 $\ge 30$ 点）计算是否达到进化门槛（为 Day 5 预留）
- [ ] **实现 LocalStorage 持久化**：
  - 在 Pinia Store 中配置监听（或集成 `pinia-plugin-persistedstate`），确保刷新或重启 Electron 应用后数据不丢失。

### 2. 快捷打卡组件开发 (Check-in Modal Component)

- [ ] **创建打卡弹窗组件** (`src/renderer/components/CheckInModal.vue`)：
  - 设计符合极简黑/深色黑胶卡片风格的 Glassmorphic 浮层 UI
  - **表单项包含**：
    1. 目标/任务描述输入框（可选，如“完成 1 个 Pomodoro”）
    2. 四维属性选择卡片/单选按钮组（🎯 专注 / 💡 智慧 / 🎨 创造 / ❤️ 共情）
  - **交互控制**：
    - 绑定 `ESC` 键或点击外部关闭弹窗
    - 提交按钮防刷与表单校验
- [ ] **窗口尺寸动态适配与交互**：
  - 调整 Electron 窗口尺寸或使用绝对定位浮层，确保打卡弹窗展开时不被窗口边界截断
  - 输入框获得焦点时确保 `no-drag` 正常交互。

### 3. 打卡动效与宠物反馈 (Pet Feedback & Animations)

- [ ] **视觉反馈效果**：
  - 在 `PetWidget.vue` 中扩展宠物状态（`idle` | `happy` | `thinking`）
  - 打卡成功后切换为 `happy` 状态（增加 CSS 跳跃动画/光晕缩放效果，持续 2 秒）
- [ ] **经验飘字动画 (Exp Floating Text)**：
  - 打卡提交时生成 `+10 EXP` 及属性图标粒子，沿宠物上方漂浮并淡出 (`@keyframes float-up`)。
- [ ] **音效反馈 (可选)**：
  - 预留打卡成功的提示音（使用 Web Audio API 或极简 HTML5 Audio 播放）。

### 4. 右键菜单与系统交互 (Context Menu & App Control)

- [ ] **Electron 右键上下文菜单**：
  - 在主进程或渲染进程实现右键菜单 `ContextMenu`
  - **菜单项包括**：
    - `🎯 快捷打卡` -> 唤起打卡弹窗
    - `📊 重置本地数据` -> 弹出二次确认框并清空 LocalStorage
    - ❌ `退出应用` -> 调用 `app.quit()`

---

## 三、 推荐目录结构 Blueprint

```text
src/
├── main/                           # Electron 主进程
│   └── index.ts                    # 增加上下文菜单 IPC 监听
├── preload/                        # 预加载脚本
│   └── index.ts                    # 暴露右键菜单与退出应用 API
└── renderer/                       # Vue3 渲染进程
    ├── index.html
    └── src/
        ├── assets/                 # 动效/图标资源
        ├── components/             # UI 组件
        │   ├── PetWidget.vue       # 2D 宠物悬浮挂件 (带 Happy 动效)
        │   └── CheckInModal.vue    # 快捷打卡弹窗 [NEW]
        ├── stores/                 # 状态管理 [NEW]
        │   └── petStore.ts         # 宠物经验与打卡状态 Store
        ├── types/                  # 类型定义 [NEW]
        │   └── pet.ts              # 宠物与打卡 TypeScript 类型
        ├── App.vue                 # 根组件 (挂载悬浮窗与弹窗)
        ├── main.ts                 # 注册 Pinia
        └── style.css
```

---

## 四、 关键数据结构与代码参考

### 1. `src/renderer/types/pet.ts` (数据结构 Blueprint)

```typescript
export type AttributeType = "focus" | "wisdom" | "creativity" | "empathy";

export interface PetStats {
  focus: number; // 专注
  wisdom: number; // 智慧
  creativity: number; // 创造
  empathy: number; // 共情
}

export interface CheckInRecord {
  id: string;
  timestamp: number;
  category: AttributeType;
  note: string;
  expGained: number;
}

export interface PetState {
  name: string;
  stage: number; // 0: 蛋, 1: 幼体, 2: 进化体
  totalExp: number;
  stats: PetStats;
  history: CheckInRecord[];
}
```

### 2. `src/renderer/stores/petStore.ts` (Pinia Store 核心逻辑)

```typescript
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { PetState, AttributeType, CheckInRecord } from "../types/pet";

const STORAGE_KEY = "monad_pet_data_v1";

export const usePetStore = defineStore("pet", () => {
  // 从 LocalStorage 读取初始状态
  const loadInitialState = (): PetState => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      name: "Monad Pet",
      stage: 0,
      totalExp: 0,
      stats: { focus: 0, wisdom: 0, creativity: 0, empathy: 0 },
      history: [],
    };
  };

  const state = ref<PetState>(loadInitialState());

  // 持久化保存
  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value));
  };

  // 提交打卡 Action
  const checkIn = (category: AttributeType, note: string = "") => {
    const expGained = 10;
    state.value.stats[category] += expGained;
    state.value.totalExp += expGained;

    const record: CheckInRecord = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      category,
      note,
      expGained,
    };
    state.value.history.unshift(record);
    save();
  };

  // 是否达到进化门槛（阈值 30 EXP）
  const isReadyToEvolve = computed(
    () => state.value.totalExp >= 30 && state.value.stage === 0,
  );

  // 重置数据
  const reset = () => {
    localStorage.removeItem(STORAGE_KEY);
    state.value = loadInitialState();
  };

  return { state, checkIn, isReadyToEvolve, reset };
});
```

---

## 五、 Day 2 验收标准 (Acceptance Criteria)

- [ ] 点击宠物或右键菜单能顺畅调出/隐藏“快捷打卡”弹窗。
- [ ] 在打卡弹窗中选择任意属性并提交后，打卡弹窗自动关闭。
- [ ] 提交打卡后，宠物播放 2 秒高兴动效，并有 `+10 EXP` 漂浮提示。
- [ ] 对应属性在 Pinia 与 `LocalStorage` 中准确增加 10 点，刷新应用后经验数据不丢失。
- [ ] 悬浮窗右键菜单功能完整（快捷打卡、数据重置、退出应用均正常工作）。
