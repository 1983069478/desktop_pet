/**
 * preload 脚本通过 contextBridge 暴露到 window 上的 API 类型声明。
 * 这里只做类型描述，真正实现位于 src/preload/index.ts。
 */

/** 窗口拖拽 API（用于把宠物窗口从渲染进程搬到新位置） */
interface PetAPI {
  /** 按下鼠标：把当前鼠标屏幕坐标传给主进程，记录拖拽起点 */
  startDrag: (x: number, y: number) => void
  /** 移动鼠标：把最新鼠标屏幕坐标传给主进程，实时移动窗口 */
  moveDrag: (x: number, y: number) => void
}

interface ElectronAPI {
  platform: string
}

interface Window {
  electronAPI?: ElectronAPI
  petAPI?: PetAPI
}
