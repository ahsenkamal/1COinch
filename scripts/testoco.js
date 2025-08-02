const { ethers } = require("hardhat");
const fetch = require("node-fetch");
const { LimitOrderBuilder, LimitOrderPredicateBuilder } = require("@1inch/limit-order-protocol-utils");

async function main() {
  const [signer] = await ethers.getSigners();
  const chainId = 11155111;
  const ocoAddress = "0x3B92998F37264510645ccE5f3b112F766e858cb9";
  const OCO_ABI = ["function registerOCO(uint256,uint8,bytes32,bytes32) external"];
  const oco = new ethers.Contract(ocoAddress, OCO_ABI, signer);

  const makerAsset = "0x6E08Aae1fF3f8D53fBfc0703c6d5c7e4BFbB0D74";
  const takerAsset = "0xDD13E55209Fd76AfE204dBda4007C227904f0a81";
  const makingAmount = ethers.utils.parseUnits("1", 6);
  const takingAmount = ethers.utils.parseUnits("0.005", 18);
  const slot = 0;
  const bit = 17;

  const saltA = ethers.utils.hexlify(ethers.utils.randomBytes(32));
  const saltB = ethers.utils.hexlify(ethers.utils.randomBytes(32));

  const predicate = new LimitOrderPredicateBuilder()
    .bitInvalidatorEquals(slot, bit, false)
    .build();

  const builder = new LimitOrderBuilder(chainId, makerAsset, takerAsset)
    .setMaker(await signer.getAddress())
    .setMakingAmount(makingAmount.toString())
    .setTakingAmount(takingAmount.toString())
    .setPredicate(predicate);

  const orderA = builder.setSalt(saltA).build();
  const orderB = builder.setSalt(saltB).build();

  const sigA = await orderA.signTypedData(signer, chainId);
  const sigB = await orderB.signTypedData(signer, chainId);

  await oco.registerOCO(slot, bit, orderA.getOrderHash(), orderB.getOrderHash());
  console.log("Registered OCO orders");

  const headers = { "Content-Type": "application/json" };

  const postOrder = async (order, signature) => {
    const res = await fetch("https://api.1inch.dev/orderbook/v4/order", {
      method: "POST",
      headers,
      body: JSON.stringify({ order, signature: signature.signature })
    });
    console.log(`Order submitted. Status: ${res.status}`);
  };

  await postOrder(orderA, sigA);
  await postOrder(orderB, sigB);

  console.log("Use fillOrder.js to fill one order and test cancellation.");
}

main().catch(console.error);