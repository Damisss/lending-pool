import { actionCreator } from '../../utils/helper'
import {SET_COLLATERAL_TYPE} from '../../utils/types'

export const setCollateralStart = actionCreator(SET_COLLATERAL_TYPE.SET_COLLATERAL_START, '')
export const setCollateralSuccess = actionCreator(SET_COLLATERAL_TYPE.SET_COLLATERAL_SUCCESS, '')
export const setCollateralLFail = actionCreator(SET_COLLATERAL_TYPE.SET_COLLATERAL_FAIL, '')