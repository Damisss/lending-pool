// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import {ISToken} from './ISToken.sol';

interface ISTokenFactory {
     function deploySToken(
        string memory name,
        string memory symbol
    ) external returns(ISToken);
}