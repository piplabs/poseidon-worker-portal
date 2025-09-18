import { defineConfig } from '@wagmi/cli'
import { react } from '@wagmi/cli/plugins'
import { mintPsdnAbi, bridgeAbi, l2BridgeAbi } from './src/lib/abi'


export default defineConfig({
  out: 'src/generated.ts',
  contracts: [
 {
  name: "MintPSDN",
  abi: mintPsdnAbi,
  address: {
    1518: '0xe085464511D76AEB51Aa3f7c6DdE2B2C5A42Ad46',
    11711: '0x30f627A3de293d408E89D4C3E40a41bbF638bC36',
  },
 },

 {
  name: "Bridge",
  abi: bridgeAbi,
  address: {
    1518: '0xbB59cb9A7e0D88Ac5d04b7048b58f942aa058eae',
  },
 },

 {
  name: "L2Bridge",
  abi: l2BridgeAbi,
  address: {
    11711: '0x4200000000000000000000000000000000000010',
  }
 }
  ],
  plugins: [ react() ],
})
