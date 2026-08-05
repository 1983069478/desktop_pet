import hardhat from "hardhat";
const { ethers } = hardhat;

async function main() {
  console.log("🚀 正在部署 DynamicPetNFT 合约到 Monad 测试网...\n");

  // 获取部署账号
  const [deployer] = await ethers.getSigners();
  console.log("部署账号:", deployer.address);
  console.log("账号余额:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MON\n");

  // 部署合约
  const DynamicPetNFT = await ethers.getContractFactory("DynamicPetNFT");
  const contract = await DynamicPetNFT.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("✅ 合约部署成功！");
  console.log("合约地址:", contractAddress);
  console.log("\n📋 请将此地址保存到 src/contracts/address.ts");
  console.log("🔍 Monad 浏览器: https://testnet.monadvision.com/address/" + contractAddress);
}

main().catch((error) => {
  console.error("❌ 部署失败:", error);
  process.exitCode = 1;
});
