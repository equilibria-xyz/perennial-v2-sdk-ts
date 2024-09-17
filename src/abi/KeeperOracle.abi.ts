export const KeeperOracleAbi = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'timeout_',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'DivisionByZero',
    type: 'error',
  },
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
    name: 'KeeperOracleInvalidCallbackError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'KeeperOracleInvalidPriceError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'KeeperOracleNoPriorRequestsError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'KeeperOracleNotOracleError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'KeeperOracleVersionOutsideRangeError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'OracleProviderUnauthorizedError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'PriceResponseStorageInvalidError',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        components: [
          {
            internalType: 'contract IMarket',
            name: 'market',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'account',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'version',
            type: 'uint256',
          },
        ],
        indexed: true,
        internalType: 'struct IKeeperOracle.SettlementCallback',
        name: 'callback',
        type: 'tuple',
      },
    ],
    name: 'CallbackFulfilled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        components: [
          {
            internalType: 'contract IMarket',
            name: 'market',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'account',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'version',
            type: 'uint256',
          },
        ],
        indexed: true,
        internalType: 'struct IKeeperOracle.SettlementCallback',
        name: 'callback',
        type: 'tuple',
      },
    ],
    name: 'CallbackRequested',
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
        name: 'newOracle',
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
        name: '',
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
        name: 'version',
        type: 'tuple',
      },
      {
        internalType: 'address',
        name: 'receiver',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'value',
        type: 'uint256',
      },
    ],
    name: 'commit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'commitmentGasOracle',
    outputs: [
      {
        internalType: 'contract IGasOracle',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
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
            internalType: 'uint64',
            name: 'latestVersion',
            type: 'uint64',
          },
          {
            internalType: 'uint64',
            name: 'currentIndex',
            type: 'uint64',
          },
          {
            internalType: 'uint64',
            name: 'latestIndex',
            type: 'uint64',
          },
        ],
        internalType: 'struct IKeeperOracle.KeeperOracleGlobal',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
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
        name: 'latestVersion',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'version',
        type: 'uint256',
      },
    ],
    name: 'localCallbacks',
    outputs: [
      {
        internalType: 'address[]',
        name: '',
        type: 'address[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'next',
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
    name: 'oracle',
    outputs: [
      {
        internalType: 'contract IOracle',
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
        internalType: 'contract IOracle',
        name: 'newOracle',
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
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'requests',
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
    inputs: [
      {
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'responses',
    outputs: [
      {
        components: [
          {
            internalType: 'Fixed6',
            name: 'price',
            type: 'int256',
          },
          {
            internalType: 'UFixed6',
            name: 'syncFee',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'asyncFee',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'oracleFee',
            type: 'uint256',
          },
          {
            internalType: 'bool',
            name: 'valid',
            type: 'bool',
          },
        ],
        internalType: 'struct PriceResponse',
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
        internalType: 'uint256',
        name: 'version',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'maxCount',
        type: 'uint256',
      },
    ],
    name: 'settle',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'settlementGasOracle',
    outputs: [
      {
        internalType: 'contract IGasOracle',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
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
        name: '',
        type: 'tuple',
      },
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
    name: 'timeout',
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
] as const
