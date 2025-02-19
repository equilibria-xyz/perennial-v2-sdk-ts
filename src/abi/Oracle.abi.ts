export const OracleAbi = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'version',
        type: 'uint256',
      },
    ],
    name: 'InitializableAlreadyInitializedError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InitializableNotInitializingError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InitializableZeroVersionError',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
    ],
    name: 'InstanceNotFactoryError',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
    ],
    name: 'InstanceNotOwnerError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InstancePausedError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'OracleNotBeneficiaryError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'OracleNotMarketError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'OracleNotSubOracleError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'OracleOutOfOrderCommitError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'OracleOutOfSyncError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'OracleProviderUnauthorizedError',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'newBeneficiary',
        type: 'address',
      },
    ],
    name: 'BeneficiaryUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'UFixed6',
        name: 'settlementFee',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'UFixed6',
        name: 'oracleFee',
        type: 'uint256',
      },
    ],
    name: 'FeeReceived',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'version',
        type: 'uint256',
      },
    ],
    name: 'Initialized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'contract IMarket',
        name: 'newMarket',
        type: 'address',
      },
    ],
    name: 'MarketUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'timestamp',
            type: 'uint256',
          },
          {
            internalType: 'Fixed6',
            name: 'price',
            type: 'int256',
          },
          {
            internalType: 'bool',
            name: 'valid',
            type: 'bool',
          },
        ],
        indexed: false,
        internalType: 'struct OracleVersion',
        name: 'version',
        type: 'tuple',
      },
    ],
    name: 'OracleProviderVersionFulfilled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'version',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'bool',
        name: 'newPrice',
        type: 'bool',
      },
    ],
    name: 'OracleProviderVersionRequested',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'contract IOracleProvider',
        name: 'newProvider',
        type: 'address',
      },
    ],
    name: 'OracleUpdated',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'at',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'timestamp',
            type: 'uint256',
          },
          {
            internalType: 'Fixed6',
            name: 'price',
            type: 'int256',
          },
          {
            internalType: 'bool',
            name: 'valid',
            type: 'bool',
          },
        ],
        internalType: 'struct OracleVersion',
        name: 'atVersion',
        type: 'tuple',
      },
      {
        components: [
          {
            internalType: 'UFixed6',
            name: 'settlementFee',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'oracleFee',
            type: 'uint256',
          },
        ],
        internalType: 'struct OracleReceipt',
        name: 'atReceipt',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'beneficiary',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'UFixed6',
        name: 'settlementFeeRequested',
        type: 'uint256',
      },
    ],
    name: 'claimFee',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'current',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'factory',
    outputs: [
      {
        internalType: 'contract IFactory',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'global',
    outputs: [
      {
        components: [
          {
            internalType: 'uint128',
            name: 'current',
            type: 'uint128',
          },
          {
            internalType: 'uint128',
            name: 'latest',
            type: 'uint128',
          },
        ],
        internalType: 'struct IOracle.OracleGlobal',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'contract IOracleProvider',
        name: 'initialProvider',
        type: 'address',
      },
      {
        internalType: 'string',
        name: 'name_',
        type: 'string',
      },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'latest',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'timestamp',
            type: 'uint256',
          },
          {
            internalType: 'Fixed6',
            name: 'price',
            type: 'int256',
          },
          {
            internalType: 'bool',
            name: 'valid',
            type: 'bool',
          },
        ],
        internalType: 'struct OracleVersion',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'market',
    outputs: [
      {
        internalType: 'contract IMarket',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'oracles',
    outputs: [
      {
        internalType: 'contract IOracleProvider',
        name: 'provider',
        type: 'address',
      },
      {
        internalType: 'uint96',
        name: 'timestamp',
        type: 'uint96',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'contract IMarket',
        name: 'newMarket',
        type: 'address',
      },
    ],
    name: 'register',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'contract IMarket',
        name: '',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'request',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'status',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'timestamp',
            type: 'uint256',
          },
          {
            internalType: 'Fixed6',
            name: 'price',
            type: 'int256',
          },
          {
            internalType: 'bool',
            name: 'valid',
            type: 'bool',
          },
        ],
        internalType: 'struct OracleVersion',
        name: 'latestVersion',
        type: 'tuple',
      },
      {
        internalType: 'uint256',
        name: 'currentTimestamp',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'contract IOracleProvider',
        name: 'newProvider',
        type: 'address',
      },
    ],
    name: 'update',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newBeneficiary',
        type: 'address',
      },
    ],
    name: 'updateBeneficiary',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'Token18',
        name: 'token',
        type: 'address',
      },
    ],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const
