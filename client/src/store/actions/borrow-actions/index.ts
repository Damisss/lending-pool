import { actionCreator } from '../../utils/helper'
import {BORROW_TYPE} from '../../utils/types'

export const borrowStart = actionCreator(BORROW_TYPE.BORROW_START, '')
export const borrowSuccess = actionCreator(BORROW_TYPE.BORROW_SUCCESS, '')
export const borrowFail = actionCreator(BORROW_TYPE.BORROW_FAIL, '')