const { ethers } = require('ethers');
require('dotenv').config();

// Your config
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ALCHEMY_RPC_URL = process.env.ALCHEMY_API_URL;

console.log(ALCHEMY_RPC_URL)

// Sepolia testnet tokens
const TOKENS = {
    WETH: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
    USDC: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
    USDT: '0x7169d38820dfd117c3fa1f22a697dba58d90ba06',
    DAI: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    LINK: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
};

async function checkBalances() {
    try {
        const provider = new ethers.JsonRpcProvider(ALCHEMY_RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        
        console.log(`\n🔍 Checking balances for wallet: ${wallet.address}\n`);
        
        // Check ETH balance
        const ethBalance = await provider.getBalance(wallet.address);
        console.log(`💰 ETH: ${ethers.formatEther(ethBalance)}`);
        
        // ERC20 ABI for balance checking
        const erc20ABI = [
            "function balanceOf(address account) external view returns (uint256)",
            "function symbol() external view returns (string)",
            "function decimals() external view returns (uint8)"
        ];
        
        // Check each token balance
        for (const [symbol, address] of Object.entries(TOKENS)) {
            try {
                const contract = new ethers.Contract(address, erc20ABI, provider);
                const balance = await contract.balanceOf(wallet.address);
                const decimals = await contract.decimals();
                const tokenSymbol = await contract.symbol();
                
                const formattedBalance = ethers.formatUnits(balance, decimals);
                console.log(`🪙 ${symbol} (${tokenSymbol}): ${formattedBalance}`);
            } catch (error) {
                console.log(`❌ ${symbol}: Error fetching balance`);
            }
        }
        
        console.log('\n✅ Balance check complete!\n');
        
    } catch (error) {
        console.error('❌ Error checking balances:', error.message);
    }
}

// Run it
checkBalances();