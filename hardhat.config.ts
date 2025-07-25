import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "london", // EVM version
    },
  },
  networks: {
    hardhat: {
      gas: 10000000, // 10M gas
      gasPrice: 20000000000, // 20 gwei
      blockGasLimit: 30000000, // 30M gas
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      gas: 10000000, // 10M gas
      gasPrice: 20000000000, // 20 gwei
    },
    bsc: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      gas: 8000000, // 8M gas
      gasPrice: 50000000, // 5 gwei
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      chainId: 97,
      gas: 8000000, // 8M gas
      gasPrice: 1000000000, // 10 gwei
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    eth: {
      url: "https://ethereum.publicnode.com",
      chainId: 1,
      gas: 8000000, // 8M gas
      gasPrice: 200000000, // 20 gwei (more realistic for ETH mainnet)
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    sepolia: {
      url: process.env.ALCHEMY_API_KEY ?
        `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}` :
        "https://eth-sepolia.g.alchemy.com/v2/demo",
      chainId: 11155111,
      gas: 8000000, // 8M gas
      gasPrice: 10000000000, // 10 gwei
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  mocha: {
    timeout: 60000, // 60 seconds timeout for tests
  },
};

export default config;
