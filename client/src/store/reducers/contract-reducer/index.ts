import {CONTRACT_TYPE} from '../../utils/types'
import {IActionWithPayload} from '../../utils/helper'
import { Contract } from 'ethers'

type Type =CONTRACT_TYPE.LOAD_CONTRACT_START | CONTRACT_TYPE.LOAD_CONTRACT_SUCCESS | CONTRACT_TYPE.LOAD_CONTRACT_FAIL
type AccountType = IActionWithPayload<Type, Contract>

const initialState = {
    lendingPool: null,
    loading: false,
    isLoaded: false,
    isError: false
}

export const contractReducer = (state=initialState, action:AccountType)=>{

    switch (action.type) {
        case CONTRACT_TYPE.LOAD_CONTRACT_START:
            
            return{
                ...state,
                loading:true,
                isLoaded: false,
                isError: false
            }
        case CONTRACT_TYPE.LOAD_CONTRACT_SUCCESS:
        
            return{
                ...state,
                lendingPool: action.payload,
                isLoaded: true,
                loading: false,
                isError: false
            }

        case CONTRACT_TYPE.LOAD_CONTRACT_FAIL:
        
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