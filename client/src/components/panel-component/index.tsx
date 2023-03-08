import { FunctionComponent } from 'react'
import { AssetComponent } from '../asset-component'

type Panel = {
    panelType: string
    supply?: string
    withdraw?: string
    borrow?: string
    repay?: string
    tokenAddress?:string
    tokenSymbol:string
    liquidity?:string
}
export const PanelComponent:FunctionComponent<Panel> = ({
    supply,
    withdraw,
    borrow,
    repay,
    tokenAddress,
    tokenSymbol,
    liquidity,

})=>{

    return(
        <div className="w-full">
            <div className='border-solid border-t-2 mb-2'></div>
            <div className='px-2'>
                <AssetComponent 
                    supply={supply}
                    withdraw={withdraw}
                    borrow={borrow}
                    repay={repay}
                    tokenAddress={tokenAddress as string}
                    tokenSymbol={tokenSymbol}
                    liquidity={liquidity}
                />
            </div>
            <div className='border-solid border-t-2 mt-2'></div>
        </div>
    )
}