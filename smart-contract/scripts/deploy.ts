const fs = require('fs-extra')
const path = require('path')
import { ethers, artifacts, upgrades } from "hardhat";
import {utils} from 'ethers'


const BASE_BORROW_RATE = utils.parseUnits('0.02', 18)
const RATE_SLOP_1 = utils.parseUnits('0.02', 18)
const RATE_SLOP_2 = utils.parseUnits('0.04', 18)
const LIQUIDATION_THRESHOLD = utils.parseUnits('0.75', 18)
const LIQUIDATION_BONUS_PERCENT = utils.parseUnits('1.05', 18)
const EXCESS_UTILIZATION_RATE = utils.parseUnits('0.2', 18)
const OPTIMAL_UTILIZATION_RATE = utils.parseUnits('0.8', 18)

async function main() {
 
  const [deployer, ...otherAccounts] = await ethers.getSigners()
  const WadMath = await ethers.getContractFactory('WadMath')
  const wadMath = await WadMath.deploy()
  const Oracle =  await ethers.getContractFactory('Oracle',{
    libraries:{
        WadMath:wadMath.address,
    }
  })

const oracle = await Oracle.deploy()
  const AmountShareConvertor =  await ethers.getContractFactory('AmountShareConvertor', {
    libraries:{
      WadMath:wadMath.address,
      Oracle: oracle.address
    }
  })
  const amountShareConvertor = await AmountShareConvertor.deploy()
  const LendingPoolHelper =  await ethers.getContractFactory('LendingPoolHelper',{
    libraries:{
        WadMath:wadMath.address,
        AmountShareConvertor: amountShareConvertor.address
    }
})

const lendingPoolHelper = await LendingPoolHelper.deploy()

  const CompoundInterestCalculator =  await ethers.getContractFactory('CompoundInterestCalculator',{
      libraries:{
          WadMath:wadMath.address
      }
  })

  const compoundInterestCalculator = await CompoundInterestCalculator.deploy()
  const PoolConfigurator = await ethers.getContractFactory('PoolConfigurator',{
      libraries:{
      WadMath:wadMath.address
      }
  })

  const poolConfigurator = await PoolConfigurator.deploy(
      BASE_BORROW_RATE,
      RATE_SLOP_1,
      RATE_SLOP_2,
      LIQUIDATION_THRESHOLD,
      LIQUIDATION_BONUS_PERCENT,
      EXCESS_UTILIZATION_RATE,
      OPTIMAL_UTILIZATION_RATE
  )

  await poolConfigurator.deployed()

  const STokenFactory = await ethers.getContractFactory('STokenFactory')
  const sTokenFactory = await STokenFactory.deploy()
  await sTokenFactory.deployed()

  const LendingPool = await ethers.getContractFactory('LendingPool', {
      libraries:{
      WadMath:wadMath.address,
      AmountShareConvertor: amountShareConvertor.address,
      Oracle: oracle.address,
      CompoundInterestCalculator: compoundInterestCalculator.address,
      LendingPoolHelper:lendingPoolHelper.address
      }
  })  
 
  const lendingPool  = await upgrades.deployProxy(LendingPool, [sTokenFactory.address], {
    initializer: 'initialize',
    kind:'transparent',
    unsafeAllowLinkedLibraries:true,
  })
  await lendingPool.deployed()

  console.log(`deployment wadMath:   ${wadMath.address}`)
  console.log(`deployment oracle:   ${oracle.address}`)
  console.log(`deployment amountShareConvertor:   ${amountShareConvertor.address}`)
  console.log(`deployment lendingPoolHelper:   ${lendingPoolHelper.address}`)
  console.log(`deployment compoundInterestCalculator:   ${compoundInterestCalculator.address}`)
  console.log(`deployment pool configurator:   ${poolConfigurator.address}`)
  console.log(`deployment sToken factory:   ${sTokenFactory.address}`)
  console.log(`deployment lending pool:   ${lendingPool.address}`)

  contractsBuild('LendingPool', lendingPool.address, 'lending-pool-contract')
  contractsBuild('PoolConfigurator', poolConfigurator.address, 'pool-config-contract')
}

const contractsBuild = (contractName: string, address:string, dir:string): void => {
  const contractsBuildDirectory = path.join(__dirname, '..', `contracts-build-directory/${dir}`)
  
  fs.removeSync(contractsBuildDirectory + `/abi.json`)
  fs.removeSync(contractsBuildDirectory + `/address.json`)
 
  fs.outputJsonSync(
    path.join(contractsBuildDirectory + `/address.json`),
    { address }
  )
  
  const artifact = artifacts.readArtifactSync(contractName)
  fs.outputJsonSync(
    path.join(contractsBuildDirectory + `/abi.json`),
    artifact
  )

}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
  process.exit(1)
})
