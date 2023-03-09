// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {Math} from '@openzeppelin/contracts/utils/math/Math.sol';
import {SafeMath} from '@openzeppelin/contracts/utils/math/SafeMath.sol';
import {AmountShareConvertor,  IPoolConfigurator, ISToken} from './AmountShareConvertor.sol';
import {CompoundInterestCalculator} from './CompoundInterestCalculator.sol';
import {Storage} from '../Storage.sol';
import {WadMath} from './WadMath.sol';

error NotUsedAsCollateral();
error PoolNotActivatedError();
error CollateralNotEnableError(); 
error HasBorrowBalanceError();

library LendingPoolHelper {
    using WadMath for uint256;
    using AmountShareConvertor for Storage.Pool;

     function liquidationHelper(
        Storage.Pool memory liquidatedTokenPool_,
        Storage.Pool memory collateralTokenPool_,
        uint256 userBorrowShare_,
        uint256 purchaseAmount_,
        uint256 closeFactor_,
        uint256 totalLiquidity_,
        bool isCollateralActivated_
    ) external view returns(uint256, uint256, uint256) {
        require(isTokenLiquiditable(
            isCollateralActivated_,
            userBorrowShare_,
            liquidatedTokenPool_
        ));

        (uint256 liquidatedAmount, uint256 purchaseAmount) = getDifferentAmounts(
            liquidatedTokenPool_, 
            userBorrowShare_,
            purchaseAmount_,
            closeFactor_
        );

        uint256 collateralShare = liquidatedTokenPool_.getCollateralShare(
            collateralTokenPool_,
            liquidatedAmount,
            totalLiquidity_
        );
        return (collateralShare, liquidatedAmount, purchaseAmount);
    }

    function getDifferentAmounts(
        Storage.Pool memory liquidatedTokenPool_,
        uint256 userBorrowShare_,
        uint256 purchaseAmount_,
        uint256 closeFactor_
        ) private pure returns(uint256, uint256){
        uint256 maxPurchaseAmount = userBorrowShare_.wadMul(closeFactor_);
        uint256 purchaseAmount = purchaseAmount_;
        if(purchaseAmount > maxPurchaseAmount) purchaseAmount = maxPurchaseAmount;

        uint256 liquidatedAmount = liquidatedTokenPool_.shareAmountToBorrowAmount( 
            purchaseAmount
        );
        return (liquidatedAmount, purchaseAmount);
    }

    function isTokenLiquiditable(
        bool isUserCollateralActivated_,
        uint256 userBorrowShare_,
        Storage.Pool memory liquidatedTokenPool_
    )private view returns(bool){
        if(
            liquidatedTokenPool_.poolStatus != Storage.Stat.ACTIVATED && liquidatedTokenPool_.poolStatus != Storage.Stat.CLOSED
        ) revert PoolNotActivatedError();
        if(liquidatedTokenPool_.poolConfig.liquidationThreshold() <= 0) revert NotUsedAsCollateral();
        if(!isUserCollateralActivated_) revert CollateralNotEnableError();
        if(userBorrowShare_ <= 0) revert HasBorrowBalanceError();
        return true;
        
    }

    function getPool(Storage.Pool memory pool_) external pure returns(
        Storage.Stat,
        address,
        address,
        address
        ){
        return(
            pool_.poolStatus,
            address(pool_.poolConfig),
            pool_.priceFeedAddress,
            pool_.priceInUSDFeedAddress
        );
        
    }  
}