import {GET_BALANCES_TYPE} from '../../utils/types'
import {IActionWithPayload} from '../../utils/helper'
import { Balances } from '../../../utils/types'

type Type =GET_BALANCES_TYPE.GET_BALANCES_START | GET_BALANCES_TYPE.GET_BALANCES_SUCCESS | GET_BALANCES_TYPE.GET_BALANCES_FAIL

type RepayType = IActionWithPayload<Type, Balances>

const initialState = {
    balances:[],
    isError:false,
    isLoaded:false
}
const updateBalance = (state:Balances[]=[], payload:Balances)=>{
    
    const index = state.findIndex(item=>item.tokenAddress === payload.tokenAddress)
    if(index >=0) {
        state[index] = payload 
    }else{
        state.push(payload)
    }
    return state
}
export const balancesReducer = (state=initialState, action:RepayType)=>{

    switch (action.type) {
        case GET_BALANCES_TYPE.GET_BALANCES_START:
            
            return{
                ...state,
                //balances:[],
                isError:false,
                isLoaded:false
            }
        case GET_BALANCES_TYPE.GET_BALANCES_SUCCESS:
        
            return{
                ...state,
                balances:updateBalance(state.balances, action.payload),
                isError:false,
                isLoaded:true
            }

        case GET_BALANCES_TYPE.GET_BALANCES_FAIL:
        
            return{
                ...state,
                balances:[],
                isError: true,
                isLoaded:false
            }

        default:
            return state
    }
}