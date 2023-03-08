// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {SafeMath} from '@openzeppelin/contracts/utils/math/SafeMath.sol';

library WadMath{
    using SafeMath for uint256;
    /*
    *@title WadMath library
    *@author Damiss
    *@dev Provides mul and div function for wads <<decimal numbers with 18 digits precision>>
    **/
    uint internal constant WAD = 1e18;
    /*
    *@notice get wad
    *@returns wad
    **/

    function getWad() external pure returns(uint wad){
        wad = WAD;
    }

    /*
     *@notice a_ multiply by b_ in wad
     *@returns operations result
    **/
    function wadMul(uint a_, uint b_) external pure returns (uint){
        return a_.mul(b_).div(WAD);
    }
    
    /*
     *@notice a_ divide by b_ in wad
     *@return operations result
    **/
    function wadDiv(uint a_, uint b_) external pure returns (uint){
        return a_.mul(WAD).div(b_);
    }

}