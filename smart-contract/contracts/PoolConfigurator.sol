// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {WadMath, SafeMath} from './libraries/WadMath.sol';

contract PoolConfigurator{
    using WadMath for uint256;
    using SafeMath for uint256;

    uint private immutable _baseBorrowRate; //BBR
    uint private immutable _rateSlop1; //RS1
    uint private immutable _rateSlop2; //RS2
    uint private immutable _liquidationThreshold; //collateral 
    uint private immutable _liquidationBonusPercent; //
    uint private immutable _excessUtilizationRate; //EUR
    uint private immutable _optimalUtilizationRate; //OUR

    constructor(
        uint256 baseBorrowRate_,
        uint256 rateSlop1_,
        uint256 rateSlop2_,
        uint256 liquidationThreshold_,
        uint256 liquidationBonusPercent_,
        uint256 excessUtilizationRate_,
        uint256 optimalUtilizationRate_
    ){
        _baseBorrowRate = baseBorrowRate_;
        _rateSlop1 = rateSlop1_;
        _rateSlop2 = rateSlop2_;
        _liquidationThreshold = liquidationThreshold_;
        _liquidationBonusPercent = liquidationBonusPercent_;
        _excessUtilizationRate = excessUtilizationRate_;
        _optimalUtilizationRate = optimalUtilizationRate_;
    }

    function liquidationThreshold() external view returns(uint256){
        return _liquidationThreshold;
    }


    function liquidationBonusPercent() external view returns(uint256){
        return _liquidationBonusPercent;
    }

    function utilizationRate (
        uint256 totalBorrow_,
        uint256 totalLiquidity_
        ) internal pure returns(uint256){
            return totalLiquidity_ == 0 ? 0: totalBorrow_.wadDiv(totalLiquidity_);
    }

    function calculateBorrowInterestRate(
        uint256 totalBorrow_,
        uint256 totalLiquidity_
    )  external view returns (uint256 borrowInterest) {
        uint256 _utilizationRate = utilizationRate(totalBorrow_, totalLiquidity_);

        if(_utilizationRate > _optimalUtilizationRate){
            uint256 excessUtilizationRateRatio = _utilizationRate.sub(_optimalUtilizationRate).wadDiv(_excessUtilizationRate);
            borrowInterest = _baseBorrowRate.add(_rateSlop1).add(_rateSlop2.wadMul(excessUtilizationRateRatio));
        }
        
        borrowInterest = _baseBorrowRate.add(_utilizationRate.wadMul(_rateSlop1).wadDiv(_optimalUtilizationRate));
    }

}