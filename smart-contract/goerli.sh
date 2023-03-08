#!/bin/sh
npm run hardhat:fork & 
sleep 5
npm run deploy:goerli
exit 0