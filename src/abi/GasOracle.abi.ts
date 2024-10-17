export const GasOracleAbi = [
  {
    inputs: [
      {
        internalType: 'contract AggregatorV3Interface',
        name: 'feed',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'decimals',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'computeGas',
        type: 'uint256',
      },
      {
        internalType: 'UFixed18',
        name: 'computeMultiplier',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'computeBase',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'calldataGas',
        type: 'uint256',
      },
      {
        internalType: 'UFixed18',
        name: 'calldataMultiplier',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'calldataBase',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      {
        internalType: 'int256',
        name: 'value',
        type: 'int256',
      },
    ],
    name: 'UFixed18UnderflowError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'CALLDATA_GAS',
    outputs: [
      {
        internalType: 'UFixed18',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'COMPUTE_GAS',
    outputs: [
      {
        internalType: 'UFixed18',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'FEED',
    outputs: [
      {
        internalType: 'contract AggregatorV3Interface',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'FEED_OFFSET',
    outputs: [
      {
        internalType: 'int256',
        name: '',
        type: 'int256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'value',
        type: 'uint256',
      },
    ],
    name: 'cost',
    outputs: [
      {
        internalType: 'UFixed18',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const
