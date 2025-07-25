import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bsc, mainnet } from "viem/chains";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
    // Get the private key from environment variables
    const privateKey = process.env.PRIVATE_KEY as `0x${string}`;
    if (!privateKey) {
        throw new Error("Missing PRIVATE_KEY environment variable");
    }

    // Create an account from the private key
    const account = privateKeyToAccount(privateKey);
    console.log(`Account: ${account.address}`);

    // Create public clients for both networks
    const bscPublicClient = createPublicClient({
        chain: bsc,
        transport: http()
    });

    const ethPublicClient = createPublicClient({
        chain: mainnet,
        transport: http()
    });

    // Create wallet clients for both networks
    const bscWalletClient = createWalletClient({
        chain: bsc,
        transport: http()
    });

    const ethWalletClient = createWalletClient({
        chain: mainnet,
        transport: http()
    });

    // Get current nonces on both chains
    const bscNonce = await bscPublicClient.getTransactionCount({
        address: account.address
    });

    const ethNonce = await ethPublicClient.getTransactionCount({
        address: account.address
    });

    console.log(`Current nonce on BSC: ${bscNonce}`);
    console.log(`Current nonce on Ethereum: ${ethNonce}`);

    // Calculate the target nonce (the higher of the two)
    const targetNonce = Math.max(bscNonce, ethNonce);
    console.log(`Target nonce for both chains: ${targetNonce}`);

    // Sync nonce on BSC
    async function syncBscNonce(currentNonce: number, targetNonce: number): Promise<void> {
        const count = targetNonce - currentNonce;
        if (count <= 0) return;

        console.log(`Synchronizing nonce on BSC. Need to send ${count} transaction(s)...`);

        for (let i = 0; i < count; i++) {
            console.log(`Sending transaction ${i + 1}/${count}...`);
            const hash = await bscWalletClient.sendTransaction({
                account,
                chain: bsc,
                to: account.address,
                value: 0n
            });

            await bscPublicClient.waitForTransactionReceipt({ hash });

            console.log(`Transaction sent: ${hash}`);
        }

        console.log(`BSC nonce synchronized successfully!`);
    }

    // Sync nonce on Ethereum
    async function syncEthNonce(currentNonce: number, targetNonce: number): Promise<void> {
        const count = targetNonce - currentNonce;
        if (count <= 0) return;

        console.log(`Synchronizing nonce on Ethereum. Need to send ${count} transaction(s)...`);

        for (let i = 0; i < count; i++) {
            console.log(`Sending transaction ${i + 1}/${count}...`);
            const hash = await ethWalletClient.sendTransaction({
                account,
                chain: mainnet,
                to: account.address,
                value: 0n
            });

            await ethPublicClient.waitForTransactionReceipt({ hash });

            console.log(`Transaction sent: ${hash}`);
        }

        console.log(`Ethereum nonce synchronized successfully!`);
    }

    // Determine which chain needs nonce synchronization and perform it
    if (bscNonce < targetNonce) {
        console.log(`BSC nonce needs to be increased by ${targetNonce - bscNonce}`);
        await syncBscNonce(bscNonce, targetNonce);
    } else if (ethNonce < targetNonce) {
        console.log(`Ethereum nonce needs to be increased by ${targetNonce - ethNonce}`);
        await syncEthNonce(ethNonce, targetNonce);
    } else {
        console.log("Nonces are already synchronized! No action needed.");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
}); 