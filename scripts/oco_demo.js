const { ethers } = require('ethers');
const axios = require('axios');
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ALCHEMY_RPC_URL = process.env.ALCHEMY_API_URL;
const ONEINCH_API_KEY = process.env.ONEINCH_API_KEY;

const CHAIN_ID = 11155111; // Sepolia
const WETH_ADDRESS = '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9';
const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'; // 1inch uses this for native ETH

class SimpleOCOOrder {
    constructor() {
        this.provider = new ethers.JsonRpcProvider(ALCHEMY_RPC_URL);
        this.wallet = new ethers.Wallet(PRIVATE_KEY, this.provider);
        console.log(`🔗 Connected to wallet: ${this.wallet.address}`);
    }

    // Get headers for 1inch API
    getHeaders() {
        return {
            'Authorization': `Bearer ${ONEINCH_API_KEY}`,
            'Content-Type': 'application/json'
        };
    }

    // Check current balances
    async checkBalances() {
        console.log('\n📊 Current Balances:');
        
        const ethBalance = await this.provider.getBalance(this.wallet.address);
        console.log(`💰 ETH: ${ethers.formatEther(ethBalance)}`);
        
        const wethContract = new ethers.Contract(
            WETH_ADDRESS,
            ["function balanceOf(address) view returns (uint256)"],
            this.provider
        );
        const wethBalance = await wethContract.balanceOf(this.wallet.address);
        console.log(`💰 WETH: ${ethers.formatEther(wethBalance)}`);
        
        return { ethBalance, wethBalance };
    }

    // Create a simple limit order using 1inch
    async createLimitOrder(fromToken, toToken, amount, price) {
        try {
            const orderData = {
                makerAsset: fromToken,
                takerAsset: toToken, 
                makingAmount: amount,
                takingAmount: ethers.parseEther((parseFloat(ethers.formatEther(amount)) * price).toString()).toString(),
                maker: this.wallet.address,
                receiver: '0x0000000000000000000000000000000000000000',
                allowedSender: '0x0000000000000000000000000000000000000000',
                salt: Math.floor(Math.random() * 1000000).toString(),
                offsets: '0',
                interactions: '0x'
            };

            console.log(`📝 Creating limit order: ${ethers.formatEther(amount)} ${fromToken === WETH_ADDRESS ? 'WETH' : 'ETH'} → ${toToken === WETH_ADDRESS ? 'WETH' : 'ETH'} at price ${price}`);

            // For now, let's just simulate the order creation since 1inch might not support Sepolia limit orders
            console.log('⚠️  Note: This is a simulation since 1inch limit orders may not be available on Sepolia');
            console.log('📊 Order details:', {
                from: fromToken === WETH_ADDRESS ? 'WETH' : 'ETH',
                to: toToken === WETH_ADDRESS ? 'WETH' : 'ETH', 
                amount: ethers.formatEther(amount),
                expectedOutput: ethers.formatEther(orderData.takingAmount)
            });

            return {
                orderHash: `0x${Math.random().toString(16).substr(2, 64)}`, // Fake hash for demo
                orderData: orderData,
                status: 'simulated'
            };

        } catch (error) {
            console.error('❌ Error creating limit order:', error.message);
            throw error;
        }
    }

    // Approve WETH spending if needed
    async approveWETH(amount) {
        const wethContract = new ethers.Contract(
            WETH_ADDRESS,
            [
                "function approve(address spender, uint256 amount) external returns (bool)",
                "function allowance(address owner, address spender) external view returns (uint256)"
            ],
            this.wallet
        );

        // For demo, we'll use a mock spender address (1inch router)
        const spender = '0x1111111254EEB25477B68fb85Ed929f73A960582'; // 1inch v5 router

        const currentAllowance = await wethContract.allowance(this.wallet.address, spender);
        
        if (currentAllowance < amount) {
            console.log('📝 Approving WETH spending...');
            const tx = await wethContract.approve(spender, ethers.MaxUint256);
            await tx.wait();
            console.log('✅ WETH approved!');
        }
    }

    // Create OCO orders
    async createOCOOrders() {
        try {
            await this.checkBalances();
            
            console.log('\n🎯 Creating OCO Orders (WETH ↔ ETH)');
            console.log('This demonstrates the concept - on mainnet you would use real 1inch limit orders\n');

            // Use 0.05 WETH for the OCO orders
            const tradingAmount = ethers.parseEther('0.05');
            
            // Example prices (these would be real market prices in production)
            const highPrice = 1.1;  // Sell WETH for ETH at 10% premium
            const lowPrice = 0.9;   // Sell WETH for ETH at 10% discount
            
            console.log('📊 OCO Strategy:');
            console.log(`💹 Take Profit: Sell ${ethers.formatEther(tradingAmount)} WETH → ETH at ${highPrice}x rate`);
            console.log(`🛡️  Stop Loss: Sell ${ethers.formatEther(tradingAmount)} WETH → ETH at ${lowPrice}x rate`);
            
            // Approve WETH spending first
            await this.approveWETH(tradingAmount);
            
            // Create the two orders
            const takeProfitOrder = await this.createLimitOrder(
                WETH_ADDRESS,
                ETH_ADDRESS,
                tradingAmount,
                highPrice
            );
            
            const stopLossOrder = await this.createLimitOrder(
                WETH_ADDRESS, 
                ETH_ADDRESS,
                tradingAmount,
                lowPrice
            );
            
            console.log('\n✅ OCO Orders Created Successfully!');
            console.log('🚀 Take Profit Order ID:', takeProfitOrder.orderHash);
            console.log('🛡️  Stop Loss Order ID:', stopLossOrder.orderHash);
            
            console.log('\n📝 Next Steps:');
            console.log('1. On mainnet, these would be real limit orders on 1inch');
            console.log('2. When one order executes, you would cancel the other');
            console.log('3. Use the bit invalidation method from the main script for automatic cancellation');
            
            return {
                takeProfitOrder,
                stopLossOrder
            };

        } catch (error) {
            console.error('❌ Error creating OCO orders:', error.message);
            throw error;
        }
    }
}

async function main() {
    try {
        const ocoSystem = new SimpleOCOOrder();
        await ocoSystem.createOCOOrders();
    } catch (error) {
        console.error('❌ Main execution error:', error.message);
    }
}

// Run it
main();