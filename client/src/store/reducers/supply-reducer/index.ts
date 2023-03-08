import {SUPPLY_TYPE} from '../../utils/types'
import {IActionWithoutPayload} from '../../utils/helper'

type Type =SUPPLY_TYPE.SUPPLY_START | SUPPLY_TYPE.SUPPLY_SUCCESS | SUPPLY_TYPE.SUPPLY_FAIL
type AccountType = IActionWithoutPayload<Type>

const initialState = {
    submitting: false,
    submitted: false,
    isError: false
}

export const supplyReducer = (state=initialState, action:AccountType)=>{

    switch (action.type) {
        case SUPPLY_TYPE.SUPPLY_START:
            
            return{
                ...state,
                submitting:true,
                submitted: false,
                isError: false
            }
        case SUPPLY_TYPE.SUPPLY_SUCCESS:
        
            return{
                ...state,
                submitting:false,
                submitted: true,
                isError: false
            }

        case SUPPLY_TYPE.SUPPLY_FAIL:
        
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