import { Field, Form } from 'formik'
import { ChangeEventHandler, FunctionComponent, useEffect, useState } from 'react'
import cx from 'classnames'
import { Contract, providers } from 'ethers'

import { CustomButton } from '../custom-button'
import { CustomInput } from '../custom-input'
import { assets, faucet, showFaucetConditions } from '../../utils/config'
import { getChainId } from '../../utils/helper'

//this should be in config file
const ERC20_ABI = ["function mint(address to, uint256 amount) external returns (bool)"]

type SupplyBorrowCardComponent = {
    tokenSymbol:string
    setFieldValue: (filedName: string, value: string) => {}
    handleChange: ChangeEventHandler<HTMLInputElement>
    values:{ 
        token:string
        amount:number
    }
    option1?:string
    option2?:string
    tokenAddress:string
    isCollateralEnabled:boolean
    balances:{
        walletBalance:string 
        supplyBalance:string 
        borrowBalance:string
    }
    provider: providers.Web3Provider
}

export const SupplyBorrowCardComponent:FunctionComponent<SupplyBorrowCardComponent> = ({
    tokenSymbol,
    handleChange,
    setFieldValue,
    values,
    option1,
    option2,
    tokenAddress,
    isCollateralEnabled,
    balances,
    provider,
    ...otherProps
})=>{
    
    const [selectedOption, setSelectedOption] = useState(option1)
    const [chainId, setChainId] = useState<string|undefined>()

    const onSetToken = ()=>{
        setFieldValue('option', selectedOption as string)
    }

    const onSelectOption = (option?:string)=>{
        setSelectedOption(option)
    }

    const onMax = ()=>{
        setFieldValue('maxAmountSelected', 'max')
        if(selectedOption === 'Supply'){
            setFieldValue('amount', balances.walletBalance || '')
        }
        if(selectedOption === 'Withdraw'){
            setFieldValue('amount', balances.supplyBalance || '')
        }
        if( selectedOption === 'Repay'){
            setFieldValue('amount', balances.borrowBalance || '')
        }
    }
    
    const isFaucetDisplayed = ()=>{
        if(
            chainId && 
            chainId === '11155111' && 
            selectedOption
        ) return showFaucetConditions.includes(selectedOption)
        return false
    }

    const onFaucet = async()=>{
        if(tokenAddress && chainId){
            const signer = provider.getSigner()
            const tokenContract = new Contract(tokenAddress, ERC20_ABI)
            const tx = await tokenContract.connect(signer).mint(
                await signer.getAddress(), 
                faucet[chainId][tokenAddress]
            )
            await tx.wait()
        }
    }

    useEffect(()=>{
        const asyncCall = async()=>{
            setChainId((await getChainId(provider))?.toString())
        }
        asyncCall()
    }, [chainId])

    return(
        <>
        <div className="h-full w-full">
            <div className='flex items-center justify-center mb-4'>
                <span>
                    <img 
                        src={chainId&&assets[chainId][tokenAddress]}  
                        alt={'icon'} className='h-8 w-8 rounded-full bg-contain bg-center mr-2'
                    />
                </span>
                <span className='text-xl fond-semibold'>{tokenSymbol}</span>
            </div>
            <div className='flex justify-around border-solid border-b-2 mb-2'>
                <div onClick={()=>onSelectOption(option1)}
                className={
                    cx("flex justify-center text-semibold cursor-pointer w-full border-solid border-b-2", 
                    {'border-b-blue-400': selectedOption === option1})}
                >
                    {option1}
                </div>
                <div onClick={()=>onSelectOption(option2)} className={
                    cx("flex justify-center text-semibold cursor-pointer  w-full border-solid border-b-2", 
                    {'border-b-blue-400': selectedOption === option2})
                }>
                    {option2}
                </div>
            </div>

            <Form className='px-4'>
            <div className="w-full">
                <Field
                    Name='amount'
                    component={CustomInput}
                    id='amount'
                    label='Amount'
                    onChange={handleChange}
                    value={values.amount}
                    type='text'
                    onMax={onMax}
                    isOptionBorrow={selectedOption === 'Borrow'}
                    {...otherProps}
                />
                </div>
                <CustomButton
                    className="bg-blue-400 py-1 px-4 rounded-md mt-1 w-1/2 h-full text-white mx-auto mb-4"
                    name={`${selectedOption} ${tokenSymbol}` as string}
                    onClick={onSetToken}
                    type='submit'
                    disabled={isCollateralEnabled && selectedOption === 'Borrow' || !values.amount}
                />
            </Form>
            {isFaucetDisplayed() &&
                <span className="flex justify-center w-full font-bold mb-4" 
                    onClick={onFaucet}>
                        faucet
                </span>
            }
        </div>
        
        </>
    )
}