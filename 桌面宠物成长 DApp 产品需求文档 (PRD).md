# 桌面宠物成长 DApp 产品需求文档 (PRD)

创建者: Jerry
创建时间: 2026年7月27日 10:00
类别: PRD
上次编辑者: Jerry
上次更新时间: 2026年7月27日 10:06

# **桌面宠物成长 DApp 产品需求文档 (PRD)**

**文档版本**：v0.2

**更新日期**：2026-07-27

**开发周期**：1 周 (7 Days Sprint)

**开发模式**：个人独立全栈开发 (Solo Developer)

**部署网络**：Monad Testnet

**文档用途**：指导 1 周内 MVP Demo 的快速开发与技术落地，验证核心产品闭环。

---

## **1. 裁剪说明与 Demo 目标**

### **1.1 版本变更说明 (v0.1 -> v0.2)**

为了确保个人在 **1 周内**独立完成可演示的 Demo，v0.2 版本对 v0.1 PRD 进行了**极端裁剪（Radical Scoping）**：

- **砍掉云端后端**：采用“客户端 + 电脑本地存储（LocalStorage）”架构，实现 Serverless 极简设计。
- **砍掉复杂 Web3 基础设施**：去除了账户抽象（AA）、嵌入式钱包 SDK 及后端 Gas 代付，采用客户端直连 Monad 测试网 RPC + 极简 ERC-721 智能合约。
- **砍掉高级交互与扩展功能**：暂不开发 AI 自由对话、情绪系统、ERC-1155 里程碑徽章、好友拜访及装备系统。
- **聚焦核心闭环**：专注于“桌面透明浮窗 $\rightarrow$ 快捷打卡增加经验 $\rightarrow$ 满足条件触发进化 $\rightarrow$ Monad 测试网触发链上交易（更新 NFT 动态 URI）”的完整主线。

### **1.2 Demo 演示目标 (Wow Factor)**

通过 2 分钟的完整录屏或现场演示，验证并展现以下核心体验：

1. **桌面挂件体验**：无边框、透明背景、可拖拽常驻屏幕右下角的 2D 宠物浮窗。
2. **低打扰快捷打卡**：点击宠物调出极简打卡框，一键打卡，经验值即时增加并播放宠物高兴反馈。
3. **链上动态进化**：本地经验满格后触发进化，调起 Monad 测试网交易并更新链上 NFT 元数据，生成 Monad Explorer 可查的交易记录。

---

## **2. 极简技术架构**

```

┌─────────────────────────────────────────────────────────────┐
│ 客户端桌面悬浮窗 (Electron / Vue3 / Vite)                    │
│                                                             │
│  ├── 1. UI/交互层: 透明窗口 (Transparent Window), 2D GIF动画   │
│  ├── 2. 状态/存储层: Pinia + LocalStorage (打卡与经验记录)   │
│  └── 3. Web3 模块: viem / ethers.js                         │
└──────────────────────────┬──────────────────────────────────┘
                           │ 触发进化时发送 Transaction
                           ▼
              ┌──────────────────────────┐
              │ Monad Testnet (测试网)    │
              │ 智能合约: DynamicPetNFT  │
              └──────────────────────────┘
```

- **桌面客户端**：Electron + Vue3 / Vite（开启 `frame: false, transparent: true, alwaysOnTop: true`）。
- **数据存储**：100% 本地存储 (`LocalStorage`)，保存打卡历史、四维属性经验、本地宠物状态。
- **区块链网络**：Monad Testnet。
- **智能合约**：Solidity (ERC-721 URIStorage)，部署于 Monad 测试网。

---

## **3. 核心功能规格 (MVP Demo Scope)**

### **3.1 桌面透明悬浮窗 (Desktop Widget)**

- **P0**：支持系统置顶 (`alwaysOnTop`) 与透明背景。
- **P0**：支持按住鼠标无边框拖拽改变桌面位置（`webkit-app-region: drag`）。
- **P0**：显示 2D 宠物动画（如 2-3 套 GIF/PNG 序列帧：阶段 0 宠物蛋，阶段 1 幼体，阶段 2 进化形态）。
- **P0**：悬浮窗右键菜单支持：“快捷打卡”、“重置数据”、“退出应用”。

### **3.2 快捷打卡与属性经验 (Check-in & Stats)**

- **P0**：单击宠物或右键菜单调出“快捷打卡”浮层。
- **P0**：打卡表单仅包含：目标名称（可选输入框） + 四项属性单选（专注 / 智慧 / 创造 / 共情）。
- **P0**：提交打卡后：
    1. 宠物播放打卡动作/表情反馈 2 秒。
    2. 对应属性经验值 +10。
    3. 数据立即写入本地 `LocalStorage`。
- **说明**：打卡过程**完全链下进行**，零 Gas 费、不弹窗确认、秒级响应。

### **3.3 宠物进化与 Monad 链上交互 (On-Chain Evolution)**

- **进化条件**：当累计经验达到设定阈值（例如：打卡 3 次或总经验达到 30 点）时，自动触发进化。
- **链上交易 (Transaction)**：
    1. 客户端调用 Monad 测试网上的 `DynamicPetNFT.sol` 合约的 `evolvePet()` 方法。
    2. 提交新的元数据 JSON URI（更新 NFT 形象与属性数据）。
    3. 控制台/界面展示生成的 **Monad 交易哈希 (Tx Hash)**。
- **展示更新**：交易确认后，桌面宠物形态由“阶段 0/1”切换为“阶段 2（进化体）”，主面板显示“已成功在 Monad 链上记录进化”。

### **3.4 极简 NFT 状态面板 (NFT Inspector Page)**

- **P0**：双击宠物或通过菜单打开主面板。
- **P0**：展示宠物当前 NFT 预览卡片、Token ID、四维属性柱状图。
- **P0**：提供按钮点击直接跳转至 **Monad Block Explorer**（查看该 NFT 的交易记录和链上状态）。

---

## **4. 智能合约规格 (DynamicPetNFT.sol)**

部署至 **Monad Testnet** 的 Solidity 智能合约范例代码：

```
solidity

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DynamicPetNFT is ERC721URIStorage, Ownable {
    uint256 public tokenCounter;

    // 记录宠物的成长阶段 (0: 蛋, 1: 幼体, 2: 进化体)
    mapping(uint256 => uint256) public petStage;

    event PetMinted(address indexed owner, uint256 tokenId);
    event PetEvolved(uint256 indexed tokenId, uint256 newStage, string newUri);

    constructor() ERC721("Monad Growth Pet", "M-PET") Ownable(msg.sender) {
        tokenCounter = 0;
    }

    // 1. 铸造宠物 NFT
    function mintPet(string memory initialUri) public returns (uint256) {
        uint256 newItemId = tokenCounter;
        _safeMint(msg.sender, newItemId);
        _setTokenURI(newItemId, initialUri);
        petStage[newItemId] = 0;
        tokenCounter++;
        emit PetMinted(msg.sender, newItemId);
        return newItemId;
    }

    // 2. 进化宠物 (更新形态与动态 URI)
    function evolvePet(uint256 tokenId, uint256 newStage, string memory newUri) public {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        petStage[tokenId] = newStage;
        _setTokenURI(tokenId, newUri);
        emit PetEvolved(tokenId, newStage, newUri);
    }
}
```

---

## **5. 7天开发冲刺计划 (7-Day Sprint Plan)**

| **天数** | **核心目标** | **具体任务** | **交付产物** |
| --- | --- | --- | --- |
| **Day 1** | **桌面客户端框架搭建** | 1. 搭建 Electron + Vite + Vue3 模板。
2. 配置透明背景、无边框、无系统标题栏。
3. 实现鼠标拖拽与置顶渲染 2D 宠物 GIF。 | 运行在桌面的透明宠物挂件 |
| **Day 2** | **本地打卡与经验系统** | 1. 设计打卡弹窗组件。
2. 编写 Pinia/LocalStorage 经验累加逻辑。
3. 添加打卡成功后的宠物动作/表情反馈。 | 可持续打卡并累加经验的本地闭环 |
| **Day 3** | **Monad 测试网合约部署** | 1. 使用 Hardhat/Remix 编写 `DynamicPetNFT.sol`。
2. 获取 Monad 测试网水龙头测试币。
3. 部署合约至 Monad Testnet 并记录 ABI 与合约地址。 | Monad 测试网上已部署的 NFT 合约 |
| **Day 4** | **Web3 模块集成** | 1. 客户端引入 `ethers.js` 或 `viem`。
2. 实现连接 Monad 测试网发交易功能（Mint & Evolve）。
3. 在进化触发点调用合约 `evolvePet()`。 | 打通客户端与 Monad 测试网交易 |
| **Day 5** | **全链路进化与动态 NFT 展示** | 1. 本地经验满格 $\rightarrow$ 自动触发 Monad 链上交易。
2. 交易成功后更新桌面宠物形态（更换 GIF 素材）。
3. 制作主面板，展示 Token ID、属性图及 Monad Explorer 链接。 | 完整走通“打卡-进化-链上更新”主线 |
| **Day 6** | **UI/UX 细节优化** | 1. 优化拖拽体验与右键菜单。
2. 增加音效与进化粒子/光效动画。
3. 修复交互 Bug，确保无崩溃。 | 高完成度可演示 Demo |
| **Day 7** | **测试与视频录制 Showcase** | 1. 在 Monad 测试网上进行全流程测试。
2. 录制 1-2 分钟完整的 Demo 演示视频。 | 演示视频与最终代码库 |

---

## **6. 风险控制与应急方案**

1. **Monad 测试网 RPC 延迟或拥堵**：
    - *应对*：客户端增加 `Loading...` 锁屏状态及交易失败重试提示；预留切换备用 RPC 节点接口。
2. **私钥/钱包连接复杂度**：
    - *应对*：Demo 开发期间可直接在客户端环境变量配置测试私钥直连发交易，避免每次都手动弹窗签名 MetaMask。
3. **美术资源短缺**：
    - *应对*：直接使用免费开源像素 GIF 资源（如 itch.io 搜索 "Pixel Monster/Pet"），属性差异用 CSS `filter: hue-rotate()` 色相旋转实现换色。