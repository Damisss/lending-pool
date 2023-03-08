import { FunctionComponent } from 'react'

type ProcessingComponent = {
    alertType: boolean
    showProcessing: boolean
    processingMessage: string
}

export const ProcessingComponent:FunctionComponent<ProcessingComponent> = ({
    showProcessing,
    alertType,
    processingMessage
})=>{

    return(
        <div className={`
            fixed top-0 left-0 w-screen h-screen 
            flex items-center justify-center bg-black 
            bg-opacity-50 transform transition-transform duration-300
            ${showProcessing && alertType ? 'scale-100' : 'scale-0'}`
            }>
            <div className=" bg-blue-400 flex flex-col justify-center items-center shadow-xl ronded-xl min-w-min px-10 pb-2">
                <div className="flex flex-col justify-center items-center">
                    <div className=' lds-dual-ring scale-50'></div>
                </div>
                <span className="text-white text-xl">{processingMessage}...</span>
            </div>
        </div>
    )
}