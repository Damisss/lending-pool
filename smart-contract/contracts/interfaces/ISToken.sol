// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface ISToken {
    function mint(address account, uint256 amount) external;
    function burn(address account, uint256 amount) external;
    //function _transfer() external;
    function name() external view returns (string memory);
    /*
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() external view returns (string memory);
    function totalSupply() external view returns(uint256);
    function balanceOf(address account) external view returns (uint256);
}
