// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IPoolConfigurator {
    function baseBorrowRate() external view returns(uint256);
    function optimalUtilizationRate() external view returns(uint256);
    function liquidationThreshold() external view returns(uint256);
    function liquidationBonusPercent() external view returns(uint256);
    function calculateBorrowInterestRate(
        uint256 totalBorrow,
        uint256 totalLiquidity
    )  external view returns (uint256 borrowInterest);
}