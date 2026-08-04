# 📋 Day 1 开发任务清单：桌面客户端框架搭建

> **关联文档**：[桌面宠物成长 DApp 产品需求文档 (PRD v0.2)](../桌面宠物成长%20DApp%20产品需求文档%20%28PRD%29.md)  
> **日期**：Day 1  
> **核心交付物**：运行在桌面的透明 2D 宠物悬浮挂件

---

## 一、 开发目标 (Day 1 Goal)

* **核心产出**：运行在桌面上的透明 2D 宠物悬浮挂件。
* **关键特性**：
  * 无边框窗口 (`frame: false`)
  * 背景完全透明 (`transparent: true`)
  * 屏幕常驻置顶 (`alwaysOnTop: true`)
  * 鼠标无缝自由拖拽 (`-webkit-app-region: drag`)

---

## 二、 详细任务拆解 (Task Checklist)

### 1. 环境与项目初始化 (Project Setup)
- [x] **初始化项目**：使用 Vite + Electron 脚手架搭建底层架构 (基于 Vite 6 + Vue 3 + TypeScript)
- [x] **安装核心依赖**：已成功安装 `electron`, `vue@3`, `pinia`, `vite-plugin-electron` 等全套依赖
- [x] **清理冗余代码**：建立极简 Vue 渲染层与专用透明窗口样式，剔除任何模版杂质。

### 2. Electron 主进程配置 (Main Process Setup)
- [x] **配置 BrowserWindow 属性**：在主进程 (`src/main/index.ts`) 中设置透明与置顶参数：
  - `frame: false` (隐藏窗口边框与标题栏)
  - `transparent: true` (开启窗口透明度)
  - `alwaysOnTop: true` (设置桌面最高层级置顶)
  - `resizable: false` (锁定窗口大小为 `240x240`px)
  - `hasShadow: false` (关闭系统窗口阴影，防止透明背景黑框)
- [x] **窗口初始化定位**：自动获取屏幕分辨率，默认定位置于屏幕右下角。
- [x] **配置预加载脚本与 IPC 桥接**：设置 `webPreferences` 开启 `preload` 脚本 (`src/preload/index.ts`)。

### 3. 前端样式与资源准备 (Renderer & UI Setup)
- [x] **配置全局透明样式** (`src/renderer/style.css`)：已完成透明背景与取消选中文本设定。
- [x] **导入 2D 宠物素材**：编写了带悬浮/光晕/呼吸动效的 2D 极简 SVG 宠物组件，预留资源位置。

### 4. 交互与窗口拖拽功能 (Drag & Interactions)
- [x] **配置区域拖拽**：在宠物容器根节点配置 `-webkit-app-region: drag`，支持鼠标自由拖拽。
- [x] **绑定基础鼠标事件**：完成 Hover 缩放与动效，预留快捷打卡与交互接口。

---

## 三、 推荐目录结构 Blueprint

```text
desktop_pet/
├── docs/                           # 专用于存放文档的文件夹
│   └── day1_task_list.md           # Day 1 开发任务清单
├── 桌面宠物成长 DApp 产品需求文档 (PRD).md
├── package.json
├── electron.vite.config.ts
├── src/
│   ├── main/                       # Electron 主进程代码
│   │   └── index.ts                # 窗口创建与透明/置顶配置
│   ├── preload/                    # 预加载脚本
│   │   └── index.ts
│   └── renderer/                   # Vue3 前端 UI 代码
│       ├── index.html
│       ├── src/
│       │   ├── assets/             # 宠物动画/图片资源
│       │   ├── components/         # 宠物悬浮窗组件
│       │   │   └── PetWidget.vue
│       │   ├── App.vue
│       │   └── main.ts
```

---

## 四、 关键配置代码参考

### 1. `src/main/index.ts` (主进程核心窗口配置)
```typescript
import { app, BrowserWindow, screen } from 'electron'
import path from 'path'

function createWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

  const mainWindow = new BrowserWindow({
    width: 220,
    height: 220,
    x: screenWidth - 250,  // 默认放置在右下角
    y: screenHeight - 250,
    frame: false,           // 无边框
    transparent: true,     // 背景透明
    alwaysOnTop: true,     // 常驻置顶
    resizable: false,      // 禁止拖拽改变尺寸
    hasShadow: false,      // 无外阴影
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(createWindow)
```

### 2. `src/renderer/src/components/PetWidget.vue` (宠物视图组件)
```vue
<template>
  <div class="pet-container">
    <img src="../assets/pet_stage_0.gif" alt="Pet" class="pet-image" />
  </div>
</template>

<style scoped>
.pet-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  -webkit-app-region: drag; /* 允许鼠标拖拽悬浮窗口 */
  cursor: grab;
}

.pet-image {
  width: 160px;
  height: 160px;
  object-fit: contain;
  pointer-events: none; /* 避免图片防碍窗口拖拽 */
}
</style>
```

---

## 五、 Day 1 验收标准 (Acceptance Criteria)

- [ ] 执行 `npm run dev` 能够无报错正常启动。
- [ ] 桌面右下角成功渲染一个纯净透明背景的 2D 宠物动画。
- [ ] 按住宠物图形可以在桌面上流畅拖拽定位。
- [ ] 打开其他应用窗口时，宠物挂件始终保持最顶层置顶。
