use anchor_lang::Accounts;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, mint_to, MintTo, Token, TokenAccount};
use anchor_spl::associated_token::AssociatedToken;
use crate::instructions::init_shit_state::ShitTokensState;
use crate::error::CustomError;

#[derive(Accounts)]
pub struct MintShitTokens<'info> {
    #[account(mut)]
    pub state: Account<'info, ShitTokensState>,
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        payer = signer,
        mint::decimals = 9,
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
    pub rent: Sysvar<'info, Rent>
}

impl<'info> MintShitTokens<'info> {
    pub fn handler(ctx: Context<MintShitTokens>, amount: u64) -> Result<()> {
        require!(ctx.accounts.state.owner == ctx.accounts.signer.key(), CustomError::Unauthorized);
        
        let context = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.associated_token_account.to_account_info(),
                authority: ctx.accounts.signer.to_account_info(),
            }
        );
        
        mint_to(context, amount)?;
        
        Ok(())
    }
}