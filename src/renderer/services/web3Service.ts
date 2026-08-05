/**
 * Monad 测试网 Web3 服务模块
 *
 * 封装与 DynamicPetNFT 智能合约的所有交互：
 * - 初始化 Provider / Signer / Contract
 * - 铸造新宠物 NFT（mintPet）
 * - 进化宠物 NFT（evolvePet）
 */

import { ethers } from 'ethers'
import { CONTRACT_ADDRESS } from '../../contracts/address'
import { CONTRACT_ABI } from '../../contracts/abi'

// ==================== 常量 ====================

/** Monad 测试网 RPC 节点地址 */
const RPC_URL = 'https://testnet-rpc.monad.xyz'

/** Monad 测试网 Chain ID */
const CHAIN_ID = 10143

/** 各阶段的元数据 URI（占位符，实际应上传到 IPFS） */
const STAGE_URIS: Record<number, string> = {
  0: 'https://metadata.desktop-pet.app/pet/stage/0/egg.json',
  1: 'https://metadata.desktop-pet.app/pet/stage/1/young.json',
  2: 'https://metadata.desktop-pet.app/pet/stage/2/evolved.json',
}

// ==================== 状态 ====================

let provider: ethers.JsonRpcProvider | null = null
let signer: ethers.Wallet | null = null
let contract: ethers.Contract | null = null
let initialized = false

// ==================== 初始化 ====================

/**
 * 初始化 Web3 连接
 * 必须在调用任何合约方法前执行
 *
 * @param privateKey 测试钱包私钥（从主进程安全获取）
 */
export function initWeb3(privateKey: string): void {
  provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID, { staticNetwork: true })

  signer = new ethers.Wallet(privateKey, provider)

  contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)

  initialized = true
  console.log('[Web3Service] 已连接到 Monad 测试网')
  console.log('[Web3Service] 合约地址:', CONTRACT_ADDRESS)
  console.log('[Web3Service] 钱包地址:', signer.address)
}

/** 检查是否已初始化 */
export function isReady(): boolean {
  return initialized && contract !== null
}

/** 获取当前钱包地址 */
export function getWalletAddress(): string | null {
  return signer?.address ?? null
}

// ==================== 合约交互 ====================

/** 铸造结果 */
export interface MintResult {
  tokenId: number
  txHash: string
}

/**
 * 铸造一只新宠物 NFT（首次使用）
 *
 * @param stage 初始阶段编号（通常为 0 = 宠物蛋）
 * @returns Token ID 和交易哈希
 */
export async function mintPet(stage: number = 0): Promise<MintResult> {
  if (!contract) throw new Error('Web3 未初始化，请先调用 initWeb3()')

  const uri = STAGE_URIS[stage] ?? STAGE_URIS[0]
  console.log('[Web3Service] 开始铸造宠物...', { stage, uri })

  const tx = await contract.mintPet(uri)
  console.log('[Web3Service] 铸造交易已发送:', tx.hash)

  const receipt = await tx.wait()
  console.log('[Web3Service] 铸造交易已确认, 区块:', receipt.blockNumber)

  // 从交易日志中解析 PetMinted 事件获取 Token ID
  let tokenId = 0
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog({ topics: [...log.topics], data: log.data })
      if (parsed && parsed.name === 'PetMinted') {
        tokenId = Number(parsed.args.tokenId)
        break
      }
    } catch {
      // 跳过不属于本合约的日志
    }
  }

  console.log('[Web3Service] 铸造完成, Token ID:', tokenId)
  return { tokenId, txHash: receipt.hash }
}

/**
 * 进化宠物：在链上更新成长阶段和元数据 URI
 *
 * @param tokenId 要进化的宠物 Token ID
 * @param newStage 新阶段编号 (1 = 幼体, 2 = 进化体)
 * @returns 交易哈希
 */
export async function evolvePet(tokenId: number, newStage: number): Promise<string> {
  if (!contract) throw new Error('Web3 未初始化，请先调用 initWeb3()')

  const uri = STAGE_URIS[newStage] ?? STAGE_URIS[2]
  console.log('[Web3Service] 开始进化宠物...', { tokenId, newStage, uri })

  const tx = await contract.evolvePet(tokenId, newStage, uri)
  console.log('[Web3Service] 进化交易已发送:', tx.hash)

  const receipt = await tx.wait()
  console.log('[Web3Service] 进化交易已确认, 区块:', receipt.blockNumber)

  return receipt.hash
}

/** Monad 测试网浏览器交易链接 */
export function getExplorerUrl(txHash: string): string {
  return `https://testnet.monadvision.com/tx/${txHash}`
}

/** Monad 测试网浏览器 NFT 链接 */
export function getNFTUrl(tokenId: number): string {
  return `https://testnet.monadvision.com/address/${CONTRACT_ADDRESS}`
}
