import { FunctionComponent } from 'react'


type CustomSwitch = {
    isCollateralEnabled: boolean
    onClick?:(d:boolean)=>void
    onModalShow:(isCollateral:boolean, isSupply:boolean)=>void
}

export const CustomSwitch:FunctionComponent<CustomSwitch> = ({
    isCollateralEnabled,
    onClick,
    onModalShow
})=>{
    return(
        <div 
            className="inline-flex relative justify-start items-center cursor-pointer" 
            onClick={()=>onModalShow(true, false)}
        >
            <input
                type="checkbox"
                className="sr-only peer"
                checked={isCollateralEnabled}
                readOnly
            />
            <div 
                className={`
                w-11 h-3 bg-gray-200 rounded-full peer
                peer-focus:ring-green-300  peer-checked:after:translate-x-full 
                peer-checked:after:border-white after:content-[''] 
                after:absolute after:-top-1 after:left-[2px] 
                after:bg-white after:border-gray-300 after:border 
                after:rounded-full after:h-5 after:w-5 after:transition-all 
                peer-checked:bg-green-600`}
            ></div>
        </div>
    )
}