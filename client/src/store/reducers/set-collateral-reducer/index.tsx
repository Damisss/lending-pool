import {SET_COLLATERAL_TYPE} from '../../utils/types'
import {IActionWithoutPayload} from '../../utils/helper'

type Type =SET_COLLATERAL_TYPE.SET_COLLATERAL_START | SET_COLLATERAL_TYPE.SET_COLLATERAL_SUCCESS | SET_COLLATERAL_TYPE.SET_COLLATERAL_FAIL
type AccountType = IActionWithoutPayload<Type>

const initialState = {
    submitting: false,
    submitted: false,
    isError: false
}

export const setCollateralReducer = (state=initialState, action:AccountType)=>{

    switch (action.type) {
        case SET_COLLATERAL_TYPE.SET_COLLATERAL_START:
            
            return{
                ...state,
                submitting:true,
                submitted: false,
                isError: false
            }
        case SET_COLLATERAL_TYPE.SET_COLLATERAL_SUCCESS:
        
            return{
                ...state,
                submitting:false,
                submitted: true,
                isError: false
            }

        case SET_COLLATERAL_TYPE.SET_COLLATERAL_FAIL:
        
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