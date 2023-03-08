// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {SafeMath} from '@openzeppelin/contracts/utils/math/SafeMath.sol';
import {Math} from '@openzeppelin/contracts/utils/math/Math.sol';
import {IPoolConfigurator} from '../interfaces/IPoolConfigurator.sol';
import {ISToken} from '../interfaces/ISToken.sol';
import {Storage} from '../Storage.sol';
import {Oracle} from './Oracle.sol';
import {WadMath} from './WadMath.sol';

library AmountShareConvertor{
    using SafeMath for uint;
    using Math for uint256;
    using WadMath for uint256;

    function depositAmountToShareAmount(
        Storage.Pool memory pool_,
        uint256 totalLiquidity_,
        uint256 amount_
    ) external view returns(uint256){
        uint256 liquidityShares = pool_.sTokenContract.totalSupply();
        if(liquidityShares == 0 && totalLiquidity_ == 0){
            return amount_;
        }
        
        return amount_.mul(liquidityShares).div(totalLiquidity_);
    }
    
    function borrowAmountToShareAmount(
        Storage.Pool memory pool_,
        uint256 amount_
    ) external pure returns(uint256){
        if(pool_.poolBorrowShareAmount == 0 || pool_.poolBorrowAmount == 0){
            return amount_;
        }

        return amount_.mul(pool_.poolBorrowShareAmount).ceilDiv(pool_.poolBorrowAmount);
    }

    function shareAmountToDepositedAmount(
        Storage.Pool memory pool_,
        uint256 totalLiquidity_, 
        uint256 shareAmount_
    ) external view returns(uint256){
        uint256 liquidityShares = pool_.sTokenContract.totalSupply();
        if(liquidityShares == 0){
            return 0;
        }
        
        return shareAmount_.mul(totalLiquidity_).div(liquidityShares);
    }

    function shareAmountToBorrowAmount(
        Storage.Pool memory pool_, 
        uint256 shareAmount_
    ) external pure returns(uint256){
        if(pool_.poolBorrowAmount == 0 || pool_.poolBorrowShareAmount == 0){
            return shareAmount_;
        }

        return shareAmount_.mul(pool_.poolBorrowAmount).ceilDiv(pool_.poolBorrowShareAmount);
    }

    function repayAmountToShareAmount(
        Storage.Pool memory pool_,
        uint256 amount_
    ) external pure returns(uint256){
        if(pool_.poolBorrowShareAmount == 0){
            return 0;
        }

        return amount_.mul(pool_.poolBorrowShareAmount).div(pool_.poolBorrowAmount);
    }
    
    function liquidatedAmountToCollateralAmount(
        uint256 liquidatedAmount_,
        uint256 liquidatedTokenUnitPriceInUSD_,
        uint256 collateralTokenUnitPriceInUSD_,
        uint256 liquidationBonus_
    ) public pure returns(uint256){
        if(collateralTokenUnitPriceInUSD_ <= 0 || liquidatedTokenUnitPriceInUSD_ <= 0) return uint256(0);
        return liquidatedAmount_.wadMul(liquidatedTokenUnitPriceInUSD_.wadDiv(collateralTokenUnitPriceInUSD_)).wadMul(liquidationBonus_);
        
    }

    function collateralAmountToShareAmount(
        Storage.Pool memory pool_,
        uint256 totalLiquidity_,
        uint256 amount_
    ) public view returns(uint256){
        uint256 liquidityShares = pool_.sTokenContract.totalSupply();
        if(liquidityShares == 0 && totalLiquidity_ == 0){
            return amount_;
        }
        
        return amount_.mul(liquidityShares).ceilDiv(totalLiquidity_);
    }

     function getCollateralShare(
        Storage.Pool memory liquidatedTokenPool_,
        Storage.Pool memory collateralTokenPool_,
        uint256 liquidatedAmount_,
        uint256 totalLiquidity_

    ) external view returns(uint256) {
        uint256 liquidatedTokenPriceInUSD = Oracle.getUsdValue(
            liquidatedTokenPool_.priceInUSDFeedAddress,
            1e18
        );
        
        uint256 collateralTokenPriceInUSD = Oracle.getUsdValue(
            collateralTokenPool_.priceInUSDFeedAddress,
            1e18
        );

        uint256 liquidationBonus = liquidatedTokenPool_.poolConfig.liquidationBonusPercent();
        uint256 collateralAmount = liquidatedAmountToCollateralAmount(
            liquidatedAmount_,
            liquidatedTokenPriceInUSD,
            collateralTokenPriceInUSD,
            liquidationBonus
        );
        uint256 collateralShare = collateralAmountToShareAmount(
            collateralTokenPool_,
            totalLiquidity_,
            collateralAmount
        );
        return collateralShare;
    }
    
}