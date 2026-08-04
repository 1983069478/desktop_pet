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
  startDrag: (x: number, y: number) => ipcRenderer.send('window-drag-start', x, y),
  moveDrag: (x: number, y: number) => ipcRenderer.send('window-drag-move', x, y),
})
