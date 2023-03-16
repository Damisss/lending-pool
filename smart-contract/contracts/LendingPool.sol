// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import {OwnableUpgradeable} from '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import {ReentrancyGuardUpgradeable} from '@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol';
import {SafeMath} from '@openzeppelin/contracts/utils/math/SafeMath.sol';
import {Math} from '@openzeppelin/contracts/utils/math/Math.sol';

import {WadMath} from './libraries/WadMath.sol';
import {ISTokenFactory} from './interfaces/ISTokenFactory.sol';
import {IERC20} from './interfaces/IERC20.sol';
import {AmountShareConvertor, IPoolConfigurator, ISToken} from './libraries/AmountShareConvertor.sol';
import {LendingPoolHelper} from './libraries/LendingPoolHelper.sol';
import {Oracle} from './libraries/Oracle.sol';
import {CompoundInterestCalculator} from './libraries/CompoundInterestCalculator.sol';
import {Storage} from './Storage.sol';

error NotExistedStatus(uint);
error AssetTransferFail();
error OnlyReservesInPoolError();
error ZeroBalanceError();
error WrongTokenError();
error TokenNotAllowedError();
error WrongPoolConfigError();
error WrongOraclePriceFeedError();
error PoolNotActivatedError();
error ZeroAmountError();
error NotEnoughLiquidityError();
error CollateralNotEnableError();
error HasBorrowBalanceError();
error NotUsedAsCollateral();

contract LendingPool is OwnableUpgradeable, ReentrancyGuardUpgradeable, Storage {
    using SafeMath for uint256;
    using WadMath for uint256;
    using Math for uint256;
    using Oracle for address;

    function initialize(address sTokenFacoryAddress_) external initializer{
        __Ownable_init();
        __ReentrancyGuard_init();
        _sTokenFacoryAddress = sTokenFacoryAddress_;

    }

    modifier canWithdrawOrRepay (address token_){
         if(
            _pools[token_].poolStatus != Stat.ACTIVATED && _pools[token_].poolStatus != Stat.CLOSED
        ) revert PoolNotActivatedError();
        _;
    }

    modifier wrongToken(address token_) {
      if(token_ == address(0)) revert WrongTokenError();
      _; 
    }
    modifier poolUpdate(address token_) {
        Storage.Pool storage pool  = _pools[token_];
        uint256 cumulativeInterest = getCumulativeInterest(token_);
        uint256 previousTotalBorrow = pool.poolBorrowAmount;
        pool.poolBorrowAmount = cumulativeInterest.wadMul(previousTotalBorrow);
        pool.reserves += pool.poolBorrowAmount.sub(previousTotalBorrow).wadMul(_reservePercent);
        pool.lastUpdateTimestamp = block.timestamp;
        _;
    }

    function getCumulativeInterest (address token_) wrongToken(token_) private view returns(uint256) {
        if(!_isTokenAllowed[token_]) revert TokenNotAllowedError();
        uint256 borrowInterestRate = _pools[token_].poolConfig.calculateBorrowInterestRate(
            _pools[token_].poolBorrowAmount,
            calculateTotalLiquidity(token_)
        );

        uint256 cumulativeInterest = calculateInterest(
            borrowInterestRate,
            _pools[token_].lastUpdateTimestamp,
            block.timestamp
        );
        return cumulativeInterest;
    }
    
    function calculateInterest (
        uint256 interestRate_,
        uint256 fromDate_,
        uint256 toDate_
    ) private pure returns(uint256){
        return interestRate_.wadMul(
            toDate_.sub(fromDate_)
        ).wadDiv(_secondInYear).add(WadMath.getWad());
    }
   
    
    function compoundedLiquidityOfUser(
        address account_,
        address token_
    ) public view  returns(uint256){
        uint256 balance = IERC20(token_).balanceOf(address(this));
        if(balance < _pools[token_].reserves) revert OnlyReservesInPoolError();
        
        return CompoundInterestCalculator.compoundedLiquidityOfUser(
            _pools[token_],
            account_,
            getCumulativeInterest(token_),
            balance
        );
    
    }

    function compoundedBorrowOfUser(
        address account_,
        address token_
    ) public view returns(uint256) {
        return CompoundInterestCalculator.compoundedBorrowOfUser(
            _pools[token_],
            _userData[account_][token_].borrowShare,
            getCumulativeInterest(token_)
        );
    }

    function calculateTotalLiquidity (address token_) internal view returns(uint256){
        uint256 balance = IERC20(token_).balanceOf(address(this));
        if(balance < _pools[token_].reserves) revert OnlyReservesInPoolError();
        return _pools[token_].poolBorrowAmount.add(
            balance.sub(_pools[token_].reserves)
        );
    }

    function getCollateral(address account_) private view returns(uint256){
        uint256 totalPrice;
        for(uint256 i = 0; i < _allowedTokens.length; i++){
            address token = _allowedTokens[i];
            if(_userData[account_][token].isCollateralActivated){
                uint256 assetAmount = compoundedLiquidityOfUser(account_, token);
                uint256 price = _pools[token].priceFeedAddress.getEthAmount(assetAmount);
                uint256 adjustedCollateralFactor = price.wadMul(
                    _pools[token].poolConfig.liquidationThreshold()
                );
                totalPrice += adjustedCollateralFactor;
            }
        }
        
        return totalPrice;
    }

    function getBorrowAmount(address user_) private view returns(uint256){
        uint256 totalPrice;
        for(uint256 i = 0; i < _allowedTokens.length; i++){
            address token = _allowedTokens[i];
            uint256 assetAmount = compoundedBorrowOfUser(user_, token);
            uint256 price = _pools[token].priceFeedAddress.getEthAmount(assetAmount);
            totalPrice += price;
        }
        
        return totalPrice;
    }

    function getAccountInfo(
        address account_
        ) public view returns(uint collateral, uint totalBorrow){
            return (getCollateral(account_), getBorrowAmount(account_));
    }

    function healthFactor(address account_) public view returns(uint256){
        (uint256 collateral, uint256 borrowAmount) = getAccountInfo(account_);
        if(borrowAmount == 0) return 100*1e18;
        return collateral.wadDiv(borrowAmount); 
    }
 
    function initPool(
        address token_,
        address poolConfig_,
        address priceFeedAddress_,
        address priceInUSDFeedAddress_
    ) external onlyOwner wrongToken(token_){
        if(poolConfig_ == address(0)) revert WrongPoolConfigError();
        if(priceFeedAddress_ == address(0) || priceInUSDFeedAddress_== address(0)) revert WrongOraclePriceFeedError();

        bool isTokenExisted;
        for(uint256 i = 0; i < _allowedTokens.length; i++){
            if(_allowedTokens[i] == token_){
                isTokenExisted = true;
                break;
            }
        }

        if(!isTokenExisted){
            ISToken stoken = ISTokenFactory(_sTokenFacoryAddress).deploySToken(
                string(abi.encodePacked('s', IERC20(token_).name())), 
                string(abi.encodePacked('s', IERC20(token_).symbol()))
            );
            
            _pools[token_] = Pool ({
                poolStatus: Stat.INACTIVE,
                poolConfig: IPoolConfigurator(poolConfig_),
                poolBorrowAmount: 0, 
                poolBorrowShareAmount: 0,
                reserves: 0,
                lastUpdateTimestamp: block.timestamp,
                sTokenContract: stoken,
                sTokens: 0,
                priceFeedAddress: priceFeedAddress_,
                priceInUSDFeedAddress: priceInUSDFeedAddress_
            });

            _allowedTokens.push(token_);
            _isTokenAllowed[token_] = true;

            emit Storage.InitPool(token_, poolConfig_);
        }
    
    }

    function supply(address token_, uint256 amount_) external poolUpdate(token_) nonReentrant{
        if(_pools[token_].poolStatus != Stat.ACTIVATED) revert PoolNotActivatedError();
        if(amount_ <= 0) revert ZeroAmountError();
        
        uint256 totalShare = AmountShareConvertor.depositAmountToShareAmount(
            _pools[token_], 
            calculateTotalLiquidity(token_), 
            amount_
        );
        _pools[token_].sTokenContract.mint(msg.sender, totalShare);
        bool result = IERC20(token_).transferFrom(msg.sender, address(this), amount_);
        if(!result) revert AssetTransferFail();

        emit Storage.Deposit(msg.sender, token_, amount_);

    }

    function borrow(address token_, uint256 amount_) external poolUpdate(token_) nonReentrant{
        Storage.Pool storage pool = _pools[token_];
        if( pool.poolStatus != Stat.ACTIVATED) revert PoolNotActivatedError();
        if(amount_ <= 0) revert ZeroAmountError();
        if(amount_ >  IERC20(token_).balanceOf(address(this))) revert NotEnoughLiquidityError();
        
        uint256 borrowShare = AmountShareConvertor.borrowAmountToShareAmount( pool, amount_);
         pool.poolBorrowShareAmount += borrowShare;
         pool.poolBorrowAmount += amount_;
        _userData[msg.sender][token_].borrowShare += borrowShare;
        bool result =  IERC20(token_).transfer(msg.sender, amount_);
        
        if(!result) revert AssetTransferFail();
        require(healthFactor(msg.sender) >= 1e18, 'Account is not healthy');
        emit Storage.Borrow(msg.sender, token_, amount_);
    }

    function repay(
        address token_,
        uint256 amount_
    ) external poolUpdate(token_) nonReentrant canWithdrawOrRepay(token_){
        Storage.Pool storage pool = _pools[token_];
       
        if(amount_ <= 0) revert ZeroAmountError();

        uint256 userBorrowShare = _userData[msg.sender][token_].borrowShare;
        if(userBorrowShare <= 0) revert ZeroBalanceError();
        uint256 inputtedShare;
        if(amount_ == type(uint).max){
            inputtedShare = type(uint).max;
        }else{
            inputtedShare = AmountShareConvertor.repayAmountToShareAmount(pool, amount_);
        }
        
        uint256 repayShare = inputtedShare > userBorrowShare ? userBorrowShare : inputtedShare;
        uint256 repayAmount = AmountShareConvertor.shareAmountToBorrowAmount(pool, repayShare);
        
        pool.poolBorrowAmount -= repayAmount;
        pool.poolBorrowShareAmount -= repayShare;
        _userData[msg.sender][token_].borrowShare -= repayShare;
        
        bool result = IERC20(token_).transferFrom(msg.sender, address(this), repayAmount);
        if(!result) revert AssetTransferFail();
    
        emit Storage.Repay(msg.sender, token_, amount_);
    }

    function withdraw(
        address token_, 
        uint256 amount_
    ) external poolUpdate(token_) nonReentrant canWithdrawOrRepay(token_){
        Storage.Pool storage pool = _pools[token_];
        if(amount_ <= 0) revert ZeroAmountError();

        uint256 userShare = pool.sTokenContract.balanceOf(msg.sender);
        
        if(userShare <= 0) revert ZeroBalanceError();

        uint256 inputtedShare;
        if(amount_ == type(uint).max){
            inputtedShare = type(uint).max;
        }else{
            inputtedShare = AmountShareConvertor.depositAmountToShareAmount(
                pool, 
                calculateTotalLiquidity(token_), 
                amount_
            );
        }
        
        uint256 withdrawShare = inputtedShare  > userShare ? userShare : inputtedShare;
        uint256 withdrawAmount = AmountShareConvertor.shareAmountToDepositedAmount(
            pool, 
            calculateTotalLiquidity(token_), 
            withdrawShare
        );
        pool.sTokenContract.burn(msg.sender, withdrawShare);
        bool result =  IERC20(token_).transfer(msg.sender, withdrawAmount);
        
        if(!result) revert AssetTransferFail();

        require(healthFactor(msg.sender) >= 1e18, 'Account is not healthy');
        emit Storage.Withdraw(msg.sender, token_, withdrawAmount);

    }
    
    function liquidation(
        address user_,
        address liquidatedToken_,
        address collateralToken_,
        uint256 purchaseAmount_
    ) external poolUpdate(liquidatedToken_) poolUpdate(collateralToken_) nonReentrant{
        require(healthFactor(user_) < 1e18);
        //CompilerError: Stack too deep
        //assign params to variable trick help here (Not the cleanest way to do, we will keep like that for this moment). This approach may slightly increase gas amount. 
        //Also splitting liquidation function into many functions may fix the error. But this increases the contract size ( max limit 24KB)
        address user = user_;
        address collateralToken = collateralToken_;
        address liquidatedToken = liquidatedToken_;
        uint256 amount = purchaseAmount_;
        
        uint256 userBorrowShare = _userData[user][liquidatedToken].borrowShare;
        uint256 totalLiquidity = calculateTotalLiquidity(liquidatedToken);
        bool isCollateralActivated =  _userData[user][collateralToken].isCollateralActivated;
        (
            uint256 collateralShare,
            uint256 liquidatedAmount, 
            uint256 purchaseAmount
        ) = LendingPoolHelper.liquidationHelper(
            _pools[liquidatedToken],
            _pools[collateralToken],
            userBorrowShare,
            amount,
            _closeFactor,
            totalLiquidity,
            isCollateralActivated
        );

        require(transferLiquidatedAmount(
            user,
            liquidatedToken,
            collateralToken,
            collateralShare,
            liquidatedAmount,
            purchaseAmount
        ));
         
    }

    function transferLiquidatedAmount (
        address user_,
        address liquidatedToken_,
        address collateralToken_,
        uint256 collateralShare_,
        uint256 liquidatedAmount_,
        uint256 purchaseAmount_
        ) private  returns(bool){
        
        Storage.Pool storage liquidatedTokenPool = _pools[liquidatedToken_];
        Storage.Pool storage collateralTokenPool = _pools[collateralToken_];
        
        require(IERC20(liquidatedToken_).transferFrom(msg.sender, address(this), liquidatedAmount_));
        if(collateralTokenPool.sTokenContract.balanceOf(user_) < collateralShare_) revert ZeroBalanceError();

        collateralTokenPool.sTokenContract.burn(user_, collateralShare_);
        collateralTokenPool.sTokenContract.mint(msg.sender, collateralShare_);
    
        liquidatedTokenPool.poolBorrowAmount -= liquidatedAmount_;
        liquidatedTokenPool.poolBorrowShareAmount -= purchaseAmount_;
        _userData[user_][liquidatedToken_].borrowShare -= purchaseAmount_;

        emit Storage.Liquidation(user_, msg.sender, liquidatedToken_, collateralToken_, purchaseAmount_);

        return true;
    }

    function isCollateralEnabled(address token_) external view returns(bool){
        return _userData[msg.sender][token_].isCollateralActivated;
    }

    function getUsdValue (
        address priceFeedAddress_, 
        uint256 amount_
    ) external view returns(uint256){
        return  priceFeedAddress_.getUsdValue(amount_);
    }


    function setPoolStatus(address token_, uint256 status_) external onlyOwner wrongToken(token_){
        Storage.Pool storage pool = _pools[token_];
        
        if(status_ == uint256(Stat.INACTIVE)){
            pool.poolStatus = Stat.INACTIVE;
        }else if(status_ == uint256(Stat.ACTIVATED)){
            pool.poolStatus = Stat.ACTIVATED;
        }else if(status_ == uint256(Stat.CLOSED)){
            pool.poolStatus = Stat.CLOSED;
        }else{
            revert NotExistedStatus(status_);
        }
        
        emit Storage.Status(token_, status_, block.timestamp);
    }
   
    function setCollateral(address token_) external {
        _userData[msg.sender][token_].isCollateralActivated = !_userData[msg.sender][token_].isCollateralActivated;
    }

    function getPurchaseAmount(address user_, address token_) public view returns(uint256){
        return _userData[user_][token_].borrowShare.wadMul(_closeFactor);
    }

    function getPool(address token_) external view returns(
        Stat,
        address,
        address,
        address
        ){
        return LendingPoolHelper.getPool(_pools[token_]);
    }

    function withdrawReserve(address token_) external onlyOwner wrongToken(token_){
        uint256 balance = _pools[token_].reserves;
        _pools[token_].reserves = 0;
        require(IERC20(token_).transfer(msg.sender, balance));
  } 
    
}