# PetWidget 渲染模块

## 概述
`PetWidget` 是桌面宠物的核心视图组件，负责宠物动画的逐帧渲染、白底过滤、阶段形态切换以及鼠标拖拽交互。

## 当前设计

### 1. 媒体渲染管线 (MP4 + Canvas 抠底)
* **隐藏源元素**：使用隐藏的 HTML5 `<video>` 标签播放各阶段的 MP4 动画素材。
* **逐帧抓取**：通过 `requestAnimationFrame` 驱动 `renderFrame` 主循环，使用 Canvas 2D Context (`drawImage`) 抓取 `<video>` 的当前播放帧。
* **色键抠底 (Chroma Key Filter)**：
  - 核心算法 `removeWhiteBackground` 计算每个像素颜色与纯白色 `(255, 255, 255)` 的欧式色彩距离。
  - 双阈值控制：
    - `threshold: 41`：低于此距离的近白像素直接变为完全透明 (`Alpha = 0`)。
    - `softEdge: 15`：在 `41 ~ 56` 范围内的模糊边界像素做平滑 Alpha 渐变羽化，防止锯齿白边并保护人脸及浅色高光。

### 2. 状态管理与拖拽机制
* **形态管理**：通过 `petStore` 绑定阶段状态 (`stage`)，自动同步持久化到本地 `localStorage`。
* **智能交互区分**：判断鼠标按下与松开时的位移距离（`DRAG_THRESHOLD = 5px`），精准区分“拖拽移动窗口”与“点击切换宠物形态”。

---

## 变更历史

### v1.1.0 · 2026-08-04 · [Refactor]
* 彻底移除依赖不稳定、会导致首帧卡死及体积膨胀的 GIF 解码逻辑与依赖。
* 统一升级为流畅的 MP4 视频动画管线。
* 精细化调整 Canvas Chroma Key 抠白底阈值参数（`threshold: 41`, `softEdge: 15`），消除背景的同时完整保护宠物脸部与肤色高光。

### v1.0.0 · 2026-08-04 · [Feature]
* 完成桌面宠物基础架构搭建、透明窗口与跨阶段形态切换。
