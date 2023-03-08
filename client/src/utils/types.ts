import {MetaMaskInpageProvider} from '@metamask/providers'
import { Contract } from 'ethers'

declare global{
    interface Window{
        ethereum: MetaMaskInpageProvider
    }
}

type Common ={
    loading: boolean,
    isLoaded: boolean,
    isError: boolean
}

type Account = {
    account: string,
} & Common

type Network ={
    chainId: number
} & Common

type LendingPoolContract ={
    lendingPool:Contract
} & Common

type LendingPoolInterface = {
    submitting: boolean
    submitted: boolean
    isError: boolean
}

type AlertType = {
    isProcessing:boolean
    isAlert:boolean
    isShown: boolean
    isSuccess:boolean
    isError:boolean
    message: string
}
type IsPoolsData ={
    isLoaded:boolean
}
export type Balances={
    tokenAddress:string
    walletBalance:string
    supplyBalance:string
    borrowBalance:string
    walletBalanceInUsd:string
    supplyBalanceInUsd:string
    borrowBalanceInUsd:string
}
export type BalanceType = {
    balances:Balances[]
    isError:boolean
    isLoaded:boolean
}
export type State = {
    account: Account
    network: Network
    contract: LendingPoolContract
    supply: LendingPoolInterface
    borrow: LendingPoolInterface
    repay: LendingPoolInterface
    withdraw: LendingPoolInterface
    setCollateral: LendingPoolInterface
    alert: AlertType
    balances: BalanceType
    poolsData: IsPoolsData
}
