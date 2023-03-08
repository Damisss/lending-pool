import { FunctionComponent } from 'react'
import { AssetComponent } from '../asset-component'

type SupplyComponent = {
    tokenSymbol: string
    tokenAddress:string
}

export const SupplyComponent:FunctionComponent<SupplyComponent> = ({
    tokenAddress,
    tokenSymbol
})=>{

    return(
        <div>
            <div className="border-solid border-t-2 mb-2"></div>
                <div className="px-2">
                    <AssetComponent 
                        supply='Supply' 
                        withdraw='Withdraw'
                        tokenAddress={tokenAddress}
                        tokenSymbol={tokenSymbol}
                    />
                </div>
            <div className="border-solid border-t-1 mt-2"></div>
        </div>
    )
}