// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";

contract OCOExtension is Ownable {
    event OCORegistered(address indexed user, uint256 slot, uint8 bit, bytes32 orderA, bytes32 orderB);

    constructor() Ownable(msg.sender) {}

    mapping(address => mapping(uint256 => uint256)) public usedBits;

    modifier onlyUnusedBit(uint256 slot, uint8 bit) {
        require((usedBits[msg.sender][slot] >> bit & 1) == 0, "Bit already used");
        _;
    }

    function registerOCO(
        uint256 slot,
        uint8 bit,
        bytes32 orderHashA,
        bytes32 orderHashB
    ) external onlyUnusedBit(slot, bit) {
        usedBits[msg.sender][slot] |= (1 << bit);
        emit OCORegistered(msg.sender, slot, bit, orderHashA, orderHashB);
    }
}
