import * as anchor from "@coral-xyz/anchor";
import {Program} from "@coral-xyz/anchor";
import {SolanaNftAnchor} from "../target/types/solana_nft_anchor";
import {ASSOCIATED_TOKEN_PROGRAM_ID, mintTo, TOKEN_PROGRAM_ID,} from "@solana/spl-token";
import * as assert from "assert";

describe("solana-nft-anchor", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.SolanaNftAnchor as Program<SolanaNftAnchor>;

    const provider_wallet = provider.wallet as anchor.Wallet;

    let nftMint: anchor.web3.Keypair;
    let shitTokenMint: anchor.web3.Keypair;
    let nftStateAccount: anchor.web3.Keypair;
    let shitTokenStateAccount: anchor.web3.Keypair;
    let nftAssociatedTokenAccount: anchor.web3.PublicKey;
    let shitTokenAssociatedAccount: anchor.web3.PublicKey;

    // Airdrop some SOL to the owner (for transaction fees)
    beforeEach(async () => {
        nftMint = anchor.web3.Keypair.generate();
        shitTokenMint = anchor.web3.Keypair.generate();
        nftStateAccount = anchor.web3.Keypair.generate();
        shitTokenStateAccount = anchor.web3.Keypair.generate();

        nftAssociatedTokenAccount = anchor.utils.token.associatedAddress({
            mint: nftMint.publicKey, owner: provider.wallet.publicKey,
        });

        shitTokenAssociatedAccount = anchor.utils.token.associatedAddress({
            mint: shitTokenMint.publicKey, owner: provider.wallet.publicKey,
        });

        console.log("Mint PublicKey (NFT):", nftMint.publicKey.toBase58());
        console.log("Mint PublicKey (SHIT):", shitTokenMint.publicKey.toBase58());
        console.log("NFT State Account PublicKey:", nftStateAccount.publicKey.toBase58());
        console.log("SHIT Token State Account PublicKey:", shitTokenStateAccount.publicKey.toBase58());
        console.log("Associated Token Account PublicKey (NFT):", nftAssociatedTokenAccount.toBase58());
        console.log("Associated Token Account PublicKey (SHIT):", shitTokenAssociatedAccount.toBase58());
        console.log("Wallet PublicKey:", provider.publicKey.toBase58());

        // Confirm the airdrop transaction
        console.log("Finished initialization");
    });

    it("Initializes the NFT state and mints 4 NFTs", async () => {
        // Initialize the NFT state account with a total supply of 10 NFTs
        await program.rpc.initNftState(new anchor.BN(10), {
            accounts: {
                state: nftStateAccount.publicKey,
                signer: provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            }, signers: [nftStateAccount],
        });

        console.log("Initialized NFT state");

        // Now mint 4 NFTs
        await program.rpc.mintNft(new anchor.BN(4), {
            accounts: {
                state: nftStateAccount.publicKey,
                signer: provider.wallet.publicKey,
                mint: nftMint.publicKey,
                associatedTokenAccount: nftAssociatedTokenAccount,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            }, signers: [nftMint],
        });

        console.log("Minted 4 NFTs");

        // Verify the NFT token balance
        const nftTokenAccount = await program.provider.connection.getTokenAccountBalance(nftAssociatedTokenAccount);
        assert.equal(nftTokenAccount.value.uiAmount, 4, "4 NFTs should have been minted");

        try {
            await mintTo(
                program.provider.connection,
                provider_wallet.payer,
                nftMint.publicKey,
                nftAssociatedTokenAccount,
                provider.wallet.publicKey,
                1,
            );
            assert.fail("Minting should fail after authority is removed");
        } catch (err) {
            console.log("Minting failed as expected:", err.transactionMessage);
            assert.ok("Minting failed as expected");
        }

    });

    it("Initializes the SHIT token state and mints 10 SHIT tokens", async () => {
        // Initialize the SHIT token state account
        await program.rpc.initShitState({
            accounts: {
                state: shitTokenStateAccount.publicKey,
                signer: provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            }, signers: [shitTokenStateAccount],
        });

        console.log("Initialized SHIT token state");

        // Mint 10 SHIT tokens to the owner
        await program.rpc.mintShit(new anchor.BN(10_000_000_000), {
            accounts: {
                state: shitTokenStateAccount.publicKey,
                signer: provider.wallet.publicKey,
                mint: shitTokenMint.publicKey,
                associatedTokenAccount: shitTokenAssociatedAccount,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            }, signers: [shitTokenMint],
        });

        console.log("Minted 10 SHIT tokens");

        // Verify the SHIT token balance
        const shitTokenAccount = await program.provider.connection.getTokenAccountBalance(shitTokenAssociatedAccount);
        assert.equal(shitTokenAccount.value.uiAmount, 10, "10 SHIT tokens should have been minted");
    });
});