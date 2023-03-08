import { HardhatUserConfig} from 'hardhat/config'
import '@nomiclabs/hardhat-etherscan'
import '@openzeppelin/hardhat-upgrades'
import '@nomicfoundation/hardhat-toolbox'
import 'hardhat-contract-sizer'
import 'hardhat-gas-reporter'

require("dotenv").config();

type HardhatConfig = {
	settings: {
		optimizer: { enabled: boolean, runs: number},
		
	},
	contractSizer?:{
		alphaSort: boolean,
		disambiguatePaths: boolean,
		runOnCompile: boolean,
		strict: boolean,
		only: string[]
	}
	,
} & HardhatUserConfig

const config: HardhatConfig = {
	solidity: "0.8.17",
	settings: {
		optimizer: {
			enabled: true,
			runs: 2000
		}
	},
	defaultNetwork: "hardhat",
	networks: {
		hardhat: {
			forking: {
				url: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
				enabled:true
			},
			allowUnlimitedContractSize:true,
		},
		goerli: {
			url: `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_TESTNET_API_KEY}`,
			chainId: 5,
			accounts: [process.env.GOERLI_PRIVATE_KEY as string],
			gas: 30000000,
			gasPrice: 50000000000,
			minGasPrice: 25000000000
		},
		
	},
	
	etherscan:{
		apiKey:process.env.ETHERSCAN_API_KEY
	},
	contractSizer: {
		alphaSort: true,
		disambiguatePaths: false,
		runOnCompile: true,
		strict: true,
		only: [':LendingPool$'],
	},
	gasReporter: {
		enabled: true,
		currency: "USD",
		coinmarketcap: process.env.COINMARKETCAP,
		token: "matic",
		outputFile: "gasReports.txt",
		noColors: true
	}
};

export default config;
