# Day 4 计划：Web3 模块集成

**日期**：2026-08-05

**目标**：让桌面客户端能直接调用 Monad 测试网上的智能合约，打通"铸造宠物"和"进化宠物"两条链上交易。

---

## 背景知识

- **Provider**：客户端和区块链之间的"电话线"，负责把我们的请求传给区块链
- **Signer**：用私钥签名的"印章"，证明交易是我们发起的
- **Contract**：把合约地址 + ABI 组合起来，让我们可以像调用普通函数一样调用合约方法

---

## 任务清单

### ① 创建 Web3 服务模块

新建 `src/renderer/services/web3Service.ts`，把区块链交互逻辑封装成独立服务：

| 功能 | 说明 |
|------|------|
| 初始化 Provider | 连接 Monad 测试网 RPC 节点 |
| 创建 Signer | 用钱包私钥创建签名器 |
| 获取合约实例 | 用 Day 3 保存的地址 + ABI 创建合约对象 |
| `mintPet()` | 铸造新宠物 NFT（首次创建） |
| `evolvePet()` | 进化宠物（更新阶段和 URI） |

### ② 管理私钥（安全处理）

私钥不能写死在代码里，需要考虑安全性：

- 目前私钥存在 `.env` 文件（不上传 GitHub）
- Day 4 阶段：在 Electron 渲染进程通过 preload 桥接读取
- 方案：Electron 主进程读取 `.env`，通过 IPC 安全传递给渲染进程

### ③ 集成到打卡流程

把链上操作加入现有交互流程：

```
打卡 3 次（总经验 ≥ 30）
       ↓
  弹出提示："宠物可以进化了！"
       ↓
  用户确认 → 调用合约 evolvePet()
       ↓
  等待交易确认（显示 Loading）
       ↓
  交易成功 → 切换宠物形态 + 显示 Tx Hash
```

### ④ 添加交易状态 UI

| 状态 | 显示 |
|------|------|
| 交易发送中 | 加载动画 + "正在发送交易到 Monad 测试网..." |
| 交易确认中 | 加载动画 + "等待区块确认..." |
| 交易成功 | ✅ 显示 Monad 浏览器链接 |
| 交易失败 | ❌ 显示错误信息 + 重试按钮 |

### ⑤ 首次铸造逻辑

判断用户是否已经拥有宠物 NFT：

- 如果 localStorage 中没有 Token ID → 用户首次使用 → 调用 `mintPet()` 铸造新 NFT
- 如果已有 Token ID → 跳过铸造，直接进入正常流程
- 铸造成功后保存 Token ID 到 localStorage

---

## 涉及文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/renderer/services/web3Service.ts` | 新建 | Web3 交互核心模块 |
| `src/main/index.ts` | 修改 | 主进程读取私钥，IPC 传递给渲染进程 |
| `src/preload/index.ts` | 修改 | 暴露私钥读取接口 |
| `src/renderer/types/electron.d.ts` | 修改 | 补充新 API 类型 |
| `src/renderer/stores/petStore.ts` | 修改 | 新增 Token ID 存储、进化触发判断 |
| `src/renderer/components/PetWidget.vue` | 修改 | 集成进化流程 + 交易状态提示 |
| `src/renderer/components/TxStatus.vue` | 新建 | 交易状态提示组件 |

---

## 依赖

- `ethers.js` v6（已安装）✅
- Monad 测试网 RPC（已配置）✅
- 合约地址 + ABI（Day 3 已保存）✅
- 测试钱包私钥（`.env` 已有）✅

---

## 完成结果 ✅

### 新增/修改文件

| 文件 | 状态 | 说明 |
|------|------|------|
| `src/renderer/services/web3Service.ts` | ✅ 新建 | 封装 mintPet / evolvePet / 浏览器链接 |
| `src/main/index.ts` | ✅ 修改 | 新增 `get-private-key` IPC handler |
| `src/preload/index.ts` | ✅ 修改 | 新增 `getPrivateKey()` 桥接方法 |
| `src/renderer/types/electron.d.ts` | ✅ 修改 | 补充类型声明 |
| `src/renderer/stores/petStore.ts` | ✅ 修改 | 新增 tokenId / needsMint / canEvolve / resetAll |
| `src/renderer/components/PetWidget.vue` | ✅ 修改 | 集成 Web3 初始化 + 进化按钮 + 经验进度条 |
| `src/renderer/components/TxStatus.vue` | ✅ 新建 | 交易状态 Toast 提示组件 |

### 用户操作流程

```
打卡 3 次 → 总经验 30/30
    ↓
✨ "可以进化了！" 按钮出现（带脉冲光效）
    ↓
用户点击按钮
    ↓
[首次] 自动铸造 NFT → ⏳ 等待确认
    ↓
调用合约 evolvePet() → ⏳ 等待确认
    ↓
✅ 进化成功！显示 Monad 浏览器链接
    宠物形态自动切换到下一阶段
```
