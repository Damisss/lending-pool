import { utils } from 'ethers'
import { actionCreator } from '../utils/helper'
import {GET_POOLS_TYPE} from '../utils/types'

export const getPoolsStart = actionCreator(GET_POOLS_TYPE.GET_POOLS_DATA_LOAD_START, '')
export const getPoolsSuccess = (data:utils.Result | [])=>actionCreator(GET_POOLS_TYPE.GET_POOLS_DATA_LOAD_SUCCESS, data)
export const getPoolsFail = actionCreator(GET_POOLS_TYPE.GET_POOLS_DATA_LOAD_FAIL, '')