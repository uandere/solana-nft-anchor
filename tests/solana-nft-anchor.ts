import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaNftAnchor } from "../target/types/solana_nft_anchor";
import {
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import * as assert from "assert";
import { before } from "mocha";

describe("solana-nft-anchor", () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace.SolanaNftAnchor as Program<SolanaNftAnchor>;
    let mint: anchor.web3.Keypair;
    let nftStateAccount: anchor.web3.Keypair;
    let associatedTokenAccount: anchor.web3.PublicKey;

    // Airdrop some SOL to the owner (for transaction fees)
    before(async () => {
        mint = anchor.web3.Keypair.generate();
        nftStateAccount = anchor.web3.Keypair.generate();

        // Derive the associated token account for the owner
        associatedTokenAccount = anchor.utils.token.associatedAddress({
            mint: mint.publicKey,
            owner: program.provider.wallet.publicKey,
        });

        console.log("Mint PublicKey:", mint.publicKey.toBase58());
        console.log("NFT State Account PublicKey:", nftStateAccount.publicKey.toBase58());
        console.log("Associated Token Account PublicKey:", associatedTokenAccount.toBase58());
        console.log("Wallet PublicKey:", program.provider.wallet.publicKey.toBase58());

        const signature = await program.provider.connection.requestAirdrop(
            program.provider.wallet.publicKey,
            10e9
        );

        // Confirm the airdrop transaction
        await program.provider.connection.confirmTransaction(signature, "confirmed");
        console.log("Finished initialization ✅");
    });

    it("Initializes the state and mints 4 NFTs", async () => {
        console.log("Before initialization");

        // Initialize the state account with a total supply of 10 NFTs
        await program.rpc.initialize(new anchor.BN(10), {
            accounts: {
                state: nftStateAccount.publicKey,
                signer: program.provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            },
            signers: [nftStateAccount],
        });

        console.log("After initialization");

        // Now mint 4 NFTs
        await program.rpc.initNft(new anchor.BN(4), {
            accounts: {
                state: nftStateAccount.publicKey,
                signer: program.provider.wallet.publicKey,
                mint: mint.publicKey,
                associatedTokenAccount: associatedTokenAccount,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            },
            signers: [mint],
        });

        console.log("After minting");

        // Fetch the state account and verify that 4 NFTs were minted
        const stateAccount = await program.account.nftState.fetch(nftStateAccount.publicKey);
        assert.equal(stateAccount.nftsMinted.toNumber(), 4, "4 NFTs should have been minted");
    });
});