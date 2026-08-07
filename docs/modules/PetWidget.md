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
* **动态经验与曲线进化**：由 `petStore` 响应阶段目标（阶段0需要30经验，阶段1需要60经验，阶段2经验无上限）。配合光效完成链上突破。
* **桌面原生透明体验与防溢出**：
  - 外层容器设置 `pointer-events: none`（透明区域 100% 鼠标穿透，不拦截桌面点击），仅在宠物与弹窗实体上启用 `pointer-events: auto`。
  - 隐藏视频节点设置为零布局占位的绝对定位（`1px * 1px`），并在 `index.html` 开启 `overflow: hidden`，防止各种分辨率屏幕下 Viewport 盒模型扩展拉撑。
  - 主进程开启系统托盘 Tray Icon 挂载与高 DPI 适配开关，设置 `skipTaskbar: true` 隐藏任务栏图标。

---

## 变更历史

### v1.6.0 · 2026-08-07 · [Bugfix]
* 修复隐藏媒体元素导致的低分辨率/高 DPI 屏幕下窗口盒模型隐形溢出问题（`.hidden-media` 调整为 `1px`，根节点增加 `overflow: hidden`）。
* 引入 Hit-Testing 碰撞透传机制：`pet-wrapper` 设置 `pointer-events: none`，解决大面积透明窗口在桌面上拦截鼠标操作的问题。
* 优化组件物理尺寸：宠物形象物理尺寸精简为 `115px * 160px`，窗口调整至 `175px * 265px`。

### v1.5.0 · 2026-08-06 · [Feature]
* 新增 Windows 系统右下角托盘图标支持（System Tray Icon）并实现 `skipTaskbar: true` 隐藏任务栏卡片。
* 优化阶段成长经验曲线：阶段 0 需 30 经验进化，阶段 1 需 60 经验进化，阶段 2 经验无上限可无限累加。
* 修复生产打包路径：设置 `base: './'` 配合 `../dist/index.html` 解决生产环境下 MP4 资源与 HTML 页面加载 404/黑屏问题。
* 去除弹窗遮罩黑底框：将 `CheckInModal` 与 `NftPanel` 蒙版背景置为 `transparent`。
* 支持动态嵌入 `.exe` 与托盘自定义图标 `public/icon.png`。
* 编写全面使用与分发文档 `USER_GUIDE.md`。

### v1.4.0 · 2026-08-05 · [Feature]
* 新增进化光柱、金色浮动粒子（`evo-particles`）与全屏闪烁 reveal 特效。
* 优化 Web3 进化交易体验：后台静默发送链上交易，结合炫酷特效呈现宠物突破感。
* 新增打卡反馈：打卡成功时宠物呈现立体的抖动反馈，同时上方升起黄色飘字动画。
* 优化窗口拖拽平滑度：拖拽过程中暂停 `floatBounce` 动画，消除跟手移动时的微弱抖动。

### v1.3.0 · 2026-08-05 · [Feature]
* 新增双击宠物触发打开 NFT 属性状态面板 (`NftPanel.vue`)。
* 展现宠物当前 Token ID、区块链网络信息、四维能力经验条及智能合约绑定的属性状态。

### v1.2.0 · 2026-08-05 · [Feature]
* 调整 Electron 窗口高宽边界（`220px * 340px`），解决底部进化按钮显示截断问题。
* 取消点击宠物自动切换形态的功能，仅保留点击动画缩放反馈。
* 优化进化流程：进化成功后自动调用 `store.resetStats()` 将经验值归 0 并同步隐退进化按钮。
* 补充完善 `.gitignore`，忽略 Hardhat 智能合约编译产物（`artifacts/`, `cache/`, `typechain-types/`）与 `.claude/` 配置。

### v1.1.0 · 2026-08-04 · [Refactor]
* 彻底移除依赖不稳定、会导致首帧卡死及体积膨胀的 GIF 解码逻辑与依赖。
* 统一升级为流畅的 MP4 视频动画管线。
* 精细化调整 Canvas Chroma Key 抠白底阈值参数（`threshold: 41`, `softEdge: 15`），消除背景的同时完整保护宠物脸部与肤色高光。

### v1.0.0 · 2026-08-04 · [Feature]
* 完成桌面宠物基础架构搭建、透明窗口与跨阶段形态切换。
