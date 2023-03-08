import {ACCOUNT_TYPE} from '../../utils/types'
import {actionCreator} from '../../utils/helper'

export const loadAccountStart = actionCreator(ACCOUNT_TYPE.LOAD_ACCOUNT_START, '')
export const loadAccountSuccess = (payload:string)=>actionCreator(ACCOUNT_TYPE.LOAD_ACCOUNT_SUCCESS, payload)
export const loadAccountFail = actionCreator(ACCOUNT_TYPE.LOAD_ACCOUNT_FAIL, '')