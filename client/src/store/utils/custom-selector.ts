import {createSelector} from 'reselect'
import { get} from 'lodash'
import { State } from '../../utils/types'
import { BigNumberish } from 'ethers'

const poolsRowData = (state:State)=>get(state, 'poolsData.poolsData', [])

export const poolsData = createSelector(poolsRowData, (eventsArray)=>{
    
    const data:{token:string, status: BigNumberish, timestamp: BigNumberish}[] = []
    eventsArray.forEach(async(item:{token:string, status: BigNumberish, timestamp: BigNumberish})=>{
        const dataIndex = data.findIndex((d)=>d.token === item.token)
        if(dataIndex >= 0){
            if(
                data[dataIndex].token === item.token && 
                data[dataIndex].timestamp.toString() <= item.timestamp.toString()
            ){
                data[dataIndex] = {
                    token: item.token,
                    timestamp: item.timestamp,
                    status: item.status
                }
            }
        }else{
            data.push({
                token: item.token,
                timestamp: item.timestamp,
                status: item.status
            })
        }
        
    })
    
    return {
        data
    }
})