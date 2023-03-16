// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';
import {ILendingPool} from './interfaces/ILendingPool.sol';

contract SToken is ERC20, Ownable{
    ILendingPool private _lendingPool;
    constructor(
        string memory name_,
        string memory symbol_,
        ILendingPool lendingPool_
        )ERC20(name_, symbol_){
            _lendingPool = lendingPool_;
    }

    function mint(address account_, uint256 amount_) external onlyOwner{
        _mint(account_, amount_);
    }

    function burn(address account_, uint256 amount_) external onlyOwner{
        _burn(account_, amount_);
    }

    // function _transfer(
    //     address from_,
    //     address to_,
    //     uint256 amount_
    // ) internal override onlyOwner{
    //     super._transfer(from_, to_, amount_);
    //     // check if user is healthy
    // }
}