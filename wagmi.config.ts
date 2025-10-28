import { defineConfig } from '@wagmi/cli'
import { react } from '@wagmi/cli/plugins'
import { mintPsdnAbi, bridgeAbi, l2BridgeAbi, subnetControlPlaneAbi } from './src/generated'


export default defineConfig({
  out: 'src/generated.ts',
  contracts: [
 {
  name: "MintPSDN",
  abi: mintPsdnAbi,
  address: {
    1518: '0xe085464511D76AEB51Aa3f7c6DdE2B2C5A42Ad46',
    111811: '0x30f627A3de293d408E89D4C3E40a41bbF638bC36',
  },
 },

 {
  name: "Bridge",
  abi: bridgeAbi,
  address: {
    1518: '0x09E0A37b6A03a1561813DFdf3dA203e9bCc77232',
  },
 },

 {
  name: "L2Bridge",
  abi: l2BridgeAbi,
  address: {
    111811: '0x4200000000000000000000000000000000000010',
  }
 }, 

 {
  name: "SubnetControlPlane",
  abi: subnetControlPlaneAbi,
  address: {
    111811: '0xdC805e279e3A4C1F8d244858CaD99f4b5FF9cC0A',
  }
 }
  ],
  plugins: [ react() ],
})

