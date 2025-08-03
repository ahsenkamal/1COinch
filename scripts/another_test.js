import { Wallet, JsonRpcProvider } from 'ethers';
import {
  LimitOrderBuilder,
  LimitOrderProtocolFacade,
  Web3ProviderConnector
} from '@1inch/limit-order-protocol-utils';

import dotenv from 'dotenv';
dotenv.config();

const RPC_URL = process.env.ALCHEMY_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const MAKER_ASSET = '0x4C6cC1c8b178E6cBa3650618C6fC18AcC264B8bB';
const TAKER_ASSET = '0x7d74e7fA0e430C3D69De7DECe297d7152081Cf1f';
const LIMIT_ORDER_PROTOCOL_ADDRESS = '0x94Bc2a1c732Bd9eee66a7f39f1856fF07cBe42a6';

async function main() {
  const provider = new JsonRpcProvider(RPC_URL);
  const wallet = new Wallet(PRIVATE_KEY, provider);

  const connector = new Web3ProviderConnector(provider);
  const facade = new LimitOrderProtocolFacade(LIMIT_ORDER_PROTOCOL_ADDRESS, connector);
  const builder = new LimitOrderBuilder(
    LIMIT_ORDER_PROTOCOL_ADDRESS,
    11155111, // Sepolia chain ID
    wallet
  );

  const order = builder.buildLimitOrder({
    makerAsset: MAKER_ASSET,
    takerAsset: TAKER_ASSET,
    maker: await wallet.getAddress(),
    receiver: await wallet.getAddress(),
    allowedSender: '0x0000000000000000000000000000000000000000',
    makingAmount: '1000000000000000000',
    takingAmount: '2000000',
    makerTraits: builder.buildMakerTraits(),
  });

  const signature = await builder.buildOrderSignature(wallet, order);
  const typedOrder = { ...order, signature };

  console.log('Limit order created:', JSON.stringify(typedOrder, null, 2));
}

main().catch(console.error);