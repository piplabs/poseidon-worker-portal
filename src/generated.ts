import {
  createUseReadContract,
  createUseWriteContract,
  createUseSimulateContract,
  createUseWatchContractEvent,
} from 'wagmi/codegen'

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Bridge
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 *
 */
export const bridgeAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  { type: 'error', inputs: [], name: 'ProxyAdminOwnedBase_NotProxyAdmin' },
  {
    type: 'error',
    inputs: [],
    name: 'ProxyAdminOwnedBase_NotProxyAdminOrProxyAdminOwner',
  },
  { type: 'error', inputs: [], name: 'ProxyAdminOwnedBase_NotProxyAdminOwner' },
  {
    type: 'error',
    inputs: [],
    name: 'ProxyAdminOwnedBase_NotResolvedDelegateProxy',
  },
  {
    type: 'error',
    inputs: [],
    name: 'ProxyAdminOwnedBase_NotSharedProxyAdminOwner',
  },
  { type: 'error', inputs: [], name: 'ProxyAdminOwnedBase_ProxyAdminNotFound' },
  { type: 'error', inputs: [], name: 'ReinitializableBase_ZeroInitVersion' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'localToken',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'remoteToken',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: false },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'extraData',
        internalType: 'bytes',
        type: 'bytes',
        indexed: false,
      },
    ],
    name: 'ERC20BridgeFinalized',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'localToken',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'remoteToken',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: false },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'extraData',
        internalType: 'bytes',
        type: 'bytes',
        indexed: false,
      },
    ],
    name: 'ERC20BridgeInitiated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'l1Token',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'l2Token',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: false },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'extraData',
        internalType: 'bytes',
        type: 'bytes',
        indexed: false,
      },
    ],
    name: 'ERC20DepositInitiated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'l1Token',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'l2Token',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: false },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'extraData',
        internalType: 'bytes',
        type: 'bytes',
        indexed: false,
      },
    ],
    name: 'ERC20WithdrawalFinalized',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'extraData',
        internalType: 'bytes',
        type: 'bytes',
        indexed: false,
      },
    ],
    name: 'ETHBridgeFinalized',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'extraData',
        internalType: 'bytes',
        type: 'bytes',
        indexed: false,
      },
    ],
    name: 'ETHBridgeInitiated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'extraData',
        internalType: 'bytes',
        type: 'bytes',
        indexed: false,
      },
    ],
    name: 'ETHDepositInitiated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'extraData',
        internalType: 'bytes',
        type: 'bytes',
        indexed: false,
      },
    ],
    name: 'ETHWithdrawalFinalized',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'version', internalType: 'uint8', type: 'uint8', indexed: false },
    ],
    name: 'Initialized',
  },
  {
    type: 'function',
    inputs: [
      { name: '_localToken', internalType: 'address', type: 'address' },
      { name: '_remoteToken', internalType: 'address', type: 'address' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
      { name: '_minGasLimit', internalType: 'uint32', type: 'uint32' },
      { name: '_extraData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'bridgeERC20',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_localToken', internalType: 'address', type: 'address' },
      { name: '_remoteToken', internalType: 'address', type: 'address' },
      { name: '_to', internalType: 'address', type: 'address' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
      { name: '_minGasLimit', internalType: 'uint32', type: 'uint32' },
      { name: '_extraData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'bridgeERC20To',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_minGasLimit', internalType: 'uint32', type: 'uint32' },
      { name: '_extraData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'bridgeETH',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_to', internalType: 'address', type: 'address' },
      { name: '_minGasLimit', internalType: 'uint32', type: 'uint32' },
      { name: '_extraData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'bridgeETHTo',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_l1Token', internalType: 'address', type: 'address' },
      { name: '_l2Token', internalType: 'address', type: 'address' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
      { name: '_minGasLimit', internalType: 'uint32', type: 'uint32' },
      { name: '_extraData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'depositERC20',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_l1Token', internalType: 'address', type: 'address' },
      { name: '_l2Token', internalType: 'address', type: 'address' },
      { name: '_to', internalType: 'address', type: 'address' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
      { name: '_minGasLimit', internalType: 'uint32', type: 'uint32' },
      { name: '_extraData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'depositERC20To',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_minGasLimit', internalType: 'uint32', type: 'uint32' },
      { name: '_extraData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'depositETH',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_to', internalType: 'address', type: 'address' },
      { name: '_minGasLimit', internalType: 'uint32', type: 'uint32' },
      { name: '_extraData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'depositETHTo',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
    ],
    name: 'deposits',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_localToken', internalType: 'address', type: 'address' },
      { name: '_remoteToken', internalType: 'address', type: 'address' },
      { name: '_from', internalType: 'address', type: 'address' },
      { name: '_to', internalType: 'address', type: 'address' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
      { name: '_extraData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'finalizeBridgeERC20',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_from', internalType: 'address', type: 'address' },
      { name: '_to', internalType: 'address', type: 'address' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
      { name: '_extraData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'finalizeBridgeETH',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_l1Token', internalType: 'address', type: 'address' },
      { name: '_l2Token', internalType: 'address', type: 'address' },
      { name: '_from', internalType: 'address', type: 'address' },
      { name: '_to', internalType: 'address', type: 'address' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
      { name: '_extraData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'finalizeERC20Withdrawal',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_from', internalType: 'address', type: 'address' },
      { name: '_to', internalType: 'address', type: 'address' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
      { name: '_extraData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'finalizeETHWithdrawal',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'initVersion',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: '_messenger',
        internalType: 'contract ICrossDomainMessenger',
        type: 'address',
      },
      {
        name: '_systemConfig',
        internalType: 'contract ISystemConfig',
        type: 'address',
      },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'l2TokenBridge',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'messenger',
    outputs: [
      {
        name: '',
        internalType: 'contract ICrossDomainMessenger',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'otherBridge',
    outputs: [
      { name: '', internalType: 'contract StandardBridge', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'paused',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'proxyAdmin',
    outputs: [
      { name: '', internalType: 'contract IProxyAdmin', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'proxyAdminOwner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'superchainConfig',
    outputs: [
      { name: '', internalType: 'contract ISuperchainConfig', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'systemConfig',
    outputs: [
      { name: '', internalType: 'contract ISystemConfig', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: '_systemConfig',
        internalType: 'contract ISystemConfig',
        type: 'address',
      },
    ],
    name: 'upgrade',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'version',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  { type: 'receive', stateMutability: 'payable' },
] as const

/**
 *
 */
export const bridgeAddress = {
  1518: '0x09E0A37b6A03a1561813DFdf3dA203e9bCc77232',
} as const

/**
 *
 */
export const bridgeConfig = { address: bridgeAddress, abi: bridgeAbi } as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// L2Bridge
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 *
 */
export const l2BridgeAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'l1Token',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'l2Token',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: false },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'extraData',
        internalType: 'bytes',
        type: 'bytes',
        indexed: false,
      },
    ],
    name: 'DepositFinalized',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'localToken',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'remoteToken',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: false },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'extraData',
        internalType: 'bytes',
        type: 'bytes',
        indexed: false,
      },
    ],
    name: 'ERC20BridgeFinalized',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'localToken',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'remoteToken',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: false },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'extraData',
        internalType: 'bytes',
        type: 'bytes',
        indexed: false,
      },
    ],
    name: 'ERC20BridgeInitiated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'extraData',
        internalType: 'bytes',
        type: 'bytes',
        indexed: false,
      },
    ],
    name: 'ETHBridgeFinalized',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'extraData',
        internalType: 'bytes',
        type: 'bytes',
        indexed: false,
      },
    ],
    name: 'ETHBridgeInitiated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'version', internalType: 'uint8', type: 'uint8', indexed: false },
    ],
    name: 'Initialized',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'l1Token',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'l2Token',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: false },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'extraData',
        internalType: 'bytes',
        type: 'bytes',
        indexed: false,
      },
    ],
    name: 'WithdrawalInitiated',
  },
  {
    type: 'function',
    inputs: [
      { name: '_localToken', internalType: 'address', type: 'address' },
      { name: '_remoteToken', internalType: 'address', type: 'address' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
      { name: '_minGasLimit', internalType: 'uint32', type: 'uint32' },
      { name: '_extraData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'bridgeERC20',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_localToken', internalType: 'address', type: 'address' },
      { name: '_remoteToken', internalType: 'address', type: 'address' },
      { name: '_to', internalType: 'address', type: 'address' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
      { name: '_minGasLimit', internalType: 'uint32', type: 'uint32' },
      { name: '_extraData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'bridgeERC20To',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_minGasLimit', internalType: 'uint32', type: 'uint32' },
      { name: '_extraData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'bridgeETH',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_to', internalType: 'address', type: 'address' },
      { name: '_minGasLimit', internalType: 'uint32', type: 'uint32' },
      { name: '_extraData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'bridgeETHTo',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
    ],
    name: 'deposits',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_localToken', internalType: 'address', type: 'address' },
      { name: '_remoteToken', internalType: 'address', type: 'address' },
      { name: '_from', internalType: 'address', type: 'address' },
      { name: '_to', internalType: 'address', type: 'address' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
      { name: '_extraData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'finalizeBridgeERC20',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_from', internalType: 'address', type: 'address' },
      { name: '_to', internalType: 'address', type: 'address' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
      { name: '_extraData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'finalizeBridgeETH',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: '_otherBridge',
        internalType: 'contract StandardBridge',
        type: 'address',
      },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'l1TokenBridge',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'messenger',
    outputs: [
      {
        name: '',
        internalType: 'contract ICrossDomainMessenger',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'otherBridge',
    outputs: [
      { name: '', internalType: 'contract StandardBridge', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'paused',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'version',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: '_l2Token', internalType: 'address', type: 'address' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
      { name: '_minGasLimit', internalType: 'uint32', type: 'uint32' },
      { name: '_extraData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_l2Token', internalType: 'address', type: 'address' },
      { name: '_to', internalType: 'address', type: 'address' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
      { name: '_minGasLimit', internalType: 'uint32', type: 'uint32' },
      { name: '_extraData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'withdrawTo',
    outputs: [],
    stateMutability: 'payable',
  },
  { type: 'receive', stateMutability: 'payable' },
] as const

/**
 *
 */
export const l2BridgeAddress = {
  111811: '0x4200000000000000000000000000000000000010',
} as const

/**
 *
 */
export const l2BridgeConfig = {
  address: l2BridgeAddress,
  abi: l2BridgeAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// MintPSDN
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**

*/
export const mintPsdnAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  {
    type: 'error',
    inputs: [{ name: 'target', internalType: 'address', type: 'address' }],
    name: 'AddressEmptyCode',
  },
  { type: 'error', inputs: [], name: 'ECDSAInvalidSignature' },
  {
    type: 'error',
    inputs: [{ name: 'length', internalType: 'uint256', type: 'uint256' }],
    name: 'ECDSAInvalidSignatureLength',
  },
  {
    type: 'error',
    inputs: [{ name: 's', internalType: 'bytes32', type: 'bytes32' }],
    name: 'ECDSAInvalidSignatureS',
  },
  {
    type: 'error',
    inputs: [
      { name: 'implementation', internalType: 'address', type: 'address' },
    ],
    name: 'ERC1967InvalidImplementation',
  },
  { type: 'error', inputs: [], name: 'ERC1967NonPayable' },
  {
    type: 'error',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'allowance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC20InsufficientAllowance',
  },
  {
    type: 'error',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'balance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC20InsufficientBalance',
  },
  {
    type: 'error',
    inputs: [{ name: 'approver', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidApprover',
  },
  {
    type: 'error',
    inputs: [{ name: 'receiver', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidReceiver',
  },
  {
    type: 'error',
    inputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidSender',
  },
  {
    type: 'error',
    inputs: [{ name: 'spender', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidSpender',
  },
  {
    type: 'error',
    inputs: [{ name: 'deadline', internalType: 'uint256', type: 'uint256' }],
    name: 'ERC2612ExpiredSignature',
  },
  {
    type: 'error',
    inputs: [
      { name: 'signer', internalType: 'address', type: 'address' },
      { name: 'owner', internalType: 'address', type: 'address' },
    ],
    name: 'ERC2612InvalidSigner',
  },
  { type: 'error', inputs: [], name: 'FailedCall' },
  {
    type: 'error',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'currentNonce', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'InvalidAccountNonce',
  },
  { type: 'error', inputs: [], name: 'InvalidInitialization' },
  { type: 'error', inputs: [], name: 'NotInitializing' },
  {
    type: 'error',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'OwnableInvalidOwner',
  },
  {
    type: 'error',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'OwnableUnauthorizedAccount',
  },
  { type: 'error', inputs: [], name: 'UUPSUnauthorizedCallContext' },
  {
    type: 'error',
    inputs: [{ name: 'slot', internalType: 'bytes32', type: 'bytes32' }],
    name: 'UUPSUnsupportedProxiableUUID',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'spender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'value',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Approval',
  },
  { type: 'event', anonymous: false, inputs: [], name: 'EIP712DomainChanged' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'version',
        internalType: 'uint64',
        type: 'uint64',
        indexed: false,
      },
    ],
    name: 'Initialized',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'value',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Transfer',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'implementation',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'Upgraded',
  },
  {
    type: 'function',
    inputs: [],
    name: 'DOMAIN_SEPARATOR',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'UPGRADE_INTERFACE_VERSION',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'eip712Domain',
    outputs: [
      { name: 'fields', internalType: 'bytes1', type: 'bytes1' },
      { name: 'name', internalType: 'string', type: 'string' },
      { name: 'version', internalType: 'string', type: 'string' },
      { name: 'chainId', internalType: 'uint256', type: 'uint256' },
      { name: 'verifyingContract', internalType: 'address', type: 'address' },
      { name: 'salt', internalType: 'bytes32', type: 'bytes32' },
      { name: 'extensions', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'admin', internalType: 'address', type: 'address' }],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'nonces',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'deadline', internalType: 'uint256', type: 'uint256' },
      { name: 'v', internalType: 'uint8', type: 'uint8' },
      { name: 'r', internalType: 'bytes32', type: 'bytes32' },
      { name: 's', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'permit',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'proxiableUUID',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'newImplementation', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'upgradeToAndCall',
    outputs: [],
    stateMutability: 'payable',
  },
] as const

/**

*/
export const mintPsdnAddress = {
  1518: '0xe085464511D76AEB51Aa3f7c6DdE2B2C5A42Ad46',
  111811: '0x30f627A3de293d408E89D4C3E40a41bbF638bC36',
} as const

/**

*/
export const mintPsdnConfig = {
  address: mintPsdnAddress,
  abi: mintPsdnAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SubnetControlPlane
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 *
 */
export const subnetControlPlaneAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_poseidonToken', internalType: 'address', type: 'address' },
      { name: '_taskQueue', internalType: 'address', type: 'address' },
      { name: '_subnetTreasury', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'error',
    inputs: [{ name: 'target', internalType: 'address', type: 'address' }],
    name: 'AddressEmptyCode',
  },
  {
    type: 'error',
    inputs: [
      { name: 'implementation', internalType: 'address', type: 'address' },
    ],
    name: 'ERC1967InvalidImplementation',
  },
  { type: 'error', inputs: [], name: 'ERC1967NonPayable' },
  { type: 'error', inputs: [], name: 'FailedCall' },
  { type: 'error', inputs: [], name: 'InvalidInitialization' },
  { type: 'error', inputs: [], name: 'NotInitializing' },
  {
    type: 'error',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'OwnableInvalidOwner',
  },
  {
    type: 'error',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'OwnableUnauthorizedAccount',
  },
  { type: 'error', inputs: [], name: 'UUPSUnauthorizedCallContext' },
  {
    type: 'error',
    inputs: [{ name: 'slot', internalType: 'bytes32', type: 'bytes32' }],
    name: 'UUPSUnsupportedProxiableUUID',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'parameter',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
      {
        name: 'value',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'ConfigUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'newEpoch',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'activeWorkers',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'totalRewards',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'EpochAdvanced',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'version',
        internalType: 'uint64',
        type: 'uint64',
        indexed: false,
      },
    ],
    name: 'Initialized',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferStarted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'worker',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'epoch',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'RewardsClaimed',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'implementation',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'Upgraded',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'worker',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'activityId',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'activeCount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'WorkerActivityClaimed',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'worker',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'activityId',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      { name: 'success', internalType: 'bool', type: 'bool', indexed: false },
      {
        name: 'activeCount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'WorkerActivityCompleted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'worker',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'oldCapacity',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'newCapacity',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'WorkerCapacityUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'worker',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'activeTasks',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'timestamp',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'WorkerHeartbeat',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'worker',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'missedHeartbeats',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'WorkerJailed',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'worker',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'WorkerQueueCleared',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'worker',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'queueName',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'WorkerQueueUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'worker',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'stakedAmount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'capacity',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'queueName',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
      {
        name: 'epoch',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'WorkerRegistered',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'worker',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'WorkerUnjailed',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'worker',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'currentEpoch',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'effectiveEpoch',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'WorkerUnstakeRequested',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'worker',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'WorkerUnstaked',
  },
  {
    type: 'function',
    inputs: [],
    name: 'UPGRADE_INTERFACE_VERSION',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'acceptOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'advanceEpoch',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'canAdvanceEpoch',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'workerAddress', internalType: 'address', type: 'address' },
    ],
    name: 'checkAndUpdateWorkerStatus',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'epochId', internalType: 'uint256', type: 'uint256' }],
    name: 'claimRewards',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'worker', internalType: 'address', type: 'address' },
      { name: 'epochId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'claimRewardsFor',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'offset', internalType: 'uint256', type: 'uint256' },
      { name: 'limit', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getActiveWorkers',
    outputs: [{ name: '', internalType: 'address[]', type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getActiveWorkersCount',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getConfig',
    outputs: [
      {
        name: '',
        internalType: 'struct ISubnetControlPlane.Config',
        type: 'tuple',
        components: [
          { name: 'minimumStake', internalType: 'uint256', type: 'uint256' },
          { name: 'rewardsPerEpoch', internalType: 'uint256', type: 'uint256' },
          { name: 'epochInterval', internalType: 'uint256', type: 'uint256' },
          {
            name: 'maxActiveWorkers',
            internalType: 'uint256',
            type: 'uint256',
          },
          {
            name: 'heartbeatInterval',
            internalType: 'uint256',
            type: 'uint256',
          },
          {
            name: 'maxMissedHeartbeats',
            internalType: 'uint256',
            type: 'uint256',
          },
          { name: 'jailDuration', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getCurrentEpoch',
    outputs: [
      {
        name: '',
        internalType: 'struct ISubnetControlPlane.Epoch',
        type: 'tuple',
        components: [
          { name: 'epochId', internalType: 'uint256', type: 'uint256' },
          { name: 'startTime', internalType: 'uint256', type: 'uint256' },
          { name: 'endTime', internalType: 'uint256', type: 'uint256' },
          { name: 'totalStaked', internalType: 'uint256', type: 'uint256' },
          { name: 'totalRewards', internalType: 'uint256', type: 'uint256' },
          { name: 'finalized', internalType: 'bool', type: 'bool' },
          {
            name: 'activeWorkersCount',
            internalType: 'uint256',
            type: 'uint256',
          },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'epochId', internalType: 'uint256', type: 'uint256' }],
    name: 'getEpoch',
    outputs: [
      {
        name: '',
        internalType: 'struct ISubnetControlPlane.Epoch',
        type: 'tuple',
        components: [
          { name: 'epochId', internalType: 'uint256', type: 'uint256' },
          { name: 'startTime', internalType: 'uint256', type: 'uint256' },
          { name: 'endTime', internalType: 'uint256', type: 'uint256' },
          { name: 'totalStaked', internalType: 'uint256', type: 'uint256' },
          { name: 'totalRewards', internalType: 'uint256', type: 'uint256' },
          { name: 'finalized', internalType: 'bool', type: 'bool' },
          {
            name: 'activeWorkersCount',
            internalType: 'uint256',
            type: 'uint256',
          },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getMinimumStake',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getProtocolVersion',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: 'queueName', internalType: 'string', type: 'string' }],
    name: 'getQueueSubscribers',
    outputs: [
      { name: 'workers', internalType: 'address[]', type: 'address[]' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getTaskQueue',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'worker', internalType: 'address', type: 'address' }],
    name: 'getWorkerCapacity',
    outputs: [
      { name: 'capacity', internalType: 'uint256', type: 'uint256' },
      { name: 'activeCount', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'workerAddr', internalType: 'address', type: 'address' }],
    name: 'getWorkerInfo',
    outputs: [
      {
        name: '',
        internalType: 'struct ISubnetControlPlane.WorkerInfo',
        type: 'tuple',
        components: [
          { name: 'workerAddress', internalType: 'address', type: 'address' },
          { name: 'stakedAmount', internalType: 'uint256', type: 'uint256' },
          { name: 'registeredAt', internalType: 'uint256', type: 'uint256' },
          { name: 'lastHeartbeat', internalType: 'uint256', type: 'uint256' },
          { name: 'isActive', internalType: 'bool', type: 'bool' },
          { name: 'isJailed', internalType: 'bool', type: 'bool' },
          {
            name: 'missedHeartbeats',
            internalType: 'uint256',
            type: 'uint256',
          },
          {
            name: 'unstakeRequestedAt',
            internalType: 'uint256',
            type: 'uint256',
          },
          {
            name: 'unstakeEffectiveEpoch',
            internalType: 'uint256',
            type: 'uint256',
          },
          { name: 'unjailTime', internalType: 'uint256', type: 'uint256' },
          { name: 'capacity', internalType: 'uint256', type: 'uint256' },
          {
            name: 'activeActivityCount',
            internalType: 'uint256',
            type: 'uint256',
          },
          {
            name: 'totalActivitiesCompleted',
            internalType: 'uint256',
            type: 'uint256',
          },
          {
            name: 'totalActivitiesFailed',
            internalType: 'uint256',
            type: 'uint256',
          },
          {
            name: 'capacityLastUpdated',
            internalType: 'uint256',
            type: 'uint256',
          },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'worker', internalType: 'address', type: 'address' }],
    name: 'getWorkerQueue',
    outputs: [{ name: 'queueName', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'worker', internalType: 'address', type: 'address' },
      { name: 'epochId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getWorkerRewards',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'worker', internalType: 'address', type: 'address' }],
    name: 'getWorkerUnjailTime',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'initParams',
        internalType: 'struct ISubnetControlPlane.InitParams',
        type: 'tuple',
        components: [
          { name: 'admin', internalType: 'address', type: 'address' },
          { name: 'minimumStake', internalType: 'uint256', type: 'uint256' },
          { name: 'rewardsPerEpoch', internalType: 'uint256', type: 'uint256' },
          {
            name: 'maxActiveWorkers',
            internalType: 'uint256',
            type: 'uint256',
          },
          {
            name: 'heartbeatInterval',
            internalType: 'uint256',
            type: 'uint256',
          },
          {
            name: 'maxMissedHeartbeats',
            internalType: 'uint256',
            type: 'uint256',
          },
          { name: 'jailDuration', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'initParams',
        internalType: 'struct ISubnetControlPlane.InitParams',
        type: 'tuple',
        components: [
          { name: 'admin', internalType: 'address', type: 'address' },
          { name: 'minimumStake', internalType: 'uint256', type: 'uint256' },
          { name: 'rewardsPerEpoch', internalType: 'uint256', type: 'uint256' },
          {
            name: 'maxActiveWorkers',
            internalType: 'uint256',
            type: 'uint256',
          },
          {
            name: 'heartbeatInterval',
            internalType: 'uint256',
            type: 'uint256',
          },
          {
            name: 'maxMissedHeartbeats',
            internalType: 'uint256',
            type: 'uint256',
          },
          { name: 'jailDuration', internalType: 'uint256', type: 'uint256' },
        ],
      },
      { name: '_testMode', internalType: 'bool', type: 'bool' },
      { name: '_epochInterval', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'initializeWithTestMode',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'isTestMode',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'workerAddr', internalType: 'address', type: 'address' }],
    name: 'isWorkerActive',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'workerAddr', internalType: 'address', type: 'address' }],
    name: 'isWorkerJailed',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'workerAddr', internalType: 'address', type: 'address' }],
    name: 'isWorkerRegistered',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'worker', internalType: 'address', type: 'address' },
      { name: 'queueName', internalType: 'string', type: 'string' },
    ],
    name: 'isWorkerSubscribedToQueue',
    outputs: [{ name: 'subscribed', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'worker', internalType: 'address', type: 'address' },
      { name: 'activityId', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'onActivityClaimed',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'worker', internalType: 'address', type: 'address' },
      { name: 'activityId', internalType: 'bytes32', type: 'bytes32' },
      { name: 'success', internalType: 'bool', type: 'bool' },
    ],
    name: 'onActivityCompleted',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'pendingOwner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'poseidonToken',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'proxiableUUID',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'stakeAmount', internalType: 'uint256', type: 'uint256' },
      { name: 'capacity', internalType: 'uint256', type: 'uint256' },
      { name: 'queueName', internalType: 'string', type: 'string' },
    ],
    name: 'registerWorkerWithCapacity',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'requestUnstake',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'workerAddr', internalType: 'address', type: 'address' }],
    name: 'shouldBeJailed',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'subnetTreasury',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'queueName', internalType: 'string', type: 'string' }],
    name: 'subscribeToQueue',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'taskQueue',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'unsubscribeFromQueue',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'worker', internalType: 'address', type: 'address' }],
    name: 'unsubscribeWorkerFromQueue',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_epochInterval', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'updateEpochInterval',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_heartbeatInterval', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'updateHeartbeatInterval',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_maxActiveWorkers', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'updateMaxActiveWorkers',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: '_maxMissedHeartbeats',
        internalType: 'uint256',
        type: 'uint256',
      },
    ],
    name: 'updateMaxMissedHeartbeats',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_minimumStake', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'updateMinimumStake',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_rewardsPerEpoch', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'updateRewardsPerEpoch',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newCapacity', internalType: 'uint256', type: 'uint256' }],
    name: 'updateWorkerCapacity',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'newImplementation', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'upgradeToAndCall',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'workerAddress', internalType: 'address', type: 'address' },
    ],
    name: 'withdrawStake',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'queueName', internalType: 'string', type: 'string' },
      { name: 'idx', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'workerAt',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'activeTasks', internalType: 'uint256', type: 'uint256' }],
    name: 'workerHeartbeat',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'queueName', internalType: 'string', type: 'string' }],
    name: 'workerPoolSize',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const

/**
 *
 */
export const subnetControlPlaneAddress = {
  111811: '0x780caEECE73fF2f6D89d31f0a52aC4dAeA88fda2',
} as const

/**
 *
 */
export const subnetControlPlaneConfig = {
  address: subnetControlPlaneAddress,
  abi: subnetControlPlaneAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// React
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bridgeAbi}__
 *
 *
 */
export const useReadBridge = /*#__PURE__*/ createUseReadContract({
  abi: bridgeAbi,
  address: bridgeAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"deposits"`
 *
 *
 */
export const useReadBridgeDeposits = /*#__PURE__*/ createUseReadContract({
  abi: bridgeAbi,
  address: bridgeAddress,
  functionName: 'deposits',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"initVersion"`
 *
 *
 */
export const useReadBridgeInitVersion = /*#__PURE__*/ createUseReadContract({
  abi: bridgeAbi,
  address: bridgeAddress,
  functionName: 'initVersion',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"l2TokenBridge"`
 *
 *
 */
export const useReadBridgeL2TokenBridge = /*#__PURE__*/ createUseReadContract({
  abi: bridgeAbi,
  address: bridgeAddress,
  functionName: 'l2TokenBridge',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"messenger"`
 *
 *
 */
export const useReadBridgeMessenger = /*#__PURE__*/ createUseReadContract({
  abi: bridgeAbi,
  address: bridgeAddress,
  functionName: 'messenger',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"otherBridge"`
 *
 *
 */
export const useReadBridgeOtherBridge = /*#__PURE__*/ createUseReadContract({
  abi: bridgeAbi,
  address: bridgeAddress,
  functionName: 'otherBridge',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"paused"`
 *
 *
 */
export const useReadBridgePaused = /*#__PURE__*/ createUseReadContract({
  abi: bridgeAbi,
  address: bridgeAddress,
  functionName: 'paused',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"proxyAdmin"`
 *
 *
 */
export const useReadBridgeProxyAdmin = /*#__PURE__*/ createUseReadContract({
  abi: bridgeAbi,
  address: bridgeAddress,
  functionName: 'proxyAdmin',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"proxyAdminOwner"`
 *
 *
 */
export const useReadBridgeProxyAdminOwner = /*#__PURE__*/ createUseReadContract(
  { abi: bridgeAbi, address: bridgeAddress, functionName: 'proxyAdminOwner' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"superchainConfig"`
 *
 *
 */
export const useReadBridgeSuperchainConfig =
  /*#__PURE__*/ createUseReadContract({
    abi: bridgeAbi,
    address: bridgeAddress,
    functionName: 'superchainConfig',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"systemConfig"`
 *
 *
 */
export const useReadBridgeSystemConfig = /*#__PURE__*/ createUseReadContract({
  abi: bridgeAbi,
  address: bridgeAddress,
  functionName: 'systemConfig',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"version"`
 *
 *
 */
export const useReadBridgeVersion = /*#__PURE__*/ createUseReadContract({
  abi: bridgeAbi,
  address: bridgeAddress,
  functionName: 'version',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link bridgeAbi}__
 *
 *
 */
export const useWriteBridge = /*#__PURE__*/ createUseWriteContract({
  abi: bridgeAbi,
  address: bridgeAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"bridgeERC20"`
 *
 *
 */
export const useWriteBridgeBridgeErc20 = /*#__PURE__*/ createUseWriteContract({
  abi: bridgeAbi,
  address: bridgeAddress,
  functionName: 'bridgeERC20',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"bridgeERC20To"`
 *
 *
 */
export const useWriteBridgeBridgeErc20To = /*#__PURE__*/ createUseWriteContract(
  { abi: bridgeAbi, address: bridgeAddress, functionName: 'bridgeERC20To' },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"bridgeETH"`
 *
 *
 */
export const useWriteBridgeBridgeEth = /*#__PURE__*/ createUseWriteContract({
  abi: bridgeAbi,
  address: bridgeAddress,
  functionName: 'bridgeETH',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"bridgeETHTo"`
 *
 *
 */
export const useWriteBridgeBridgeEthTo = /*#__PURE__*/ createUseWriteContract({
  abi: bridgeAbi,
  address: bridgeAddress,
  functionName: 'bridgeETHTo',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"depositERC20"`
 *
 *
 */
export const useWriteBridgeDepositErc20 = /*#__PURE__*/ createUseWriteContract({
  abi: bridgeAbi,
  address: bridgeAddress,
  functionName: 'depositERC20',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"depositERC20To"`
 *
 *
 */
export const useWriteBridgeDepositErc20To =
  /*#__PURE__*/ createUseWriteContract({
    abi: bridgeAbi,
    address: bridgeAddress,
    functionName: 'depositERC20To',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"depositETH"`
 *
 *
 */
export const useWriteBridgeDepositEth = /*#__PURE__*/ createUseWriteContract({
  abi: bridgeAbi,
  address: bridgeAddress,
  functionName: 'depositETH',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"depositETHTo"`
 *
 *
 */
export const useWriteBridgeDepositEthTo = /*#__PURE__*/ createUseWriteContract({
  abi: bridgeAbi,
  address: bridgeAddress,
  functionName: 'depositETHTo',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"finalizeBridgeERC20"`
 *
 *
 */
export const useWriteBridgeFinalizeBridgeErc20 =
  /*#__PURE__*/ createUseWriteContract({
    abi: bridgeAbi,
    address: bridgeAddress,
    functionName: 'finalizeBridgeERC20',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"finalizeBridgeETH"`
 *
 *
 */
export const useWriteBridgeFinalizeBridgeEth =
  /*#__PURE__*/ createUseWriteContract({
    abi: bridgeAbi,
    address: bridgeAddress,
    functionName: 'finalizeBridgeETH',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"finalizeERC20Withdrawal"`
 *
 *
 */
export const useWriteBridgeFinalizeErc20Withdrawal =
  /*#__PURE__*/ createUseWriteContract({
    abi: bridgeAbi,
    address: bridgeAddress,
    functionName: 'finalizeERC20Withdrawal',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"finalizeETHWithdrawal"`
 *
 *
 */
export const useWriteBridgeFinalizeEthWithdrawal =
  /*#__PURE__*/ createUseWriteContract({
    abi: bridgeAbi,
    address: bridgeAddress,
    functionName: 'finalizeETHWithdrawal',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"initialize"`
 *
 *
 */
export const useWriteBridgeInitialize = /*#__PURE__*/ createUseWriteContract({
  abi: bridgeAbi,
  address: bridgeAddress,
  functionName: 'initialize',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"upgrade"`
 *
 *
 */
export const useWriteBridgeUpgrade = /*#__PURE__*/ createUseWriteContract({
  abi: bridgeAbi,
  address: bridgeAddress,
  functionName: 'upgrade',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link bridgeAbi}__
 *
 *
 */
export const useSimulateBridge = /*#__PURE__*/ createUseSimulateContract({
  abi: bridgeAbi,
  address: bridgeAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"bridgeERC20"`
 *
 *
 */
export const useSimulateBridgeBridgeErc20 =
  /*#__PURE__*/ createUseSimulateContract({
    abi: bridgeAbi,
    address: bridgeAddress,
    functionName: 'bridgeERC20',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"bridgeERC20To"`
 *
 *
 */
export const useSimulateBridgeBridgeErc20To =
  /*#__PURE__*/ createUseSimulateContract({
    abi: bridgeAbi,
    address: bridgeAddress,
    functionName: 'bridgeERC20To',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"bridgeETH"`
 *
 *
 */
export const useSimulateBridgeBridgeEth =
  /*#__PURE__*/ createUseSimulateContract({
    abi: bridgeAbi,
    address: bridgeAddress,
    functionName: 'bridgeETH',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"bridgeETHTo"`
 *
 *
 */
export const useSimulateBridgeBridgeEthTo =
  /*#__PURE__*/ createUseSimulateContract({
    abi: bridgeAbi,
    address: bridgeAddress,
    functionName: 'bridgeETHTo',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"depositERC20"`
 *
 *
 */
export const useSimulateBridgeDepositErc20 =
  /*#__PURE__*/ createUseSimulateContract({
    abi: bridgeAbi,
    address: bridgeAddress,
    functionName: 'depositERC20',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"depositERC20To"`
 *
 *
 */
export const useSimulateBridgeDepositErc20To =
  /*#__PURE__*/ createUseSimulateContract({
    abi: bridgeAbi,
    address: bridgeAddress,
    functionName: 'depositERC20To',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"depositETH"`
 *
 *
 */
export const useSimulateBridgeDepositEth =
  /*#__PURE__*/ createUseSimulateContract({
    abi: bridgeAbi,
    address: bridgeAddress,
    functionName: 'depositETH',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"depositETHTo"`
 *
 *
 */
export const useSimulateBridgeDepositEthTo =
  /*#__PURE__*/ createUseSimulateContract({
    abi: bridgeAbi,
    address: bridgeAddress,
    functionName: 'depositETHTo',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"finalizeBridgeERC20"`
 *
 *
 */
export const useSimulateBridgeFinalizeBridgeErc20 =
  /*#__PURE__*/ createUseSimulateContract({
    abi: bridgeAbi,
    address: bridgeAddress,
    functionName: 'finalizeBridgeERC20',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"finalizeBridgeETH"`
 *
 *
 */
export const useSimulateBridgeFinalizeBridgeEth =
  /*#__PURE__*/ createUseSimulateContract({
    abi: bridgeAbi,
    address: bridgeAddress,
    functionName: 'finalizeBridgeETH',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"finalizeERC20Withdrawal"`
 *
 *
 */
export const useSimulateBridgeFinalizeErc20Withdrawal =
  /*#__PURE__*/ createUseSimulateContract({
    abi: bridgeAbi,
    address: bridgeAddress,
    functionName: 'finalizeERC20Withdrawal',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"finalizeETHWithdrawal"`
 *
 *
 */
export const useSimulateBridgeFinalizeEthWithdrawal =
  /*#__PURE__*/ createUseSimulateContract({
    abi: bridgeAbi,
    address: bridgeAddress,
    functionName: 'finalizeETHWithdrawal',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"initialize"`
 *
 *
 */
export const useSimulateBridgeInitialize =
  /*#__PURE__*/ createUseSimulateContract({
    abi: bridgeAbi,
    address: bridgeAddress,
    functionName: 'initialize',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link bridgeAbi}__ and `functionName` set to `"upgrade"`
 *
 *
 */
export const useSimulateBridgeUpgrade = /*#__PURE__*/ createUseSimulateContract(
  { abi: bridgeAbi, address: bridgeAddress, functionName: 'upgrade' },
)

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link bridgeAbi}__
 *
 *
 */
export const useWatchBridgeEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: bridgeAbi,
  address: bridgeAddress,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link bridgeAbi}__ and `eventName` set to `"ERC20BridgeFinalized"`
 *
 *
 */
export const useWatchBridgeErc20BridgeFinalizedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: bridgeAbi,
    address: bridgeAddress,
    eventName: 'ERC20BridgeFinalized',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link bridgeAbi}__ and `eventName` set to `"ERC20BridgeInitiated"`
 *
 *
 */
export const useWatchBridgeErc20BridgeInitiatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: bridgeAbi,
    address: bridgeAddress,
    eventName: 'ERC20BridgeInitiated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link bridgeAbi}__ and `eventName` set to `"ERC20DepositInitiated"`
 *
 *
 */
export const useWatchBridgeErc20DepositInitiatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: bridgeAbi,
    address: bridgeAddress,
    eventName: 'ERC20DepositInitiated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link bridgeAbi}__ and `eventName` set to `"ERC20WithdrawalFinalized"`
 *
 *
 */
export const useWatchBridgeErc20WithdrawalFinalizedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: bridgeAbi,
    address: bridgeAddress,
    eventName: 'ERC20WithdrawalFinalized',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link bridgeAbi}__ and `eventName` set to `"ETHBridgeFinalized"`
 *
 *
 */
export const useWatchBridgeEthBridgeFinalizedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: bridgeAbi,
    address: bridgeAddress,
    eventName: 'ETHBridgeFinalized',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link bridgeAbi}__ and `eventName` set to `"ETHBridgeInitiated"`
 *
 *
 */
export const useWatchBridgeEthBridgeInitiatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: bridgeAbi,
    address: bridgeAddress,
    eventName: 'ETHBridgeInitiated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link bridgeAbi}__ and `eventName` set to `"ETHDepositInitiated"`
 *
 *
 */
export const useWatchBridgeEthDepositInitiatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: bridgeAbi,
    address: bridgeAddress,
    eventName: 'ETHDepositInitiated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link bridgeAbi}__ and `eventName` set to `"ETHWithdrawalFinalized"`
 *
 *
 */
export const useWatchBridgeEthWithdrawalFinalizedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: bridgeAbi,
    address: bridgeAddress,
    eventName: 'ETHWithdrawalFinalized',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link bridgeAbi}__ and `eventName` set to `"Initialized"`
 *
 *
 */
export const useWatchBridgeInitializedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: bridgeAbi,
    address: bridgeAddress,
    eventName: 'Initialized',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link l2BridgeAbi}__
 *
 *
 */
export const useReadL2Bridge = /*#__PURE__*/ createUseReadContract({
  abi: l2BridgeAbi,
  address: l2BridgeAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link l2BridgeAbi}__ and `functionName` set to `"deposits"`
 *
 *
 */
export const useReadL2BridgeDeposits = /*#__PURE__*/ createUseReadContract({
  abi: l2BridgeAbi,
  address: l2BridgeAddress,
  functionName: 'deposits',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link l2BridgeAbi}__ and `functionName` set to `"l1TokenBridge"`
 *
 *
 */
export const useReadL2BridgeL1TokenBridge = /*#__PURE__*/ createUseReadContract(
  { abi: l2BridgeAbi, address: l2BridgeAddress, functionName: 'l1TokenBridge' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link l2BridgeAbi}__ and `functionName` set to `"messenger"`
 *
 *
 */
export const useReadL2BridgeMessenger = /*#__PURE__*/ createUseReadContract({
  abi: l2BridgeAbi,
  address: l2BridgeAddress,
  functionName: 'messenger',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link l2BridgeAbi}__ and `functionName` set to `"otherBridge"`
 *
 *
 */
export const useReadL2BridgeOtherBridge = /*#__PURE__*/ createUseReadContract({
  abi: l2BridgeAbi,
  address: l2BridgeAddress,
  functionName: 'otherBridge',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link l2BridgeAbi}__ and `functionName` set to `"paused"`
 *
 *
 */
export const useReadL2BridgePaused = /*#__PURE__*/ createUseReadContract({
  abi: l2BridgeAbi,
  address: l2BridgeAddress,
  functionName: 'paused',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link l2BridgeAbi}__ and `functionName` set to `"version"`
 *
 *
 */
export const useReadL2BridgeVersion = /*#__PURE__*/ createUseReadContract({
  abi: l2BridgeAbi,
  address: l2BridgeAddress,
  functionName: 'version',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link l2BridgeAbi}__
 *
 *
 */
export const useWriteL2Bridge = /*#__PURE__*/ createUseWriteContract({
  abi: l2BridgeAbi,
  address: l2BridgeAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link l2BridgeAbi}__ and `functionName` set to `"bridgeERC20"`
 *
 *
 */
export const useWriteL2BridgeBridgeErc20 = /*#__PURE__*/ createUseWriteContract(
  { abi: l2BridgeAbi, address: l2BridgeAddress, functionName: 'bridgeERC20' },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link l2BridgeAbi}__ and `functionName` set to `"bridgeERC20To"`
 *
 *
 */
export const useWriteL2BridgeBridgeErc20To =
  /*#__PURE__*/ createUseWriteContract({
    abi: l2BridgeAbi,
    address: l2BridgeAddress,
    functionName: 'bridgeERC20To',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link l2BridgeAbi}__ and `functionName` set to `"bridgeETH"`
 *
 *
 */
export const useWriteL2BridgeBridgeEth = /*#__PURE__*/ createUseWriteContract({
  abi: l2BridgeAbi,
  address: l2BridgeAddress,
  functionName: 'bridgeETH',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link l2BridgeAbi}__ and `functionName` set to `"bridgeETHTo"`
 *
 *
 */
export const useWriteL2BridgeBridgeEthTo = /*#__PURE__*/ createUseWriteContract(
  { abi: l2BridgeAbi, address: l2BridgeAddress, functionName: 'bridgeETHTo' },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link l2BridgeAbi}__ and `functionName` set to `"finalizeBridgeERC20"`
 *
 *
 */
export const useWriteL2BridgeFinalizeBridgeErc20 =
  /*#__PURE__*/ createUseWriteContract({
    abi: l2BridgeAbi,
    address: l2BridgeAddress,
    functionName: 'finalizeBridgeERC20',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link l2BridgeAbi}__ and `functionName` set to `"finalizeBridgeETH"`
 *
 *
 */
export const useWriteL2BridgeFinalizeBridgeEth =
  /*#__PURE__*/ createUseWriteContract({
    abi: l2BridgeAbi,
    address: l2BridgeAddress,
    functionName: 'finalizeBridgeETH',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link l2BridgeAbi}__ and `functionName` set to `"initialize"`
 *
 *
 */
export const useWriteL2BridgeInitialize = /*#__PURE__*/ createUseWriteContract({
  abi: l2BridgeAbi,
  address: l2BridgeAddress,
  functionName: 'initialize',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link l2BridgeAbi}__ and `functionName` set to `"withdraw"`
 *
 *
 */
export const useWriteL2BridgeWithdraw = /*#__PURE__*/ createUseWriteContract({
  abi: l2BridgeAbi,
  address: l2BridgeAddress,
  functionName: 'withdraw',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link l2BridgeAbi}__ and `functionName` set to `"withdrawTo"`
 *
 *
 */
export const useWriteL2BridgeWithdrawTo = /*#__PURE__*/ createUseWriteContract({
  abi: l2BridgeAbi,
  address: l2BridgeAddress,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link l2BridgeAbi}__
 *
 *
 */
export const useSimulateL2Bridge = /*#__PURE__*/ createUseSimulateContract({
  abi: l2BridgeAbi,
  address: l2BridgeAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link l2BridgeAbi}__ and `functionName` set to `"bridgeERC20"`
 *
 *
 */
export const useSimulateL2BridgeBridgeErc20 =
  /*#__PURE__*/ createUseSimulateContract({
    abi: l2BridgeAbi,
    address: l2BridgeAddress,
    functionName: 'bridgeERC20',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link l2BridgeAbi}__ and `functionName` set to `"bridgeERC20To"`
 *
 *
 */
export const useSimulateL2BridgeBridgeErc20To =
  /*#__PURE__*/ createUseSimulateContract({
    abi: l2BridgeAbi,
    address: l2BridgeAddress,
    functionName: 'bridgeERC20To',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link l2BridgeAbi}__ and `functionName` set to `"bridgeETH"`
 *
 *
 */
export const useSimulateL2BridgeBridgeEth =
  /*#__PURE__*/ createUseSimulateContract({
    abi: l2BridgeAbi,
    address: l2BridgeAddress,
    functionName: 'bridgeETH',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link l2BridgeAbi}__ and `functionName` set to `"bridgeETHTo"`
 *
 *
 */
export const useSimulateL2BridgeBridgeEthTo =
  /*#__PURE__*/ createUseSimulateContract({
    abi: l2BridgeAbi,
    address: l2BridgeAddress,
    functionName: 'bridgeETHTo',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link l2BridgeAbi}__ and `functionName` set to `"finalizeBridgeERC20"`
 *
 *
 */
export const useSimulateL2BridgeFinalizeBridgeErc20 =
  /*#__PURE__*/ createUseSimulateContract({
    abi: l2BridgeAbi,
    address: l2BridgeAddress,
    functionName: 'finalizeBridgeERC20',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link l2BridgeAbi}__ and `functionName` set to `"finalizeBridgeETH"`
 *
 *
 */
export const useSimulateL2BridgeFinalizeBridgeEth =
  /*#__PURE__*/ createUseSimulateContract({
    abi: l2BridgeAbi,
    address: l2BridgeAddress,
    functionName: 'finalizeBridgeETH',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link l2BridgeAbi}__ and `functionName` set to `"initialize"`
 *
 *
 */
export const useSimulateL2BridgeInitialize =
  /*#__PURE__*/ createUseSimulateContract({
    abi: l2BridgeAbi,
    address: l2BridgeAddress,
    functionName: 'initialize',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link l2BridgeAbi}__ and `functionName` set to `"withdraw"`
 *
 *
 */
export const useSimulateL2BridgeWithdraw =
  /*#__PURE__*/ createUseSimulateContract({
    abi: l2BridgeAbi,
    address: l2BridgeAddress,
    functionName: 'withdraw',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link l2BridgeAbi}__ and `functionName` set to `"withdrawTo"`
 *
 *
 */
export const useSimulateL2BridgeWithdrawTo =
  /*#__PURE__*/ createUseSimulateContract({
    abi: l2BridgeAbi,
    address: l2BridgeAddress,
    functionName: 'withdrawTo',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link l2BridgeAbi}__
 *
 *
 */
export const useWatchL2BridgeEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: l2BridgeAbi,
  address: l2BridgeAddress,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link l2BridgeAbi}__ and `eventName` set to `"DepositFinalized"`
 *
 *
 */
export const useWatchL2BridgeDepositFinalizedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: l2BridgeAbi,
    address: l2BridgeAddress,
    eventName: 'DepositFinalized',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link l2BridgeAbi}__ and `eventName` set to `"ERC20BridgeFinalized"`
 *
 *
 */
export const useWatchL2BridgeErc20BridgeFinalizedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: l2BridgeAbi,
    address: l2BridgeAddress,
    eventName: 'ERC20BridgeFinalized',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link l2BridgeAbi}__ and `eventName` set to `"ERC20BridgeInitiated"`
 *
 *
 */
export const useWatchL2BridgeErc20BridgeInitiatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: l2BridgeAbi,
    address: l2BridgeAddress,
    eventName: 'ERC20BridgeInitiated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link l2BridgeAbi}__ and `eventName` set to `"ETHBridgeFinalized"`
 *
 *
 */
export const useWatchL2BridgeEthBridgeFinalizedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: l2BridgeAbi,
    address: l2BridgeAddress,
    eventName: 'ETHBridgeFinalized',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link l2BridgeAbi}__ and `eventName` set to `"ETHBridgeInitiated"`
 *
 *
 */
export const useWatchL2BridgeEthBridgeInitiatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: l2BridgeAbi,
    address: l2BridgeAddress,
    eventName: 'ETHBridgeInitiated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link l2BridgeAbi}__ and `eventName` set to `"Initialized"`
 *
 *
 */
export const useWatchL2BridgeInitializedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: l2BridgeAbi,
    address: l2BridgeAddress,
    eventName: 'Initialized',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link l2BridgeAbi}__ and `eventName` set to `"WithdrawalInitiated"`
 *
 *
 */
export const useWatchL2BridgeWithdrawalInitiatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: l2BridgeAbi,
    address: l2BridgeAddress,
    eventName: 'WithdrawalInitiated',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mintPsdnAbi}__
 */
export const useReadMintPsdn = /*#__PURE__*/ createUseReadContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"DOMAIN_SEPARATOR"`
 */
export const useReadMintPsdnDomainSeparator =
  /*#__PURE__*/ createUseReadContract({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    functionName: 'DOMAIN_SEPARATOR',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"UPGRADE_INTERFACE_VERSION"`
 */
export const useReadMintPsdnUpgradeInterfaceVersion =
  /*#__PURE__*/ createUseReadContract({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    functionName: 'UPGRADE_INTERFACE_VERSION',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"allowance"`
 */
export const useReadMintPsdnAllowance = /*#__PURE__*/ createUseReadContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
  functionName: 'allowance',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"balanceOf"`
 */
export const useReadMintPsdnBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"decimals"`
 */
export const useReadMintPsdnDecimals = /*#__PURE__*/ createUseReadContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
  functionName: 'decimals',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"eip712Domain"`
 */
export const useReadMintPsdnEip712Domain = /*#__PURE__*/ createUseReadContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
  functionName: 'eip712Domain',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"name"`
 */
export const useReadMintPsdnName = /*#__PURE__*/ createUseReadContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"nonces"`
 */
export const useReadMintPsdnNonces = /*#__PURE__*/ createUseReadContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
  functionName: 'nonces',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"owner"`
 */
export const useReadMintPsdnOwner = /*#__PURE__*/ createUseReadContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
  functionName: 'owner',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"proxiableUUID"`
 */
export const useReadMintPsdnProxiableUuid = /*#__PURE__*/ createUseReadContract(
  { abi: mintPsdnAbi, address: mintPsdnAddress, functionName: 'proxiableUUID' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"symbol"`
 */
export const useReadMintPsdnSymbol = /*#__PURE__*/ createUseReadContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
  functionName: 'symbol',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"totalSupply"`
 */
export const useReadMintPsdnTotalSupply = /*#__PURE__*/ createUseReadContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
  functionName: 'totalSupply',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mintPsdnAbi}__
 */
export const useWriteMintPsdn = /*#__PURE__*/ createUseWriteContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"approve"`
 */
export const useWriteMintPsdnApprove = /*#__PURE__*/ createUseWriteContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"initialize"`
 */
export const useWriteMintPsdnInitialize = /*#__PURE__*/ createUseWriteContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
  functionName: 'initialize',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"mint"`
 */
export const useWriteMintPsdnMint = /*#__PURE__*/ createUseWriteContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
  functionName: 'mint',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"permit"`
 */
export const useWriteMintPsdnPermit = /*#__PURE__*/ createUseWriteContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
  functionName: 'permit',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useWriteMintPsdnRenounceOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"transfer"`
 */
export const useWriteMintPsdnTransfer = /*#__PURE__*/ createUseWriteContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
  functionName: 'transfer',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"transferFrom"`
 */
export const useWriteMintPsdnTransferFrom =
  /*#__PURE__*/ createUseWriteContract({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useWriteMintPsdnTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"upgradeToAndCall"`
 */
export const useWriteMintPsdnUpgradeToAndCall =
  /*#__PURE__*/ createUseWriteContract({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    functionName: 'upgradeToAndCall',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mintPsdnAbi}__
 */
export const useSimulateMintPsdn = /*#__PURE__*/ createUseSimulateContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"approve"`
 */
export const useSimulateMintPsdnApprove =
  /*#__PURE__*/ createUseSimulateContract({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    functionName: 'approve',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"initialize"`
 */
export const useSimulateMintPsdnInitialize =
  /*#__PURE__*/ createUseSimulateContract({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    functionName: 'initialize',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"mint"`
 */
export const useSimulateMintPsdnMint = /*#__PURE__*/ createUseSimulateContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
  functionName: 'mint',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"permit"`
 */
export const useSimulateMintPsdnPermit =
  /*#__PURE__*/ createUseSimulateContract({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    functionName: 'permit',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useSimulateMintPsdnRenounceOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"transfer"`
 */
export const useSimulateMintPsdnTransfer =
  /*#__PURE__*/ createUseSimulateContract({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    functionName: 'transfer',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"transferFrom"`
 */
export const useSimulateMintPsdnTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useSimulateMintPsdnTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"upgradeToAndCall"`
 */
export const useSimulateMintPsdnUpgradeToAndCall =
  /*#__PURE__*/ createUseSimulateContract({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    functionName: 'upgradeToAndCall',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link mintPsdnAbi}__
 */
export const useWatchMintPsdnEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link mintPsdnAbi}__ and `eventName` set to `"Approval"`
 */
export const useWatchMintPsdnApprovalEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    eventName: 'Approval',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link mintPsdnAbi}__ and `eventName` set to `"EIP712DomainChanged"`
 */
export const useWatchMintPsdnEip712DomainChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    eventName: 'EIP712DomainChanged',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link mintPsdnAbi}__ and `eventName` set to `"Initialized"`
 */
export const useWatchMintPsdnInitializedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    eventName: 'Initialized',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link mintPsdnAbi}__ and `eventName` set to `"OwnershipTransferred"`
 */
export const useWatchMintPsdnOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link mintPsdnAbi}__ and `eventName` set to `"Transfer"`
 */
export const useWatchMintPsdnTransferEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    eventName: 'Transfer',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link mintPsdnAbi}__ and `eventName` set to `"Upgraded"`
 */
export const useWatchMintPsdnUpgradedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    eventName: 'Upgraded',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__
 *
 *
 */
export const useReadSubnetControlPlane = /*#__PURE__*/ createUseReadContract({
  abi: subnetControlPlaneAbi,
  address: subnetControlPlaneAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"UPGRADE_INTERFACE_VERSION"`
 *
 *
 */
export const useReadSubnetControlPlaneUpgradeInterfaceVersion =
  /*#__PURE__*/ createUseReadContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'UPGRADE_INTERFACE_VERSION',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"canAdvanceEpoch"`
 *
 *
 */
export const useReadSubnetControlPlaneCanAdvanceEpoch =
  /*#__PURE__*/ createUseReadContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'canAdvanceEpoch',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"getActiveWorkers"`
 *
 *
 */
export const useReadSubnetControlPlaneGetActiveWorkers =
  /*#__PURE__*/ createUseReadContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'getActiveWorkers',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"getActiveWorkersCount"`
 *
 *
 */
export const useReadSubnetControlPlaneGetActiveWorkersCount =
  /*#__PURE__*/ createUseReadContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'getActiveWorkersCount',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"getConfig"`
 *
 *
 */
export const useReadSubnetControlPlaneGetConfig =
  /*#__PURE__*/ createUseReadContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'getConfig',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"getCurrentEpoch"`
 *
 *
 */
export const useReadSubnetControlPlaneGetCurrentEpoch =
  /*#__PURE__*/ createUseReadContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'getCurrentEpoch',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"getEpoch"`
 *
 *
 */
export const useReadSubnetControlPlaneGetEpoch =
  /*#__PURE__*/ createUseReadContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'getEpoch',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"getMinimumStake"`
 *
 *
 */
export const useReadSubnetControlPlaneGetMinimumStake =
  /*#__PURE__*/ createUseReadContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'getMinimumStake',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"getProtocolVersion"`
 *
 *
 */
export const useReadSubnetControlPlaneGetProtocolVersion =
  /*#__PURE__*/ createUseReadContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'getProtocolVersion',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"getQueueSubscribers"`
 *
 *
 */
export const useReadSubnetControlPlaneGetQueueSubscribers =
  /*#__PURE__*/ createUseReadContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'getQueueSubscribers',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"getTaskQueue"`
 *
 *
 */
export const useReadSubnetControlPlaneGetTaskQueue =
  /*#__PURE__*/ createUseReadContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'getTaskQueue',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"getWorkerCapacity"`
 *
 *
 */
export const useReadSubnetControlPlaneGetWorkerCapacity =
  /*#__PURE__*/ createUseReadContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'getWorkerCapacity',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"getWorkerInfo"`
 *
 *
 */
export const useReadSubnetControlPlaneGetWorkerInfo =
  /*#__PURE__*/ createUseReadContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'getWorkerInfo',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"getWorkerQueue"`
 *
 *
 */
export const useReadSubnetControlPlaneGetWorkerQueue =
  /*#__PURE__*/ createUseReadContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'getWorkerQueue',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"getWorkerRewards"`
 *
 *
 */
export const useReadSubnetControlPlaneGetWorkerRewards =
  /*#__PURE__*/ createUseReadContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'getWorkerRewards',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"getWorkerUnjailTime"`
 *
 *
 */
export const useReadSubnetControlPlaneGetWorkerUnjailTime =
  /*#__PURE__*/ createUseReadContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'getWorkerUnjailTime',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"isTestMode"`
 *
 *
 */
export const useReadSubnetControlPlaneIsTestMode =
  /*#__PURE__*/ createUseReadContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'isTestMode',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"isWorkerActive"`
 *
 *
 */
export const useReadSubnetControlPlaneIsWorkerActive =
  /*#__PURE__*/ createUseReadContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'isWorkerActive',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"isWorkerJailed"`
 *
 *
 */
export const useReadSubnetControlPlaneIsWorkerJailed =
  /*#__PURE__*/ createUseReadContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'isWorkerJailed',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"isWorkerRegistered"`
 *
 *
 */
export const useReadSubnetControlPlaneIsWorkerRegistered =
  /*#__PURE__*/ createUseReadContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'isWorkerRegistered',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"isWorkerSubscribedToQueue"`
 *
 *
 */
export const useReadSubnetControlPlaneIsWorkerSubscribedToQueue =
  /*#__PURE__*/ createUseReadContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'isWorkerSubscribedToQueue',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"owner"`
 *
 *
 */
export const useReadSubnetControlPlaneOwner =
  /*#__PURE__*/ createUseReadContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'owner',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"pendingOwner"`
 *
 *
 */
export const useReadSubnetControlPlanePendingOwner =
  /*#__PURE__*/ createUseReadContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'pendingOwner',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"poseidonToken"`
 *
 *
 */
export const useReadSubnetControlPlanePoseidonToken =
  /*#__PURE__*/ createUseReadContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'poseidonToken',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"proxiableUUID"`
 *
 *
 */
export const useReadSubnetControlPlaneProxiableUuid =
  /*#__PURE__*/ createUseReadContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'proxiableUUID',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"shouldBeJailed"`
 *
 *
 */
export const useReadSubnetControlPlaneShouldBeJailed =
  /*#__PURE__*/ createUseReadContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'shouldBeJailed',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"subnetTreasury"`
 *
 *
 */
export const useReadSubnetControlPlaneSubnetTreasury =
  /*#__PURE__*/ createUseReadContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'subnetTreasury',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"taskQueue"`
 *
 *
 */
export const useReadSubnetControlPlaneTaskQueue =
  /*#__PURE__*/ createUseReadContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'taskQueue',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"workerAt"`
 *
 *
 */
export const useReadSubnetControlPlaneWorkerAt =
  /*#__PURE__*/ createUseReadContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'workerAt',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"workerPoolSize"`
 *
 *
 */
export const useReadSubnetControlPlaneWorkerPoolSize =
  /*#__PURE__*/ createUseReadContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'workerPoolSize',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__
 *
 *
 */
export const useWriteSubnetControlPlane = /*#__PURE__*/ createUseWriteContract({
  abi: subnetControlPlaneAbi,
  address: subnetControlPlaneAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"acceptOwnership"`
 *
 *
 */
export const useWriteSubnetControlPlaneAcceptOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'acceptOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"advanceEpoch"`
 *
 *
 */
export const useWriteSubnetControlPlaneAdvanceEpoch =
  /*#__PURE__*/ createUseWriteContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'advanceEpoch',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"checkAndUpdateWorkerStatus"`
 *
 *
 */
export const useWriteSubnetControlPlaneCheckAndUpdateWorkerStatus =
  /*#__PURE__*/ createUseWriteContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'checkAndUpdateWorkerStatus',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"claimRewards"`
 *
 *
 */
export const useWriteSubnetControlPlaneClaimRewards =
  /*#__PURE__*/ createUseWriteContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'claimRewards',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"claimRewardsFor"`
 *
 *
 */
export const useWriteSubnetControlPlaneClaimRewardsFor =
  /*#__PURE__*/ createUseWriteContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'claimRewardsFor',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"initialize"`
 *
 *
 */
export const useWriteSubnetControlPlaneInitialize =
  /*#__PURE__*/ createUseWriteContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'initialize',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"initializeWithTestMode"`
 *
 *
 */
export const useWriteSubnetControlPlaneInitializeWithTestMode =
  /*#__PURE__*/ createUseWriteContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'initializeWithTestMode',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"onActivityClaimed"`
 *
 *
 */
export const useWriteSubnetControlPlaneOnActivityClaimed =
  /*#__PURE__*/ createUseWriteContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'onActivityClaimed',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"onActivityCompleted"`
 *
 *
 */
export const useWriteSubnetControlPlaneOnActivityCompleted =
  /*#__PURE__*/ createUseWriteContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'onActivityCompleted',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"registerWorkerWithCapacity"`
 *
 *
 */
export const useWriteSubnetControlPlaneRegisterWorkerWithCapacity =
  /*#__PURE__*/ createUseWriteContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'registerWorkerWithCapacity',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 *
 */
export const useWriteSubnetControlPlaneRenounceOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"requestUnstake"`
 *
 *
 */
export const useWriteSubnetControlPlaneRequestUnstake =
  /*#__PURE__*/ createUseWriteContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'requestUnstake',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"subscribeToQueue"`
 *
 *
 */
export const useWriteSubnetControlPlaneSubscribeToQueue =
  /*#__PURE__*/ createUseWriteContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'subscribeToQueue',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"transferOwnership"`
 *
 *
 */
export const useWriteSubnetControlPlaneTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"unsubscribeFromQueue"`
 *
 *
 */
export const useWriteSubnetControlPlaneUnsubscribeFromQueue =
  /*#__PURE__*/ createUseWriteContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'unsubscribeFromQueue',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"unsubscribeWorkerFromQueue"`
 *
 *
 */
export const useWriteSubnetControlPlaneUnsubscribeWorkerFromQueue =
  /*#__PURE__*/ createUseWriteContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'unsubscribeWorkerFromQueue',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"updateEpochInterval"`
 *
 *
 */
export const useWriteSubnetControlPlaneUpdateEpochInterval =
  /*#__PURE__*/ createUseWriteContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'updateEpochInterval',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"updateHeartbeatInterval"`
 *
 *
 */
export const useWriteSubnetControlPlaneUpdateHeartbeatInterval =
  /*#__PURE__*/ createUseWriteContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'updateHeartbeatInterval',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"updateMaxActiveWorkers"`
 *
 *
 */
export const useWriteSubnetControlPlaneUpdateMaxActiveWorkers =
  /*#__PURE__*/ createUseWriteContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'updateMaxActiveWorkers',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"updateMaxMissedHeartbeats"`
 *
 *
 */
export const useWriteSubnetControlPlaneUpdateMaxMissedHeartbeats =
  /*#__PURE__*/ createUseWriteContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'updateMaxMissedHeartbeats',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"updateMinimumStake"`
 *
 *
 */
export const useWriteSubnetControlPlaneUpdateMinimumStake =
  /*#__PURE__*/ createUseWriteContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'updateMinimumStake',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"updateRewardsPerEpoch"`
 *
 *
 */
export const useWriteSubnetControlPlaneUpdateRewardsPerEpoch =
  /*#__PURE__*/ createUseWriteContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'updateRewardsPerEpoch',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"updateWorkerCapacity"`
 *
 *
 */
export const useWriteSubnetControlPlaneUpdateWorkerCapacity =
  /*#__PURE__*/ createUseWriteContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'updateWorkerCapacity',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"upgradeToAndCall"`
 *
 *
 */
export const useWriteSubnetControlPlaneUpgradeToAndCall =
  /*#__PURE__*/ createUseWriteContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'upgradeToAndCall',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"withdrawStake"`
 *
 *
 */
export const useWriteSubnetControlPlaneWithdrawStake =
  /*#__PURE__*/ createUseWriteContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'withdrawStake',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"workerHeartbeat"`
 *
 *
 */
export const useWriteSubnetControlPlaneWorkerHeartbeat =
  /*#__PURE__*/ createUseWriteContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'workerHeartbeat',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__
 *
 *
 */
export const useSimulateSubnetControlPlane =
  /*#__PURE__*/ createUseSimulateContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"acceptOwnership"`
 *
 *
 */
export const useSimulateSubnetControlPlaneAcceptOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'acceptOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"advanceEpoch"`
 *
 *
 */
export const useSimulateSubnetControlPlaneAdvanceEpoch =
  /*#__PURE__*/ createUseSimulateContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'advanceEpoch',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"checkAndUpdateWorkerStatus"`
 *
 *
 */
export const useSimulateSubnetControlPlaneCheckAndUpdateWorkerStatus =
  /*#__PURE__*/ createUseSimulateContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'checkAndUpdateWorkerStatus',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"claimRewards"`
 *
 *
 */
export const useSimulateSubnetControlPlaneClaimRewards =
  /*#__PURE__*/ createUseSimulateContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'claimRewards',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"claimRewardsFor"`
 *
 *
 */
export const useSimulateSubnetControlPlaneClaimRewardsFor =
  /*#__PURE__*/ createUseSimulateContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'claimRewardsFor',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"initialize"`
 *
 *
 */
export const useSimulateSubnetControlPlaneInitialize =
  /*#__PURE__*/ createUseSimulateContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'initialize',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"initializeWithTestMode"`
 *
 *
 */
export const useSimulateSubnetControlPlaneInitializeWithTestMode =
  /*#__PURE__*/ createUseSimulateContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'initializeWithTestMode',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"onActivityClaimed"`
 *
 *
 */
export const useSimulateSubnetControlPlaneOnActivityClaimed =
  /*#__PURE__*/ createUseSimulateContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'onActivityClaimed',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"onActivityCompleted"`
 *
 *
 */
export const useSimulateSubnetControlPlaneOnActivityCompleted =
  /*#__PURE__*/ createUseSimulateContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'onActivityCompleted',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"registerWorkerWithCapacity"`
 *
 *
 */
export const useSimulateSubnetControlPlaneRegisterWorkerWithCapacity =
  /*#__PURE__*/ createUseSimulateContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'registerWorkerWithCapacity',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 *
 */
export const useSimulateSubnetControlPlaneRenounceOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"requestUnstake"`
 *
 *
 */
export const useSimulateSubnetControlPlaneRequestUnstake =
  /*#__PURE__*/ createUseSimulateContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'requestUnstake',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"subscribeToQueue"`
 *
 *
 */
export const useSimulateSubnetControlPlaneSubscribeToQueue =
  /*#__PURE__*/ createUseSimulateContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'subscribeToQueue',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"transferOwnership"`
 *
 *
 */
export const useSimulateSubnetControlPlaneTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"unsubscribeFromQueue"`
 *
 *
 */
export const useSimulateSubnetControlPlaneUnsubscribeFromQueue =
  /*#__PURE__*/ createUseSimulateContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'unsubscribeFromQueue',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"unsubscribeWorkerFromQueue"`
 *
 *
 */
export const useSimulateSubnetControlPlaneUnsubscribeWorkerFromQueue =
  /*#__PURE__*/ createUseSimulateContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'unsubscribeWorkerFromQueue',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"updateEpochInterval"`
 *
 *
 */
export const useSimulateSubnetControlPlaneUpdateEpochInterval =
  /*#__PURE__*/ createUseSimulateContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'updateEpochInterval',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"updateHeartbeatInterval"`
 *
 *
 */
export const useSimulateSubnetControlPlaneUpdateHeartbeatInterval =
  /*#__PURE__*/ createUseSimulateContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'updateHeartbeatInterval',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"updateMaxActiveWorkers"`
 *
 *
 */
export const useSimulateSubnetControlPlaneUpdateMaxActiveWorkers =
  /*#__PURE__*/ createUseSimulateContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'updateMaxActiveWorkers',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"updateMaxMissedHeartbeats"`
 *
 *
 */
export const useSimulateSubnetControlPlaneUpdateMaxMissedHeartbeats =
  /*#__PURE__*/ createUseSimulateContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'updateMaxMissedHeartbeats',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"updateMinimumStake"`
 *
 *
 */
export const useSimulateSubnetControlPlaneUpdateMinimumStake =
  /*#__PURE__*/ createUseSimulateContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'updateMinimumStake',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"updateRewardsPerEpoch"`
 *
 *
 */
export const useSimulateSubnetControlPlaneUpdateRewardsPerEpoch =
  /*#__PURE__*/ createUseSimulateContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'updateRewardsPerEpoch',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"updateWorkerCapacity"`
 *
 *
 */
export const useSimulateSubnetControlPlaneUpdateWorkerCapacity =
  /*#__PURE__*/ createUseSimulateContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'updateWorkerCapacity',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"upgradeToAndCall"`
 *
 *
 */
export const useSimulateSubnetControlPlaneUpgradeToAndCall =
  /*#__PURE__*/ createUseSimulateContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'upgradeToAndCall',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"withdrawStake"`
 *
 *
 */
export const useSimulateSubnetControlPlaneWithdrawStake =
  /*#__PURE__*/ createUseSimulateContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'withdrawStake',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `functionName` set to `"workerHeartbeat"`
 *
 *
 */
export const useSimulateSubnetControlPlaneWorkerHeartbeat =
  /*#__PURE__*/ createUseSimulateContract({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    functionName: 'workerHeartbeat',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link subnetControlPlaneAbi}__
 *
 *
 */
export const useWatchSubnetControlPlaneEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `eventName` set to `"ConfigUpdated"`
 *
 *
 */
export const useWatchSubnetControlPlaneConfigUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    eventName: 'ConfigUpdated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `eventName` set to `"EpochAdvanced"`
 *
 *
 */
export const useWatchSubnetControlPlaneEpochAdvancedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    eventName: 'EpochAdvanced',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `eventName` set to `"Initialized"`
 *
 *
 */
export const useWatchSubnetControlPlaneInitializedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    eventName: 'Initialized',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `eventName` set to `"OwnershipTransferStarted"`
 *
 *
 */
export const useWatchSubnetControlPlaneOwnershipTransferStartedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    eventName: 'OwnershipTransferStarted',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `eventName` set to `"OwnershipTransferred"`
 *
 *
 */
export const useWatchSubnetControlPlaneOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `eventName` set to `"RewardsClaimed"`
 *
 *
 */
export const useWatchSubnetControlPlaneRewardsClaimedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    eventName: 'RewardsClaimed',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `eventName` set to `"Upgraded"`
 *
 *
 */
export const useWatchSubnetControlPlaneUpgradedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    eventName: 'Upgraded',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `eventName` set to `"WorkerActivityClaimed"`
 *
 *
 */
export const useWatchSubnetControlPlaneWorkerActivityClaimedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    eventName: 'WorkerActivityClaimed',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `eventName` set to `"WorkerActivityCompleted"`
 *
 *
 */
export const useWatchSubnetControlPlaneWorkerActivityCompletedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    eventName: 'WorkerActivityCompleted',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `eventName` set to `"WorkerCapacityUpdated"`
 *
 *
 */
export const useWatchSubnetControlPlaneWorkerCapacityUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    eventName: 'WorkerCapacityUpdated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `eventName` set to `"WorkerHeartbeat"`
 *
 *
 */
export const useWatchSubnetControlPlaneWorkerHeartbeatEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    eventName: 'WorkerHeartbeat',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `eventName` set to `"WorkerJailed"`
 *
 *
 */
export const useWatchSubnetControlPlaneWorkerJailedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    eventName: 'WorkerJailed',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `eventName` set to `"WorkerQueueCleared"`
 *
 *
 */
export const useWatchSubnetControlPlaneWorkerQueueClearedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    eventName: 'WorkerQueueCleared',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `eventName` set to `"WorkerQueueUpdated"`
 *
 *
 */
export const useWatchSubnetControlPlaneWorkerQueueUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    eventName: 'WorkerQueueUpdated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `eventName` set to `"WorkerRegistered"`
 *
 *
 */
export const useWatchSubnetControlPlaneWorkerRegisteredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    eventName: 'WorkerRegistered',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `eventName` set to `"WorkerUnjailed"`
 *
 *
 */
export const useWatchSubnetControlPlaneWorkerUnjailedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    eventName: 'WorkerUnjailed',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `eventName` set to `"WorkerUnstakeRequested"`
 *
 *
 */
export const useWatchSubnetControlPlaneWorkerUnstakeRequestedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    eventName: 'WorkerUnstakeRequested',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link subnetControlPlaneAbi}__ and `eventName` set to `"WorkerUnstaked"`
 *
 *
 */
export const useWatchSubnetControlPlaneWorkerUnstakedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: subnetControlPlaneAbi,
    address: subnetControlPlaneAddress,
    eventName: 'WorkerUnstaked',
  })
