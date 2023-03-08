import { FunctionComponent, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import Select, {PlaceholderProps, components} from 'react-select'
import { netWorkOptions } from '../../utils/options'
import { State } from '../../utils/types'

import {AccountStatus} from './account-status'


type NavBar = {
    chainId:  number
}

type SelectType = {
    value: string
    label: string
}

export const NavBar:FunctionComponent<NavBar> = ({chainId})=>{
    const {account} = useSelector((state:State)=>state)
    const [networkValue, setNetworkValue] = useState<SelectType|null>(null)
    const networkHandler = async(e:any)=>{
        try {
            setNetworkValue(e)
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: e.value }],
              });
        } catch (error) {
            console.log(error)
        }
    }
    const Placeholder = (props: PlaceholderProps<any>) => {
        return <components.Placeholder {...props} />;
      };
    useEffect(()=>{
        const findNetwork =  chainId && netWorkOptions.find(net=>net.value === `0x${chainId.toString(16)}`)
    
        if(findNetwork){
            setNetworkValue(findNetwork)
        }
        
    }, [chainId])
    

    return(
        <div className="bg-blue-400 h-16">
            <nav className="flex flex-row justify-around items-center h-full">
                <Select
                className="w-34 h-3/4 mt-1 mb-2 md:w-50 h-1/2 md:mt-1 mb-2"
                isDisabled={!account.isLoaded}
                //classNamePrefix='nav-bar__select'
                components={{Placeholder}}
                onChange={networkHandler}
                value={networkValue}
                options={netWorkOptions as any}
                placeholder='Network...'
                theme={(theme) => ({
                    ...theme,
                    borderRadius: 0,
                    colors: {
                      ...theme.colors,
                      //primary25: 'hotpink',
                      primary: 'rgb(96 165 250)',
                    },
                  })}
                  styles={{
                    placeholder: (base) => ({
                      ...base,
                      fontSize: '1em',
                      color: 'black',
                      fontWeight: 400,
                    }),
                  }}
                />
                <AccountStatus/>
            </nav>
        </div>
    )
}