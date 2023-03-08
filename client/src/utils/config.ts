import { BigNumberish } from "ethers"
import { toWei } from "./helper"

export const assets:{[key: string]: {[key: string]:string|undefined}}  = {
    '1':{
        'linkAddress':require('../assets/LINK.svg').default ,
        'uniaddress':require('../assets/UNI.svg').default ,
    },
    '137':{
        'linkAddress':require('../assets/LINK.svg').default ,
        'uniaddress':require('../assets/UNI.svg').default ,
    },
    '5':{
        '0x0D6F014535C9D83654D583a0eA898789Ee4F3874':require('../assets/LINK.svg').default ,
        '0x97c938f9f56Fb3aDE6432c636c0DD01D4c43Cd28':require('../assets/WBTC.svg').default 
    },
    '31337':{
        '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063': require('../assets/DAI.svg').default
    }

}

export const faucet:{[key: string]: {[key: string]:BigNumberish}}  ={
    '5':{
        '0x97c938f9f56Fb3aDE6432c636c0DD01D4c43Cd28': toWei('.5'), //WBTC
        '0x0D6F014535C9D83654D583a0eA898789Ee4F3874':toWei('1000') //LINK
    },
}

export const priceFeedAddresses:{[key: string]: {[key: string]:string}} = {
    '5':{
        '0x0D6F014535C9D83654D583a0eA898789Ee4F3874': '0x48731cF7e84dc94C5f84577882c14Be11a5B7456',
        '0x97c938f9f56Fb3aDE6432c636c0DD01D4c43Cd28':'0xA39434A63A52E749F02807ae27335515BA4b07F7',
       
    },
    '31337':{
        '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063': '0x4746DeC9e833A82EC7C2C1356372CcF2cfcD2F3D'
    }
}


export const showFaucetConditions = ['Supply', 'Repay', '5']
export const borrowLimit = .8 //80%
//goerly
//deployment wbtc:   0x97c938f9f56Fb3aDE6432c636c0DD01D4c43Cd28
//deployment link:   0x0D6F014535C9D83654D583a0eA898789Ee4F3874

//latest
// deployment pool configurator:   0x9a3581b9b709E716339076AA9B684602263fB2ED
// deployment sToken factory:   0xE0B1236c07FB07395Af496168AD64366C842f877
// deployment lending pool:   0x2Cf6C7b014D8Bd28d40347f3BaFc5DA5C6373FfD