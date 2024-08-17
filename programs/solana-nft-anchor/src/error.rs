use anchor_lang::error_code;

#[error_code]
pub enum CustomError {
    #[msg("You are not authorized to mint NFTs")]
    Unauthorized,
    #[msg("Minting this many NFTs would exceed the total supply")]
    SupplyExceeded,
}
