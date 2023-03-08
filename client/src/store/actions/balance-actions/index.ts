import { Balances } from '../../../utils/types'
import { actionCreator } from '../../utils/helper'
import {GET_BALANCES_TYPE} from '../../utils/types'

export const getBalancesStart = actionCreator(GET_BALANCES_TYPE.GET_BALANCES_START, '')
export const getBalancesSuccess = (
    payload:Balances
)=>actionCreator(GET_BALANCES_TYPE.GET_BALANCES_SUCCESS, payload)
export const getBalancesFail = actionCreator(GET_BALANCES_TYPE.GET_BALANCES_FAIL, '')