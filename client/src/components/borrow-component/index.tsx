import { FunctionComponent } from 'react'
import { AssetComponent } from '../asset-component'

type BorrowComponent = {
    tokenAddress:string
    tokenSymbol:string
    liquidity:string
    onClick?: ()=>void
}

export const BorrowComponent:FunctionComponent<BorrowComponent> = ({
    onClick,
    tokenAddress,
    tokenSymbol,
    liquidity
})=>{
    return(
        <div onClick={onClick}>
            <div className='border-solid border-t-2 mb-2'></div>
            <div className='px-2'>
                <AssetComponent 
                    borrow='Borrow'
                    repay='Repay'
                    tokenAddress={tokenAddress}
                    tokenSymbol={tokenSymbol}
                    liquidity={liquidity}
                />
            </div>
            <div className='border-solid border-t-2 mt-2'></div>
        </div>
    )
}