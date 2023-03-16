// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

interface ILendingPool {
    event InitPool(address indexed token, address indexed poolConfig);
    event Deposit(address indexed account, address indexed token, uint256 amount);
    event Borrow(address indexed account, address indexed token, uint256 amount);
    event Repay(address indexed account, address indexed token, uint256 amount);
    event Withdraw(address indexed account, address indexed token, uint256 amount);
    event Status(address indexed token, uint256 status, uint256 timestamp);
    event Liquidation(
        address indexed user, 
        address indexed liquidator,
        address liquidatedToken, 
        address collateralToken, 
        uint256 purchaseAmount
    );
    function initPool(address token, address poolConfig) external;
    function setPoolConfig(address token_, address poolConfig_) external view returns(bool);
    function setCollateral(address token_) external;
    function isCollateralEnabled(address token_) external view returns(bool);
    function getLiquidityInUSD ( address priceFeedAddress_, address token_) external view returns(uint256);
    function getUsdValue (address priceFeedAddress_, uint256 amount_) external view returns(uint256);
    function getPurchaseAmount(address user_, address token_) external view returns(uint256);
    function liquidation(address user_, address liquidatedToken_, address collateralToken_, uint256 purchaseAmount_) external;
    function withdraw(address token_, uint256 amount_) external;
    function repay(address token_, uint256 amount_) external;
    function borrow(address token_, uint256 amount_) external;
    function supply(address token_, uint256 amount_) external;
    function healthFactor(address account_) external view returns(uint256);
    function getAccountInfo(address account_) external view returns(uint collateral, uint totalBorrow);
    function compoundedBorrowOfUser(address account_,address token_) external view returns(uint256);
    function compoundedLiquidityOfUser(address account_,address token_) external view  returns(uint256);

}
