export const KeeperFactoryAbi = [
  {
    inputs: [],
    name: 'FactoryNotInstanceError',
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
    inputs: [],
    name: 'KeeperFactoryAlreadyCreatedError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'KeeperFactoryInvalidIdError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'KeeperFactoryInvalidParameterError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'KeeperFactoryInvalidPayoffError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'KeeperFactoryInvalidSettleError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'KeeperFactoryNotCreatedError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'KeeperFactoryNotInstanceError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'KeeperFactoryVersionOutsideRangeError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'OwnableAlreadyInitializedError',
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
    name: 'OwnableNotOwnerError',
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
    name: 'OwnableNotPendingOwnerError',
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
    name: 'PausableNotPauserError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'PausablePausedError',
    type: 'error',
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
        indexed: true,
        internalType: 'contract IInstance',
        name: 'instance',
        type: 'address',
      },
    ],
    name: 'InstanceRegistered',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'id',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'underlyingId',
        type: 'bytes32',
      },
    ],
    name: 'OracleAssociated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'contract IOracleProvider',
        name: 'oracle',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'id',
        type: 'bytes32',
      },
    ],
    name: 'OracleCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnerUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'latestGranularity',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'currentGranularity',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'effectiveAfter',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'oracleFee',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'validFrom',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'validTo',
            type: 'uint256',
          },
        ],
        indexed: false,
        internalType: 'struct KeeperOracleParameter',
        name: 'newParameter',
        type: 'tuple',
      },
    ],
    name: 'ParameterUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [],
    name: 'Paused',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'newPauser',
        type: 'address',
      },
    ],
    name: 'PauserUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'contract IPayoffProvider',
        name: 'payoff',
        type: 'address',
      },
    ],
    name: 'PayoffRegistered',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'newPendingOwner',
        type: 'address',
      },
    ],
    name: 'PendingOwnerUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [],
    name: 'Unpaused',
    type: 'event',
  },
  {
    inputs: [],
    name: 'acceptOwner',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32[]',
        name: 'oracleIds',
        type: 'bytes32[]',
      },
      {
        internalType: 'uint256',
        name: 'version',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
    ],
    name: 'commit',
    outputs: [],
    stateMutability: 'payable',
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
    inputs: [
      {
        internalType: 'bytes32',
        name: 'oracleId',
        type: 'bytes32',
      },
      {
        internalType: 'bytes32',
        name: 'underlyingId',
        type: 'bytes32',
      },
      {
        components: [
          {
            internalType: 'contract IPayoffProvider',
            name: 'provider',
            type: 'address',
          },
          {
            internalType: 'int16',
            name: 'decimals',
            type: 'int16',
          },
        ],
        internalType: 'struct IKeeperFactory.PayoffDefinition',
        name: 'payoff',
        type: 'tuple',
      },
    ],
    name: 'create',
    outputs: [
      {
        internalType: 'contract IKeeperOracle',
        name: 'oracle',
        type: 'address',
      },
    ],
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
    name: 'factoryType',
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
        internalType: 'bytes32',
        name: 'underlyingId',
        type: 'bytes32',
      },
      {
        internalType: 'contract IPayoffProvider',
        name: 'payoff',
        type: 'address',
      },
    ],
    name: 'fromUnderlying',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'contract IOracleProvider',
        name: 'oracleProvider',
        type: 'address',
      },
    ],
    name: 'ids',
    outputs: [
      {
        internalType: 'bytes32',
        name: 'id',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'implementation',
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
        internalType: 'contract IOracleFactory',
        name: 'oracleFactory',
        type: 'address',
      },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'contract IInstance',
        name: 'instance',
        type: 'address',
      },
    ],
    name: 'instances',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'id',
        type: 'bytes32',
      },
    ],
    name: 'oracles',
    outputs: [
      {
        internalType: 'contract IOracleProvider',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
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
    inputs: [],
    name: 'parameter',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'latestGranularity',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'currentGranularity',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'effectiveAfter',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'oracleFee',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'validFrom',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'validTo',
            type: 'uint256',
          },
        ],
        internalType: 'struct KeeperOracleParameter',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'pause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'paused',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'pauser',
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
    inputs: [],
    name: 'pendingOwner',
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
        internalType: 'contract IPayoffProvider',
        name: 'payoff',
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
        internalType: 'bytes32[]',
        name: 'oracleIds',
        type: 'bytes32[]',
      },
      {
        internalType: 'uint256[]',
        name: 'versions',
        type: 'uint256[]',
      },
      {
        internalType: 'uint256[]',
        name: 'maxCounts',
        type: 'uint256[]',
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
    inputs: [
      {
        internalType: 'bytes32',
        name: 'oracleId',
        type: 'bytes32',
      },
    ],
    name: 'toUnderlyingId',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'oracleId',
        type: 'bytes32',
      },
    ],
    name: 'toUnderlyingPayoff',
    outputs: [
      {
        components: [
          {
            internalType: 'contract IPayoffProvider',
            name: 'provider',
            type: 'address',
          },
          {
            internalType: 'int16',
            name: 'decimals',
            type: 'int16',
          },
        ],
        internalType: 'struct IKeeperFactory.PayoffDefinition',
        name: 'payoff',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'unpause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'contract IOracleProvider',
        name: 'oracleProvider',
        type: 'address',
      },
      {
        internalType: 'bytes32',
        name: 'oracleId',
        type: 'bytes32',
      },
    ],
    name: 'updateId',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'newGranularity',
        type: 'uint256',
      },
      {
        internalType: 'UFixed6',
        name: 'newOracleFee',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'newValidFrom',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'newValidTo',
        type: 'uint256',
      },
    ],
    name: 'updateParameter',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newPauser',
        type: 'address',
      },
    ],
    name: 'updatePauser',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newPendingOwner',
        type: 'address',
      },
    ],
    name: 'updatePendingOwner',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const
