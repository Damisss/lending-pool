#!/bin/sh
npm run hardhat:fork & 
sleep 10
npm run hardhat:test
exit 0