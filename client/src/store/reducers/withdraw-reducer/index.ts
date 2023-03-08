import {WITHDRAW_TYPE} from '../../utils/types'
import {IActionWithoutPayload} from '../../utils/helper'

type Type =WITHDRAW_TYPE.WITHDRAW_START | WITHDRAW_TYPE.WITHDRAW_SUCCESS | WITHDRAW_TYPE.WITHDRAW_FAIL
type WITHDRAWType = IActionWithoutPayload<Type>

const initialState = {
    submitting: false,
    submitted: false,
    isError: false
}

export const withdrawReducer = (state=initialState, action:WITHDRAWType)=>{

    switch (action.type) {
        case WITHDRAW_TYPE.WITHDRAW_START:
            
            return{
                ...state,
                submitting:true,
                submitted: false,
                isError: false
            }
        case WITHDRAW_TYPE.WITHDRAW_SUCCESS:
        
            return{
                ...state,
                submitting:false,
                submitted: true,
                isError: false
            }

        case WITHDRAW_TYPE.WITHDRAW_FAIL:
        
            return{
                ...state,
                submitting:false,
                submitted: false,
                isError: true
            }

        default:
            return state
    }
}