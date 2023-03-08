import { ethers, network, upgrades } from 'hardhat'
import { utils, Contract, BigNumber, constants, BigNumberish} from 'ethers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import {time} from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'

require('dotenv').config()

const toWei = (value:string)=> utils.parseUnits(value, 18)

const BASE_BORROW_RATE = toWei('0.02')
const RATE_SLOP_1 = toWei('0.02')
const RATE_SLOP_2 = toWei('0.04')
const LIQUIDATION_THRESHOLD = toWei('0.75')
const LIQUIDATION_BONUS_PERCENT = toWei('1.05')
const EXCESS_UTILIZATION_RATE = toWei('0.2')
const OPTIMAL_UTILIZATION_RATE = toWei('0.8')

const ERC20_ABI = [
    "function approve(address _spender, uint256 _value) returns(bool success)",
    "function balanceOf(address _owner) external view returns (uint256 balance)",
    "function transfer(address to, uint256 amount) external returns (bool)"
]

const initPoolHelper = async(
    lendingPool:Contract,
    poolConfigurator:Contract,
    token=process.env.DAI,
    priceFeed=process.env.PRICEFEED_ADDRESS_DAI_ETH,
    priceFeedInUSD=process.env.PRICEFEED_ADDRESS_DAI_USD
    )=>{
    const tx = await lendingPool.initPool(
        token,
        poolConfigurator.address,
        priceFeed,
        priceFeedInUSD
    )
    await tx.wait()
}

describe("Lending Pool", function () {
    const DAI_WHALE = '0x075e72a5eDf65F0A5f44699c7654C1a76941Ddc8'
    const AAVE_WHALE = '0x896078A63A1878b7FDc8DBA468C9A59b94fd7a92'
    enum POOL_STATUS{
        INACTIVE=0,
        ACTIVATED=1,
        CLOSED=2
    }

    let lendingPool: Contract
    let poolConfigurator: Contract
    let dai: Contract
    let aave: Contract
    let deployer: SignerWithAddress
    let OtherAccount: SignerWithAddress[]
    let daiWhale: SignerWithAddress
    let aaveWhale: SignerWithAddress
  
    beforeEach(async() => {
        // And get signers here
        [deployer, ...OtherAccount] = await ethers.getSigners()
        // Deploy contracts 
        const WadMath = await ethers.getContractFactory('WadMath')
        const wadMath = await WadMath.deploy()
        
        const Oracle =  await ethers.getContractFactory('Oracle',{
            libraries:{
                WadMath:wadMath.address,
            }
        })
        
        const oracle = await Oracle.deploy()
        const AmountShareConvertor =  await ethers.getContractFactory('AmountShareConvertor', {
            libraries:{
                WadMath:wadMath.address,
                Oracle: oracle.address
            }
        })
        const amountShareConvertor = await AmountShareConvertor.deploy()
        const LendingPoolHelper =  await ethers.getContractFactory('LendingPoolHelper',{
            libraries:{
                WadMath:wadMath.address,
                AmountShareConvertor: amountShareConvertor.address
            }
        })
    
        const lendingPoolHelper = await LendingPoolHelper.deploy()
        
        const CompoundInterestCalculator =  await ethers.getContractFactory('CompoundInterestCalculator',{
            libraries:{
                WadMath:wadMath.address
            }
        })
    
        const compoundInterestCalculator = await CompoundInterestCalculator.deploy()
        const PoolConfigurator = await ethers.getContractFactory('PoolConfigurator',{
            libraries:{
            WadMath:wadMath.address
            }
        })
    
        poolConfigurator = await PoolConfigurator.deploy(
            BASE_BORROW_RATE,
            RATE_SLOP_1,
            RATE_SLOP_2,
            LIQUIDATION_THRESHOLD,
            LIQUIDATION_BONUS_PERCENT,
            EXCESS_UTILIZATION_RATE,
            OPTIMAL_UTILIZATION_RATE
        )
    
        await poolConfigurator.deployed()

        const STokenFactory = await ethers.getContractFactory('STokenFactory')
        const sTokenFactory = await STokenFactory.deploy()
        await sTokenFactory.deployed()

        const LendingPool = await ethers.getContractFactory('LendingPool', {
            libraries:{
            WadMath:wadMath.address,
            AmountShareConvertor: amountShareConvertor.address,
            Oracle: oracle.address,
            CompoundInterestCalculator: compoundInterestCalculator.address,
            LendingPoolHelper:lendingPoolHelper.address
            }
        })  
        
        //proxy deployment 
        lendingPool = await upgrades.deployProxy(LendingPool, [sTokenFactory.address], {
            initializer: 'initialize',
            unsafeAllowLinkedLibraries:true,
        })

        // Get instance of dai contract
        dai = new ethers.Contract(process.env.DAI as string, ERC20_ABI, deployer)
        aave = new ethers.Contract(process.env.AAVE as string, ERC20_ABI, deployer)

        await network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [DAI_WHALE]
        })

        daiWhale = await ethers.getSigner(DAI_WHALE)

        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [AAVE_WHALE]
        })
    
        aaveWhale = await ethers.getSigner(AAVE_WHALE)

    })
    describe('init pool', ()=>{
        it('should fail if caller is not the owner', async()=>{
            
            await expect(
                lendingPool.connect(OtherAccount[0]).initPool(
                    process.env.DAI,
                    poolConfigurator.address,
                    process.env.PRICEFEED_ADDRESS_DAI_ETH,
                    process.env.PRICEFEED_ADDRESS_DAI_USD,
                    {gasLimit:500000}
                )
            ).to.reverted
        })

        it('should fail if wrong asset address is provided', async()=>{
            await expect(
                lendingPool.initPool(
                    constants.AddressZero,
                    poolConfigurator.address,
                    process.env.PRICEFEED_ADDRESS_DAI_ETH,
                    process.env.PRICEFEED_ADDRESS_DAI_USD,
                )
            ).to.reverted
        })

        it('should fail if wrong pool config address is provided', async()=>{
            await expect(
                lendingPool.initPool(
                    process.env.DAI,
                    constants.AddressZero,
                    process.env.PRICEFEED_ADDRESS_DAI_ETH,
                    process.env.PRICEFEED_ADDRESS_DAI_USD,
                )
            ).to.reverted
        })

        it('should fail if wrong oracle price feed address is provided', async()=>{
            await expect(
                lendingPool.initPool(
                    process.env.DAI,
                    poolConfigurator.address,
                    constants.AddressZero,
                    process.env.PRICEFEED_ADDRESS_DAI_USD
                )
            ).to.reverted
        })

        it('should init pool', async()=>{
            const tx = await lendingPool.initPool(
                process.env.DAI,
                poolConfigurator.address,
                process.env.PRICEFEED_ADDRESS_DAI_ETH,
                process.env.PRICEFEED_ADDRESS_DAI_USD
            )
            const result = await tx.wait()
            expect('InitPool').to.eql(result.events[2].event)
            expect(process.env.DAI).to.eql(result.events[2].args[0])
            expect(poolConfigurator.address).to.eql(result.events[2].args[1])
            
        })
   })

    describe('supply asset', ()=>{
        const amount =  '100'
        it('should fail if wrong asset address is provided', async()=>{
            await initPoolHelper(lendingPool, poolConfigurator)
            await expect(
                lendingPool.supply(
                    constants.AddressZero,
                    toWei(amount)
                )
            ).to.reverted
        })
        it('should fail if asset is not allowed', async()=>{
            await initPoolHelper(lendingPool, poolConfigurator)
            await expect(
                lendingPool.supply(
                    process.env.AAVE,
                    toWei(amount)
                )
            ).to.reverted
        })
        it('should fail if pool status is not activated', async()=>{
            await initPoolHelper(lendingPool, poolConfigurator)
            await expect(
                lendingPool.supply(
                    process.env.DAI,
                    toWei(amount)
                )
            ).to.reverted
        })
        it('should fail if supply amount is equal to zero', async()=>{
            await initPoolHelper(lendingPool, poolConfigurator)
            await lendingPool.setPoolStatus(process.env.DAI, POOL_STATUS.ACTIVATED) 
            await expect(
                lendingPool.supply(
                    process.env.DAI,
                    0
                )
            ).to.reverted

        })

        it('should supply asset', async()=>{
            await initPoolHelper(lendingPool, poolConfigurator)
            await lendingPool.setPoolStatus(process.env.DAI, POOL_STATUS.ACTIVATED)
            await dai.connect(daiWhale).approve(lendingPool.address, toWei(amount)) 
            const tx = await lendingPool.connect(daiWhale).supply(
                process.env.DAI,
                toWei(amount),
                {gasLimit: 500000}
            )
            const result = await tx.wait()

            expect('Deposit').to.eql(result.events[3].event)
            expect(daiWhale.address).to.eql(result.events[3].args[0])
            expect(process.env.DAI).to.eql(result.events[3].args[1])
            expect(toWei(amount)).to.eql(result.events[3].args[2])
        })

    })

    describe('borrow', ()=>{
        const amount = '100'
        it('should fail if pool status is not activated', async()=>{
            await initPoolHelper(lendingPool, poolConfigurator)
            await expect(
                lendingPool.borrow(
                    process.env.DAI,
                    toWei(amount)
                )
            ).to.reverted

        })
        it('should fail if borrow amount is equal to zero', async()=>{
            await initPoolHelper(lendingPool, poolConfigurator)
            await lendingPool.setPoolStatus(process.env.DAI, POOL_STATUS.ACTIVATED) 
            await dai.connect(daiWhale).approve(lendingPool.address, toWei(amount)) 
            await lendingPool.connect(daiWhale).supply(
                process.env.DAI,
                toWei(amount),
                {gasLimit: 500000}
            )
            await expect(
                lendingPool.connect(daiWhale).borrow(
                    process.env.DAI,
                    0
                )
            ).to.reverted

        })
        it('should fail if pool does not have enough balance of underline asset', async()=>{
            await initPoolHelper(lendingPool, poolConfigurator)
            await lendingPool.setPoolStatus(process.env.DAI, POOL_STATUS.ACTIVATED)
            await dai.connect(daiWhale).approve(lendingPool.address, toWei(amount)) 
            await lendingPool.connect(daiWhale).supply(
                process.env.DAI,
                toWei(amount),
                {gasLimit: 500000}
            )
            await expect(
                lendingPool.connect(daiWhale).borrow(
                    process.env.DAI,
                    toWei('200')
                )
            ).to.reverted
        })

        it('should fail if account is unhealthy', async()=>{
            //user supply 100 DAI and then wants borrow 76 DAI while keeping his/her position. 
            //However, collateral threshold for DAI is 75%
            await initPoolHelper(lendingPool, poolConfigurator)
            await lendingPool.setPoolStatus(process.env.DAI, POOL_STATUS.ACTIVATED)
            await dai.connect(daiWhale).approve(lendingPool.address, toWei(amount)) 
            await lendingPool.connect(daiWhale).supply(
                process.env.DAI,
                toWei(amount),
                {gasLimit: 500000}
            )
            await expect(
                lendingPool.connect(daiWhale).borrow(
                    process.env.DAI,
                    toWei('76')
                )
            ).to.reverted
        })

        it('should borrow', async()=>{
            await initPoolHelper(lendingPool, poolConfigurator)
            await lendingPool.setPoolStatus(process.env.DAI, POOL_STATUS.ACTIVATED)
            await dai.connect(daiWhale).approve(lendingPool.address, toWei(amount)) 
            await lendingPool.connect(daiWhale).supply(
                process.env.DAI,
                toWei(amount),
                {gasLimit: 500000}
            )
            await lendingPool.connect(daiWhale).setCollateral(process.env.DAI)
            const tx = await lendingPool.connect(daiWhale).borrow(
                process.env.DAI,
                toWei('75')
            )
            const result = await tx.wait()
            
            expect('Borrow').to.eql(result.events[1].event)
            expect(daiWhale.address).to.eql(result.events[1].args[0])
            expect(process.env.DAI).to.eql(result.events[1].args[1])
            expect(toWei('75')).to.eql(result.events[1].args[2])
            
        })

        it('can borrow different asset than collateral one', async()=>{
            //init dai pool
            await initPoolHelper(lendingPool, poolConfigurator)
            //init aave pool
            await initPoolHelper(
                lendingPool, 
                poolConfigurator, 
                process.env.AAVE, 
                process.env.PRICEFEED_ADDRESS_AAVE_ETH,
                process.env.PRICEFEED_ADDRESS_AAVE_USD
            )
            // activate dai pool
            await lendingPool.setPoolStatus(process.env.DAI, POOL_STATUS.ACTIVATED)
            // activate aave pool
            await lendingPool.setPoolStatus(process.env.AAVE, POOL_STATUS.ACTIVATED)
            //aave whale deposit 50 aave
            await aave.connect(aaveWhale).approve(lendingPool.address, toWei('50')) 
            await lendingPool.connect(aaveWhale).supply(
                process.env.AAVE,
                toWei('50'),
                {gasLimit: 500000}
            )
            // daiWhale deposit 1000 dai
            await dai.connect(daiWhale).approve(lendingPool.address, toWei('1000')) 
            await lendingPool.connect(daiWhale).supply(
                process.env.DAI,
                toWei('1000'),
                {gasLimit: 500000}
            )
            // daiWhale borrow 5 aave token
            await lendingPool.connect(daiWhale).setCollateral(process.env.DAI)
            const tx = await lendingPool.connect(daiWhale).borrow(
                process.env.AAVE,
                toWei('1')
            )
            const result = await tx.wait()
            //instantly jump a period of time;
            await time.increase(600)
            expect('Borrow').to.eql(result.events[1].event)
            expect(daiWhale.address).to.eql(result.events[1].args[0])
            expect(process.env.AAVE).to.eql(result.events[1].args[1])
            expect(toWei('1')).to.eql(result.events[1].args[2])
        })
    })
    describe('repay', ()=>{
        const amount = '1000'
        it('should fail if pool is not activated or not closed', async()=>{
            await initPoolHelper(lendingPool, poolConfigurator)
            // activate dai pool
            await lendingPool.setPoolStatus(process.env.DAI, POOL_STATUS.ACTIVATED)
            await dai.connect(daiWhale).approve(lendingPool.address, toWei(amount)) 
            await lendingPool.connect(daiWhale).supply(
                process.env.DAI,
                toWei(amount),
                {gasLimit: 500000}
            )
            await lendingPool.connect(daiWhale).setCollateral(process.env.DAI)
            await lendingPool.connect(daiWhale).borrow(
                process.env.DAI,
                toWei('75')
            )
            // disactivate dai pool
            await lendingPool.setPoolStatus(process.env.DAI, POOL_STATUS.INACTIVE)
            await expect(
            lendingPool.connect(daiWhale).repay(
                    process.env.DAI,
                    toWei('75')
                )
            ).to.reverted
        })

        it('should fail if repay amount is less or equal to zero', async()=>{
            await initPoolHelper(lendingPool, poolConfigurator)
            // activate dai pool
            await lendingPool.setPoolStatus(process.env.DAI, POOL_STATUS.ACTIVATED)
            await dai.connect(daiWhale).approve(lendingPool.address, toWei(amount)) 
            await lendingPool.connect(daiWhale).supply(
                process.env.DAI,
                toWei(amount),
                {gasLimit: 500000}
            )
            await lendingPool.connect(daiWhale).setCollateral(process.env.DAI)
            await lendingPool.connect(daiWhale).borrow(
                process.env.DAI,
                toWei('75')
            )
            await expect(
                lendingPool.connect(daiWhale).repay(
                    process.env.DAI,
                    toWei('0')
                )
            ).to.reverted
        })

        it('should fail if user has zero borrow amount', async()=>{
            await initPoolHelper(lendingPool, poolConfigurator)
            // activate dai pool
            await lendingPool.setPoolStatus(process.env.DAI, POOL_STATUS.ACTIVATED)
            await dai.connect(daiWhale).approve(lendingPool.address, toWei(amount)) 
            await lendingPool.connect(daiWhale).supply(
                process.env.DAI,
                toWei(amount),
                {gasLimit: 500000}
            )
            await lendingPool.connect(daiWhale).setCollateral(process.env.DAI)
            await lendingPool.connect(daiWhale).borrow(
                process.env.DAI,
                toWei('75')
            )
            await time.increase(600)
            //repay full borrow amount 
            await dai.connect(daiWhale).approve(lendingPool.address, toWei('100')) 
            const tx = await lendingPool.connect(daiWhale).repay(
                process.env.DAI,
                toWei('76'),
                {gasLimit: 500000}
            )
            await tx.wait()
            await expect(
                lendingPool.connect(daiWhale).repay(
                    process.env.DAI,
                    toWei('10')
                )
            ).to.reverted
        })

        it('should repay', async()=>{
            await initPoolHelper(lendingPool, poolConfigurator)
            // activate dai pool
            await lendingPool.setPoolStatus(process.env.DAI, POOL_STATUS.ACTIVATED)
            await dai.connect(daiWhale).approve(lendingPool.address, toWei(amount)) 
            await lendingPool.connect(daiWhale).supply(
                process.env.DAI,
                toWei(amount),
                {gasLimit: 500000}
            )
            await lendingPool.connect(daiWhale).setCollateral(process.env.DAI)
            await lendingPool.connect(daiWhale).borrow(
                process.env.DAI,
                toWei('75')
            )
            await time.increase(600)
            //repay full borrow amount 
            await dai.connect(daiWhale).approve(lendingPool.address, toWei('100')) 
            const tx = await lendingPool.connect(daiWhale).repay(
                process.env.DAI,
                toWei('76'),
                {gasLimit: 500000}
            )
            const result = await tx.wait()
            expect('Repay').to.eql(result.events[2].event)
            expect(daiWhale.address).to.eql(result.events[2].args[0])
            expect(process.env.DAI).to.eql(result.events[2].args[1])
            expect(toWei('76')).to.eql(result.events[2].args[2])
        
        })

    })
    describe('withdraw', ()=>{
        const amount = '1000'
        it('should fail if pool is not activated or not closed', async()=>{
            await initPoolHelper(lendingPool, poolConfigurator)
            // activate dai pool
            await lendingPool.setPoolStatus(process.env.DAI, POOL_STATUS.ACTIVATED)
            await dai.connect(daiWhale).approve(lendingPool.address, toWei(amount)) 
            await lendingPool.connect(daiWhale).supply(
                process.env.DAI,
                toWei(amount),
                {gasLimit: 500000}
            )
        
            // disactivate dai pool
            await lendingPool.setPoolStatus(process.env.DAI, POOL_STATUS.INACTIVE)
            await expect(
            lendingPool.connect(daiWhale).withdraw(
                    process.env.DAI,
                    toWei(amount)
                )
            ).to.reverted
        })
        it('should fail if withdraw amount is less or equal to zero', async()=>{
            await initPoolHelper(lendingPool, poolConfigurator)
            // activate dai pool
            await lendingPool.setPoolStatus(process.env.DAI, POOL_STATUS.ACTIVATED)
            await dai.connect(daiWhale).approve(lendingPool.address, toWei(amount)) 
            await lendingPool.connect(daiWhale).supply(
                process.env.DAI,
                toWei(amount),
                {gasLimit: 500000}
            )
           
            await expect(
                lendingPool.connect(daiWhale).withdraw(
                    process.env.DAI,
                    toWei('0')
                )
            ).to.reverted
        })

        it('should fail if user try to withdraw after clearing his/her position', async()=>{
            await initPoolHelper(lendingPool, poolConfigurator)
            // activate dai pool
            await lendingPool.setPoolStatus(process.env.DAI, POOL_STATUS.ACTIVATED)
            await dai.connect(daiWhale).approve(lendingPool.address, toWei(amount)) 
            await lendingPool.connect(daiWhale).supply(
                process.env.DAI,
                toWei(amount),
                {gasLimit: 500000}
            )
            const tx = await lendingPool.connect(daiWhale).withdraw(
                process.env.DAI,
                toWei(amount)
            )
            await tx.wait()
            await expect(
                lendingPool.connect(daiWhale).withdraw(
                    process.env.DAI,
                    toWei(amount)
                )
            ).to.reverted
        })

        it('should withdraw', async()=>{
            await initPoolHelper(lendingPool, poolConfigurator)
            // activate dai pool
            await lendingPool.setPoolStatus(process.env.DAI, POOL_STATUS.ACTIVATED)
            await dai.connect(daiWhale).approve(lendingPool.address, toWei(amount)) 
            await lendingPool.connect(daiWhale).supply(
                process.env.DAI,
                toWei(amount),
                {gasLimit: 500000}
            )
            //keep position for 600 seconds
            await time.increase(600)
            const tx = await lendingPool.connect(daiWhale).withdraw(
                process.env.DAI,
                constants.MaxUint256
            )
            await tx.wait()
            const result = await tx.wait()
            
            expect('Withdraw').to.eql(result.events[2].event)
            expect(daiWhale.address).to.eql(result.events[2].args[0])
            expect(process.env.DAI).to.eql(result.events[2].args[1])
            //deposit amount equal to withdraw amount after 10 minutes because there is no borrow yet. 
            expect(toWei(amount)).to.eql(result.events[2].args[2])
        })

    })

    describe('liquidation', ()=>{
        const amount = '100'
        it('should fail if account is healthy', async()=>{
            const liquidator = OtherAccount[2]
            await initPoolHelper(lendingPool, poolConfigurator)
            await lendingPool.setPoolStatus(process.env.DAI, POOL_STATUS.ACTIVATED)
            // activate dai pool
            const tx1 = await dai.connect(daiWhale).transfer(liquidator.address, toWei(amount))
            await tx1.wait() 
            await dai.connect(daiWhale).approve(lendingPool.address, toWei(amount)) 
            await lendingPool.connect(daiWhale).supply(
                process.env.DAI,
                toWei(amount),
                {gasLimit: 500000}
            )
            await lendingPool.connect(daiWhale).setCollateral(process.env.DAI)
            await lendingPool.connect(daiWhale).borrow(
                process.env.DAI,
                toWei('74')
            )
            await time.increase(600)
            const purchaseAmount = await lendingPool.getPurchaseAmount(daiWhale.address, process.env.DAI)
            await expect(
                lendingPool.connect(liquidator).liquidation(
                    daiWhale.address,
                    process.env.DAI,
                    process.env.DAI,
                    purchaseAmount,
                    {gasLimit: 500000}
                )
            ).to.reverted
        })
        it('should fail if token is not collateral', async()=>{
            const liquidator = OtherAccount[2]
            await initPoolHelper(lendingPool, poolConfigurator)
            await lendingPool.setPoolStatus(process.env.DAI, POOL_STATUS.ACTIVATED)
            // activate dai pool
            const tx1 = await dai.connect(daiWhale).transfer(liquidator.address, toWei(amount))
            await tx1.wait() 
            await dai.connect(daiWhale).approve(lendingPool.address, toWei(amount)) 
            await lendingPool.connect(daiWhale).supply(
                process.env.DAI,
                toWei(amount),
                {gasLimit: 500000}
            )
            await time.increase(600)
            const purchaseAmount = await lendingPool.getPurchaseAmount(daiWhale.address, process.env.DAI)
            await expect(
                lendingPool.connect(liquidator).liquidation(
                    daiWhale.address,
                    process.env.DAI,
                    process.env.DAI,
                    purchaseAmount,
                    {gasLimit: 500000}
                )
            ).to.reverted
        })
        it('should fail if user did not borrow', async()=>{
            const liquidator = OtherAccount[2]
            await initPoolHelper(lendingPool, poolConfigurator)
            await lendingPool.setPoolStatus(process.env.DAI, POOL_STATUS.ACTIVATED)
            // activate dai pool
            const tx1 = await dai.connect(daiWhale).transfer(liquidator.address, toWei(amount))
            await tx1.wait() 
            await dai.connect(daiWhale).approve(lendingPool.address, toWei(amount)) 
            await lendingPool.connect(daiWhale).supply(
                process.env.DAI,
                toWei(amount),
                {gasLimit: 500000}
            )
            await lendingPool.connect(daiWhale).setCollateral(process.env.DAI)

            await time.increase(600)
            const purchaseAmount = await lendingPool.getPurchaseAmount(daiWhale.address, process.env.DAI)
            await expect(
                lendingPool.connect(liquidator).liquidation(
                    daiWhale.address,
                    process.env.DAI,
                    process.env.DAI,
                    purchaseAmount,
                    {gasLimit: 500000}
                )
            ).to.reverted
        })
        it('should liquidate', async()=>{
            const liquidator = OtherAccount[5]
            await initPoolHelper(lendingPool, poolConfigurator)
            await lendingPool.setPoolStatus(process.env.DAI, POOL_STATUS.ACTIVATED)
            // activate dai pool
            const tx1 = await dai.connect(daiWhale).transfer(liquidator.address, toWei('100'))
            await tx1.wait()
            const balanceBeforeLiquidation = await dai.balanceOf(liquidator.address)
            
            await dai.connect(daiWhale).approve(lendingPool.address, toWei(amount)) 
            await lendingPool.connect(daiWhale).supply(
                process.env.DAI,
                toWei(amount),
                {gasLimit: 500000}
            )
            await lendingPool.connect(daiWhale).setCollateral(process.env.DAI)
            await lendingPool.connect(daiWhale).borrow(
                process.env.DAI,
                toWei('75')
            )
            await time.increase(600)
            //repay full borrow amount 
            await dai.connect(liquidator).approve(lendingPool.address, toWei('50')) 
            const purchaseAmount = await lendingPool.getPurchaseAmount(daiWhale.address, process.env.DAI)
            const tx = await lendingPool.connect(liquidator).liquidation(
                daiWhale.address,
                process.env.DAI,
                process.env.DAI,
                purchaseAmount,
                {gasLimit: 500000}
            )
            const result = await tx.wait()
            const tx2 = await lendingPool.connect(liquidator).withdraw(
                process.env.DAI,
                constants.MaxUint256,
                {gasLimit: 500000}
            )
            await tx2.wait()
            const balanceAfterLiquidation = await dai.balanceOf(liquidator.address)

            expect(balanceBeforeLiquidation).to.be.lessThan(balanceAfterLiquidation)
            
            expect('Liquidation').to.eql(result.events[4].event)
            expect(daiWhale.address).to.eql(result.events[4].args[0])
            expect(liquidator.address).to.eql(result.events[4].args[1])
            expect(process.env.DAI).to.eql(result.events[4].args[2])
            expect(process.env.DAI).to.eql(result.events[4].args[3])
            expect(purchaseAmount).to.eql(result.events[4].args[4])
        
        })
    })
})
