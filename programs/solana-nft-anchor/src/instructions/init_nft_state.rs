use anchor_lang::{account, Accounts, InitSpace};
use anchor_lang::prelude::*;
use crate::DISCRIMINATOR_SIZE;


#[derive(Accounts)]
pub struct InitNFTState<'info> {
    #[account(
        init,
        payer = signer,
        space = DISCRIMINATOR_SIZE + NFTState::INIT_SPACE
    )]
    pub state: Account<'info, NFTState>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[account]
#[derive(InitSpace)]
pub struct NFTState {
    pub owner: Pubkey,
    pub total_supply: u64,
    pub nfts_minted: u64,
}

impl<'info> InitNFTState<'info> {
    pub fn handler(ctx: Context<InitNFTState>, total_supply: u64) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.owner = ctx.accounts.signer.key();
        state.total_supply = total_supply;
        state.nfts_minted = 0;
        Ok(())
    }
}
