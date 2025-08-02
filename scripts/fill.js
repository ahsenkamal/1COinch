const { ethers } = require("hardhat");
const { LimitOrderProtocolFacade } = require("@1inch/limit-order-protocol-utils");

async function main() {
  const [signer] = await ethers.getSigners();
  const chainId = 11155111;

  const protocol = new ethers.Contract(
    "0x94Bc2a1c732Bd9eee66a7f39f185a89a73b0fbcB",
    ["function fillOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),bytes,uint256,uint256,bytes,bytes) external payable returns(uint256, uint256)"]
  , signer);

  const order = require("./orderA.json");
  const signature = require("./sigA.json");

  const makingAmount = order.makingAmount;
  const takingAmount = order.takingAmount;

  const res = await protocol.fillOrder(
    order,
    signature.signature,
    makingAmount,
    takingAmount,
    "0x",
    "0x"
  );

  console.log("Order filled. Result:", res);
}

main().catch(console.error);