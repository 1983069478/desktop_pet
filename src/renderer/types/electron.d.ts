/**
 * preload 脚本通过 contextBridge 暴露到 window 上的 API 类型声明。
 * 这里只做类型描述，真正实现位于 src/preload/index.ts。
 */

/** 右键菜单动作类型 */
type MenuAction = 'check-in' | 'reset' | 'guide'

/** 宠物窗口专属 API */
interface PetAPI {
  /** 按下鼠标：把当前鼠标屏幕坐标传给主进程，记录拖拽起点 */
  startDrag: (x: number, y: number) => void
  /** 移动鼠标：把最新鼠标屏幕坐标传给主进程，实时移动窗口 */
  moveDrag: (x: number, y: number) => void
  /** 右键宠物：通知主进程弹出原生右键菜单 */
  showContextMenu: () => void
  /** 监听菜单点击事件 */
  onMenuAction: (callback: (action: MenuAction) => void) => void
  /** 移除菜单事件监听，组件销毁时调用 */
  removeMenuActionListener: () => void
  /** 打开外部默认浏览器链接 */
  openExternal: (url: string) => void
  /** 从主进程获取测试钱包私钥（返回 Promise） */
  getPrivateKey: () => Promise<string>
}

interface ElectronAPI {
  platform: string
}

interface Window {
  electronAPI?: ElectronAPI
  petAPI?: PetAPI
}
