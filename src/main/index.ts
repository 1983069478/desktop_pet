import { app, BrowserWindow, screen, ipcMain, Menu, Tray, nativeImage } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import dotenv from 'dotenv'

import { fileURLToPath } from 'node:url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ---- 窗口位置持久化 ----

/** 保存窗口位置的 JSON 文件路径 */
const WINDOW_CONFIG_PATH = path.join(app.getPath('userData'), 'window-position.json')

interface WindowConfig {
  x: number
  y: number
}

function saveWindowPosition(x: number, y: number) {
  try {
    fs.writeFileSync(WINDOW_CONFIG_PATH, JSON.stringify({ x, y }))
  } catch {
    // 写入失败静默忽略
  }
}

function loadWindowPosition(): WindowConfig | null {
  try {
    if (fs.existsSync(WINDOW_CONFIG_PATH)) {
      const raw = fs.readFileSync(WINDOW_CONFIG_PATH, 'utf-8')
      const config = JSON.parse(raw)
      if (typeof config.x === 'number' && typeof config.y === 'number') {
        return config
      }
    }
  } catch {
    // 读取失败则使用默认位置
  }
  return null
}

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

/** 创建系统右下角托盘图标 */
function createTray() {
  const iconPaths = [
    path.join(__dirname, '../public/icon.png'),
    path.join(__dirname, '../dist/icon.png'),
    path.join(app.getAppPath(), 'public/icon.png'),
    path.join(app.getAppPath(), 'dist/icon.png'),
  ]

  let icon: Electron.NativeImage | null = null
  for (const p of iconPaths) {
    if (fs.existsSync(p)) {
      const img = nativeImage.createFromPath(p)
      if (!img.isEmpty()) {
        icon = img
        break
      }
    }
  }

  if (!icon) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="#7c3aed"/><ellipse cx="16" cy="15" rx="7" ry="9" fill="#a78bfa"/><circle cx="12" cy="11" r="3.5" fill="#ffffff" opacity="0.85"/></svg>`
    icon = nativeImage.createFromDataURL(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`)
  }

  tray = new Tray(icon)
  tray.setToolTip('🥚')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '📝 快捷打卡',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.webContents.send('menu-action', 'check-in')
        }
      },
    },
    {
      label: '🔄 重置数据',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('menu-action', 'reset')
        }
      },
    },
    {
      label: '👁️ 显示/隐藏宠物',
      click: () => {
        if (!mainWindow) return
        if (mainWindow.isVisible()) {
          mainWindow.hide()
        } else {
          mainWindow.show()
        }
      },
    },
    { type: 'separator' },
    {
      label: '❌ 退出应用',
      click: () => {
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    if (!mainWindow) return
    if (mainWindow.isVisible()) {
      mainWindow.focus()
    } else {
      mainWindow.show()
    }
  })
}

/**
 * 窗口拖拽状态缓存。
 * 拖拽开始时记录「窗口位置 + 鼠标屏幕坐标」的初始值，
 * 拖动过程中用 鼠标位移量 实时计算窗口新位置，保证窗口不"跳"。
 */
let dragState: {
  startWindowX: number
  startWindowY: number
  startCursorX: number
  startCursorY: number
} | null = null

/** 注册渲染进程发来的 IPC 事件 */
function registerIpcHandlers() {
  // ---- 窗口拖拽 ----

  ipcMain.on('window-drag-start', (_event, cursorX: number, cursorY: number) => {
    if (!mainWindow) return
    const [winX, winY] = mainWindow.getPosition()
    dragState = { startWindowX: winX, startWindowY: winY, startCursorX: cursorX, startCursorY: cursorY }
  })

  ipcMain.on('window-drag-move', (_event, cursorX: number, cursorY: number) => {
    if (!mainWindow || !dragState) return
    const dx = cursorX - dragState.startCursorX
    const dy = cursorY - dragState.startCursorY
    mainWindow.setPosition(dragState.startWindowX + dx, dragState.startWindowY + dy)
  })

  // ---- 私钥读取 ----

  ipcMain.handle('get-private-key', () => {
    return process.env.PRIVATE_KEY || ''
  })

  // ---- 右键菜单 ----

  ipcMain.on('show-context-menu', (event) => {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: '📝 快捷打卡',
        click: () => {
          event.sender.send('menu-action', 'check-in')
        },
      },
      {
        label: '🔄 重置数据',
        click: () => {
          event.sender.send('menu-action', 'reset')
        },
      },
      { type: 'separator' },
      {
        label: '❌ 退出应用',
        click: () => {
          app.quit()
        },
      },
    ]

    const menu = Menu.buildFromTemplate(template)
    menu.popup({ window: mainWindow! })
  })
}

function createWindow() {
  // 获取主显示器工作区尺寸
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize

  const windowWidth = 220
  const windowHeight = 340

  // 尝试恢复上次窗口位置，否则使用默认右下角
  const saved = loadWindowPosition()
  const initialX = saved ? saved.x : screenWidth - windowWidth - 20
  const initialY = saved ? saved.y : screenHeight - windowHeight - 20

  // 确定 preload 脚本路径（兼容 index.mjs 和 index.js）
  const preloadPath = fs.existsSync(path.join(__dirname, 'preload/index.mjs'))
    ? path.join(__dirname, 'preload/index.mjs')
    : path.join(__dirname, 'preload/index.js')

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: initialX,
    y: initialY,
    frame: false,            // 无边框窗口
    transparent: true,      // 窗口背景透明
    alwaysOnTop: true,      // 常驻桌面最顶层
    resizable: false,       // 固定窗口大小
    hasShadow: false,       // 关闭窗口阴影
    skipTaskbar: true,      // 不在 Windows 任务栏显示图标
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // 根据 Vite 环境变量加载页面
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    // mainWindow.webContents.openDevTools({ mode: 'detach' }) // 调试时可开启
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // 关闭前保存窗口位置
  mainWindow.on('close', () => {
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition()
      saveWindowPosition(x, y)
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  registerIpcHandlers()
  createWindow()
  createTray()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
