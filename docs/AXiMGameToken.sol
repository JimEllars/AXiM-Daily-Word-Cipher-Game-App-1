// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract AXiMGameToken is ERC20 {
    using ECDSA for bytes32;

    address public backendSigner;
    
    mapping(address => uint256) public lastClaimDay;
    mapping(address => uint256) public currentStreak;

    constructor(address _signer) ERC20("AXiM Subcoin", "AXM") {
        backendSigner = _signer;
    }

    function claimDailyReward(
        uint256 score, 
        uint256 dayId, 
        bytes memory signature
    ) external {
        require(lastClaimDay[msg.sender] < dayId, "Already claimed today");

        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, score, dayId));
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        require(ECDSA.recover(ethSignedMessageHash, signature) == backendSigner, "Invalid signature");

        if (lastClaimDay[msg.sender] == dayId - 1) {
            currentStreak[msg.sender] += 1;
        } else {
            currentStreak[msg.sender] = 1;
        }

        lastClaimDay[msg.sender] = dayId;

        uint256 baseReward = score * 10 ** decimals() / 100;
        uint256 streakMultiplier = currentStreak[msg.sender] > 10 ? 200 : 100 + (currentStreak[msg.sender] * 10);
        uint256 finalReward = (baseReward * streakMultiplier) / 100;

        _mint(msg.sender, finalReward);
    }
}