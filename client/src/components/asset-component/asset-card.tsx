import {FunctionComponent} from 'react'
import { assets } from '../../utils/config'

type AssetCard ={
    onModalShow:()=>void
    chainId?:string
    tokenAddress:string
    tokenSymbol:string
    priceInUsd:string
    balance:string
}
export const AssetCard:FunctionComponent<AssetCard> = ({
    onModalShow,
    chainId,
    tokenAddress,
    tokenSymbol,
    priceInUsd,
    balance
})=>{
    return(
        <>
            <div  onClick={onModalShow} className="flex flex-1 flex-row justify-between items-center mr-6">
                <div className='flex items-center w-full'>
                    <span className='bg-white'>
                        <img 
                        src={chainId&&assets[chainId][tokenAddress as string]} 
                        alt={'icon'} 
                        className='h-8 w-8 rounded-full bg-contain bg-center mr-2'
                    />
                    </span>
                    <span className="font-semibold">{tokenSymbol}</span>
                </div>
                <div className="flex flex-col justify-start w-full md:justify-start" >
                    <span className="font-semibold" >{`$${priceInUsd}`}</span>
                    <span >{`${balance} ${tokenSymbol}`}</span>
                </div>
            </div>
        </>
    )
}