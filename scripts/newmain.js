require('dotenv').config();
const { ethers } = require('ethers');
const axios = require('axios');

const RPC_URL = process.env.MAIN_RPC;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ONE_INCH_API_KEY = process.env.ONE_INCH_API_KEY;

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Token & contract addresses
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; // 6 decimals
const USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7'; // 6 decimals
const LIMIT_ORDER_CONTRACT = '0x111111125421ca6dc452d289314280a0f8842a65'; // v4

const LIMIT_ORDER_API = 'https://api.1inch.dev/limit-order/v4.0/1';

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)'
];

function getHeaders() {
  return {
    Authorization: `Bearer ${ONE_INCH_API_KEY}`,
    'Content-Type': 'application/json'
  };
}

async function ensureAllowance(tokenAddress, amount) {
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
  const current = await token.allowance(wallet.address, LIMIT_ORDER_CONTRACT);
  if (current < amount) {
    console.log(`🔓 Approving ${ethers.formatUnits(amount, 6)} tokens...`);
    const tx = await token.approve(LIMIT_ORDER_CONTRACT, amount);
    await tx.wait();
    console.log('✅ Approved.');
  } else {
    console.log('✅ Already approved.');
  }
}

async function placeLimitOrder(makingAmt, takingAmt, salt) {
  const order = {
    makerAsset: USDC,
    takerAsset: USDT,
    makingAmount: makingAmt.toString(),
    takingAmount: takingAmt.toString(),
    maker: wallet.address,
    receiver: ethers.ZeroAddress,
    allowedSender: ethers.ZeroAddress,
    salt: salt.toString(),
    offsets: '0',
    interactions: '0x'
  };
  console.log(`📤 Placing order: Sell ${ethers.formatUnits(makingAmt,6)} USDC for ${ethers.formatUnits(takingAmt,6)} USDT`);
  const response = await axios.post(
    `${LIMIT_ORDER_API}/order`,
    order,
    { headers: getHeaders() }
  );
  console.log('✅ Order placed. Hash:', response.data.hash);
  return response.data;
}

async function main() {
  console.log('🟢 Starting USDC → USDT OCO (plain JS CommonJS)');
  console.log('Wallet:', wallet.address);

  const usdc = new ethers.Contract(USDC, ERC20_ABI, provider);
  const balance = await usdc.balanceOf(wallet.address);
  console.log('USDC balance:', ethers.formatUnits(balance, 6));

  const amountToSell = ethers.parseUnits('1.0', 6);
  const takeProfit = ethers.parseUnits('1.01', 6);
  const stopLoss = ethers.parseUnits('0.99', 6);

  if (balance < amountToSell) {
    console.error('❌ Not enough USDC (needs at least 1 USDC)');
    return;
  }

  const ethBalance = await provider.getBalance(wallet.address);
  if (ethBalance < ethers.parseEther('0.003')) {
    console.error('❌ ETH balance low (<0.003 ETH). Fund ETH for gas.');
    return;
  }

  await ensureAllowance(USDC, amountToSell);

  const saltBase = Math.floor(Math.random() * 1e9);
  const tp = await placeLimitOrder(amountToSell, takeProfit, saltBase);
  const sl = await placeLimitOrder(amountToSell, stopLoss, saltBase + 1);

  console.log('\n🎯 OCO orders created:');
  console.log('TP Hash:', tp.hash);
  console.log('SL Hash:', sl.hash);
}

main().catch(error => {
  console.error('❌ Script error:', error.response?.data || error.message);
  process.exit(1);
});
