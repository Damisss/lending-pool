import {ACCOUNT_TYPE} from '../../utils/types'
import {IActionWithPayload} from '../../utils/helper'

type Type = ACCOUNT_TYPE.LOAD_ACCOUNT_START | ACCOUNT_TYPE.LOAD_ACCOUNT_SUCCESS | ACCOUNT_TYPE.LOAD_ACCOUNT_FAIL
type AccountType = IActionWithPayload<Type, string>

const initialState = {
    account: '',
    loading: false,
    isLoaded: false,
    isError: false
}

export const accountReducer = (state=initialState, action:AccountType)=>{

    switch (action.type) {
        case ACCOUNT_TYPE.LOAD_ACCOUNT_START:
            
            return{
                ...state,
                loading:true,
                isLoaded: false,
                isError: false
            }
        case ACCOUNT_TYPE.LOAD_ACCOUNT_SUCCESS:
        
            return{
                ...state,
                account: action.payload,
                isLoaded: true,
                loading: false,
                isError: false
            }

        case ACCOUNT_TYPE.LOAD_ACCOUNT_FAIL:
        
            return{
                ...state,
                isLoaded: false,
                loading: false,
                isError: true
            }

        default:
            return state
    }
}