import { FunctionComponent, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { alertInit } from '../../store/actions/alert-actions'
import { State } from '../../utils/types'

type AlertComponent = {
    alertType:boolean
    showAlert:boolean
    isSuccess:boolean
    alertMessage:string

}

export const AlertComponent:FunctionComponent<AlertComponent> = ({
    showAlert,
    alertType,
    alertMessage,
    isSuccess
})=>{
    const dispatch = useDispatch()
    const state = useSelector((state:State)=>state)

    useEffect(()=>{
        let setTimeoutId:number
        setTimeoutId = window.setTimeout(()=>{
            dispatch(alertInit)
        }, 3000)

        return ()=>{
            window.clearTimeout(setTimeoutId)
            
        }
        
    }, [state.alert.isError, state.alert.isSuccess])

    return(
        <div className={`
            fixed top-0 left-0 w-screen h-screen 
            flex items-center justify-center bg-black 
            bg-opacity-50 transform transition-transform duration-300
            ${showAlert && alertType? 'scale-100' : 'scale-0'}`
            }>
            <div className=" bg-blue-400 flex flex-col justify-center items-center shadow-xl ronded-xl min-w-min px-10 pb-2">
                <div className="flex flex-col justify-center items-center">
                    {
                        isSuccess && !state.alert.isError?
                        <span className="bg-[url('/img/success.svg')] h-8 w-8 rounded-full bg-contain bg-center mr-2"></span>
                        :state.alert.isError && !isSuccess?
                        <span className="bg-[url('/img/error.svg')] h-8 w-8 rounded-full bg-contain bg-center mr-2"></span>
                        :null
                    }
                </div>
                <span className="text-white text-xl">{alertMessage}...</span>
            </div>
        </div>
    )
}