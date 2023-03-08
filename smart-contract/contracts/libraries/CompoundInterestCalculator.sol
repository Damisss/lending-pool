// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {Math} from '@openzeppelin/contracts/utils/math/Math.sol';
import {SafeMath} from '@openzeppelin/contracts/utils/math/SafeMath.sol';
import {Storage} from '../Storage.sol';
import {WadMath} from './WadMath.sol';

library CompoundInterestCalculator {
    using Math for uint256;
    using SafeMath for uint256;
    using WadMath for uint256;

    function helper(
        Storage.Pool memory pool_,
        uint256 cumulativeInterest_
        ) private pure returns(uint256){
  
        uint256 totalBorrow = cumulativeInterest_.wadMul(pool_.poolBorrowAmount);
        return totalBorrow;
    }
    
    function compoundedLiquidityOfUser(
        Storage.Pool memory pool_,
        address account_,
        uint256 cumulativeInterest_,
        uint256 poolBalance_
    ) external view  returns(uint256){
        uint256 availableLiquidity = poolBalance_.sub(pool_.reserves);
        uint256 totalBorrow = helper(pool_, cumulativeInterest_);
        uint256 liquidity = totalBorrow.add(availableLiquidity);

        uint256 userShare = pool_.sTokenContract.balanceOf(account_);
        uint256 totalShare = pool_.sTokenContract.totalSupply();

        if(totalShare == 0){
            return 0;
        }
        
        return userShare.mul(liquidity).div(totalShare);
    
    }

    function compoundedBorrowOfUser(
        Storage.Pool memory pool_,
        uint256 borrowShare_,
        uint256 cumulativeInterest_
    ) external pure returns(uint256) {
        uint256 totalBorrow = helper(pool_, cumulativeInterest_);

        if(totalBorrow == 0 || pool_.poolBorrowShareAmount == 0){
            return borrowShare_;
        }

        return borrowShare_.mul(totalBorrow).ceilDiv(pool_.poolBorrowShareAmount);
    }
}