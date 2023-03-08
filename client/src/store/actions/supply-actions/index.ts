import { actionCreator } from '../../utils/helper'
import {SUPPLY_TYPE} from '../../utils/types'

export const supplyStart = actionCreator(SUPPLY_TYPE.SUPPLY_START, '')
export const supplySuccess = actionCreator(SUPPLY_TYPE.SUPPLY_SUCCESS, '')
export const supplyFail = actionCreator(SUPPLY_TYPE.SUPPLY_FAIL, '')