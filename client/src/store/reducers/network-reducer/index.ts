import {NETWORK_TYPE} from '../../utils/types'
import {IActionWithPayload} from '../../utils/helper'

type Type =NETWORK_TYPE.LOAD_NETWORKID_START | NETWORK_TYPE.LOAD_NETWORKID_SUCCESS | NETWORK_TYPE.LOAD_NETWORKID_FAIL
type AccountType = IActionWithPayload<Type, number>

const initialState = {
    chainId: null,
    loading: false,
    isLoaded: false,
    isError: false
}

export const networkReducer = (state=initialState, action:AccountType)=>{

    switch (action.type) {
        case NETWORK_TYPE.LOAD_NETWORKID_START:
            
            return{
                ...state,
                loading:true,
                isLoaded: false,
                isError: false
            }
        case NETWORK_TYPE.LOAD_NETWORKID_SUCCESS:
        
            return{
                ...state,
                chainId: action.payload,
                isLoaded: true,
                loading: false,
                isError: false
            }

        case NETWORK_TYPE.LOAD_NETWORKID_FAIL:
        
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