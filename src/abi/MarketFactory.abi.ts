export const MarketFactoryAbi = [
  {
    inputs: [
      {
        internalType: 'contract IFactory',
        name: 'oracleFactory_',
        type: 'address',
      },
      {
        internalType: 'contract IVerifier',
        name: 'verifier_',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'implementation_',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'FactoryAlreadyRegisteredError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'FactoryInvalidOracleError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'FactoryInvalidPayoffError',
    type: 'error',
  },
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
    name: 'MarketFactoryInvalidReferralFeeError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MarketFactoryInvalidSignerError',
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
    inputs: [],
    name: 'ProtocolParameterStorageInvalidError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ProtocolParameterStorageInvalidError',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'operator',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bool',
        name: 'newEnabled',
        type: 'bool',
      },
    ],
    name: 'ExtensionUpdated',
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
        internalType: 'contract IMarket',
        name: 'market',
        type: 'address',
      },
      {
        components: [
          {
            internalType: 'Token18',
            name: 'token',
            type: 'address',
          },
          {
            internalType: 'contract IOracleProvider',
            name: 'oracle',
            type: 'address',
          },
        ],
        indexed: false,
        internalType: 'struct IMarket.MarketDefinition',
        name: 'definition',
        type: 'tuple',
      },
    ],
    name: 'MarketCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'operator',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bool',
        name: 'newEnabled',
        type: 'bool',
      },
    ],
    name: 'OperatorUpdated',
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
            internalType: 'UFixed6',
            name: 'maxFee',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'maxFeeAbsolute',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'maxCut',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'maxRate',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'minMaintenance',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'minEfficiency',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'referralFee',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'minScale',
            type: 'uint256',
          },
        ],
        indexed: false,
        internalType: 'struct ProtocolParameter',
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
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'referrer',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'UFixed6',
        name: 'newFee',
        type: 'uint256',
      },
    ],
    name: 'ReferralFeeUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'signer',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bool',
        name: 'newEnabled',
        type: 'bool',
      },
    ],
    name: 'SignerUpdated',
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
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'signer',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'orderReferrer',
        type: 'address',
      },
    ],
    name: 'authorization',
    outputs: [
      {
        internalType: 'bool',
        name: 'isOperator',
        type: 'bool',
      },
      {
        internalType: 'bool',
        name: 'isSigner',
        type: 'bool',
      },
      {
        internalType: 'UFixed6',
        name: 'orderReferralFee',
        type: 'uint256',
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
            internalType: 'Token18',
            name: 'token',
            type: 'address',
          },
          {
            internalType: 'contract IOracleProvider',
            name: 'oracle',
            type: 'address',
          },
        ],
        internalType: 'struct IMarket.MarketDefinition',
        name: 'definition',
        type: 'tuple',
      },
    ],
    name: 'create',
    outputs: [
      {
        internalType: 'contract IMarket',
        name: 'newMarket',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'extensions',
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
    inputs: [],
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
        internalType: 'contract IOracleProvider',
        name: 'oracle',
        type: 'address',
      },
    ],
    name: 'markets',
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
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'operators',
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
    name: 'oracleFactory',
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
            internalType: 'UFixed6',
            name: 'maxFee',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'maxFeeAbsolute',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'maxCut',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'maxRate',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'minMaintenance',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'minEfficiency',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'referralFee',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'minScale',
            type: 'uint256',
          },
        ],
        internalType: 'struct ProtocolParameter',
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
        internalType: 'address',
        name: 'referrer',
        type: 'address',
      },
    ],
    name: 'referralFees',
    outputs: [
      {
        internalType: 'UFixed6',
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
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'signers',
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
    name: 'unpause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'accessor',
            type: 'address',
          },
          {
            internalType: 'bool',
            name: 'approved',
            type: 'bool',
          },
        ],
        internalType: 'struct AccessUpdate[]',
        name: 'newOperators',
        type: 'tuple[]',
      },
      {
        components: [
          {
            internalType: 'address',
            name: 'accessor',
            type: 'address',
          },
          {
            internalType: 'bool',
            name: 'approved',
            type: 'bool',
          },
        ],
        internalType: 'struct AccessUpdate[]',
        name: 'newSigners',
        type: 'tuple[]',
      },
    ],
    name: 'updateAccessBatch',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              {
                internalType: 'address',
                name: 'accessor',
                type: 'address',
              },
              {
                internalType: 'bool',
                name: 'approved',
                type: 'bool',
              },
            ],
            internalType: 'struct AccessUpdate[]',
            name: 'operators',
            type: 'tuple[]',
          },
          {
            components: [
              {
                internalType: 'address',
                name: 'accessor',
                type: 'address',
              },
              {
                internalType: 'bool',
                name: 'approved',
                type: 'bool',
              },
            ],
            internalType: 'struct AccessUpdate[]',
            name: 'signers',
            type: 'tuple[]',
          },
          {
            components: [
              {
                internalType: 'address',
                name: 'account',
                type: 'address',
              },
              {
                internalType: 'address',
                name: 'signer',
                type: 'address',
              },
              {
                internalType: 'address',
                name: 'domain',
                type: 'address',
              },
              {
                internalType: 'uint256',
                name: 'nonce',
                type: 'uint256',
              },
              {
                internalType: 'uint256',
                name: 'group',
                type: 'uint256',
              },
              {
                internalType: 'uint256',
                name: 'expiry',
                type: 'uint256',
              },
            ],
            internalType: 'struct Common',
            name: 'common',
            type: 'tuple',
          },
        ],
        internalType: 'struct AccessUpdateBatch',
        name: 'accessUpdateBatch',
        type: 'tuple',
      },
      {
        internalType: 'bytes',
        name: 'signature',
        type: 'bytes',
      },
    ],
    name: 'updateAccessBatchWithSignature',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'extension',
        type: 'address',
      },
      {
        internalType: 'bool',
        name: 'newEnabled',
        type: 'bool',
      },
    ],
    name: 'updateExtension',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'operator',
        type: 'address',
      },
      {
        internalType: 'bool',
        name: 'newEnabled',
        type: 'bool',
      },
    ],
    name: 'updateOperator',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              {
                internalType: 'address',
                name: 'accessor',
                type: 'address',
              },
              {
                internalType: 'bool',
                name: 'approved',
                type: 'bool',
              },
            ],
            internalType: 'struct AccessUpdate',
            name: 'access',
            type: 'tuple',
          },
          {
            components: [
              {
                internalType: 'address',
                name: 'account',
                type: 'address',
              },
              {
                internalType: 'address',
                name: 'signer',
                type: 'address',
              },
              {
                internalType: 'address',
                name: 'domain',
                type: 'address',
              },
              {
                internalType: 'uint256',
                name: 'nonce',
                type: 'uint256',
              },
              {
                internalType: 'uint256',
                name: 'group',
                type: 'uint256',
              },
              {
                internalType: 'uint256',
                name: 'expiry',
                type: 'uint256',
              },
            ],
            internalType: 'struct Common',
            name: 'common',
            type: 'tuple',
          },
        ],
        internalType: 'struct OperatorUpdate',
        name: 'operatorUpdate',
        type: 'tuple',
      },
      {
        internalType: 'bytes',
        name: 'signature',
        type: 'bytes',
      },
    ],
    name: 'updateOperatorWithSignature',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'UFixed6',
            name: 'maxFee',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'maxFeeAbsolute',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'maxCut',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'maxRate',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'minMaintenance',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'minEfficiency',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'referralFee',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'minScale',
            type: 'uint256',
          },
        ],
        internalType: 'struct ProtocolParameter',
        name: 'newParameter',
        type: 'tuple',
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
  {
    inputs: [
      {
        internalType: 'address',
        name: 'referrer',
        type: 'address',
      },
      {
        internalType: 'UFixed6',
        name: 'newReferralFee',
        type: 'uint256',
      },
    ],
    name: 'updateReferralFee',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'signer',
        type: 'address',
      },
      {
        internalType: 'bool',
        name: 'newEnabled',
        type: 'bool',
      },
    ],
    name: 'updateSigner',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            components: [
              {
                internalType: 'address',
                name: 'accessor',
                type: 'address',
              },
              {
                internalType: 'bool',
                name: 'approved',
                type: 'bool',
              },
            ],
            internalType: 'struct AccessUpdate',
            name: 'access',
            type: 'tuple',
          },
          {
            components: [
              {
                internalType: 'address',
                name: 'account',
                type: 'address',
              },
              {
                internalType: 'address',
                name: 'signer',
                type: 'address',
              },
              {
                internalType: 'address',
                name: 'domain',
                type: 'address',
              },
              {
                internalType: 'uint256',
                name: 'nonce',
                type: 'uint256',
              },
              {
                internalType: 'uint256',
                name: 'group',
                type: 'uint256',
              },
              {
                internalType: 'uint256',
                name: 'expiry',
                type: 'uint256',
              },
            ],
            internalType: 'struct Common',
            name: 'common',
            type: 'tuple',
          },
        ],
        internalType: 'struct SignerUpdate',
        name: 'signerUpdate',
        type: 'tuple',
      },
      {
        internalType: 'bytes',
        name: 'signature',
        type: 'bytes',
      },
    ],
    name: 'updateSignerWithSignature',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'verifier',
    outputs: [
      {
        internalType: 'contract IVerifier',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const
