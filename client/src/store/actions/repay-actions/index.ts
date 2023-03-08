import { actionCreator } from '../../utils/helper'
import {REPAY_TYPE} from '../../utils/types'

export const repayStart = actionCreator(REPAY_TYPE.REPAY_START, '')
export const repaySuccess = actionCreator(REPAY_TYPE.REPAY_SUCCESS, '')
export const repayFail = actionCreator(REPAY_TYPE.REPAY_FAIL, '')