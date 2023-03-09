import { Contract } from "ethers";
import { ethers, network } from "hardhat";
import { initData } from "./config";
require("dotenv").config();

const ERC20ABI = require('@openzeppelin/contracts/build/contracts/ERC20.json').abi

const LENDING_POOL_CONTRACT_ABI= require('../contracts-build-directory/lending-pool-contract/abi.json').abi
const LENDING_POOL_ADDRESS= require('../contracts-build-directory/lending-pool-contract/address.json').address
const POOL_CONFIG_ADDRESS = require('../contracts-build-directory/pool-config-contract/address.json').address

enum POOL_STATUS{
    INACTIVE=0,
    ACTIVATED=1,
    CLOSED=2
}

const DAI_WHALE = '0x075e72a5eDf65F0A5f44699c7654C1a76941Ddc8'
const main = async ()=>{
   
   
    if(network.name === 'localhost') {
        const accounts = await ethers.getSigners()
        const provider =   new ethers.providers.JsonRpcProvider('http://localhost:8545/')
        //impersonateAccount Whale's account and then transfer some dai into hardhat first account.
        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [DAI_WHALE]
        })
        
        const daiWhale = await ethers.getSigner(DAI_WHALE)
        const dai = new Contract(
            process.env.DAI as string, 
            ERC20ABI,
            provider
        )
        
       await dai.connect(daiWhale).transfer(accounts[0].address, ethers.utils.parseUnits('1000', 18));
        
       const lendingPool = new Contract(LENDING_POOL_ADDRESS, LENDING_POOL_CONTRACT_ABI, provider)
        
       try {
        const tx  =await lendingPool.connect(accounts[0]).initPool(
            process.env.DAI as string, 
            POOL_CONFIG_ADDRESS, 
            process.env.PRICEFEED_ADDRESS_DAI_ETH as string, 
            process.env.PRICEFEED_ADDRESS_DAI_USD as string, 
            {gasLimit:6000000, gasPrice: ethers.utils.parseUnits('100', 'gwei')}
        )
        const resut = await tx.wait()
        console.log(resut)
        const tx1 = await lendingPool.connect(accounts[0]).setPoolStatus(
            process.env.DAI as string, 
            POOL_STATUS.ACTIVATED
        );
        await tx1.wait()
        
    } catch (error) {
        
        console.log(error)
    }

    }else if(network.name === 'sepolia'){
        const provider = new ethers.providers.WebSocketProvider(`https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_TESTNET_API_KEY}`)
        const signer = new ethers.Wallet(process.env.PRIVATE_KEY as string, provider)
        const lendingPool = new Contract(LENDING_POOL_ADDRESS, LENDING_POOL_CONTRACT_ABI, signer)
        
        for(let item of initData.sepolia){
            try {
                const tx  =await lendingPool.connect(signer).initPool(
                    item.token, 
                    POOL_CONFIG_ADDRESS, 
                    item.priceFeed, 
                    item.priceInUsd, 
                    //{gasLimit:6000000, gasPrice: ethers.utils.parseUnits('00', 'gwei')}
                )
                await tx.wait()
                const tx1 = await lendingPool.connect(signer).setPoolStatus(
                    item.token, 
                    POOL_STATUS.ACTIVATED
                );
                const resut = await tx1.wait()
                console.log(resut)
            } catch (error) {
                console.log(error)
            }
        }
    }
    
}

main().then(()=>{
    process.exit(0)
}).catch((error)=>{
    console.error(error)
    process.exitCode = 1
    process.exit(1)
})
