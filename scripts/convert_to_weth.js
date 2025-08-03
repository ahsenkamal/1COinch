const { ethers } = require('ethers');
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ALCHEMY_RPC_URL = process.env.ALCHEMY_API_URL;
const WETH_ADDRESS = '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9';

async function wrapETH() {
    try {
        const provider = new ethers.JsonRpcProvider(ALCHEMY_RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        
        // WETH contract ABI (just the functions we need)
        const wethABI = [
            "function deposit() external payable",
            "function balanceOf(address account) external view returns (uint256)"
        ];
        
        const wethContract = new ethers.Contract(WETH_ADDRESS, wethABI, wallet);
        
        // Convert 0.1 ETH to WETH (keeping some ETH for gas)
        const amountToWrap = ethers.parseEther('0.1');
        
        console.log(`🔄 Wrapping ${ethers.formatEther(amountToWrap)} ETH to WETH...`);
        
        // Send the transaction
        const tx = await wethContract.deposit({ value: amountToWrap });
        console.log(`📝 Transaction sent: ${tx.hash}`);
        console.log('⏳ Waiting for confirmation...');
        
        // Wait for confirmation
        const receipt = await tx.wait();
        console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
        
        // Check new WETH balance
        const wethBalance = await wethContract.balanceOf(wallet.address);
        console.log(`💰 New WETH balance: ${ethers.formatEther(wethBalance)}`);
        
        // Check remaining ETH balance
        const ethBalance = await provider.getBalance(wallet.address);
        console.log(`💰 Remaining ETH balance: ${ethers.formatEther(ethBalance)}`);
        
        console.log('\n🎉 ETH wrapped successfully! You can now use WETH for trading.');
        
    } catch (error) {
        console.error('❌ Error wrapping ETH:', error.message);
    }
}

// Run it
wrapETH();