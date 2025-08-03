const { ethers } = require('ethers');
const axios = require('axios');
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ONE_INCH_API_KEY = process.env.ONE_INCH_API_KEY;
const RPC_URL = process.env.MAIN_RPC;

const CHAIN_ID = 1;
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
//0x111111125421ca6dc452d289314280a0f8842a65 real
//0x1111111254EEB25477B68fb85Ed929f73A960582 wrong
const LIMIT_ORDER_PROTOCOL = '0x111111125421ca6dc452d289314280a0f8842a65';

const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address,uint256) returns (bool)",
    "function allowance(address,address) view returns (uint256)",
    "function decimals() view returns (uint8)"
];

const getHeaders = () => ({
    'Authorization': `Bearer ${ONE_INCH_API_KEY}`,
    'Content-Type': 'application/json'
});

async function checkAllowance(token, amount) {
    const contract = new ethers.Contract(token, ERC20_ABI, wallet);
    const allowance = await contract.allowance(wallet.address, LIMIT_ORDER_PROTOCOL);
    if (allowance < amount) {
        console.log(`🔓 Approving ${ethers.formatUnits(amount, 6)} ${token === USDC ? 'USDC' : 'USDT'}...`);
        const tx = await contract.approve(LIMIT_ORDER_PROTOCOL, amount);
        await tx.wait();
        console.log('✅ Token approved.');
    } else {
        console.log('✅ Sufficient allowance exists.');
    }
}

async function createOrder(makerAsset, takerAsset, makingAmount, takingAmount, salt) {
    const order = {
        makerAsset,
        takerAsset,
        makingAmount: makingAmount.toString(),
        takingAmount: takingAmount.toString(),
        maker: wallet.address,
        receiver: '0x0000000000000000000000000000000000000000',
        allowedSender: '0x0000000000000000000000000000000000000000',
        salt: salt.toString(),
        offsets: '0',
        interactions: '0x'
    };

    console.log(`📤 Creating order: Sell ${ethers.formatUnits(makingAmount, 6)} USDC for ${ethers.formatUnits(takingAmount, 6)} USDT`);
    const res = await axios.post(
        `https://api.1inch.dev/orderbook/v4.0/${CHAIN_ID}/order`,
        order,
        { headers: getHeaders() }
    );
    console.log('✅ Order hash:', res.data?.hash || 'Created');
    return res.data;
}

async function main() {
    console.log('🟢 Starting OCO USDC → USDT on Ethereum Mainnet...');
    console.log('Wallet:', wallet.address);

    const usdc = new ethers.Contract(USDC, ERC20_ABI, provider);
    const balance = await usdc.balanceOf(wallet.address);

    const amountToSell = ethers.parseUnits("1.0", 6); // 1 USDC
    const takeProfitUSDT = ethers.parseUnits("1.01", 6); // 1.01 USDT
    const stopLossUSDT = ethers.parseUnits("0.99", 6);  // 0.99 USDT

    if (balance < amountToSell) {
        console.error("❌ Not enough USDC. Fund your wallet with at least 1 USDC.");
        return;
    }

    await checkAllowance(USDC, amountToSell);

    const saltBase = Math.floor(Math.random() * 1e9);

    const tpOrder = await createOrder(USDC, USDT, amountToSell, takeProfitUSDT, saltBase);
    const slOrder = await createOrder(USDC, USDT, amountToSell, stopLossUSDT, saltBase + 1);

    console.log('\n🎯 OCO orders placed successfully.');
    console.log('✅ Take Profit Order:', tpOrder.hash);
    console.log('✅ Stop Loss Order:', slOrder.hash);
}

main().catch(err => {
    console.error('❌ Error:', err.message);
});
