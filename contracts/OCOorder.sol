// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@1inch/limit-order-protocol-contract/contracts/LimitOrderProtocol.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract OCOorder is Ownable {
    LimitOrderProtocol public constant LIMIT_ORDER_PROTOCOL = LimitOrderProtocol(0x94Bc2a1c732Bd9eee66a7f39f185befb9340bccb);

    struct OCOOrderPair {
        bytes32 takeProfitOrderHash;
        bytes32 stopLossOrderHash;
        bool isActive;
    }

    mapping(address => OCOOrderPair) public userOCOPairs;

    event OCOOrderCreated(address indexed user, bytes32 takeProfitHash, bytes32 stopLossHash);

    function createOCO(
        OrderLib.Order calldata takeProfitOrder,
        bytes calldata takeProfitSignature,
        OrderLib.Order calldata stopLossOrder,
        bytes calldata stopLossSignature
    ) external onlyOwner {
        require(takeProfitOrder.maker == msg.sender, "Invalid user");
        require(stopLossOrder.maker == msg.sender, "Invalid user");

        bytes32 tpHash = LIMIT_ORDER_PROTOCOL.hashOrder(takeProfitOrder);
        bytes32 slHash = LIMIT_ORDER_PROTOCOL.hashOrder(stopLossOrder);

        userOCOPairs[msg.sender] = OCOOrderPair(tpHash, slHash, true);

        emit OCOOrderCreated(msg.sender, tpHash, slHash);
    }
}