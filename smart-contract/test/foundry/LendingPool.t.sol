pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import {Address} from '@openzeppelin/contracts/utils/Address.sol';
import {Strings} from '@openzeppelin/contracts/utils/Strings.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';

import {LendingPool, AmountShareConvertor, Oracle} from 'contracts/LendingPool.sol';
import {PoolConfigurator} from 'contracts/PoolConfigurator.sol';
import {STokenFactory} from 'contracts/STokenFactory.sol';
import {IPoolConfigurator} from 'contracts/interfaces/IPoolConfigurator.sol';
import {ILendingPool} from 'contracts/interfaces/ILendingPool.sol';
import {ISToken} from 'contracts/interfaces/ISToken.sol';
import {Storage} from 'contracts/Storage.sol';

contract LendingPoolTest is Test {
    using stdStorage for StdStorage;
    using Address for address;
    using Strings for uint;

    LendingPool public lendingPool;
    STokenFactory public sTokenFactory;
    PoolConfigurator public poolConfigurator;

    address constant USDT = 0xc2132D05D31c914a87C6611C10748AEb04B58e8F;
    address constant DAI = 0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063;
    address constant AAVE = 0xD6DF932A45C0f255f85145f286eA0b292B21C90B;
    address constant PRICE_FEED_ADDRESS = 0xFC539A559e170f848323e19dfD66007520510085; //DAI/ETH
    address constant PRICE_FEED_IN_USD_ADDRESS = 0x4746DeC9e833A82EC7C2C1356372CcF2cfcD2F3D; // DAI/USD
    address constant PRICE_FEED_ADDRESS_2 = 0xbE23a3AA13038CfC28aFd0ECe4FdE379fE7fBfc4; //AAVE/ETH
    address constant PRICE_FEED_IN_USD_ADDRESS_2 = 0x72484B12719E23115761D5DA1646945632979bB6; // AAVE/USD
    

    event InitPool(address indexed token, address indexed poolConfig);
    event Deposit(address indexed account, address indexed token, uint256 amount);
    event Borrow(address indexed account, address indexed token, uint256 amount);
    event Repay(address indexed account, address indexed token, uint256 amount);
    event Withdraw(address indexed account, address indexed token, uint256 amount);
    event Liquidation(
        address indexed user, 
        address indexed liquidator,
        address liquidatedToken, 
        address collateralToken, 
        uint256 purchaseAmount
    );
    
    uint256 constant DEPOSITED_DAI_AMOUNT = 1000*1e18;
    uint256 constant DEPOSITED_AAVE_AMOUNT = 500*1e18;
    uint256 constant BORROW_DAI_AMOUNT = 750*1e18;
    uint256 constant BORROW_AAVE_AMOUNT = 3*1e18;
    
    uint256 constant BASE_BORROW_RATE = 0.01*1e18;
    uint256 constant RATE_SLOP_1 = 0.02*1e18;
    uint256 constant RATE_SLOP_2 = 0.04*1e18;
    uint256 constant LIQUIDATION_THRESHOLD = 0.75*1e18;
    uint256 constant LIQUIDATION_BONUS_PERCENT = 1.05*1e18;
    uint256 constant EXCESS_UTILIZATION_RATE = 0.2*1e18;
    uint256 constant OPTIMAL_UTILIZATION_RATE = 0.8*1e18;

    function setUp() public {
        sTokenFactory = new STokenFactory();
        poolConfigurator = new PoolConfigurator(
            BASE_BORROW_RATE,
            RATE_SLOP_1,
            RATE_SLOP_2,
            LIQUIDATION_THRESHOLD,
            LIQUIDATION_BONUS_PERCENT,
            EXCESS_UTILIZATION_RATE,
            OPTIMAL_UTILIZATION_RATE
        );
        
        lendingPool = new LendingPool();
        lendingPool.initialize(address(sTokenFactory));
    }

    function testDeployment() public {
        assertTrue(Address.isContract(address(poolConfigurator)));
        assertTrue(Address.isContract(address(lendingPool)));
    }
    
    function testInitPoolFailWithWrongToken() public{
        vm.expectRevert();
        lendingPool.initPool(
            address(0), 
            address(poolConfigurator), 
            PRICE_FEED_ADDRESS, 
            PRICE_FEED_IN_USD_ADDRESS
        );
    }

    function testInitPoolFailWithWrongConfig() public{
        vm.expectRevert();
        lendingPool.initPool(
            DAI,
            address(0),
            PRICE_FEED_ADDRESS,
            PRICE_FEED_IN_USD_ADDRESS
        );
    }

    function testInitPoolFailWithCallerNotOwner() public{
        vm.expectRevert(
            bytes(abi.encodePacked('Ownable: caller is not the owner'))
        );
        vm.prank(address(1));
        lendingPool.initPool(
            DAI, 
            address(poolConfigurator), 
            PRICE_FEED_ADDRESS,
            PRICE_FEED_IN_USD_ADDRESS
        );
    }

    function testInitPool() public{
        vm.expectEmit(true, true, false, true);
        emit InitPool(DAI, address(poolConfigurator));
        lendingPool.initPool(
            DAI, 
            address(poolConfigurator),
            PRICE_FEED_ADDRESS,
            PRICE_FEED_IN_USD_ADDRESS
        );
    }


    function testPoolStatusFailWithCallerNotOwner() public{
        vm.expectRevert(
            bytes(abi.encodePacked('Ownable: caller is not the owner'))
        );
        vm.prank(address(1));
        lendingPool.setPoolStatus(DAI, 1);
    }

    function testPoolStatus(uint status) public{
        vm.assume(status < 3);
        lendingPool.setPoolStatus(DAI, status);
        (Storage.Stat poolStatus, , ,) = lendingPool.getPool(DAI);
        assertTrue(status == uint(poolStatus));
    }

    function testGetPool() public{
        lendingPool.initPool(
            DAI,
            address(poolConfigurator),
            PRICE_FEED_ADDRESS,
            PRICE_FEED_IN_USD_ADDRESS
        );
        (
            Storage.Stat status,
            address poolConfig,
            address priceFeed,
            address priceFeedInUsd
        ) = lendingPool.getPool(DAI);

        assertEq(0, uint(status));
        assertEq(address(poolConfigurator), poolConfig);
        assertEq(priceFeed, PRICE_FEED_ADDRESS);
        assertEq(priceFeedInUsd, PRICE_FEED_IN_USD_ADDRESS);
    }
    function initPoolAndSetStatus(
        address token_, 
        address priceFeedAddress, 
        address priceFeedInUSD
    ) private{
        // manipulate fork mainnet state by transfering 10000 dai to caller account(LendingPool.t.sol contract)
        stdstore
        .target(token_)
        .sig(IERC20(token_).balanceOf.selector)
        .with_key(address(this))
        .checked_write(10000*1e18);
        //initiate the pool
        lendingPool.initPool(
            token_,
            address(poolConfigurator),
            priceFeedAddress,
            priceFeedInUSD
        );
        //set pool status
        lendingPool.setPoolStatus(token_, 1);
    }
    function testDepositFailWithWrongToken() public{
        initPoolAndSetStatus(DAI, PRICE_FEED_ADDRESS, PRICE_FEED_IN_USD_ADDRESS);
        IERC20(DAI).approve(address(lendingPool), DEPOSITED_DAI_AMOUNT);
        vm.expectRevert();
        lendingPool.supply(address(0), DEPOSITED_DAI_AMOUNT);
    }
    
    function testDepositFailWithNotListedToken() public{
        initPoolAndSetStatus(DAI, PRICE_FEED_ADDRESS, PRICE_FEED_IN_USD_ADDRESS);
        IERC20(USDT).approve(address(lendingPool), 10*1e18);
        vm.expectRevert();
        lendingPool.supply(USDT, 5*1e18);
    }

    function testDepositFailWithNotActivateStatus() public{
        lendingPool.initPool(
            DAI,
            address(poolConfigurator), 
            PRICE_FEED_ADDRESS, 
            PRICE_FEED_IN_USD_ADDRESS
        );
        IERC20(DAI).approve(address(lendingPool), DEPOSITED_DAI_AMOUNT);
        vm.expectRevert();
        lendingPool.supply(DAI, DEPOSITED_DAI_AMOUNT);
       
    }

    function testDepositFailWithZeroAmount() public{
        initPoolAndSetStatus(DAI, PRICE_FEED_ADDRESS, PRICE_FEED_IN_USD_ADDRESS);
        IERC20(DAI).approve(address(lendingPool), DEPOSITED_DAI_AMOUNT);
        vm.expectRevert();
        lendingPool.supply(DAI, 0);
    }

    function testDeposit() public {
        initPoolAndSetStatus(DAI, PRICE_FEED_ADDRESS, PRICE_FEED_IN_USD_ADDRESS);
        //approve lending pool contract to transfer asset to itself
        IERC20(DAI).approve(address(lendingPool), DEPOSITED_DAI_AMOUNT);
        //supply the amount of 5 DAI and then emit Deposit event
        vm.expectEmit(true, true, false, true);
        emit Deposit(address(this), DAI, DEPOSITED_DAI_AMOUNT);
        lendingPool.supply(DAI, DEPOSITED_DAI_AMOUNT);
    }
    
    function testBorrowFailWithNotActivateStatus() public{
        lendingPool.initPool(
            DAI, 
            address(poolConfigurator),
            PRICE_FEED_ADDRESS,
            PRICE_FEED_IN_USD_ADDRESS
        );
        IERC20(DAI).approve(address(lendingPool), DEPOSITED_DAI_AMOUNT);
        vm.expectRevert();
        lendingPool.borrow(DAI, BORROW_DAI_AMOUNT);
    }

    function testBorrowFailWithNotEnoughLiquity() public{
        initPoolAndSetStatus(DAI, PRICE_FEED_ADDRESS, PRICE_FEED_IN_USD_ADDRESS);
        //IERC20(DAI).approve(address(lendingPool), DEPOSITED_DAI_AMOUNT);
        vm.expectRevert();
        lendingPool.borrow(DAI, BORROW_DAI_AMOUNT);
    }

    function testBorrowFailWithNotHealthyAccount() public{
        initPoolAndSetStatus(DAI, PRICE_FEED_ADDRESS, PRICE_FEED_IN_USD_ADDRESS);
        IERC20(DAI).approve(address(lendingPool), DEPOSITED_DAI_AMOUNT);
        lendingPool.supply(DAI, DEPOSITED_DAI_AMOUNT);
        vm.expectRevert();

        // liquidity factor is 75% of user deposit.
        lendingPool.borrow(DAI, BORROW_DAI_AMOUNT+1e18);
    }

    function testBorrow() public{
        initPoolAndSetStatus(DAI, PRICE_FEED_ADDRESS, PRICE_FEED_IN_USD_ADDRESS);
        IERC20(DAI).transfer(address(2), DEPOSITED_DAI_AMOUNT);
        // user is address(2) instead of address(this)
        vm.startPrank(address(2));
        IERC20(DAI).approve(address(lendingPool), DEPOSITED_DAI_AMOUNT);
        lendingPool.supply(DAI, DEPOSITED_DAI_AMOUNT);
        uint balanceBeforeBorrow = IERC20(DAI).balanceOf(address(2));
        lendingPool.setCollateral(DAI);
        vm.expectEmit(true, true, false, true);
        emit Borrow(address(2), DAI, BORROW_DAI_AMOUNT);
        lendingPool.borrow(DAI, BORROW_DAI_AMOUNT);

        uint balanceAfterBorrow = IERC20(DAI).balanceOf(address(2));
        assertEq(0, balanceBeforeBorrow);
        assertEq(BORROW_DAI_AMOUNT, balanceAfterBorrow);
    }

    function testBorrowDifferentAssetThanCollateral() public{
        //init first pool (DAI pool)
        initPoolAndSetStatus(DAI, PRICE_FEED_ADDRESS, PRICE_FEED_IN_USD_ADDRESS);
        // //init second pool (AAVE pool)
        initPoolAndSetStatus(AAVE, PRICE_FEED_ADDRESS_2, PRICE_FEED_IN_USD_ADDRESS_2);
         // deposit 1000 AAVE in second pool
        IERC20(AAVE).approve(address(lendingPool), DEPOSITED_AAVE_AMOUNT);
        lendingPool.supply(AAVE, DEPOSITED_AAVE_AMOUNT);
        // 1000 DAI to user
        IERC20(DAI).transfer(address(2), DEPOSITED_DAI_AMOUNT);
        // user is address(2) instead of address(this)
        vm.startPrank(address(2));
        IERC20(DAI).approve(address(lendingPool),DEPOSITED_DAI_AMOUNT);
        lendingPool.supply(DAI, DEPOSITED_DAI_AMOUNT);
        uint balanceBeforeBorrow = IERC20(AAVE).balanceOf(address(2));
        lendingPool.setCollateral(DAI);
        vm.expectEmit(true, true, false, true);
        emit Borrow(address(2), AAVE, BORROW_AAVE_AMOUNT);
        lendingPool.borrow(AAVE, BORROW_AAVE_AMOUNT);

        uint balanceAfterBorrow = IERC20(AAVE).balanceOf(address(2));
        assertEq(0, balanceBeforeBorrow);
        assertEq(BORROW_AAVE_AMOUNT, balanceAfterBorrow);
    }
    
    function getRepayAmount (address account, address token) private view returns(uint256){
        // get user account info
        (,uint256 borrowAmount) = lendingPool.getAccountInfo(account);
        //get pool info
        (,,address priceFeed,) = lendingPool.getPool(token);
        //convert borrow item price value into underling asset (e.g. usd->DAI)
        //asset borrow amount with wumulative interest
        return Oracle.getAssetAmountFromEth(priceFeed, borrowAmount);
    }

    function testRepayFailWithNotActivateStatus() public{
        lendingPool.initPool(
            DAI,
            address(poolConfigurator),
            PRICE_FEED_ADDRESS,
            PRICE_FEED_IN_USD_ADDRESS
        );
        IERC20(DAI).approve(address(lendingPool), DEPOSITED_DAI_AMOUNT);
        vm.expectRevert();
        lendingPool.repay(DAI, 10*1e18);
    }

    function testRepayFailWithZeroInputValue() public{
        initPoolAndSetStatus(DAI, PRICE_FEED_ADDRESS, PRICE_FEED_IN_USD_ADDRESS);
        IERC20(DAI).approve(address(lendingPool), DEPOSITED_DAI_AMOUNT);
        vm.expectRevert();
        lendingPool.repay(DAI, 0);
    }

    function testFullyRepayBorrow() public{
        initPoolAndSetStatus(DAI, PRICE_FEED_ADDRESS, PRICE_FEED_IN_USD_ADDRESS);
        IERC20(DAI).transfer(address(2), DEPOSITED_DAI_AMOUNT);
        // user is address(2) instead of address(this)
        vm.startPrank(address(2));
        IERC20(DAI).approve(address(lendingPool), DEPOSITED_DAI_AMOUNT);
        uint256 borrowAmount = 70*1e18;
        lendingPool.supply(DAI, 100*1e18);
        lendingPool.setCollateral(DAI);
        //borrow 70% of my deposited amount
        lendingPool.borrow(DAI, borrowAmount);
        //changing the timestamp of the block(instantly jump a period of time)
        vm.warp(block.timestamp + 10 minutes);
        //console.log('balance',lendingPool.compoundedLiquidityOfUser(address(2), DAI) );
        uint assetAmountToBePaidBeforeRepay = getRepayAmount(address(2), DAI);
        
        vm.expectEmit(true, true, false, true);
        emit Repay(address(2), DAI, assetAmountToBePaidBeforeRepay);
        IERC20(DAI).approve(address(lendingPool), assetAmountToBePaidBeforeRepay);
        //repay all my debt with cumulative interest
        lendingPool.repay(DAI, assetAmountToBePaidBeforeRepay);
        
        uint assetAmountToBePaidAfterRepay = getRepayAmount(address(2), DAI);
        assertTrue(borrowAmount < assetAmountToBePaidBeforeRepay);
        assertTrue(assetAmountToBePaidAfterRepay == 0);
    }

    function testPartiallyRepayBorroow() public{
        initPoolAndSetStatus(DAI, PRICE_FEED_ADDRESS, PRICE_FEED_IN_USD_ADDRESS);
        IERC20(DAI).transfer(address(2), DEPOSITED_DAI_AMOUNT);
        // user is address(2) instead of address(this)
        vm.startPrank(address(2));
        uint256 borrowAmount = 70*1e18;
        IERC20(DAI).approve(address(lendingPool), DEPOSITED_DAI_AMOUNT);
        lendingPool.supply(DAI, 100*1e18);
        //borrow 70% of my deposited amount
        lendingPool.setCollateral(DAI);
        lendingPool.borrow(DAI, borrowAmount);
        //changing the timestamp of the block(instantly jump a period of time)
        vm.warp(block.timestamp + 10 minutes);
        uint assetAmountToBePaidBeforeRepay = getRepayAmount(address(2), DAI) - 10*1e18;
        
        vm.expectEmit(true, true, false, true);
        emit Repay(address(2), DAI, assetAmountToBePaidBeforeRepay);
        IERC20(DAI).approve(address(lendingPool), assetAmountToBePaidBeforeRepay);
        //repay all my debt with cumulative interest
        lendingPool.repay(DAI, assetAmountToBePaidBeforeRepay);
        //
        uint assetAmountToBePaidAfterRepay = getRepayAmount(address(2), DAI);
        assertTrue(borrowAmount > assetAmountToBePaidBeforeRepay);
        assertTrue(assetAmountToBePaidAfterRepay > 0); 
    }

    function testWithdrawFailWithNotActivateStatus() public{
        lendingPool.initPool(
            DAI,
            address(poolConfigurator),
            PRICE_FEED_ADDRESS,
            PRICE_FEED_IN_USD_ADDRESS
        );
        IERC20(DAI).approve(address(lendingPool), DEPOSITED_DAI_AMOUNT);
        vm.expectRevert();
        lendingPool.withdraw(DAI, 10*1e18);
    }

    function testWithdrawFailWithZeroInputValue() public{
        initPoolAndSetStatus(DAI, PRICE_FEED_ADDRESS, PRICE_FEED_IN_USD_ADDRESS);
        IERC20(DAI).approve(address(lendingPool), DEPOSITED_DAI_AMOUNT);
        vm.expectRevert();
        lendingPool.withdraw(DAI, 0);
    }

    function testWithdraw() public{
        initPoolAndSetStatus(DAI, PRICE_FEED_ADDRESS, PRICE_FEED_IN_USD_ADDRESS);
        initPoolAndSetStatus(AAVE, PRICE_FEED_ADDRESS_2, PRICE_FEED_IN_USD_ADDRESS_2);
        IERC20(AAVE).approve(address(lendingPool), DEPOSITED_AAVE_AMOUNT);
        lendingPool.supply(AAVE, DEPOSITED_AAVE_AMOUNT);
        IERC20(DAI).approve(address(lendingPool), DEPOSITED_DAI_AMOUNT);
        lendingPool.supply(DAI, 100*1e18);
        //vm.warp(block.timestamp + 10 minutes);
        
        IERC20(AAVE).transfer(address(2), 10*1e18);
        IERC20(DAI).transfer(address(2), 10*1e18);
       
        IERC20(DAI).transfer(address(3), DEPOSITED_DAI_AMOUNT);
        // transfer 1 AAVE to allow address(3) repay loan with interrest
        IERC20(AAVE).transfer(address(3), 1*1e18);
        //IERC20(DAI).transfer(address(2), 200*1e18);
        // 3 AAVE
        uint borrowAmount = 3*1e18;
        // address(2) deposited 10 AAVE and then borrow 70 DAI
        vm.startPrank(address(2));
        IERC20(AAVE).approve(address(lendingPool), 10*1e18);
        lendingPool.supply(AAVE, 10*1e18);
        lendingPool.setCollateral(AAVE);
        lendingPool.borrow(DAI, 70*1e18);

        vm.warp(block.timestamp + 10 minutes);
        vm.stopPrank();
        //After 10 minutes address(3) deposit 1000 DAI and then borrow 3 AAVE.
        vm.startPrank(address(3));
        IERC20(DAI).approve(address(lendingPool), DEPOSITED_DAI_AMOUNT);
        lendingPool.supply(DAI, DEPOSITED_DAI_AMOUNT);
        lendingPool.setCollateral(DAI);
        lendingPool.borrow(AAVE, borrowAmount);

        vm.warp(block.timestamp + 10 minutes);
        // repay the borrow 3 AAVE + cumulative interrest after 10 minutes
        uint assetAmountToBePaidBeforeRepay = getRepayAmount(address(3), AAVE);
        
        IERC20(AAVE).approve(address(lendingPool), type(uint).max);
        //repay all my debt with cumulative interest
        lendingPool.repay(AAVE, type(uint).max);
        
        uint assetAmountToBePaidAfterRepay = getRepayAmount(address(3), AAVE);
        uint balanceBeforeWithDraw = IERC20(DAI).balanceOf(address(3));
        lendingPool.withdraw(DAI,  type(uint).max);
         
        assertTrue(borrowAmount < assetAmountToBePaidBeforeRepay);
        assertTrue(assetAmountToBePaidAfterRepay == 0);
        assertTrue(balanceBeforeWithDraw == 0);
        assertTrue(balanceBeforeWithDraw == 0);
    }

    function testLiquidationFailWithHealthyAccount() public{
        initPoolAndSetStatus(DAI, PRICE_FEED_ADDRESS, PRICE_FEED_IN_USD_ADDRESS);
        IERC20(DAI).transfer(address(2), DEPOSITED_DAI_AMOUNT);
        // user is address(2) instead of address(this)
        vm.startPrank(address(2));
        IERC20(DAI).approve(address(lendingPool), DEPOSITED_DAI_AMOUNT);
        uint256 borrowAmount = 74*1e18;
        lendingPool.supply(DAI, 100*1e18);
        lendingPool.setCollateral(DAI);
        //borrow 70% of my deposited amount
        lendingPool.borrow(DAI, borrowAmount);
        vm.stopPrank();
        //changing the timestamp of the block(instantly jump a period of time)
        vm.warp(block.timestamp + 10 minutes);
        
        uint purchaseAmount = lendingPool.getPurchaseAmount(address(2), DAI);
        IERC20(DAI).approve(address(lendingPool), 50*1e18);
        vm.expectRevert();
        lendingPool.liquidation(address(2), DAI, DAI, purchaseAmount);
        
    }

    function testLiquidationFailWithDisableCollateral() public{
        initPoolAndSetStatus(DAI, PRICE_FEED_ADDRESS, PRICE_FEED_IN_USD_ADDRESS);
        IERC20(DAI).transfer(address(2), DEPOSITED_DAI_AMOUNT);
        // user is address(2) instead of address(this)
        vm.startPrank(address(2));
        IERC20(DAI).approve(address(lendingPool), DEPOSITED_DAI_AMOUNT);
        lendingPool.supply(DAI, 100*1e18);
        //borrow 70% of my deposited amount
        //lendingPool.borrow(DAI, borrowAmount);
        vm.stopPrank();
        //changing the timestamp of the block(instantly jump a period of time)
        vm.warp(block.timestamp + 10 minutes);
        
        uint purchaseAmount = lendingPool.getPurchaseAmount(address(2), DAI);
        IERC20(DAI).approve(address(lendingPool), 50*1e18);
        vm.expectRevert();
        lendingPool.liquidation(address(2), DAI, DAI, purchaseAmount);
        
    }

    function testLiquidationFailWithZeroBorowAmount() public{
        initPoolAndSetStatus(DAI, PRICE_FEED_ADDRESS, PRICE_FEED_IN_USD_ADDRESS);
        IERC20(DAI).transfer(address(2), DEPOSITED_DAI_AMOUNT);
        // user is address(2) instead of address(this)
        vm.startPrank(address(2));
        IERC20(DAI).approve(address(lendingPool), DEPOSITED_DAI_AMOUNT);
        lendingPool.supply(DAI, 100*1e18);
        lendingPool.setCollateral(DAI);
        vm.stopPrank();
        //changing the timestamp of the block(instantly jump a period of time)
        vm.warp(block.timestamp + 10 minutes);
        
        uint purchaseAmount = lendingPool.getPurchaseAmount(address(2), DAI);
        IERC20(DAI).approve(address(lendingPool), 50*1e18);
        vm.expectRevert();
        lendingPool.liquidation(address(2), DAI, DAI, purchaseAmount);
        
    }

    function testLiquidation() public{
        initPoolAndSetStatus(DAI, PRICE_FEED_ADDRESS, PRICE_FEED_IN_USD_ADDRESS);
        IERC20(DAI).transfer(address(2), DEPOSITED_DAI_AMOUNT);
        // user is address(2) instead of address(this)
        vm.startPrank(address(2));
        IERC20(DAI).approve(address(lendingPool), DEPOSITED_DAI_AMOUNT);
        uint256 borrowAmount = 75*1e18;
        lendingPool.supply(DAI, 100*1e18);
        lendingPool.setCollateral(DAI);
        //borrow 70% of my deposited amount
        lendingPool.borrow(DAI, borrowAmount);
        vm.stopPrank();
        //changing the timestamp of the block(instantly jump a period of time)
        vm.warp(block.timestamp + 10 minutes);
        uint balanceBeforeLiquidation = IERC20(DAI).balanceOf(address(this));
        uint purchaseAmount = lendingPool.getPurchaseAmount(address(2), DAI);
        IERC20(DAI).approve(address(lendingPool), 50*1e18);
        vm.expectEmit(true, true, false, true);
        emit Liquidation(address(2), address(this), DAI, DAI, purchaseAmount);
        lendingPool.liquidation(address(2), DAI, DAI, purchaseAmount);
        lendingPool.withdraw(DAI,  type(uint).max);
        uint balanceAfterLiquidation = IERC20(DAI).balanceOf(address(this));
       
        assertTrue( balanceAfterLiquidation > balanceBeforeLiquidation);
    }




}