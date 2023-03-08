import { actionCreator } from '../../utils/helper'
import {WITHDRAW_TYPE} from '../../utils/types'

export const withdrawStart = actionCreator(WITHDRAW_TYPE.WITHDRAW_START, '')
export const withdrawSuccess = actionCreator(WITHDRAW_TYPE.WITHDRAW_SUCCESS, '')
export const withdrawFail = actionCreator(WITHDRAW_TYPE.WITHDRAW_FAIL, '')