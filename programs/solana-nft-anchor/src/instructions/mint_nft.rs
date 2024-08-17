use anchor_lang::Accounts;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, mint_to, MintTo, set_authority, SetAuthority, Token, TokenAccount};
use anchor_spl::associated_token::AssociatedToken;
use crate::error::CustomError;
use crate::instructions::init_nft_state::NFTState;

#[derive(Accounts)]
pub struct MintNFT<'info> {
    #[account(mut)]
    pub state: Account<'info, NFTState>,
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        payer = signer,
        mint::decimals = 0,
        mint::authority = signer.key(),
        mint::freeze_authority = signer.key(),
    )]
    pub mint: Account<'info, Mint>,
    #[account(
        init,
        payer = signer,
        associated_token::mint = mint,
        associated_token::authority = signer,
    )]
    pub associated_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> MintNFT<'info> {
    pub fn handler(ctx: Context<MintNFT>, num_nfts: u64) -> Result<()> {
        let state = &mut ctx.accounts.state;

        // Check that only the program's owner can mint
        require!(ctx.accounts.signer.key() == state.owner, CustomError::Unauthorized);

        // Ensure the total supply isn't exceeded
        require!(state.nfts_minted + num_nfts <= state.total_supply, CustomError::SupplyExceeded);

        // Mint the NFTs
        for _ in 0..num_nfts {
            let cpi_context = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.associated_token_account.to_account_info(),
                    authority: ctx.accounts.signer.to_account_info(),
                },
            );

            mint_to(cpi_context, 1)?;
            state.nfts_minted += 1;
        }

        // Disable future minting by setting the mint authority to None
        let cpi_context = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            SetAuthority {
                account_or_mint: ctx.accounts.mint.to_account_info(),
                current_authority: ctx.accounts.signer.to_account_info(),
            },
        );

        set_authority(
            cpi_context,
            spl_token::instruction::AuthorityType::MintTokens,
            None
        )?;

        Ok(())
    }
}