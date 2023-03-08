import {ALERT_TYPE} from '../../utils/types'
import {IActionWithPayload} from '../../utils/helper'

type Type = ALERT_TYPE.ALERT_PROCESSING | ALERT_TYPE.ALERT_SUCCESS | ALERT_TYPE.ALERT_FAIL | ALERT_TYPE.ALERT_INIT
type AccountType = IActionWithPayload<Type, string>

const initialState = {
    isProcessing:false,
    isAlert:false,
    isShown: false,
    isSuccess:false,
    message: '',
    isError:false
}

export const alertReducer = (state=initialState, action:AccountType)=>{

    switch (action.type) {
        case ALERT_TYPE.ALERT_PROCESSING:
            
            return{
                ...state,
                isProcessing:true,
                isAlert:false,
                isShown: true,
                message: action.payload,
                isSuccess:false,
                isError:false
            }
        case ALERT_TYPE.ALERT_SUCCESS:
        
            return{
                ...state,
                isProcessing:false,
                isAlert:true,
                isShown: true,
                message: action.payload,
                isSuccess: true,
                isError:false
            }

        case ALERT_TYPE.ALERT_FAIL:
        
            return{
                ...state,
                isProcessing:false,
                isAlert:true,
                isShown: true,
                message: action.payload,
                isSuccess: false,
                isError:true
            }
        
        case ALERT_TYPE.ALERT_INIT:
    
            return{
                ...state,
                isProcessing:false,
                isAlert:false,
                isShown: false,
                isSuccess:false,
                message: '',
                isError:false
            }

        default:
            return state
    }
}