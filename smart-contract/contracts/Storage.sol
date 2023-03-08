// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {IPoolConfigurator} from './interfaces/IPoolConfigurator.sol';
import {ISToken} from './interfaces/ISToken.sol';

abstract contract  Storage {
    uint256  constant internal _secondInYear = 365 days;
    uint256  constant internal _reservePercent = 0.05 * 1e18;
    uint  constant internal _closeFactor = .5 *1e18;

    enum Stat{INACTIVE, ACTIVATED, CLOSED}
    struct Pool {
        Stat poolStatus;
        IPoolConfigurator poolConfig;
        uint256 poolBorrowAmount; 
        uint256 poolBorrowShareAmount;
        uint256 reserves;
        uint256 lastUpdateTimestamp;
        ISToken sTokenContract;
        uint256 sTokens;
        //uint8 apy;
        address priceFeedAddress;
        address priceInUSDFeedAddress;
    }

    struct UserInfo {
        bool isCollateralActivated;
        uint256 borrowShare;
        uint256 borrowAwardMultiplier;
    }
    // this is not good approach. let's keep like that for this moment.
    mapping(address=>Pool) internal  _pools;

     /**
     * mapping user account to ERC20 token address then to user info of that pool
    **/
    mapping(address=>mapping(address=>UserInfo)) internal _userData;
    mapping (address => bool) internal _isTokenAllowed;
    //allowed tokens
    address[] internal _allowedTokens;
    address internal _sTokenFacoryAddress;

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

    //event WithdrawReserve(address indexed token_, address indexed admin, uint256 amount);
  
}