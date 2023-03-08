import { FunctionComponent } from 'react'

type PanelHeader = {
    panelType: string
    isSupplied?: boolean
}
export const PanelHeaderComponent:FunctionComponent<PanelHeader> = ({
    panelType,
    isSupplied,
})=>{

    return(
        <div className="w-full pb-4">
            <div className="font-bold p-2 text-lg">
            <span>{panelType}</span>
            </div>
            <div className='border-solid border-t-2 mb-2'></div>
            <div className="flex flex-row justify-between w-full px-2">
                <span className="font-semibold">Aseets</span>
                <span className="font-semibold">Wallet</span>
                <span className="font-semibold">{isSupplied ? 'Collateral':'% Of Limit' }</span>
            </div>
        </div>
    )
}