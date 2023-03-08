import {BORROW_TYPE} from '../../utils/types'
import {IActionWithoutPayload} from '../../utils/helper'

type Type =BORROW_TYPE.BORROW_START | BORROW_TYPE.BORROW_SUCCESS | BORROW_TYPE.BORROW_FAIL
type BorrowType = IActionWithoutPayload<Type>

const initialState = {
    submitting: false,
    submitted: false,
    isError: false
}

export const borrowReducer = (state=initialState, action:BorrowType)=>{

    switch (action.type) {
        case BORROW_TYPE.BORROW_START:
            
            return{
                ...state,
                submitting:true,
                submitted: false,
                isError: false
            }
        case BORROW_TYPE.BORROW_SUCCESS:
        
            return{
                ...state,
                submitting:false,
                submitted: true,
                isError: false
            }

        case BORROW_TYPE.BORROW_FAIL:
        
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