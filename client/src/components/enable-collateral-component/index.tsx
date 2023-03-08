import { FunctionComponent } from 'react'
import { CustomButton } from '../custom-button'


type EnableCollateral = {
    onClick:()=>void
    tokenSymbol:string
    tokenAddress:string
    isCollateralEnabled:boolean
}

export const EnableCollateral:FunctionComponent<EnableCollateral> = ({
    onClick,
    tokenSymbol,
    isCollateralEnabled
})=>{
    return(
        <div className="h-full px-2 pt-4 pb-6 w-full">
            <div className="text-center px-2 mb-4">
                <p>
                    Every asset used as collateral increases your borrowing limit.However, this can lead the asset to being seized in liquidation.
                </p>
            </div>
            <CustomButton
                className="bg-[#0f172a] py-1 px-4 rounded-md mt-1 w-1/2 h-full text-white mx-auto"
                name={!isCollateralEnabled?`Use ${tokenSymbol} as collateral`: 'Disable Collateral'}
                onClick={onClick}
                type='button'
            />
        </div>
    )
}