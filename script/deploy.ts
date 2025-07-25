import { createPublicClient, http, getContract, parseEther, createWalletClient, getAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bsc, mainnet } from "viem/chains";
import * as dotenv from "dotenv";

dotenv.config();

// LayerZero endpoint addresses
const BSC_LZ_ENDPOINT = "0x1a44076050125825900e736c501f859c50fE728c";  // BSC Mainnet
const ETH_LZ_ENDPOINT = "0x1a44076050125825900e736c501f859c50fE728c";  // ETH Mainnet

async function main() {
    // Get the private key from environment variables
    const privateKey = process.env.PRIVATE_KEY as `0x${string}`;
    if (!privateKey) {
        throw new Error("Missing PRIVATE_KEY environment variable");
    }

    // Get the delegate (owner) and treasury addresses from environment variables
    const delegateAddress = process.env.DELEGATE_ADDRESS;
    if (!delegateAddress) {
        throw new Error("Missing DELEGATE_ADDRESS environment variable");
    }

    const treasuryAddress = process.env.TREASURY_ADDRESS;
    if (!treasuryAddress) {
        throw new Error("Missing TREASURY_ADDRESS environment variable");
    }

    console.log(`Delegate (Owner) Address: ${delegateAddress}`);
    console.log(`Treasury Address: ${treasuryAddress}`);

    // Create an account from the private key
    const account = privateKeyToAccount(privateKey);
    console.log(`Deploying with account: ${account.address}`);

    try {
        // Create clients for both networks to check nonces
        const bscClient = createPublicClient({
            chain: bsc,
            transport: http()
        });

        const ethClient = createPublicClient({
            chain: mainnet,
            transport: http()
        });

        // Get current nonces on both chains
        const bscNonce = await bscClient.getTransactionCount({
            address: account.address
        });

        const ethNonce = await ethClient.getTransactionCount({
            address: account.address
        });

        console.log(`Current nonce on BSC: ${bscNonce}`);
        console.log(`Current nonce on Ethereum: ${ethNonce}`);

        // Create deployment parameters
        const deploymentParameters = {
            delegate: delegateAddress,
            treasury: treasuryAddress,
        };

        if (bscNonce != ethNonce) {
            console.log("Nonces are not equal. Syncing nonces...");
            return;
        }

        // Calculate deterministic contract address
        // The create address is dependent on the deployer address and nonce
        // Using the formula: keccak256(rlp([deployer_address, nonce]))
        const expectedNonce = Math.max(bscNonce, ethNonce);

        //deploy the contract
        // Create wallet clients for both networks
        const bscWalletClient = createWalletClient({
            account,
            chain: bsc,
            transport: http()
        });

        const ethWalletClient = createWalletClient({
            account,
            chain: mainnet,
            transport: http()
        });

        // Contract ABIs and bytecode imports
        const EPTCrossMainArtifact = require('../artifacts/contracts/EPTCross_main.sol/EPTCrossMain.json');
        const EPTCrossAssitArtifact = require('../artifacts/contracts/EPTCross_assit.sol/EPTCrossAssit.json');

        // Deploy main contract on BSC
        console.log("Deploying EPTCrossMain contract to BSC...");
        const deployMainTx = await bscWalletClient.deployContract({
            abi: EPTCrossMainArtifact.abi,
            bytecode: EPTCrossMainArtifact.bytecode as `0x${string}`,
            args: [
                "Balance", // _name
                "EPT",           // _symbol
                BSC_LZ_ENDPOINT,  // _lzEndpoint
                delegateAddress,  // _delegate
                treasuryAddress,  // _treasury
            ],
            account,
        });

        console.log(`EPTCrossMain deployed on BSC. Transaction hash: ${deployMainTx}`);

        // Wait for transaction confirmation and get deployed address
        console.log("Waiting for BSC deployment confirmation...");
        const mainDeploymentReceipt = await bscClient.waitForTransactionReceipt({ hash: deployMainTx });
        const mainContractAddress = mainDeploymentReceipt.contractAddress;
        console.log(`EPTCrossMain deployed to: ${mainContractAddress}`);

        // Deploy assist contract on Ethereum
        console.log("Deploying EPTCrossAssit contract to Ethereum...");
        const deployAssitTx = await ethWalletClient.deployContract({
            abi: EPTCrossAssitArtifact.abi,
            bytecode: EPTCrossAssitArtifact.bytecode as `0x${string}`,
            args: [
                "Balance", // _name
                "EPT",             // _symbol
                ETH_LZ_ENDPOINT,    // _lzEndpoint
                delegateAddress,    // _delegate
                treasuryAddress,    // _treasury
            ],
            account,
        });

        console.log(`EPTCrossAssit deployed on Ethereum. Transaction hash: ${deployAssitTx}`);

        // Wait for transaction confirmation and get deployed address
        console.log("Waiting for Ethereum deployment confirmation...");
        const assitDeploymentReceipt = await ethClient.waitForTransactionReceipt({ hash: deployAssitTx });
        const assitContractAddress = assitDeploymentReceipt.contractAddress;
        console.log(`EPTCrossAssit deployed to: ${assitContractAddress}`);

        console.log("\nDeployment Summary:");
        console.log(`Main Contract (BSC): ${mainContractAddress}`);
        console.log(`Assist Contract (ETH): ${assitContractAddress}`);
        console.log("\nTo set up cross-chain functionality, these contracts should be linked through LayerZero.");

        //save the addresses to a file
        const fs = require('fs');
        const addresses = {
            mainContractAddress,
            assitContractAddress
        };
        fs.writeFileSync('addresses' + new Date().toISOString().split('T')[0] + '.json', JSON.stringify(addresses, null, 2));

    } catch (error) {
        console.error("Deployment failed:", error);
        process.exit(1);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
}); 