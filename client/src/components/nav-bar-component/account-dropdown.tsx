import { FunctionComponent } from 'react'
import millify from 'millify'

type AccountDropdown ={
    tokenDropdown: boolean
   accountDropdown: boolean
   account: string | null
   ethBalance: number
   totalBalances:{totalBorrowBalance:number,totalSupplyBalance:number}
}
export const AccountDropdown:FunctionComponent<AccountDropdown> = ({
    tokenDropdown,
    accountDropdown,
    account,
    ethBalance,
    totalBalances
})=>{

   
    const showtTokenDropdown = ()=>(
        <div className="absolute mt-8 bg-blue-400 text-white px-3 md:mt-4 p-4 w-full">
            <div className='token-details'>
                <div></div>
                <div className="flex justify-between">
                    <span className="font-semibold">Your Supply</span>
                    <span>${millify(totalBalances.totalSupplyBalance)}</span>
                </div>
            </div>
            <div className="flex justify-between">
                <span className="font-semibold">Your Borrow</span>
                <span>${millify(totalBalances.totalBorrowBalance)}</span>
            </div>
        </div>
    )
    const showAccountDropdown = ()=>(
        <div className="absolute mt-8 bg-blue-400 text-white px-3 md:mt-4 px-4">
            <span className="visible font-bold mt-2 ">Connected Wallet</span>
            <div className="mt-1 text-center">
                <span className="font-semibold">{account}</span>
            </div>
            <div className="border borderb-2 boder-white my-4"></div>
            <div className="flex flex-row justify-center">
                <div></div>
                <span className="mb-1 font-semibold">{ethBalance} ETH </span>
            </div>
        </div>
    )

    return(
        <div >
            {
              tokenDropdown &&  !accountDropdown && showtTokenDropdown() 
            }
            {
                !tokenDropdown &&  accountDropdown && showAccountDropdown()
            }
        </div>
    )
}