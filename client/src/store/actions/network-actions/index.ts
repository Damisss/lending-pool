import {NETWORK_TYPE} from '../../utils/types'
import {actionCreator} from '../../utils/helper'

export const loadNetworkIdStart = actionCreator(NETWORK_TYPE.LOAD_NETWORKID_START, '')
export const loadNetworkIdSuccess = (payload:number)=>actionCreator(NETWORK_TYPE.LOAD_NETWORKID_SUCCESS, payload)
export const loadNetworkIdFail = actionCreator(NETWORK_TYPE.LOAD_NETWORKID_FAIL, '')