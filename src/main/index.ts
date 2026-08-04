import { app, BrowserWindow, screen, ipcMain } from 'electron'
import path from 'node:path'

// 关闭硬件加速（可选，某些 Windows 系统上透明窗口需要关闭硬件加速以防黑框，但通常默认支持）
// app.disableHardwareAcceleration()

let mainWindow: BrowserWindow | null = null

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

/** 注册渲染进程发来的 IPC 事件（窗口拖拽） */
function registerWindowDragIpc() {
  // 用户按下鼠标：记录拖拽起点
  ipcMain.on('window-drag-start', (_event, cursorX: number, cursorY: number) => {
    if (!mainWindow) return
    const [winX, winY] = mainWindow.getPosition()
    dragState = { startWindowX: winX, startWindowY: winY, startCursorX: cursorX, startCursorY: cursorY }
  })

  // 用户移动鼠标：根据位移量移动窗口
  ipcMain.on('window-drag-move', (_event, cursorX: number, cursorY: number) => {
    if (!mainWindow || !dragState) return
    const dx = cursorX - dragState.startCursorX
    const dy = cursorY - dragState.startCursorY
    mainWindow.setPosition(dragState.startWindowX + dx, dragState.startWindowY + dy)
  })
}

function createWindow() {
  // 获取主显示器工作区尺寸
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize

  const windowWidth = 200
  const windowHeight = 270

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: screenWidth - windowWidth - 20, // 距离右侧 20px
    y: screenHeight - windowHeight - 20, // 距离底部 20px
    frame: false,            // 无边框窗口
    transparent: true,      // 窗口背景透明
    alwaysOnTop: true,      // 常驻桌面最顶层
    resizable: false,       // 固定窗口大小
    hasShadow: false,       // 关闭窗口阴影
    skipTaskbar: false,     // 是否在任务栏隐藏 (开发期保留任务栏图标便于操控)
    webPreferences: {
      preload: path.join(__dirname, 'preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // 根据 Vite 环境变量加载页面
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    // mainWindow.webContents.openDevTools({ mode: 'detach' }) // 调试时可开启
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  registerWindowDragIpc()
  createWindow()

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
