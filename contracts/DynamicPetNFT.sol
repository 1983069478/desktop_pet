// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * 桌面宠物成长 NFT 合约
 *
 * 每只宠物是一个 ERC-721 NFT，通过 evolvePet() 更新成长阶段和元数据 URI。
 * 部署在 Monad 测试网上，供桌面宠物 Electron 客户端调用。
 */
contract DynamicPetNFT is ERC721URIStorage, Ownable {
    /** 下一个可用的 Token ID（自增计数器） */
    uint256 public tokenCounter;

    /** 记录每个 NFT 的成长阶段 (0: 蛋, 1: 幼体, 2: 进化体) */
    mapping(uint256 => uint256) public petStage;

    /** 宠物进化事件（供前端/浏览器监听） */
    event PetMinted(address indexed owner, uint256 tokenId);
    event PetEvolved(uint256 indexed tokenId, uint256 newStage, string newUri);

    constructor() ERC721("Monad Growth Pet", "M-PET") Ownable(msg.sender) {
        tokenCounter = 0;
    }

    /**
     * 铸造一只新宠物 NFT
     * @param initialUri 初始元数据 URI（指向宠物蛋阶段的 JSON）
     * @return 新铸造的 Token ID
     */
    function mintPet(string memory initialUri) public returns (uint256) {
        uint256 newItemId = tokenCounter;
        _safeMint(msg.sender, newItemId);
        _setTokenURI(newItemId, initialUri);
        petStage[newItemId] = 0;
        tokenCounter++;
        emit PetMinted(msg.sender, newItemId);
        return newItemId;
    }

    /**
     * 进化宠物：更新成长阶段和元数据 URI
     * @param tokenId  要进化的宠物 Token ID
     * @param newStage 新阶段编号 (1 = 幼体, 2 = 进化体)
     * @param newUri   新阶段的元数据 URI
     */
    function evolvePet(uint256 tokenId, uint256 newStage, string memory newUri) public {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(newStage > petStage[tokenId], "Stage must increase");
        petStage[tokenId] = newStage;
        _setTokenURI(tokenId, newUri);
        emit PetEvolved(tokenId, newStage, newUri);
    }
}
