# Day 3 计划：Monad 测试网智能合约部署

**日期**：2026-08-04

**目标**：编写宠物 NFT 智能合约，并部署到 Monad 测试网

---

## 背景知识

- **区块链**：一个公共的、不可篡改的分布式账本，所有交易记录公开可查
- **智能合约**：运行在区块链上的程序代码，一旦部署就不能修改，按预设规则自动执行
- **Monad 测试网**：Monad 区块链的测试环境，测试币免费领取，用于开发调试
- **NFT**：非同质化代币，每个 NFT 都是独一无二的数字资产。宠物的每个成长阶段对应不同的 NFT 元数据

---

## 任务清单

### ① 搭建 Hardhat 环境

Hardhat 是以太坊智能合约的开发框架，提供编译、测试、部署等功能。

- 安装 Hardhat 及相关依赖包
- 在项目根目录创建 `hardhat.config.ts` 配置文件
- 创建 `contracts/` 目录存放合约源码
- 创建 `scripts/` 目录存放部署脚本

### ② 编写 DynamicPetNFT 合约

用 Solidity 语言编写 ERC-721 NFT 合约，包含两个核心功能：

| 功能 | 方法 | 说明 |
|------|------|------|
| 铸造宠物 | `mintPet(initialUri)` | 创建一只新宠物 NFT，设置初始元数据 URI |
| 进化宠物 | `evolvePet(tokenId, newStage, newUri)` | 更新宠物的成长阶段和元数据 URI |

### ③ 配置 Monad 测试网

在 Hardhat 配置中添加 Monad Testnet 的网络信息：
- RPC 节点地址（与区块链通信的入口）
- Chain ID（区块链网络标识）
- 部署账号私钥（用于签名交易）

### ④ 领取 Monad 测试币

- 访问 Monad 测试网水龙头（Faucet）网站
- 输入钱包地址领取免费测试币
- 测试币用于支付合约部署的 Gas 费用

### ⑤ 部署合约

- 编写部署脚本 `scripts/deploy.ts`
- 运行部署命令将合约发布到 Monad 测试网
- 等待交易确认，获取合约地址

### ⑥ 保存合约信息

合约部署成功后需要保存以下信息，供 Day 4 前端集成使用：

- **合约地址**：区块链上合约的唯一标识
- **ABI（应用二进制接口）**：描述合约有哪些方法、参数类型的 JSON 文件
- 将以上信息写入 `src/contracts/` 目录供前端引用

---

## 涉及文件

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `hardhat.config.ts` | 新建 | Hardhat 编译和网络配置 |
| `contracts/DynamicPetNFT.sol` | 新建 | NFT 智能合约源码 |
| `scripts/deploy.ts` | 新建 | 合约部署脚本 |
| `package.json` | 修改 | 新增 Hardhat 相关 npm 依赖 |
| `src/contracts/address.ts` | 新建 | 合约地址常量 |
| `src/contracts/abi.ts` | 新建 | 合约 ABI 定义 |
| `.gitignore` | 修改 | 排除私钥等敏感文件 |

---

## 前置条件

- Node.js 环境（已满足）
- 钱包地址和私钥（用于部署合约）
- 浏览器访问 Monad 测试网水龙头

---

## 部署结果 ✅

| 项目 | 值 |
|------|-----|
| **合约地址** | `0x005e2dBe0ac53B7B6785BC4baEeEBCd37630A2A4` |
| **部署账号** | `0x9E3317d57071C677C74AA32C5689aCA4BaF1DA18` |
| **网络** | Monad Testnet (Chain ID: 10143) |
| **部署时间** | 2026-08-05 |
| **Monad 浏览器** | https://testnet.monadvision.com/address/0x005e2dBe0ac53B7B6785BC4baEeEBCd37630A2A4 |

### 新增文件

| 文件 | 说明 |
|------|------|
| `contracts/DynamicPetNFT.sol` | NFT 合约源码 |
| `hardhat.config.cjs` | Hardhat 编译和部署配置 |
| `scripts/deploy.ts` | 部署脚本 |
| `src/contracts/address.ts` | 合约地址常量（Day 4 使用） |
| `src/contracts/abi.ts` | 合约 ABI 接口定义（Day 4 使用） |
| `.env` | 测试钱包私钥（已 gitignore） |
