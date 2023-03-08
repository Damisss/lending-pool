import { actionCreator } from '../../utils/helper'
import {ALERT_TYPE} from '../../utils/types'

export const alertProcessing = ( message:string)=>actionCreator(ALERT_TYPE.ALERT_PROCESSING, message)
export const alertSuccess = ( message:string)=>actionCreator(ALERT_TYPE.ALERT_SUCCESS, message)
export const alertFail = ( message:string)=>actionCreator(ALERT_TYPE.ALERT_FAIL, message)
export const alertInit = actionCreator(ALERT_TYPE.ALERT_INIT, '')