import {GET_POOLS_TYPE} from '../../utils/types'
import {IActionWithPayload} from '../../utils/helper'
import { utils } from 'ethers'

type Type =GET_POOLS_TYPE.GET_POOLS_DATA_LOAD_START | GET_POOLS_TYPE.GET_POOLS_DATA_LOAD_SUCCESS | GET_POOLS_TYPE.GET_POOLS_DATA_LOAD_FAIL
type AccountType = IActionWithPayload<Type, utils.Result>

const initialState = {
    poolsData: [],
    loading: false,
    isLoaded: false,
    isError: false
}

export const getPoolsDataReducer = (state=initialState, action:AccountType)=>{

    switch (action.type) {
        case GET_POOLS_TYPE.GET_POOLS_DATA_LOAD_START:
            
            return{
                ...state,
                loading:true,
                isLoaded: false,
                isError: false
            }
        case GET_POOLS_TYPE.GET_POOLS_DATA_LOAD_SUCCESS:
        
            return{
                ...state,
                poolsData: action.payload,
                isLoaded: true,
                loading: false,
                isError: false
            }

        case GET_POOLS_TYPE.GET_POOLS_DATA_LOAD_FAIL:
        
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