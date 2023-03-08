import {REPAY_TYPE} from '../../utils/types'
import {IActionWithoutPayload} from '../../utils/helper'

type Type =REPAY_TYPE.REPAY_START | REPAY_TYPE.REPAY_SUCCESS | REPAY_TYPE.REPAY_FAIL
type RepayType = IActionWithoutPayload<Type>

const initialState = {
    submitting: false,
    submitted: false,
    isError: false
}

export const repayReducer = (state=initialState, action:RepayType)=>{

    switch (action.type) {
        case REPAY_TYPE.REPAY_START:
            
            return{
                ...state,
                submitting:true,
                submitted: false,
                isError: false
            }
        case REPAY_TYPE.REPAY_SUCCESS:
        
            return{
                ...state,
                submitting:false,
                submitted: true,
                isError: false
            }

        case REPAY_TYPE.REPAY_FAIL:
        
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