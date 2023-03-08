import { FunctionComponent, useEffect, useState } from 'react'
import { BigNumberish } from 'ethers'
import { useDispatch, useSelector } from 'react-redux'

import { BorrowComponent } from '../../components/borrow-component'
import { SupplyComponent } from '../../components/supply'
import { PanelComponent } from '../../components/panel-component'

import { PanelHeaderComponent } from '../../components'
import { CustomButton } from '../../components'
import { State } from '../../utils/types'
import { 
    connectAccount, 
    customSubstring, 
    getChainId, 
    loadContract, 
    provider, 
    toEther 
} from '../../utils/helper'
import { priceFeedAddresses } from '../../utils/config'
import { poolsData } from '../../store/utils/custom-selector'
import { getBalancesFail, getBalancesStart, getBalancesSuccess } from '../../store/actions/balance-actions'

const ERC20_ABI = require('../../utils/IERC20.json').abi

type poolData= {
    token:string
    status: BigNumberish
    tokenSymbol: string
    liquidity:string
}

export const MarketContainer:FunctionComponent = ()=>{
    const {data} = useSelector(poolsData)
    const {
        account:{isLoaded, account, loading}, 
        contract:{lendingPool},
        supply:{submitted},
        borrow,
        repay,
        withdraw,
        ...restState
    } = useSelector((state:State)=>state)
    
    const dispatch = useDispatch()
    const [supplyData, setSupplyData] = useState<poolData[]>([])
    const [borrowData, setBorrowData] = useState<poolData[]>([])
    const [yourSupplyData, setYourSupplyData] = useState<poolData[]>([])
    const [yourBorrowData, setYourBorrowData] = useState<poolData[]>([])
    const [totalSupplyBalance, setTotalSupplyBalance] = useState('')
    const [totalBorrowBalance, setTotalBorrowBalance] = useState('')
    const [isAccountLoading, setIsAccountLoading] = useState(false)

    useEffect(()=>{
        const prepareData = async()=>{
            if(provider && account){
                const signer = provider.getSigner()
                const {chainId} = await provider.getNetwork()
                dispatch(getBalancesStart)
                
                const pools:poolData[] = []
                const supplyData:poolData[] = []
                const borrowData:poolData[]= []
                let mySupplyBalance = 0
                let myBorrowBalance = 0
                
                for(let item of data){
                    const contract = loadContract(item.token, ERC20_ABI)
                    const walletBalance = await contract.balanceOf(account)
                    const avaialableLiquidity = await contract.balanceOf(lendingPool.address)
                    const tokenSymbol = await contract.symbol()
                    const supplyBalance = await lendingPool.connect(signer).compoundedLiquidityOfUser(account,item.token)
                    const borrowBalance = await lendingPool.connect(signer).compoundedBorrowOfUser(account,item.token)
                    const liquidity = await lendingPool.connect(signer).getUsdValue(
                        priceFeedAddresses[chainId][item.token],
                        avaialableLiquidity
                    )
                    
                    const supplyAmountInFiat = await lendingPool.connect(signer).getUsdValue(
                        priceFeedAddresses[chainId][item.token],
                        supplyBalance
                    )
                    
                    const borrowAmountInFiat = await lendingPool.connect(signer).getUsdValue(
                        priceFeedAddresses[chainId][item.token],
                        borrowBalance
                    )
                    
                    const walletBalanceInFiat = await lendingPool.connect(signer).getUsdValue(
                        priceFeedAddresses[chainId][item.token],
                        walletBalance
                    )
                    
    
                    mySupplyBalance += parseFloat(toEther(supplyAmountInFiat))
                    myBorrowBalance += parseFloat(toEther(borrowAmountInFiat))
        
                    dispatch(getBalancesSuccess({
                        tokenAddress: item.token,
                        walletBalance: toEther(walletBalance),
                        supplyBalance: toEther(supplyBalance),
                        borrowBalance: toEther(borrowBalance),
                        walletBalanceInUsd: toEther(walletBalanceInFiat),
                        supplyBalanceInUsd: toEther(supplyAmountInFiat),
                        borrowBalanceInUsd: toEther(borrowAmountInFiat)
                    }))
                    
                    if(parseFloat(toEther(supplyBalance)) > 0){
                        supplyData.push({
                            token: item.token,
                            status: item.status,
                            tokenSymbol,
                            liquidity:toEther(liquidity)
                        })
                    }
    
                    if(parseFloat(toEther(borrowBalance)) > 0){
                        borrowData.push({
                            token: item.token,
                            status: item.status,
                            tokenSymbol,
                            liquidity:toEther(liquidity)
                        })
                    }
                    pools.push({
                        token: item.token,
                        status: item.status,
                        tokenSymbol,
                        liquidity: toEther(liquidity)
                    })
                }
                
                const supplyFinalData = pools.filter(item=>{
                  const ind = supplyData.findIndex(d=>d.token === item.token)
                  if(ind >= 0) return null
                  return item
                }).filter(Boolean)
    
                const borrowFinalData = pools.filter(item=>{
                    const ind = borrowData.findIndex(d=>d.token === item.token)
                    if(ind >= 0) return null
                    return item
                }).filter(Boolean)
    
                setSupplyData(supplyFinalData)
                setBorrowData(borrowFinalData)
                setYourSupplyData(supplyData)
                setYourBorrowData(borrowData)
                setTotalSupplyBalance(mySupplyBalance === 0 ? '': mySupplyBalance.toString())
                setTotalBorrowBalance(myBorrowBalance === 0 ? '': myBorrowBalance.toString())
            }
        }
        try {
            prepareData()
        } catch (error) {
            dispatch(getBalancesFail)
        }
        const setTimeoutId = setInterval(()=>{
            prepareData()
        }, 13000)
        setIsAccountLoading(loading)
        
        return()=>{
            window.clearInterval(setTimeoutId)
        }
    }, [
            restState.poolsData.isLoaded, 
            submitted, 
            borrow.submitted, 
            repay.submitted, 
            withdraw.submitted
        ]
    )

    const displaySupply = (data:poolData)=>{
        
        return data.status.toString() === '1' ?
            <SupplyComponent
                key={data.token}
                tokenAddress={data.token}
                tokenSymbol={data.tokenSymbol}
            /> : null
    }

    const displayBorrow = (data:poolData)=>{
        return <BorrowComponent 
            key={data.token}
            tokenAddress={data.token}
            tokenSymbol={data.tokenSymbol}
            liquidity={parseFloat(data.liquidity).toFixed(2)}
        />
    }

    const displayYourSupply = (data:poolData)=>{
        return(
            data.status.toString() === '1' ?
            <PanelComponent 
                key={data.token}
                panelType={'Supply'} 
                supply='Supply'
                withdraw='Withdraw'
                tokenAddress={data.token}
                tokenSymbol={data.tokenSymbol}
            /> : null
        )
    }

    const displayYourBorrow = (data:poolData)=>{
        return(
            data.status.toString() === '1' ?
            <PanelComponent 
                key={data.token}
                panelType='Borrow'
                borrow='Borrow' 
                repay='Repay'
                tokenAddress={data.token}
                tokenSymbol={data.tokenSymbol}
                liquidity={parseFloat(data.liquidity).toFixed(2)}
            /> : null
        )
    }

    if(isAccountLoading){
        const isWalletInstalled = window.ethereum?.isMetaMask || false
        return(
            <div className="bg-[#0f172a] py-44 flex flex-row justify-center justify-around">
                {<div className="flex flex-col bg-white items-center rounded-md border-2 shadow shadow-2xl p-12">
                    <div>
                        <h2 className="text-center text-xl font-semibold">{!isWalletInstalled? 'Install Metamask': 'Connect your Wallet'}</h2>
                        <span>Connect your wallet to see your supplies, borrowings, and open positions.</span>
                    </div>
                    {
                    !isWalletInstalled ?
                    <CustomButton
                        className="bg-blue-400 rounded-md py-2 mx-auto text-white mt-6 w-11/12 md:w-1/2"
                        name='Install Metamask'
                        onClick={()=>window.open ('https://metamask.io', '_ blank')}
                        type='button'
                        /> :
                        <CustomButton
                            className="bg-blue-400 rounded-md py-2 mx-auto text-white mt-6 w-11/12 md:w-1/2"
                            name='Connect Wallet'
                            onClick={connectAccount}
                            type='button'
                        />
                    }
                </div>
                }
            </div>
        )
    }

    return(
        <>
           { !isAccountLoading && isLoaded?   <div>
                    <div className="bg-[#0f172a] py-44 flex flex-row justify-center justify-around">
                        <div className=" flex flex-col text-white">
                            <span>Supply Balance</span>
                            <span>{`$${+customSubstring(totalSupplyBalance, 9) > 0 ? customSubstring(totalSupplyBalance, 9): '0.00000000'}`}</span>
                        </div>
                        <div className="flex flex-col text-white">
                            <span>Borrow Balance</span>
                            <span>{`$${+customSubstring(totalBorrowBalance, 9) > 0 ? customSubstring(totalBorrowBalance, 9):'0.00000000'}`}</span>
                        </div>
                    </div>
                    <div className="flex justify-center w-10/12 mx-auto -mt-12 md:w-11/12">
                        <div className="flex flex-col w-full md:flex-row">
                            <div className="w-full md:mr-2">
                                <div className="bg-white rounded-md border-2 mb-4 shadow shadow-2xl">
                                    <PanelHeaderComponent  panelType='Supply' isSupplied/>
                                {
                                    yourSupplyData.map(displayYourSupply)
                                }
                                </div>
                                <div className="bg-white rounded-md border-2 shadow shadow-2xl">
                                    <div className="flex flex-row justify-between mb-2 px-2 pt-2">
                                        <span className="font-semibold">Assets</span>
                                        <span className="font-semibold">Wallet</span>
                                        <span className="font-semibold">Collateral</span>
                                    </div>
                                    {
                                        supplyData.map(displaySupply)
                                    }
                                </div>
                            </div>
                            <div className="w-full md:ml-2">
                                <div className="bg-white rounded-md border-2 mb-4 shadow shadow-2xl">
                                    <PanelHeaderComponent  panelType='Borrow'/>
                                    {
                                        yourBorrowData.map(displayYourBorrow)
                                    }
                                </div>
                                <div className="bg-white rounded-md border-2 shadow shadow-2xl">
                                    <div className="flex flex-row justify-between mb-2 px-2 pt-2">
                                        <span className="font-semibold">Assets</span>
                                        <span className="font-semibold">Wallet</span>
                                        <span className="font-semibold">Liquidity</span>
                                    </div>
                                {
                                        borrowData.map(displayBorrow)
                                } 
                                </div>
                            </div>
                        </div>
                    </div>
                </div>:
                <div className="w-full flex justify-center align-center items-center h-full">
                    <span className="font-bold text-xl">loading...</span>
                </div>
            }
        </>
    )
}