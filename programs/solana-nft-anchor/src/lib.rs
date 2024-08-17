#![allow(unused_imports)]

mod error;
mod instructions;

mod utils;

use anchor_lang::prelude::*;
use anchor_spl::token::{mint_to, MintTo, set_authority, SetAuthority};

use error::*;
use instructions::{
    init_nft_state::*,
    init_shit_state::*,
    mint_nft::*,
    mint_shit::*,
};


declare_id!("4BsMpWZvHvJKRuTzkRX9ocNj3BxkcGZZnYw8miiWyUoz");

const DISCRIMINATOR_SIZE: usize = 8;


#[program]
pub mod solana_nft_anchor {
    use crate::instructions::init_shit_state::InitShitState;
    use crate::instructions::mint_nft::MintNFT;
    use super::*;

    pub fn init_nft_state(ctx: Context<InitNFTState>, total_supply: u64) -> Result<()> {
        InitNFTState::handler(ctx, total_supply)
    }

    pub fn mint_nft(ctx: Context<MintNFT>, num_nfts: u64) -> Result<()> {
        MintNFT::handler(ctx, num_nfts)
    }
    
    pub fn init_shit_state(ctx: Context<InitShitState>) -> Result<()> {
        InitShitState::handler(ctx)
    }

    pub fn mint_shit(ctx: Context<MintShitTokens>, amount: u64) -> Result<()> {
        MintShitTokens::handler(ctx, amount)
    }
}