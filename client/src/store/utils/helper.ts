export interface IActionWithPayload<T, P>{
    type: T
    payload: P
}

export interface IActionWithoutPayload<T>{
    type: T
}



export function actionCreator<T extends string, P=void>(type: T, payload: P):IActionWithoutPayload<T>

export function actionCreator<T extends string, P>(type: T, payload: P):IActionWithPayload<T, P>

export function actionCreator<T extends string, P>(type: T, payload: P){

    return{
        type,
        payload
    }
}