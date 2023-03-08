import { withFormik } from 'formik'
import { Dispatch } from 'react'
import { Action } from 'redux'
import { Contract, providers } from 'ethers'

import { SupplyBorrowCardComponent } from './supply-borrow-card-component'
import { formatAmount, loadContract, toWei } from '../../utils/helper'
import { supplyStart, supplyFail } from '../../store/actions/supply-actions'
import { alertFail, alertProcessing } from '../../store/actions/alert-actions'
import { borrowFail, borrowStart } from '../../store/actions/borrow-actions'
import { repayFail, repayStart } from '../../store/actions/repay-actions'
import { withdrawFail, withdrawStart } from '../../store/actions/withdraw-actions'

const ERC20ABI = require('../../utils/IERC20.json').abi

type MyFormProps={
    initialAmount?:string
    initialToken?: string
}

type FormValues ={
    amount:string
    option:string

}
type AdditionalProps = {
    provider?:providers.Web3Provider
    lendingPool?: Contract
    dispatch: Dispatch<Action>
    tokenSymbol:string
    option1:string
    option2:string
    tokenAddress:string
    onClick: ()=>void
    isCollateralEnabled: boolean
    balances:{ 
        walletBalance:string, 
        supplyBalance:string, 
        borrowBalance:string
    }
}

const SupplyBorrowPanel = withFormik<MyFormProps & AdditionalProps, FormValues>({
    mapPropsToValues: props => {

        return ({
            amount: props.initialAmount || '',
            option:  props.initialToken || ''
        })
    },
    async handleSubmit({ amount, option}: FormValues, { setSubmitting, props }) {
        props.onClick()

        if(parseFloat(amount) > 0 && props.lendingPool && props.provider){
            const signer = props.provider.getSigner() as providers.JsonRpcSigner
            const loadERC20 = loadContract(props.tokenAddress as string, ERC20ABI)
            switch (option) {
                case 'Supply':
                    try {
                        props.dispatch(supplyStart)
                        props.dispatch(alertProcessing('Transaction Pending'))
                        const approveTx = await loadERC20.connect(signer).approve(props.lendingPool.address, toWei(amount.toString()))
                        await approveTx.wait()
                        const tx = await props.lendingPool?.connect(signer).supply(
                            props.tokenAddress as string,
                            toWei(amount.toString())
                        )
                        await tx.wait() 
                    } catch (error) { 
                        props.dispatch(supplyFail)
                        props.dispatch(alertFail('Transaction Failed')) 
                        console.log(error)
                    }

                    break

                case 'Withdraw':
                    try {
                        props.dispatch(withdrawStart)
                        props.dispatch(alertProcessing('Transaction Pending'))
                        const tx = await props.lendingPool.connect(signer).withdraw(
                            props.tokenAddress as string,
                            formatAmount(amount.toString(), props.balances.supplyBalance as string)
                        )
                        await tx.wait()

                    } catch (error) {
                        props.dispatch(withdrawFail)
                        props.dispatch(alertFail('Transaction Failed')) 
                        console.log(error)
                    }
                    break
                
                case 'Borrow':
                    try {
                        props.dispatch(borrowStart)
                        props.dispatch(alertProcessing('Transaction Pending'))
                        const tx = await props.lendingPool.connect(signer).borrow(
                            props.tokenAddress as string,
                           toWei(amount.toString())
                        )
                        await tx.wait() 
                    
                    } catch (error) {
                        props.dispatch(borrowFail)
                        props.dispatch(alertFail('Transaction Failed')) 
                        console.log(error)
                    }
                    break

                case 'Repay':
                    try {
                        props.dispatch(repayStart)
                        props.dispatch(alertProcessing('Transaction Pending'))
                        const formattedAmount = formatAmount(amount.toString(), props.balances.borrowBalance as string)
                        const approveTx = await loadERC20.connect(signer).approve(props.lendingPool.address, formattedAmount)
                        await approveTx.wait()
                        const tx = await props.lendingPool.connect(signer).repay(
                            props.tokenAddress as string,
                            formattedAmount
                        )
                        await tx.wait()
            
                    } catch (error) {
                        props.dispatch(repayFail)
                        props.dispatch(alertFail('Transaction Failed')) 
                        console.log(error)
                    }
                    break
            
                default:
                    break
            }
            
        }
        setSubmitting(true)
    }
    

})(SupplyBorrowCardComponent)


export default SupplyBorrowPanel