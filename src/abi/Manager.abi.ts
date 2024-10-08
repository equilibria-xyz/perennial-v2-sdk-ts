export const ManagerAbi = [
  {
    inputs: [
      {
        internalType: 'Token6',
        name: 'usdc',
        type: 'address',
      },
      {
        internalType: 'Token18',
        name: 'dsu',
        type: 'address',
      },
      {
        internalType: 'contract IEmptySetReserve',
        name: 'reserve',
        type: 'address',
      },
      {
        internalType: 'contract IMarketFactory',
        name: 'marketFactory',
        type: 'address',
      },
      {
        internalType: 'contract IOrderVerifier',
        name: 'verifier',
        type: 'address',
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
        name: 'value',
        type: 'uint256',
      },
    ],
    name: 'Fixed6OverflowError',
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
    name: 'ManagerCannotCancelError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ManagerCannotExecuteError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ManagerInvalidOrderNonceError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ManagerInvalidSignerError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'TriggerOrderInvalidError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'TriggerOrderStorageInvalidError',
    type: 'error',
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
    inputs: [
      {
        internalType: 'int256',
        name: 'value',
        type: 'int256',
      },
    ],
    name: 'UFixed6UnderflowError',
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
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'applicableGas',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'applicableValue',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'UFixed18',
        name: 'baseFee',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'UFixed18',
        name: 'calldataFee',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'UFixed18',
        name: 'keeperFee',
        type: 'uint256',
      },
    ],
    name: 'KeeperCall',
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
        indexed: true,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'orderId',
        type: 'uint256',
      },
    ],
    name: 'TriggerOrderCancelled',
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
        indexed: true,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        components: [
          {
            internalType: 'uint8',
            name: 'side',
            type: 'uint8',
          },
          {
            internalType: 'int8',
            name: 'comparison',
            type: 'int8',
          },
          {
            internalType: 'Fixed6',
            name: 'price',
            type: 'int256',
          },
          {
            internalType: 'Fixed6',
            name: 'delta',
            type: 'int256',
          },
          {
            internalType: 'UFixed6',
            name: 'maxFee',
            type: 'uint256',
          },
          {
            internalType: 'bool',
            name: 'isSpent',
            type: 'bool',
          },
          {
            internalType: 'address',
            name: 'referrer',
            type: 'address',
          },
          {
            components: [
              {
                internalType: 'UFixed6',
                name: 'amount',
                type: 'uint256',
              },
              {
                internalType: 'address',
                name: 'receiver',
                type: 'address',
              },
              {
                internalType: 'bool',
                name: 'fixedFee',
                type: 'bool',
              },
              {
                internalType: 'bool',
                name: 'unwrap',
                type: 'bool',
              },
            ],
            internalType: 'struct InterfaceFee',
            name: 'interfaceFee',
            type: 'tuple',
          },
        ],
        indexed: false,
        internalType: 'struct TriggerOrder',
        name: 'order',
        type: 'tuple',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'orderId',
        type: 'uint256',
      },
    ],
    name: 'TriggerOrderExecuted',
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
        internalType: 'contract IMarket',
        name: 'market',
        type: 'address',
      },
      {
        components: [
          {
            internalType: 'UFixed6',
            name: 'amount',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'receiver',
            type: 'address',
          },
          {
            internalType: 'bool',
            name: 'fixedFee',
            type: 'bool',
          },
          {
            internalType: 'bool',
            name: 'unwrap',
            type: 'bool',
          },
        ],
        indexed: false,
        internalType: 'struct InterfaceFee',
        name: 'fee',
        type: 'tuple',
      },
    ],
    name: 'TriggerOrderInterfaceFeeCharged',
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
        indexed: true,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        components: [
          {
            internalType: 'uint8',
            name: 'side',
            type: 'uint8',
          },
          {
            internalType: 'int8',
            name: 'comparison',
            type: 'int8',
          },
          {
            internalType: 'Fixed6',
            name: 'price',
            type: 'int256',
          },
          {
            internalType: 'Fixed6',
            name: 'delta',
            type: 'int256',
          },
          {
            internalType: 'UFixed6',
            name: 'maxFee',
            type: 'uint256',
          },
          {
            internalType: 'bool',
            name: 'isSpent',
            type: 'bool',
          },
          {
            internalType: 'address',
            name: 'referrer',
            type: 'address',
          },
          {
            components: [
              {
                internalType: 'UFixed6',
                name: 'amount',
                type: 'uint256',
              },
              {
                internalType: 'address',
                name: 'receiver',
                type: 'address',
              },
              {
                internalType: 'bool',
                name: 'fixedFee',
                type: 'bool',
              },
              {
                internalType: 'bool',
                name: 'unwrap',
                type: 'bool',
              },
            ],
            internalType: 'struct InterfaceFee',
            name: 'interfaceFee',
            type: 'tuple',
          },
        ],
        indexed: false,
        internalType: 'struct TriggerOrder',
        name: 'order',
        type: 'tuple',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'orderId',
        type: 'uint256',
      },
    ],
    name: 'TriggerOrderPlaced',
    type: 'event',
  },
  {
    inputs: [],
    name: 'ARB_FIXED_OVERHEAD',
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
    name: 'ARB_GAS_MULTIPLIER',
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
    name: 'DSU',
    outputs: [
      {
        internalType: 'Token18',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'USDC',
    outputs: [
      {
        internalType: 'Token6',
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
        internalType: 'contract IMarket',
        name: 'market',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'orderId',
        type: 'uint256',
      },
    ],
    name: 'cancelOrder',
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
                internalType: 'contract IMarket',
                name: 'market',
                type: 'address',
              },
              {
                internalType: 'uint256',
                name: 'orderId',
                type: 'uint256',
              },
              {
                internalType: 'UFixed6',
                name: 'maxFee',
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
            internalType: 'struct Action',
            name: 'action',
            type: 'tuple',
          },
        ],
        internalType: 'struct CancelOrderAction',
        name: 'request',
        type: 'tuple',
      },
      {
        internalType: 'bytes',
        name: 'signature',
        type: 'bytes',
      },
    ],
    name: 'cancelOrderWithSignature',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
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
        name: 'orderId',
        type: 'uint256',
      },
    ],
    name: 'checkOrder',
    outputs: [
      {
        components: [
          {
            internalType: 'uint8',
            name: 'side',
            type: 'uint8',
          },
          {
            internalType: 'int8',
            name: 'comparison',
            type: 'int8',
          },
          {
            internalType: 'Fixed6',
            name: 'price',
            type: 'int256',
          },
          {
            internalType: 'Fixed6',
            name: 'delta',
            type: 'int256',
          },
          {
            internalType: 'UFixed6',
            name: 'maxFee',
            type: 'uint256',
          },
          {
            internalType: 'bool',
            name: 'isSpent',
            type: 'bool',
          },
          {
            internalType: 'address',
            name: 'referrer',
            type: 'address',
          },
          {
            components: [
              {
                internalType: 'UFixed6',
                name: 'amount',
                type: 'uint256',
              },
              {
                internalType: 'address',
                name: 'receiver',
                type: 'address',
              },
              {
                internalType: 'bool',
                name: 'fixedFee',
                type: 'bool',
              },
              {
                internalType: 'bool',
                name: 'unwrap',
                type: 'bool',
              },
            ],
            internalType: 'struct InterfaceFee',
            name: 'interfaceFee',
            type: 'tuple',
          },
        ],
        internalType: 'struct TriggerOrder',
        name: 'order',
        type: 'tuple',
      },
      {
        internalType: 'bool',
        name: 'canExecute',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'ethTokenOracleFeed',
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
    inputs: [
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
        name: 'orderId',
        type: 'uint256',
      },
    ],
    name: 'executeOrder',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'contract AggregatorV3Interface',
        name: 'ethOracle_',
        type: 'address',
      },
      {
        components: [
          {
            internalType: 'UFixed18',
            name: 'multiplierBase',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'bufferBase',
            type: 'uint256',
          },
          {
            internalType: 'UFixed18',
            name: 'multiplierCalldata',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'bufferCalldata',
            type: 'uint256',
          },
        ],
        internalType: 'struct IKept.KeepConfig',
        name: 'keepConfig_',
        type: 'tuple',
      },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'keepConfig',
    outputs: [
      {
        internalType: 'UFixed18',
        name: 'multiplierBase',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'bufferBase',
        type: 'uint256',
      },
      {
        internalType: 'UFixed18',
        name: 'multiplierCalldata',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'bufferCalldata',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'keeperToken',
    outputs: [
      {
        internalType: 'Token18',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'marketFactory',
    outputs: [
      {
        internalType: 'contract IMarketFactory',
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
        name: 'orderId',
        type: 'uint256',
      },
    ],
    name: 'orders',
    outputs: [
      {
        components: [
          {
            internalType: 'uint8',
            name: 'side',
            type: 'uint8',
          },
          {
            internalType: 'int8',
            name: 'comparison',
            type: 'int8',
          },
          {
            internalType: 'Fixed6',
            name: 'price',
            type: 'int256',
          },
          {
            internalType: 'Fixed6',
            name: 'delta',
            type: 'int256',
          },
          {
            internalType: 'UFixed6',
            name: 'maxFee',
            type: 'uint256',
          },
          {
            internalType: 'bool',
            name: 'isSpent',
            type: 'bool',
          },
          {
            internalType: 'address',
            name: 'referrer',
            type: 'address',
          },
          {
            components: [
              {
                internalType: 'UFixed6',
                name: 'amount',
                type: 'uint256',
              },
              {
                internalType: 'address',
                name: 'receiver',
                type: 'address',
              },
              {
                internalType: 'bool',
                name: 'fixedFee',
                type: 'bool',
              },
              {
                internalType: 'bool',
                name: 'unwrap',
                type: 'bool',
              },
            ],
            internalType: 'struct InterfaceFee',
            name: 'interfaceFee',
            type: 'tuple',
          },
        ],
        internalType: 'struct TriggerOrder',
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
        internalType: 'contract IMarket',
        name: 'market',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'orderId',
        type: 'uint256',
      },
      {
        components: [
          {
            internalType: 'uint8',
            name: 'side',
            type: 'uint8',
          },
          {
            internalType: 'int8',
            name: 'comparison',
            type: 'int8',
          },
          {
            internalType: 'Fixed6',
            name: 'price',
            type: 'int256',
          },
          {
            internalType: 'Fixed6',
            name: 'delta',
            type: 'int256',
          },
          {
            internalType: 'UFixed6',
            name: 'maxFee',
            type: 'uint256',
          },
          {
            internalType: 'bool',
            name: 'isSpent',
            type: 'bool',
          },
          {
            internalType: 'address',
            name: 'referrer',
            type: 'address',
          },
          {
            components: [
              {
                internalType: 'UFixed6',
                name: 'amount',
                type: 'uint256',
              },
              {
                internalType: 'address',
                name: 'receiver',
                type: 'address',
              },
              {
                internalType: 'bool',
                name: 'fixedFee',
                type: 'bool',
              },
              {
                internalType: 'bool',
                name: 'unwrap',
                type: 'bool',
              },
            ],
            internalType: 'struct InterfaceFee',
            name: 'interfaceFee',
            type: 'tuple',
          },
        ],
        internalType: 'struct TriggerOrder',
        name: 'order',
        type: 'tuple',
      },
    ],
    name: 'placeOrder',
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
                internalType: 'uint8',
                name: 'side',
                type: 'uint8',
              },
              {
                internalType: 'int8',
                name: 'comparison',
                type: 'int8',
              },
              {
                internalType: 'Fixed6',
                name: 'price',
                type: 'int256',
              },
              {
                internalType: 'Fixed6',
                name: 'delta',
                type: 'int256',
              },
              {
                internalType: 'UFixed6',
                name: 'maxFee',
                type: 'uint256',
              },
              {
                internalType: 'bool',
                name: 'isSpent',
                type: 'bool',
              },
              {
                internalType: 'address',
                name: 'referrer',
                type: 'address',
              },
              {
                components: [
                  {
                    internalType: 'UFixed6',
                    name: 'amount',
                    type: 'uint256',
                  },
                  {
                    internalType: 'address',
                    name: 'receiver',
                    type: 'address',
                  },
                  {
                    internalType: 'bool',
                    name: 'fixedFee',
                    type: 'bool',
                  },
                  {
                    internalType: 'bool',
                    name: 'unwrap',
                    type: 'bool',
                  },
                ],
                internalType: 'struct InterfaceFee',
                name: 'interfaceFee',
                type: 'tuple',
              },
            ],
            internalType: 'struct TriggerOrder',
            name: 'order',
            type: 'tuple',
          },
          {
            components: [
              {
                internalType: 'contract IMarket',
                name: 'market',
                type: 'address',
              },
              {
                internalType: 'uint256',
                name: 'orderId',
                type: 'uint256',
              },
              {
                internalType: 'UFixed6',
                name: 'maxFee',
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
            internalType: 'struct Action',
            name: 'action',
            type: 'tuple',
          },
        ],
        internalType: 'struct PlaceOrderAction',
        name: 'request',
        type: 'tuple',
      },
      {
        internalType: 'bytes',
        name: 'signature',
        type: 'bytes',
      },
    ],
    name: 'placeOrderWithSignature',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'reserve',
    outputs: [
      {
        internalType: 'contract IEmptySetReserve',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'verifier',
    outputs: [
      {
        internalType: 'contract IOrderVerifier',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const
