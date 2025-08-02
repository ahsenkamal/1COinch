const hre = require("hardhat");

async function main() {
  const OCO = await hre.ethers.getContractFactory("OCOExtension");
  const oco = await OCO.deploy();
  await oco.waitForDeployment();
  console.log("OCOExtension deployed to:", await oco.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});