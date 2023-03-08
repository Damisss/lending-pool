import { FunctionComponent } from 'react'
import cx from 'classnames'


type CustomButton = {
    className:string
    type: 'submit' | 'button' | 'reset' | undefined
    onClick?:()=>void
    name: string
    disabled?:boolean
}

export const CustomButton:FunctionComponent<CustomButton> = ({
    className,
    type,
    onClick,
    name,
    disabled=false
})=>{
    return(
        <div 
            className={cx(
                className, 
                {"bg-gray-300":disabled, "bg-blue-400":!disabled, "hover:bg-blue-600":!disabled}
                )}
            >
            <button
            className="w-full font-bold"
                type={type}
                onClick={onClick}
                disabled={disabled}
            >
                {name}
            </button>
        </div>
    )
}