import { useEffect } from 'react';
import {useSelector, useDispatch} from 'react-redux'


import {NavBar} from './components'
import { AlertComponent } from './components/alert'
import { ProcessingComponent } from './components/processing'
import { MarketContainer } from './containers/market-interface'
import {
  loadAccountFail,
  loadAccountStart,
  loadAccountSuccess,
  loadNetworkIdStart,
  loadNetworkIdSuccess,
  loadContractStart,
  loadContractSuccess
} from './store/actions'
import { repaySuccess } from './store/actions/repay-actions';
import { getPoolsFail, getPoolsSuccess } from './store/get-pools-actions';
import { supplySuccess } from './store/actions/supply-actions'
import { 
  fetchEventData,
  getAccount, 
  getChainId, 
  loadArtifacts, 
  loadContract, 
  provider, 
  removeMetamaskEvents, 
  subscribeToEvent, 
  subscribMetamaskEvents 
} from './utils/helper'
import {State} from './utils/types'

function App() {
  
  const state = useSelector((state:State)=>state)
  const dispatch = useDispatch()
 
  const metamaskEventHandler = (...args:unknown[])=>{
    const currentAccount = args[0] as string[]
    dispatch(loadAccountSuccess(currentAccount[0]))
  }

  useEffect(()=>{
    
    const fetchData = async()=>{
    try {
      dispatch(loadNetworkIdStart)
      dispatch(loadContractStart)
      const chainId = await getChainId(provider)
      if(chainId){
        
        dispatch(loadNetworkIdSuccess(chainId))

        dispatch(loadAccountStart)
        const account = await getAccount(provider)
        if (account){
          dispatch(loadAccountSuccess(account))
          
        } 

        const {
          lendingPoolContractABI,
          lendingPoolContractAddress
        } = loadArtifacts()
        
        const lendingPool = loadContract(lendingPoolContractAddress, lendingPoolContractABI)
        dispatch(loadContractSuccess(lendingPool))
        dispatch(getPoolsFail)
        await fetchEventData(lendingPool, 'Status', dispatch, getPoolsSuccess, provider)

        if(state.supply.submitting){
          subscribeToEvent(lendingPool, 'Deposit', dispatch, supplySuccess)
        }

        if(state.repay.submitting){
          subscribeToEvent(lendingPool, 'Repay', dispatch, repaySuccess)
        }
 
        
      }
         
    } catch (error) {
      if(!state.account.account.length){
        dispatch(loadAccountFail) 
      }
      //no matching event
      dispatch(getPoolsFail)
      

      console.log(error)
    }
    
    }
    
    fetchData()
    subscribMetamaskEvents(metamaskEventHandler)
    
  return ()=>{
    removeMetamaskEvents(metamaskEventHandler)
  }
  },[state.network.chainId, state.supply.submitting, state.repay.submitting])
  
  return (
    <div className="bg-[#f7f7f9] h-screen">
      <div>
        <NavBar chainId={state.network.chainId}/>
      </div>
      <div></div>
      <MarketContainer/>
      <ProcessingComponent 
        alertType={state.alert.isProcessing} 
        showProcessing={state.alert.isShown} 
        processingMessage={state.alert.message}
      />
      <AlertComponent 
        alertType={state.alert.isAlert} 
        showAlert={state.alert.isShown} 
        alertMessage={state.alert.message}
        isSuccess={state.alert.isSuccess}
      />
    </div>
  );
}

export default App;
