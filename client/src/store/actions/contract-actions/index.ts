import { Contract } from 'ethers'
import { actionCreator } from '../../utils/helper'
import {CONTRACT_TYPE} from '../../utils/types'

export const loadContractStart = actionCreator(CONTRACT_TYPE.LOAD_CONTRACT_START, '')
export const loadContractSuccess = (lendingPool:Contract)=>actionCreator(CONTRACT_TYPE.LOAD_CONTRACT_SUCCESS, lendingPool)
export const loadContractFail = actionCreator(CONTRACT_TYPE.LOAD_CONTRACT_FAIL, '')