import {combineReducers} from 'redux'
import {accountReducer} from '../reducers/account-reducer'
import { alertReducer } from './alert-reducer'
import { balancesReducer } from './balance-reducer'
import { borrowReducer } from './borrow-reducer'
import { contractReducer } from './contract-reducer'
import { networkReducer } from './network-reducer'
import { repayReducer } from './repay-reducer'
import { setCollateralReducer } from './set-collateral-reducer'
import { getPoolsDataReducer } from './get-pools-reducer'
import { supplyReducer } from './supply-reducer'
import { withdrawReducer } from './withdraw-reducer'

export const rootReducer = combineReducers({
    account: accountReducer,
    network: networkReducer,
    contract: contractReducer,
    alert: alertReducer,
    supply: supplyReducer,
    borrow: borrowReducer,
    repay: repayReducer,
    withdraw: withdrawReducer,
    setCollateral: setCollateralReducer,
    poolsData: getPoolsDataReducer,
    balances:balancesReducer
})