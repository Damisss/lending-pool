import { FunctionComponent, useEffect, useState, useRef, MutableRefObject } from 'react'
import {useSelector} from 'react-redux'
import { connectAccount, getBalance} from '../../utils/helper'
import { State } from '../../utils/types'
import {CustomButton} from '../custom-button'
import { AccountDropdown } from './account-dropdown'

export const AccountStatus:FunctionComponent = ()=>{
    const [tokenDropDown, setTokenDropDown] = useState(false)
    const [accountDropDown, setAccountDropDown] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
    const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false)
    const [ethBalance, setEthBalance] = useState(0.00)
    const [isAllDropdownClosed, setIsAllDropdownClosed] = useState(false)
    const [totalBalances, setTotalBalances] = useState({totalBorrowBalance:0,totalSupplyBalance:0})
    const {account, balances:{balances, isLoaded}} = useSelector((state:State)=>state)
    const dropdownRef = useRef() as MutableRefObject<any>

    const showTokenDropDown = ()=>{
        setTokenDropDown(!tokenDropDown)
        setAccountDropDown(false)
        setIsAllDropdownClosed(false)
    }
    
    const showAccountDropdown = ()=>{
        setAccountDropDown(!accountDropDown)
        setTokenDropDown(false)
        setIsAllDropdownClosed(false)
    }

    useEffect(()=>{
        const total = balances.reduce((acc, curr)=>{
            return {
                totalBorrowBalance: acc.totalBorrowBalance + (parseFloat(curr.borrowBalanceInUsd || '0')),
                totalSupplyBalance: acc.totalSupplyBalance + (parseFloat(curr.supplyBalanceInUsd ||' 0'))
            }
        }, {totalBorrowBalance:0,totalSupplyBalance:0})
        setTotalBalances(total)

        const accountStatus = async()=>{
            const isInstalled = window.ethereum?.isMetaMask || false
            setIsMetaMaskInstalled(isInstalled)
            const status = await window.ethereum?._metamask.isUnlocked()
            const balance = await getBalance(account.account)
           
            setEthBalance(+parseFloat(balance).toFixed(4))
            setIsConnected(status)    
        }
        accountStatus()
        document.addEventListener('mousedown', closeAllDropdown);
        return () => document.removeEventListener('mousedown', closeAllDropdown);
    }, [account.isLoaded, accountDropDown, tokenDropDown, isLoaded])

    const accountFormat = ()=>{
        const length = account.account.length
        if(length){
            return `${account.account.substring(0, 6)}...${account.account.substring(length-4, length)}`
        }
        return null
    }

    const closeAllDropdown = (e:any)=>{
        if (!dropdownRef.current!.contains(e.target)) {
            setIsAllDropdownClosed(true)
        }
       
    }
    
    if(!isMetaMaskInstalled){
        return(
            <CustomButton
            className="h-full px-4 rounded-md mt-1 w-full text-white pt-1"
            name='Install Metamask'
            onClick={()=>window.open ('https://metamask.io', '_ blank')}
            type='button'
        /> 
        )
    }

    if(!isConnected){
        return(
            <div className="border-solid border-2 border-white rounded-full px-2 h-3/4 py-1 mb-3 mt-2 hover:bg-blue-600 px-3">
                    <CustomButton
                    className="h-full px-4 rounded-md mt-1 w-full text-white pt-1"
                    name='Connect Wallet'
                    onClick={connectAccount}
                    type='button'
                />
            </div>
        )
    }
    
    return(
        <div className='relative h-full'>
            {  !account.isLoaded
               ? 
               <div className='flex items-center h-full text-white font-bold text-xl'>
                <span>loading...</span>
               </div>
               :
               <div className="border-solid border-2 border-white rounded-full px-2 h-3/4 py-1 mb-3 mt-2 hover:bg-blue-600 px-3">
                    <div className="flex flex-row items-center h-full">
                        <div
                            className="border-r-2 border-white rounded-r-full pr-3 flex items-center h-full cursor-pointer" 
                            onClick={showTokenDropDown}
                        >
                            <span className="bg-[url('/img/asset_ETH.svg')] h-6 w-6 rounded-full bg-contain mr-2"></span>
                            <span className="text-white font-semibold">{ethBalance}</span>
                        </div>
                        
                        <div className="h-full flex items-center cursor-pointer ml-2" onClick={showAccountDropdown}>
                            <span className="text-white font-semibold">{accountFormat()}</span>
                        </div>
                    </div>
               </div>
            }
            <div ref={dropdownRef} >
                {
                    !isAllDropdownClosed && <AccountDropdown 
                    tokenDropdown={tokenDropDown} 
                    accountDropdown={accountDropDown}
                    account={accountFormat()}
                    ethBalance={ethBalance}
                    totalBalances={totalBalances}
                 />
                }
            </div>
            
        </div>
    )
}