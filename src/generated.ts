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
  1518: '0xbB59cb9A7e0D88Ac5d04b7048b58f942aa058eae',
} as const

/**
 *
 */
export const bridgeConfig = { address: bridgeAddress, abi: bridgeAbi } as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// MintPSDN
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 *
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
 *
 */
export const mintPsdnAddress = {
  1518: '0xe085464511D76AEB51Aa3f7c6DdE2B2C5A42Ad46',
} as const

/**
 *
 */
export const mintPsdnConfig = {
  address: mintPsdnAddress,
  abi: mintPsdnAbi,
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
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mintPsdnAbi}__
 *
 *
 */
export const useReadMintPsdn = /*#__PURE__*/ createUseReadContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"DOMAIN_SEPARATOR"`
 *
 *
 */
export const useReadMintPsdnDomainSeparator =
  /*#__PURE__*/ createUseReadContract({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    functionName: 'DOMAIN_SEPARATOR',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"UPGRADE_INTERFACE_VERSION"`
 *
 *
 */
export const useReadMintPsdnUpgradeInterfaceVersion =
  /*#__PURE__*/ createUseReadContract({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    functionName: 'UPGRADE_INTERFACE_VERSION',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"allowance"`
 *
 *
 */
export const useReadMintPsdnAllowance = /*#__PURE__*/ createUseReadContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
  functionName: 'allowance',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"balanceOf"`
 *
 *
 */
export const useReadMintPsdnBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"decimals"`
 *
 *
 */
export const useReadMintPsdnDecimals = /*#__PURE__*/ createUseReadContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
  functionName: 'decimals',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"eip712Domain"`
 *
 *
 */
export const useReadMintPsdnEip712Domain = /*#__PURE__*/ createUseReadContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
  functionName: 'eip712Domain',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"name"`
 *
 *
 */
export const useReadMintPsdnName = /*#__PURE__*/ createUseReadContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"nonces"`
 *
 *
 */
export const useReadMintPsdnNonces = /*#__PURE__*/ createUseReadContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
  functionName: 'nonces',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"owner"`
 *
 *
 */
export const useReadMintPsdnOwner = /*#__PURE__*/ createUseReadContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
  functionName: 'owner',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"proxiableUUID"`
 *
 *
 */
export const useReadMintPsdnProxiableUuid = /*#__PURE__*/ createUseReadContract(
  { abi: mintPsdnAbi, address: mintPsdnAddress, functionName: 'proxiableUUID' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"symbol"`
 *
 *
 */
export const useReadMintPsdnSymbol = /*#__PURE__*/ createUseReadContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
  functionName: 'symbol',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"totalSupply"`
 *
 *
 */
export const useReadMintPsdnTotalSupply = /*#__PURE__*/ createUseReadContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
  functionName: 'totalSupply',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mintPsdnAbi}__
 *
 *
 */
export const useWriteMintPsdn = /*#__PURE__*/ createUseWriteContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"approve"`
 *
 *
 */
export const useWriteMintPsdnApprove = /*#__PURE__*/ createUseWriteContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"initialize"`
 *
 *
 */
export const useWriteMintPsdnInitialize = /*#__PURE__*/ createUseWriteContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
  functionName: 'initialize',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"mint"`
 *
 *
 */
export const useWriteMintPsdnMint = /*#__PURE__*/ createUseWriteContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
  functionName: 'mint',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"permit"`
 *
 *
 */
export const useWriteMintPsdnPermit = /*#__PURE__*/ createUseWriteContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
  functionName: 'permit',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 *
 */
export const useWriteMintPsdnRenounceOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"transfer"`
 *
 *
 */
export const useWriteMintPsdnTransfer = /*#__PURE__*/ createUseWriteContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
  functionName: 'transfer',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"transferFrom"`
 *
 *
 */
export const useWriteMintPsdnTransferFrom =
  /*#__PURE__*/ createUseWriteContract({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"transferOwnership"`
 *
 *
 */
export const useWriteMintPsdnTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"upgradeToAndCall"`
 *
 *
 */
export const useWriteMintPsdnUpgradeToAndCall =
  /*#__PURE__*/ createUseWriteContract({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    functionName: 'upgradeToAndCall',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mintPsdnAbi}__
 *
 *
 */
export const useSimulateMintPsdn = /*#__PURE__*/ createUseSimulateContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"approve"`
 *
 *
 */
export const useSimulateMintPsdnApprove =
  /*#__PURE__*/ createUseSimulateContract({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    functionName: 'approve',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"initialize"`
 *
 *
 */
export const useSimulateMintPsdnInitialize =
  /*#__PURE__*/ createUseSimulateContract({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    functionName: 'initialize',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"mint"`
 *
 *
 */
export const useSimulateMintPsdnMint = /*#__PURE__*/ createUseSimulateContract({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
  functionName: 'mint',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"permit"`
 *
 *
 */
export const useSimulateMintPsdnPermit =
  /*#__PURE__*/ createUseSimulateContract({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    functionName: 'permit',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 *
 */
export const useSimulateMintPsdnRenounceOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"transfer"`
 *
 *
 */
export const useSimulateMintPsdnTransfer =
  /*#__PURE__*/ createUseSimulateContract({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    functionName: 'transfer',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"transferFrom"`
 *
 *
 */
export const useSimulateMintPsdnTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"transferOwnership"`
 *
 *
 */
export const useSimulateMintPsdnTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mintPsdnAbi}__ and `functionName` set to `"upgradeToAndCall"`
 *
 *
 */
export const useSimulateMintPsdnUpgradeToAndCall =
  /*#__PURE__*/ createUseSimulateContract({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    functionName: 'upgradeToAndCall',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link mintPsdnAbi}__
 *
 *
 */
export const useWatchMintPsdnEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: mintPsdnAbi,
  address: mintPsdnAddress,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link mintPsdnAbi}__ and `eventName` set to `"Approval"`
 *
 *
 */
export const useWatchMintPsdnApprovalEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    eventName: 'Approval',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link mintPsdnAbi}__ and `eventName` set to `"EIP712DomainChanged"`
 *
 *
 */
export const useWatchMintPsdnEip712DomainChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    eventName: 'EIP712DomainChanged',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link mintPsdnAbi}__ and `eventName` set to `"Initialized"`
 *
 *
 */
export const useWatchMintPsdnInitializedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    eventName: 'Initialized',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link mintPsdnAbi}__ and `eventName` set to `"OwnershipTransferred"`
 *
 *
 */
export const useWatchMintPsdnOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link mintPsdnAbi}__ and `eventName` set to `"Transfer"`
 *
 *
 */
export const useWatchMintPsdnTransferEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    eventName: 'Transfer',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link mintPsdnAbi}__ and `eventName` set to `"Upgraded"`
 *
 *
 */
export const useWatchMintPsdnUpgradedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: mintPsdnAbi,
    address: mintPsdnAddress,
    eventName: 'Upgraded',
  })
