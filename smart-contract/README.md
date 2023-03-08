# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.ts
```
 /*
     *@notice Borrow interest rate(BIR) calculation.
     *Rate slop2 (RS2) is used in BIR calculation when utilization rate (UR) is over 70%. 
     *Hence, the borrow interest rate increase exponentially.
     *This prevents pool to be out of liquidity
     *@author Damiss
    **/

/*
 *@title Lending Pool 
 *@dev central point of interaction with the protocol
  * There is a pool for every ERC20 token in which user can deposit his/her liquidity.
  * User can uses his/her liquidity as collateral to borrow any asset from different pools if his/her account is healthy
  * (i.e. total borrow value must be less than the total collateral value). On the other hand the borrower will repay 
  * the loan with accumulated interest. User's account is liquidated if his/her account is not healthy.
  * Liquidity provider receive compound interest.
  * 
  * ----------------------------------------------------------------------------------------------------------------------
  * Each pool contains 3 status(INACTIVE, ). Howver, a pool must have only one status at a time.
  *1.INACTIVE: defines the initialized state of the pool. Hence, user cannot perform any action (deposit, borrow, repay and withdraw)
  *2.ACTIVE: the pool is on active state. Therefore, users can deposit, borrow, repay, withdraw and liquidate.
  *2. CLOSE: iF the pool is on close state, user can repay the loan, withdraw, liquidate. However, he is not  allowed to deposit or borrow. 
 *@author Damiss
**/

Tip: When you add liquidity, you will receive pool tokens representing your position. These tokens automatically earn fees proportional to your share of the pool, and can be redeemed at any time.