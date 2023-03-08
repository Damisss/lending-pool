import { FunctionComponent, useEffect, useState, useRef, MutableRefObject } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import millify from 'millify'

import { EnableCollateral } from '../enable-collateral-component'
import { CustomSwitch } from '../custom-switch'
import { Modal } from '../modal-component'
import SupplyBorrowPanel from '../supply-borrow-card'
import { alertFail, alertProcessing, alertSuccess } from '../../store/actions'
import { alertInit } from '../../store/actions/alert-actions'
import { borrowSuccess } from '../../store/actions/borrow-actions'
import { setCollateralLFail, setCollateralStart, setCollateralSuccess } from '../../store/actions/set-collateral-actions'
import { withdrawSuccess } from '../../store/actions/withdraw-actions'
import { borrowLimit } from '../../utils/config'
import { customSubstring, getChainId, provider, subscribeToEvent } from '../../utils/helper'
import { State } from '../../utils/types'
import { AssetCard } from './asset-card'

type AssetComponent = {
    supply?: string
    withdraw?: string
    borrow?: string
    repay?:string
    tokenAddress:string
    tokenSymbol:string
    liquidity?:string
}
export const AssetComponent:FunctionComponent<AssetComponent> = ({
    supply,
    withdraw,
    borrow,
    repay,
    tokenAddress,
    tokenSymbol,
    liquidity,

})=>{
    const {
        contract:{lendingPool},
        alert:{isSuccess}, 
        balances:{balances, isLoaded},  
    } = useSelector((state:State)=>state)
    const dispatch = useDispatch()
    const [isCollateralEnabled, setIsCollateralEnabled] = useState(false)
    const [showEnableCollateralModal, setShowEnableCollateralModal] = useState(false)
    const [showSupplyModal, setSupplyShowModal] = useState(false)
    const [setTimeoutId, setSetTimeoutId] = useState<NodeJS.Timeout>()
    const [currentBalances, setCurrentBalances] = useState({
        walletBalance: '0.00',
        supplyBalance: '0.00',
        borrowBalance: '0.00',
        walletBalanceInUsd: '0.00',
        supplyBalanceInUsd: '0.00',
        borrowBalanceInUsd:'0.00'
    })
    const [chainId, setChainId] = useState<string|undefined>()
    const modalRef = useRef(null) as MutableRefObject<HTMLElement | null>
    
    const onModalShow = (isCollateral:boolean, isSupply:boolean)=>{
        if(isCollateral){
            setShowEnableCollateralModal(true)
        }

        if(isSupply){
            setSupplyShowModal(true)
        }
        
    }
    
    const onCloseModal = (e:any)=>{
        if (modalRef.current && !modalRef.current!.contains(e.target)) {
            setShowEnableCollateralModal(false)
            setSupplyShowModal(false)
        }
        
    }

    const onCloseButtonClicked = ()=>{
        setShowEnableCollateralModal(false)
        setSupplyShowModal(false)
    }

    const onSetCollateral = async()=>{
        try {
            onCloseButtonClicked()
            dispatch(setCollateralStart)
            dispatch(alertProcessing('Transaction Pending'))
            const signer = provider.getSigner()
            const tx = await lendingPool.connect(signer).setCollateral(tokenAddress)
            await tx.wait()
            dispatch(setCollateralSuccess)
            dispatch(alertSuccess('Transaction completed'))
        } catch (error) {
            dispatch(setCollateralLFail)
            dispatch(alertFail('Transaction Failed'))
            console.log(error)
        }
        const id = setTimeout(()=>{
            dispatch(alertInit)
        }, 3000)
        
        setSetTimeoutId(id)
    }
   
    const balanceFormat = ()=>{
        if(parseFloat(currentBalances.supplyBalance) > 0 && supply){
            return {
                tokenBalance: customSubstring(currentBalances.supplyBalance, 3),
                priceInUsd: currentBalances.supplyBalanceInUsd
            }
        }

        if(parseFloat(currentBalances.borrowBalance) > 0){
         
            return  {
                tokenBalance: customSubstring(currentBalances.borrowBalance, 3),
                priceInUsd: currentBalances.borrowBalanceInUsd
            }
            
        }
    
        return {
            tokenBalance: customSubstring(currentBalances.walletBalance, 3),
            priceInUsd: currentBalances.walletBalanceInUsd
        }
        
    }

    const showPrecentOfLimit = ()=>{
        const borrowAmount = parseFloat(currentBalances.borrowBalance || '0')
        const supplyBorrowLimit =  (parseFloat(currentBalances.supplyBalance || '0') * borrowLimit)
        if(borrowAmount > 0 && supplyBorrowLimit > 0) return String((borrowAmount/supplyBorrowLimit)*100).split('.')[0]
        return 0
    }

    useEffect(()=>{
        document.addEventListener('click', onCloseModal, true);
        const asyncCall = async()=>{
            setChainId((await getChainId(provider)).toString())
            const signer = provider.getSigner()
            const isEnabled = await lendingPool.connect(signer).isCollateralEnabled(tokenAddress)
            setIsCollateralEnabled(isEnabled)
        }
        asyncCall()
        
        const currBalances = balances.find(item=>item.tokenAddress === tokenAddress)

        if(currBalances){
            setCurrentBalances({
                walletBalance: currBalances.walletBalance,
                supplyBalance: currBalances.supplyBalance,
                borrowBalance: currBalances.borrowBalance,
                walletBalanceInUsd: millify(+customSubstring(currBalances.walletBalanceInUsd, 3)),
                supplyBalanceInUsd: millify(+customSubstring(currBalances.supplyBalanceInUsd, 3)),
                borrowBalanceInUsd: millify(+customSubstring(currBalances.borrowBalanceInUsd, 3))
            } ||{})
        }

        subscribeToEvent(lendingPool, 'Withdraw', dispatch, withdrawSuccess)
        subscribeToEvent(lendingPool, 'Borrow', dispatch, borrowSuccess)
        
        return () => {
            document.removeEventListener('click', onCloseModal, true)
            window.clearTimeout(setTimeoutId)
        };
        
    }, [
        showSupplyModal,
        showEnableCollateralModal,
        isSuccess,
        isLoaded
    ])
    
    return(
        <div className="flex cursor-pointer items-center">
            <AssetCard
                onModalShow={()=>onModalShow(false, true)}
                chainId={chainId}
                tokenAddress={tokenAddress}
                priceInUsd={balanceFormat().priceInUsd}
                balance={balanceFormat().tokenBalance}
                tokenSymbol={tokenSymbol}
            />
            {
                supply ? 
                <CustomSwitch 
                onModalShow={onModalShow} 
                onClick={setIsCollateralEnabled} 
                isCollateralEnabled={isCollateralEnabled}
                /> : 
                <span className="font-semibold">
                    {
                        currentBalances?.borrowBalance && +currentBalances.borrowBalance > 0 ?
                        `${showPrecentOfLimit()}%`:`$${liquidity&&millify(+liquidity)}`
                    }
                </span>
            }
            
            <Modal 
                onClose={onCloseButtonClicked} 
                showModal={showSupplyModal || showEnableCollateralModal} 
                ref={modalRef}
            >
                <>
                {
                    showEnableCollateralModal && <EnableCollateral 
                        onClick={onSetCollateral}
                        tokenSymbol={tokenSymbol}
                        tokenAddress={tokenAddress}
                        isCollateralEnabled={isCollateralEnabled}
                    />
                }
                {
                    showSupplyModal && <SupplyBorrowPanel
                    tokenSymbol={tokenSymbol}
                        option1={(supply || borrow) as string}
                        option2={(withdraw || repay) as string}
                        lendingPool={lendingPool}
                        provider={provider}
                        dispatch={dispatch}
                        onClick={onCloseButtonClicked}
                        tokenAddress={tokenAddress}
                        isCollateralEnabled={!isCollateralEnabled}
                        balances={currentBalances}
                    />
                }
                </>
                
            </Modal>
            
        </div>
    )
}