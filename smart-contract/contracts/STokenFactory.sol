// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {ILendingPool} from './interfaces/ILendingPool.sol';
import {SToken} from './SToken.sol';

contract STokenFactory {
    function deploySToken(
        string memory name_,
        string memory symbol_
    ) external returns(SToken) {
        SToken stoken = new SToken(name_, symbol_, ILendingPool(msg.sender));
        stoken.transferOwnership(msg.sender);
        return stoken;
    }
}