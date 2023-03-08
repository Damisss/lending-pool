// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {AggregatorV3Interface} from '@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol';
import {SafeMath} from '@openzeppelin/contracts/utils/math/SafeMath.sol';

import {WadMath} from './WadMath.sol';

import 'hardhat/console.sol';
library Oracle {
    using SafeMath for uint256;
    //decimal is 18
    function getEthAmount(
        address priceFeedAddress_,
        uint256 amount_
    ) external view returns(uint256) {

        AggregatorV3Interface priceFeed = AggregatorV3Interface(priceFeedAddress_);
        (,int256 answer,,,) = priceFeed.latestRoundData();
        assert(answer > int(0));

        return  WadMath.wadMul(amount_, uint256(answer));
    }

    function getUsdValue(
        address priceFeedAddress_,
        uint256 amount_
    ) external view returns(uint256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(priceFeedAddress_);
        (,int256 answer,,,) = priceFeed.latestRoundData();
        assert(answer > int(0));
        uint256 price = uint256(answer*1e10);
        return  WadMath.wadMul(amount_, price);
    }

    function getAssetAmountFromEth(
        address priceFeedAddress_,
        uint256 amount_
    ) external view returns(uint256) {

        AggregatorV3Interface priceFeed = AggregatorV3Interface(priceFeedAddress_);
        (,int256 answer,,,) = priceFeed.latestRoundData();
        assert(answer > int(0));

        return  WadMath.wadDiv(amount_, uint256(answer));
    }
}