export const VerifierAbi = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
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
    name: 'VerifierInvalidDomainError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'VerifierInvalidExpiryError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'VerifierInvalidGroupError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'VerifierInvalidNonceError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'VerifierInvalidSignatureError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'VerifierInvalidSignerError',
    type: 'error',
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
        indexed: false,
        internalType: 'uint256',
        name: 'group',
        type: 'uint256',
      },
    ],
    name: 'GroupCancelled',
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
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'nonce',
        type: 'uint256',
      },
    ],
    name: 'NonceCancelled',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'group',
        type: 'uint256',
      },
    ],
    name: 'cancelGroup',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'group',
            type: 'uint256',
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
        internalType: 'struct GroupCancellation',
        name: 'groupCancellation',
        type: 'tuple',
      },
      {
        internalType: 'bytes',
        name: 'signature',
        type: 'bytes',
      },
    ],
    name: 'cancelGroupWithSignature',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'nonce',
        type: 'uint256',
      },
    ],
    name: 'cancelNonce',
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
      {
        internalType: 'bytes',
        name: 'signature',
        type: 'bytes',
      },
    ],
    name: 'cancelNonceWithSignature',
    outputs: [],
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
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'groups',
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
        internalType: 'contract IMarketFactorySigners',
        name: 'marketFactory_',
        type: 'address',
      },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'marketFactory',
    outputs: [
      {
        internalType: 'contract IMarketFactorySigners',
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
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'nonces',
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
    name: 'verifyAccessUpdateBatch',
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
      {
        internalType: 'bytes',
        name: 'signature',
        type: 'bytes',
      },
    ],
    name: 'verifyCommon',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'group',
            type: 'uint256',
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
        internalType: 'struct GroupCancellation',
        name: 'groupCancellation',
        type: 'tuple',
      },
      {
        internalType: 'bytes',
        name: 'signature',
        type: 'bytes',
      },
    ],
    name: 'verifyGroupCancellation',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'Fixed6',
            name: 'amount',
            type: 'int256',
          },
          {
            internalType: 'Fixed6',
            name: 'price',
            type: 'int256',
          },
          {
            internalType: 'UFixed6',
            name: 'fee',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'originator',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'solver',
            type: 'address',
          },
          {
            internalType: 'UFixed6',
            name: 'collateralization',
            type: 'uint256',
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
        internalType: 'struct Intent',
        name: 'intent',
        type: 'tuple',
      },
      {
        internalType: 'bytes',
        name: 'signature',
        type: 'bytes',
      },
    ],
    name: 'verifyIntent',
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
    name: 'verifyOperatorUpdate',
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
    name: 'verifySignerUpdate',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const
