import { FunctionComponent } from 'react'

type CustomSwitch = {
    isCollateralEnabled: boolean
    onModalShow:(isCollateral:boolean, isSupply:boolean)=>void
    balance:number
    supplyBalance: number
}

export const CustomSwitch:FunctionComponent<CustomSwitch> = ({
    isCollateralEnabled,
    balance,
    supplyBalance,
    onModalShow
})=>{
    const isSwitchEnable = balance > 0 || supplyBalance > 0
    return(
        <div 
            className="inline-flex relative justify-start items-center cursor-pointer" 
            onClick={isSwitchEnable ? ()=>onModalShow(true, false): undefined}
        >
            <input
                type="checkbox"
                className="sr-only peer"
                checked={isCollateralEnabled && isSwitchEnable}
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