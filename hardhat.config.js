require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config()

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.23",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    },
    viaIR: true
  },
  networks: {
    sepolia: {
        url: process.env.ALCHEMY_API_URL,
        accounts: [process.env.PRIVATE_KEY]
    },
    ethmain: {
        url: process.env.MAIN_RPC,
        accounts: [process.env.PRIVATE_KEY]
    }
  }
};