import { contextBridge, ipcRenderer } from 'electron'

// 暴露安全的 Bridge API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
})

/**
 * 宠物窗口专属 API。
 * 渲染进程无法直接移动窗口（主进程才拥有窗口控制权），
 * 因此这里把「拖拽窗口」包装成两个 IPC 调用：
 * - startDrag(x, y)：按下鼠标时记录起点
 * - moveDrag(x, y)：拖动过程中实时告诉主进程鼠标最新位置
 */
contextBridge.exposeInMainWorld('petAPI', {
  // ---- 窗口拖拽 ----
  startDrag: (x: number, y: number) => ipcRenderer.send('window-drag-start', x, y),
  moveDrag: (x: number, y: number) => ipcRenderer.send('window-drag-move', x, y),

  // ---- 右键菜单 ----
  /** 通知主进程弹出右键菜单 */
  showContextMenu: () => ipcRenderer.send('show-context-menu'),

  /** 监听主进程菜单点击事件，返回所选菜单项标识 */
  onMenuAction: (callback: (action: 'check-in' | 'reset') => void) => {
    ipcRenderer.on('menu-action', (_event, action) => callback(action))
  },

  /** 移除菜单事件监听（组件卸载时清理，防止内存泄漏） */
  removeMenuActionListener: () => {
    ipcRenderer.removeAllListeners('menu-action')
  },

  // ---- 私钥获取 ----
  /** 从主进程获取 .env 中的测试钱包私钥（用于 Web3 交易签名） */
  getPrivateKey: (): Promise<string> => ipcRenderer.invoke('get-private-key'),
})
