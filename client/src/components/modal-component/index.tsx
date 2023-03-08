import React, { MutableRefObject } from 'react'
import { CustomButton } from '../custom-button'


type ModalComponent = {
   children:JSX.Element
   onClose:()=>void
   showModal: boolean
   ref:MutableRefObject<HTMLElement | null>
}

export const Modal= React.forwardRef<unknown, ModalComponent>((props:ModalComponent, ref:any)=>{
    if(!props.showModal) return null
    const {children, onClose} = props
    return(
        <div 
            className="w-full fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm flex justify-center items-center z-20"
        >
            <div className="w-full mx-2 md:w-1/3" ref={ref}>
                <div className="flex flex-col bg-white w-full">
                <CustomButton 
                    className="text-xl place-self-end mr-2 bg-white hover:bg-white"
                    name='X'
                    onClick={onClose}
                    type='button'
                />
                {children}
                </div>
            </div>
        </div>
    )
})