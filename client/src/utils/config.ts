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
    '11155111':{
        '0xE3Dbc9f08574464796Cb2d3679b932FC65FCF01D':require('../assets/LINK.svg').default ,
        '0x6A0b98D0762FE8c3aF3CF4F8e4BCD9806431e5D0':require('../assets/WBTC.svg').default 
    },
    '31337':{
        '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063': require('../assets/DAI.svg').default
    }

}

export const faucet:{[key: string]: {[key: string]:BigNumberish}}  ={
    '11155111':{
        '0x6A0b98D0762FE8c3aF3CF4F8e4BCD9806431e5D0': toWei('.5'), //WBTC
        '0xE3Dbc9f08574464796Cb2d3679b932FC65FCF01D':toWei('1000') //LINK
    },
}

export const priceFeedAddresses:{[key: string]: {[key: string]:string}} = {
    '11155111':{
        '0xE3Dbc9f08574464796Cb2d3679b932FC65FCF01D': '0xc59E3633BAAC79493d908e63626716e204A45EdF',
        '0x6A0b98D0762FE8c3aF3CF4F8e4BCD9806431e5D0':'0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43',
       
    },
    '31337':{
        '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063': '0x4746DeC9e833A82EC7C2C1356372CcF2cfcD2F3D'
    }
}


export const showFaucetConditions = ['Supply', 'Repay']
export const borrowLimit = .8 //80%
