# Lending Pool 
The code in this project demostrates how to implement a full-stack decentralized pool-based lending protocol. Lenders can supply supported digital assets(ERC20 token) into protocol and earn interest on them. The deposited tokens in different pools will be available for borrowers to borrow. The loans are taken from pool's available liquidity. Hence, the interest pay by borrowers are proportionally distributed to lenders' balance. In other words lenders' earn are from interrest pay by borrowers. The lending contract is accessed via a transparant upgrade proxy smart contract.

| :exclamation:  ** WARNING None of the contracts are audited!  |
|-----------------------------------------|

# Supply
Whenever a lender deposits a supported digital asset into the protocol, it is added to Total Liquidity. It is determined by formula:

`Total Liquidity = Total Available Liquidity + Total Borrows`

Total Available Liquidity: available liquidity of underlying asset to borrow or to withdraw. 
The Total Borrows: sum of the total borrowed amount and the accumulated borrow interest.

`Total Borrows = Borrow Amount + Cumulative Borrow Interest`

After supplying a supported digital asset, lender will receive a certain balance of an ERC20 token (.e.g. sDAI), which is a record of his/her asset deposited. The received token represents his/her shares of deposited asset to Total Liquidity. It is a tokenized representation of lender’s lending position. 
Remark the Total Liquidity grows when Cumulative Borrow Interest increases. Based on that assumption, the token received that represents lender's position can claim more of the underlying asset. the amount of shares token each lender receives is detemined as follows:

`Deposit Shares = Deposit Amount * Total Deposit Shares / Total Liquidity`

Note: for the first lender the Total Deposit Shares is equal to Total Liquidity.

Reference: [Aplha LendingPool WhitePaper](https://github.com/AlphaFinanceLab/alpha-lending-smart-contract/blob/master/documents/Alpha%20Lending%20Whitepaper.pdf )

# Borrow
Borrower must first supply a certain amount of supported asset(s) into the protocol. After that the borrower receives a balance of ERC20 token (.e.g. sDAI), which represents his/her shares of borrowed amount to the Total Borrows of underlying asset. Borrower can then use this received token (.e.g. sDAI) as collateral, in order to be able to borrow other assets such as AAVE. Note that borrower will still earn deposit interest on his/her deposit since other users are borrowing that asset from the protocol.
It is important to underline that the borrow value should not exceed borrow limit. Each supported token has a liquidation threshold aslo called Maximum Loan-to-value (LTV). The borrow Limit is the sum of product deposited value in usd and token's LTV. It can can be calculated using formula below as:

`Borrow Limit = (Deposit Value in USD of Asset1 * Asset Maximum LTV1 + Deposit Value in USD for Asset2 * Asset Maximum LTV2 + ...)`
 
Remark that a borrower can only borrow if his/her account is healthy. This health check is made by taking into account the new borrow amount. Account Health can be calculated as follows:

Account Health = Healthy (borrow value ≤ Borrow Limit) Account Health = Unhealthy (borrow value > Borrow Limit)
Borrowing process

After borrowing, the protocol calculates the amount borrow shares that represents the shares of the borrower’s borrowed amount to the Total Borrows of that asset. The borrow shares calculated as follows: 

`Borrow Shares = (Borrow Amount * Total Borrow Shares) / Total Borrows`

Note: for the first borrower the Total Borrow Shares is equal to Total Borrows.

Reference: [Aplha LendingPool WhitePaper](https://github.com/AlphaFinanceLab/alpha-lending-smart-contract/blob/master/documents/Alpha%20Lending%20Whitepaper.pdf )

# Withdraw
To withdraw a part or all of the deposited amount, there must be enough Total Available Liquidity to do so and the Account Health should remains healthy after the transaction. During the withdrawal, the protocol calculates withdraw shares using input amount and then an equivalent of withdraw shares is burnt from the balance of user's deposit shares (user's shares of deposited asset to Total Liquidity). After that the withdraw amount is transferred to the user. Withdraw shares is calculated using below formula:

`Withdraw Shares = Withdraw Amount * Total Deposit Shares / Total Liquidity`
 
When user withdraws all of the deposited amount, he/she will receive an amount greater than the originally deposited balance. This is due to the accruing deposit interest.

Reference: [Aplha LendingPool WhitePaper](https://github.com/AlphaFinanceLab/alpha-lending-smart-contract/blob/master/documents/Alpha%20Lending%20Whitepaper.pdf )

# Repay

When repaying a part or all of the borrowed amount, the protocol uses input amount to calculate repay shares. After that it transfers the repay amount to the pool, and reduces user's borrow shares. Repay shares is calculated using below formula:

`Repay Shares = Repay Amount * Total Borrow Shares / Total Borrows`

In order to pay all of the borrowed amount, user should provides more than the original amount. This is due the accrued borrow interest.

# Interest Rates Dynamics
The protocols fees is calculated based on utilization rate. It is calculated as follows:

`Utilization Rate = Total Borrows / Total Liquidity`

A higher borrow demand leads higher utilization rate, which in turn leads an increase of borrow interest rate. Each asset has its own base borrow rate and optimal utilization rate, or the specific utilization rate that marks the beginning of a sharp rise in Borrow interest rate to protect the liquidity in the pool. Therefore, Borrow Interest Rate1 and Borrow Interest Rate2 when utilization rate is below and above optimal utilization rate can be calculated as:

Borrow Interest Rate1 when Utilization Rate < Optimal Utilization Rate:


`Borrow Interest Rate = Base Borrow Rate + (Utilization Rate * Slope1)`
 

Borrow Interest Rate2 when Utilization Rate > Optimal Utilization Rate:


`Borrow Interest Rate = Slope1 + [(Utilization Rate - Optimal Utilization Rate)/(100% - Optimal Utilization Rate) * Slope2]`
 

A certain percentage of the borrow interest will be allocated for Pool reserve as an insurance for the pool. It is important to underline that higher borrow interest rate leads to an increase of deposit interest rate, which can be calculated as:

`Deposit Interest Rate = Borrow Interest Rate * Utilization Rate`

# Demo online

# Configure .env file:
Create a .env file, and fill in the following values (refer to the .env.example file):
- ALCHEMY_API_KEY="API_KEY_POLYGON_MAINNET"
- ALCHEMY_TESTNET_API_KEY="API_KEY_SEPOLIA"
- PRIVATE_KEY="YOUR_PRIVATE_KEY" 
- ETHERSCAN_API_KEY="API_KEY_ETHERSCAN"
- COINMARKETCAP="API_KEY_COIN_MARKET_CAP"

# Run a demo locally
- add sepolia testnet into your metamask wallet
- open [http://localhost:3000](http://localhost:3000) to view it in the browser
- select an asset then click on faucet in order to get some token
- enable asset as collateral before borrowing any other assets
  
1. Clone the repo into a directory
- cd into the directory
- execute commands:
```console
cd client
npm install
cd smart-contract 
npm install
```

1. Deployment and run the (client app) front-end
- cd into smart-contract
- execute command:
```console
npm run hardhat:fork
```
- open a new terminal
- cd smart-contract
- execute commands:
```console
npm run deploy:localhost
npm run initPool
```
- copy address from smart-contract/contracts-build-directory/lending-pool-contract/address.json then past it into client/src/contracts-build-directory/lending-pool-contract/address.json
  
- open a new terminal
- cd into client
- execute command:
```console
npm start
```
- open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Run a demo on docker

1. Clone the repo into a directory
- cd in to the directory
- execute command:
```console
docker-compose build localhost
```

3. Deployment  and run the (client app) front-end
- cd into project directory
- execute command:
```console
docker-compose up localhost
```
- copy address from smart-contract/contracts-build-directory/lending-pool-contract/address.json then past it into client/src/contracts-build-directory/lending-pool-contract/address.json
  
- open a new terminal 
- cd into the project directory
- execute commands:
```console
docker-compose build client
docker-compose up client
```
- open [linding protocol](https://sparkling-field-7889.on.fleek.co) to view it in the browser.

# Run tests using hardhat
- cd into smart-contract
- execute command:
```console
npm run hardhat:fork
```console
- open a new terminal 
- cd smart-contract

- execute command:
```console
npm run hardhat:test
```

# Run tests using foundry
- install foundry on your machine (Please refer to https://book.getfoundry.sh/getting-started/installation)
- cd into smart-contract
- execute command:
```console
forge test --mp test/foundry/LendingPool.t.sol --fork-url  https://polygon-mainnet.g.alchemy.com/v2/API_KEY_POLYGON_MAINNET -vv
```


# Run tests using hardhat on docker
- cd into the project directory
- execute commands:
```console
docker-compose build hardhat-test
docker-compose up hardhat-test
```

# Run tests using foundry on docker
- cd into the project directory
- execute commands:
```console
docker-compose build foundry-test
docker-compose up foundry-test
```
# Run contract into sepolia testnet
- cd into the project directory
- execute commands:
```console
docker-compose build deploy-sepolia
docker-compose up deploy-sepolia
```
Note: few steps are required in order to run the frontend using deployed smart contract in sepolia testnet. first you should verify the implementation contract (npx hardhat verify --network sepolia address), init the pool by running **npx hardhat run scripts/initPool.ts --network sepolia**. After that copy address from smart-contract/contracts-build-directory/lending-pool-contract/address.json then past it into client/src/contracts-build-directory/lending-pool-contract/address.json

|Contract Name|Adress|
|-------------|-------------|
|Proxy Contract|0x77130531587232943e918d023AEA0270221ac3B3|
|Implementation Contract|0xca94f910209e7801c88a4c0474d6b765af643af0|

  
# References
https://github.com/smartcontractkit/defi-minimal
https://github.com/Polygon-Academy/Tutorial-defi-tutorial
https://github.com/AlphaFinanceLab/alpha-lending-smart-contract/blob/master/documents/Alpha%20Lending%20Whitepaper.pdf