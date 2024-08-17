use anchor_lang::{account, Accounts, InitSpace};
use anchor_lang::prelude::*;
use crate::DISCRIMINATOR_SIZE;

#[derive(Accounts)]
pub struct InitShitState<'info> {
    #[account(
        init,
        payer = signer,
        space = DISCRIMINATOR_SIZE + ShitTokensState::INIT_SPACE
    )]
    pub state: Account<'info, ShitTokensState>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[account]
#[derive(InitSpace)]
pub struct ShitTokensState {
    pub owner: Pubkey
}

impl<'info> InitShitState<'info> {
    pub fn handler(ctx: Context<InitShitState>) -> Result<()> {
        ctx.accounts.state.owner = *ctx.accounts.signer.key;
        Ok(())
    }
}