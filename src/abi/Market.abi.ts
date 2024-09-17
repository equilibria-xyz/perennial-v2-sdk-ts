export const MarketAbi = [
  {
    inputs: [
      {
        internalType: 'contract IVerifier',
        name: 'verifier_',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'Adiabatic6ZeroScaleError',
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
    inputs: [],
    name: 'GlobalStorageInvalidError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'GuaranteeStorageInvalidError',
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
    name: 'LocalStorageInvalidError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'LocalStorageInvalidError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MarketClosedError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MarketCollateralBelowLimitError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MarketEfficiencyUnderLimitError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MarketExceedsPendingIdLimitError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MarketInsufficientCollateralError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MarketInsufficientLiquidityError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MarketInsufficientMarginError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MarketInvalidIntentFeeError',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'code',
        type: 'uint256',
      },
    ],
    name: 'MarketInvalidMarketParameterError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MarketInvalidProtectionError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MarketInvalidReferrerError',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'code',
        type: 'uint256',
      },
    ],
    name: 'MarketInvalidRiskParameterError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MarketMakerOverLimitError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MarketNotBeneficiaryError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MarketNotCoordinatorError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MarketNotOperatorError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MarketNotSingleSidedError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MarketOperatorNotAllowedError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MarketOverCloseError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MarketParameterStorageInvalidError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MarketProtectedError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MarketSettleOnlyError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MarketStalePriceError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'OrderStorageInvalidError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'PositionStorageLocalInvalidError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ReentrancyGuardReentrantCallError',
    type: 'error',
  },
  {
    inputs: [],
    name: 'RiskParameterStorageInvalidError',
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
    inputs: [],
    name: 'VersionStorageInvalidError',
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
        name: 'orderId',
        type: 'uint256',
      },
      {
        components: [
          {
            internalType: 'uint256',
            name: 'timestamp',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'orders',
            type: 'uint256',
          },
          {
            internalType: 'Fixed6',
            name: 'collateral',
            type: 'int256',
          },
          {
            internalType: 'UFixed6',
            name: 'makerPos',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'makerNeg',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'longPos',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'longNeg',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'shortPos',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'shortNeg',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'protection',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'makerReferral',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'takerReferral',
            type: 'uint256',
          },
        ],
        indexed: false,
        internalType: 'struct Order',
        name: 'order',
        type: 'tuple',
      },
      {
        components: [
          {
            internalType: 'Fixed6',
            name: 'collateral',
            type: 'int256',
          },
          {
            internalType: 'Fixed6',
            name: 'priceOverride',
            type: 'int256',
          },
          {
            internalType: 'UFixed6',
            name: 'tradeFee',
            type: 'uint256',
          },
          {
            internalType: 'Fixed6',
            name: 'offset',
            type: 'int256',
          },
          {
            internalType: 'UFixed6',
            name: 'settlementFee',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'liquidationFee',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'subtractiveFee',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'solverFee',
            type: 'uint256',
          },
        ],
        indexed: false,
        internalType: 'struct CheckpointAccumulationResult',
        name: 'accumulationResult',
        type: 'tuple',
      },
    ],
    name: 'AccountPositionProcessed',
    type: 'event',
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
        internalType: 'address',
        name: 'newCoordinator',
        type: 'address',
      },
    ],
    name: 'CoordinatorUpdated',
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
        internalType: 'Fixed6',
        name: 'amount',
        type: 'int256',
      },
    ],
    name: 'ExposureClaimed',
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
        name: 'receiver',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'UFixed6',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'FeeClaimed',
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
        components: [
          {
            internalType: 'uint256',
            name: 'timestamp',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'orders',
            type: 'uint256',
          },
          {
            internalType: 'Fixed6',
            name: 'collateral',
            type: 'int256',
          },
          {
            internalType: 'UFixed6',
            name: 'makerPos',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'makerNeg',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'longPos',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'longNeg',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'shortPos',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'shortNeg',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'protection',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'makerReferral',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'takerReferral',
            type: 'uint256',
          },
        ],
        indexed: false,
        internalType: 'struct Order',
        name: 'order',
        type: 'tuple',
      },
      {
        components: [
          {
            internalType: 'uint256',
            name: 'orders',
            type: 'uint256',
          },
          {
            internalType: 'Fixed6',
            name: 'notional',
            type: 'int256',
          },
          {
            internalType: 'UFixed6',
            name: 'takerPos',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'takerNeg',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'takerFee',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'referral',
            type: 'uint256',
          },
        ],
        indexed: false,
        internalType: 'struct Guarantee',
        name: 'guarantee',
        type: 'tuple',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'liquidator',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'orderReferrer',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'guaranteeReferrer',
        type: 'address',
      },
    ],
    name: 'OrderCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        components: [
          {
            internalType: 'UFixed6',
            name: 'fundingFee',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'interestFee',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'makerFee',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'takerFee',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'riskFee',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'maxPendingGlobal',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'maxPendingLocal',
            type: 'uint256',
          },
          {
            internalType: 'bool',
            name: 'closed',
            type: 'bool',
          },
          {
            internalType: 'bool',
            name: 'settle',
            type: 'bool',
          },
        ],
        indexed: false,
        internalType: 'struct MarketParameter',
        name: 'newParameter',
        type: 'tuple',
      },
    ],
    name: 'ParameterUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'orderId',
        type: 'uint256',
      },
      {
        components: [
          {
            internalType: 'uint256',
            name: 'timestamp',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'orders',
            type: 'uint256',
          },
          {
            internalType: 'Fixed6',
            name: 'collateral',
            type: 'int256',
          },
          {
            internalType: 'UFixed6',
            name: 'makerPos',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'makerNeg',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'longPos',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'longNeg',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'shortPos',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'shortNeg',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'protection',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'makerReferral',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'takerReferral',
            type: 'uint256',
          },
        ],
        indexed: false,
        internalType: 'struct Order',
        name: 'order',
        type: 'tuple',
      },
      {
        components: [
          {
            internalType: 'UFixed6',
            name: 'tradeFee',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'subtractiveFee',
            type: 'uint256',
          },
          {
            internalType: 'Fixed6',
            name: 'tradeOffset',
            type: 'int256',
          },
          {
            internalType: 'Fixed6',
            name: 'tradeOffsetMaker',
            type: 'int256',
          },
          {
            internalType: 'UFixed6',
            name: 'tradeOffsetMarket',
            type: 'uint256',
          },
          {
            internalType: 'Fixed6',
            name: 'adiabaticExposure',
            type: 'int256',
          },
          {
            internalType: 'Fixed6',
            name: 'adiabaticExposureMaker',
            type: 'int256',
          },
          {
            internalType: 'Fixed6',
            name: 'adiabaticExposureMarket',
            type: 'int256',
          },
          {
            internalType: 'Fixed6',
            name: 'fundingMaker',
            type: 'int256',
          },
          {
            internalType: 'Fixed6',
            name: 'fundingLong',
            type: 'int256',
          },
          {
            internalType: 'Fixed6',
            name: 'fundingShort',
            type: 'int256',
          },
          {
            internalType: 'UFixed6',
            name: 'fundingFee',
            type: 'uint256',
          },
          {
            internalType: 'Fixed6',
            name: 'interestMaker',
            type: 'int256',
          },
          {
            internalType: 'Fixed6',
            name: 'interestLong',
            type: 'int256',
          },
          {
            internalType: 'Fixed6',
            name: 'interestShort',
            type: 'int256',
          },
          {
            internalType: 'UFixed6',
            name: 'interestFee',
            type: 'uint256',
          },
          {
            internalType: 'Fixed6',
            name: 'pnlMaker',
            type: 'int256',
          },
          {
            internalType: 'Fixed6',
            name: 'pnlLong',
            type: 'int256',
          },
          {
            internalType: 'Fixed6',
            name: 'pnlShort',
            type: 'int256',
          },
          {
            internalType: 'UFixed6',
            name: 'settlementFee',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'liquidationFee',
            type: 'uint256',
          },
        ],
        indexed: false,
        internalType: 'struct VersionAccumulationResult',
        name: 'accumulationResult',
        type: 'tuple',
      },
    ],
    name: 'PositionProcessed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        components: [
          {
            internalType: 'UFixed6',
            name: 'margin',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'maintenance',
            type: 'uint256',
          },
          {
            components: [
              {
                internalType: 'UFixed6',
                name: 'linearFee',
                type: 'uint256',
              },
              {
                internalType: 'UFixed6',
                name: 'proportionalFee',
                type: 'uint256',
              },
              {
                internalType: 'UFixed6',
                name: 'adiabaticFee',
                type: 'uint256',
              },
              {
                internalType: 'UFixed6',
                name: 'scale',
                type: 'uint256',
              },
            ],
            internalType: 'struct LinearAdiabatic6',
            name: 'takerFee',
            type: 'tuple',
          },
          {
            components: [
              {
                internalType: 'UFixed6',
                name: 'linearFee',
                type: 'uint256',
              },
              {
                internalType: 'UFixed6',
                name: 'proportionalFee',
                type: 'uint256',
              },
              {
                internalType: 'UFixed6',
                name: 'scale',
                type: 'uint256',
              },
            ],
            internalType: 'struct NoopAdiabatic6',
            name: 'makerFee',
            type: 'tuple',
          },
          {
            internalType: 'UFixed6',
            name: 'makerLimit',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'efficiencyLimit',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'liquidationFee',
            type: 'uint256',
          },
          {
            components: [
              {
                internalType: 'UFixed6',
                name: 'minRate',
                type: 'uint256',
              },
              {
                internalType: 'UFixed6',
                name: 'maxRate',
                type: 'uint256',
              },
              {
                internalType: 'UFixed6',
                name: 'targetRate',
                type: 'uint256',
              },
              {
                internalType: 'UFixed6',
                name: 'targetUtilization',
                type: 'uint256',
              },
            ],
            internalType: 'struct UJumpRateUtilizationCurve6',
            name: 'utilizationCurve',
            type: 'tuple',
          },
          {
            components: [
              {
                internalType: 'UFixed6',
                name: 'k',
                type: 'uint256',
              },
              {
                internalType: 'Fixed6',
                name: 'min',
                type: 'int256',
              },
              {
                internalType: 'Fixed6',
                name: 'max',
                type: 'int256',
              },
            ],
            internalType: 'struct PController6',
            name: 'pController',
            type: 'tuple',
          },
          {
            internalType: 'UFixed6',
            name: 'minMargin',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'minMaintenance',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'staleAfter',
            type: 'uint256',
          },
          {
            internalType: 'bool',
            name: 'makerReceiveOnly',
            type: 'bool',
          },
        ],
        indexed: false,
        internalType: 'struct RiskParameter',
        name: 'newRiskParameter',
        type: 'tuple',
      },
    ],
    name: 'RiskParameterUpdated',
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
        indexed: true,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'version',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'UFixed6',
        name: 'newMaker',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'UFixed6',
        name: 'newLong',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'UFixed6',
        name: 'newShort',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'Fixed6',
        name: 'collateral',
        type: 'int256',
      },
      {
        indexed: false,
        internalType: 'bool',
        name: 'protect',
        type: 'bool',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'referrer',
        type: 'address',
      },
    ],
    name: 'Updated',
    type: 'event',
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
    name: 'checkpoints',
    outputs: [
      {
        components: [
          {
            internalType: 'Fixed6',
            name: 'tradeFee',
            type: 'int256',
          },
          {
            internalType: 'UFixed6',
            name: 'settlementFee',
            type: 'uint256',
          },
          {
            internalType: 'Fixed6',
            name: 'transfer',
            type: 'int256',
          },
          {
            internalType: 'Fixed6',
            name: 'collateral',
            type: 'int256',
          },
        ],
        internalType: 'struct Checkpoint',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'claimExposure',
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
    ],
    name: 'claimFee',
    outputs: [
      {
        internalType: 'UFixed6',
        name: 'feeReceived',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'coordinator',
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
            internalType: 'uint256',
            name: 'currentId',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'latestId',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'protocolFee',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'oracleFee',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'riskFee',
            type: 'uint256',
          },
          {
            internalType: 'Fixed6',
            name: 'latestPrice',
            type: 'int256',
          },
          {
            internalType: 'Fixed6',
            name: 'exposure',
            type: 'int256',
          },
          {
            components: [
              {
                internalType: 'Fixed6',
                name: '_value',
                type: 'int256',
              },
              {
                internalType: 'Fixed6',
                name: '_skew',
                type: 'int256',
              },
            ],
            internalType: 'struct PAccumulator6',
            name: 'pAccumulator',
            type: 'tuple',
          },
        ],
        internalType: 'struct Global',
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
        name: 'id',
        type: 'uint256',
      },
    ],
    name: 'guarantee',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'orders',
            type: 'uint256',
          },
          {
            internalType: 'Fixed6',
            name: 'notional',
            type: 'int256',
          },
          {
            internalType: 'UFixed6',
            name: 'takerPos',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'takerNeg',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'takerFee',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'referral',
            type: 'uint256',
          },
        ],
        internalType: 'struct Guarantee',
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
    name: 'guaranteeReferrers',
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
        name: 'account',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
    ],
    name: 'guarantees',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'orders',
            type: 'uint256',
          },
          {
            internalType: 'Fixed6',
            name: 'notional',
            type: 'int256',
          },
          {
            internalType: 'UFixed6',
            name: 'takerPos',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'takerNeg',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'takerFee',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'referral',
            type: 'uint256',
          },
        ],
        internalType: 'struct Guarantee',
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
        name: 'definition_',
        type: 'tuple',
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
    name: 'liquidators',
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
        name: 'account',
        type: 'address',
      },
    ],
    name: 'locals',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'currentId',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'latestId',
            type: 'uint256',
          },
          {
            internalType: 'Fixed6',
            name: 'collateral',
            type: 'int256',
          },
          {
            internalType: 'UFixed6',
            name: 'claimable',
            type: 'uint256',
          },
        ],
        internalType: 'struct Local',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'migrate',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'oracle',
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
    name: 'orderReferrers',
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
            name: 'fundingFee',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'interestFee',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'makerFee',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'takerFee',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'riskFee',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'maxPendingGlobal',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'maxPendingLocal',
            type: 'uint256',
          },
          {
            internalType: 'bool',
            name: 'closed',
            type: 'bool',
          },
          {
            internalType: 'bool',
            name: 'settle',
            type: 'bool',
          },
        ],
        internalType: 'struct MarketParameter',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'pending',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'timestamp',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'orders',
            type: 'uint256',
          },
          {
            internalType: 'Fixed6',
            name: 'collateral',
            type: 'int256',
          },
          {
            internalType: 'UFixed6',
            name: 'makerPos',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'makerNeg',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'longPos',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'longNeg',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'shortPos',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'shortNeg',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'protection',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'makerReferral',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'takerReferral',
            type: 'uint256',
          },
        ],
        internalType: 'struct Order',
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
        name: 'id',
        type: 'uint256',
      },
    ],
    name: 'pendingOrder',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'timestamp',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'orders',
            type: 'uint256',
          },
          {
            internalType: 'Fixed6',
            name: 'collateral',
            type: 'int256',
          },
          {
            internalType: 'UFixed6',
            name: 'makerPos',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'makerNeg',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'longPos',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'longNeg',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'shortPos',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'shortNeg',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'protection',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'makerReferral',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'takerReferral',
            type: 'uint256',
          },
        ],
        internalType: 'struct Order',
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
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
    ],
    name: 'pendingOrders',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'timestamp',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'orders',
            type: 'uint256',
          },
          {
            internalType: 'Fixed6',
            name: 'collateral',
            type: 'int256',
          },
          {
            internalType: 'UFixed6',
            name: 'makerPos',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'makerNeg',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'longPos',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'longNeg',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'shortPos',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'shortNeg',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'protection',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'makerReferral',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'takerReferral',
            type: 'uint256',
          },
        ],
        internalType: 'struct Order',
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
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'pendings',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'timestamp',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'orders',
            type: 'uint256',
          },
          {
            internalType: 'Fixed6',
            name: 'collateral',
            type: 'int256',
          },
          {
            internalType: 'UFixed6',
            name: 'makerPos',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'makerNeg',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'longPos',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'longNeg',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'shortPos',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'shortNeg',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'protection',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'makerReferral',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'takerReferral',
            type: 'uint256',
          },
        ],
        internalType: 'struct Order',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'position',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'timestamp',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'maker',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'long',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'short',
            type: 'uint256',
          },
        ],
        internalType: 'struct Position',
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
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'positions',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'timestamp',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'maker',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'long',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'short',
            type: 'uint256',
          },
        ],
        internalType: 'struct Position',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'riskParameter',
    outputs: [
      {
        components: [
          {
            internalType: 'UFixed6',
            name: 'margin',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'maintenance',
            type: 'uint256',
          },
          {
            components: [
              {
                internalType: 'UFixed6',
                name: 'linearFee',
                type: 'uint256',
              },
              {
                internalType: 'UFixed6',
                name: 'proportionalFee',
                type: 'uint256',
              },
              {
                internalType: 'UFixed6',
                name: 'adiabaticFee',
                type: 'uint256',
              },
              {
                internalType: 'UFixed6',
                name: 'scale',
                type: 'uint256',
              },
            ],
            internalType: 'struct LinearAdiabatic6',
            name: 'takerFee',
            type: 'tuple',
          },
          {
            components: [
              {
                internalType: 'UFixed6',
                name: 'linearFee',
                type: 'uint256',
              },
              {
                internalType: 'UFixed6',
                name: 'proportionalFee',
                type: 'uint256',
              },
              {
                internalType: 'UFixed6',
                name: 'scale',
                type: 'uint256',
              },
            ],
            internalType: 'struct NoopAdiabatic6',
            name: 'makerFee',
            type: 'tuple',
          },
          {
            internalType: 'UFixed6',
            name: 'makerLimit',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'efficiencyLimit',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'liquidationFee',
            type: 'uint256',
          },
          {
            components: [
              {
                internalType: 'UFixed6',
                name: 'minRate',
                type: 'uint256',
              },
              {
                internalType: 'UFixed6',
                name: 'maxRate',
                type: 'uint256',
              },
              {
                internalType: 'UFixed6',
                name: 'targetRate',
                type: 'uint256',
              },
              {
                internalType: 'UFixed6',
                name: 'targetUtilization',
                type: 'uint256',
              },
            ],
            internalType: 'struct UJumpRateUtilizationCurve6',
            name: 'utilizationCurve',
            type: 'tuple',
          },
          {
            components: [
              {
                internalType: 'UFixed6',
                name: 'k',
                type: 'uint256',
              },
              {
                internalType: 'Fixed6',
                name: 'min',
                type: 'int256',
              },
              {
                internalType: 'Fixed6',
                name: 'max',
                type: 'int256',
              },
            ],
            internalType: 'struct PController6',
            name: 'pController',
            type: 'tuple',
          },
          {
            internalType: 'UFixed6',
            name: 'minMargin',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'minMaintenance',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'staleAfter',
            type: 'uint256',
          },
          {
            internalType: 'bool',
            name: 'makerReceiveOnly',
            type: 'bool',
          },
        ],
        internalType: 'struct RiskParameter',
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
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'settle',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'token',
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
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        internalType: 'Fixed6',
        name: 'amount',
        type: 'int256',
      },
      {
        internalType: 'Fixed6',
        name: 'collateral',
        type: 'int256',
      },
      {
        internalType: 'address',
        name: 'referrer',
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
        name: 'account',
        type: 'address',
      },
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
    name: 'update',
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
        internalType: 'UFixed6',
        name: 'newMaker',
        type: 'uint256',
      },
      {
        internalType: 'UFixed6',
        name: 'newLong',
        type: 'uint256',
      },
      {
        internalType: 'UFixed6',
        name: 'newShort',
        type: 'uint256',
      },
      {
        internalType: 'Fixed6',
        name: 'collateral',
        type: 'int256',
      },
      {
        internalType: 'bool',
        name: 'protect',
        type: 'bool',
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
        name: 'account',
        type: 'address',
      },
      {
        internalType: 'UFixed6',
        name: 'newMaker',
        type: 'uint256',
      },
      {
        internalType: 'UFixed6',
        name: 'newLong',
        type: 'uint256',
      },
      {
        internalType: 'UFixed6',
        name: 'newShort',
        type: 'uint256',
      },
      {
        internalType: 'Fixed6',
        name: 'collateral',
        type: 'int256',
      },
      {
        internalType: 'bool',
        name: 'protect',
        type: 'bool',
      },
      {
        internalType: 'address',
        name: 'referrer',
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
        internalType: 'address',
        name: 'newCoordinator',
        type: 'address',
      },
    ],
    name: 'updateCoordinator',
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
            name: 'fundingFee',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'interestFee',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'makerFee',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'takerFee',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'riskFee',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'maxPendingGlobal',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'maxPendingLocal',
            type: 'uint256',
          },
          {
            internalType: 'bool',
            name: 'closed',
            type: 'bool',
          },
          {
            internalType: 'bool',
            name: 'settle',
            type: 'bool',
          },
        ],
        internalType: 'struct MarketParameter',
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
        components: [
          {
            internalType: 'UFixed6',
            name: 'margin',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'maintenance',
            type: 'uint256',
          },
          {
            components: [
              {
                internalType: 'UFixed6',
                name: 'linearFee',
                type: 'uint256',
              },
              {
                internalType: 'UFixed6',
                name: 'proportionalFee',
                type: 'uint256',
              },
              {
                internalType: 'UFixed6',
                name: 'adiabaticFee',
                type: 'uint256',
              },
              {
                internalType: 'UFixed6',
                name: 'scale',
                type: 'uint256',
              },
            ],
            internalType: 'struct LinearAdiabatic6',
            name: 'takerFee',
            type: 'tuple',
          },
          {
            components: [
              {
                internalType: 'UFixed6',
                name: 'linearFee',
                type: 'uint256',
              },
              {
                internalType: 'UFixed6',
                name: 'proportionalFee',
                type: 'uint256',
              },
              {
                internalType: 'UFixed6',
                name: 'scale',
                type: 'uint256',
              },
            ],
            internalType: 'struct NoopAdiabatic6',
            name: 'makerFee',
            type: 'tuple',
          },
          {
            internalType: 'UFixed6',
            name: 'makerLimit',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'efficiencyLimit',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'liquidationFee',
            type: 'uint256',
          },
          {
            components: [
              {
                internalType: 'UFixed6',
                name: 'minRate',
                type: 'uint256',
              },
              {
                internalType: 'UFixed6',
                name: 'maxRate',
                type: 'uint256',
              },
              {
                internalType: 'UFixed6',
                name: 'targetRate',
                type: 'uint256',
              },
              {
                internalType: 'UFixed6',
                name: 'targetUtilization',
                type: 'uint256',
              },
            ],
            internalType: 'struct UJumpRateUtilizationCurve6',
            name: 'utilizationCurve',
            type: 'tuple',
          },
          {
            components: [
              {
                internalType: 'UFixed6',
                name: 'k',
                type: 'uint256',
              },
              {
                internalType: 'Fixed6',
                name: 'min',
                type: 'int256',
              },
              {
                internalType: 'Fixed6',
                name: 'max',
                type: 'int256',
              },
            ],
            internalType: 'struct PController6',
            name: 'pController',
            type: 'tuple',
          },
          {
            internalType: 'UFixed6',
            name: 'minMargin',
            type: 'uint256',
          },
          {
            internalType: 'UFixed6',
            name: 'minMaintenance',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'staleAfter',
            type: 'uint256',
          },
          {
            internalType: 'bool',
            name: 'makerReceiveOnly',
            type: 'bool',
          },
        ],
        internalType: 'struct RiskParameter',
        name: 'newRiskParameter',
        type: 'tuple',
      },
    ],
    name: 'updateRiskParameter',
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
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'timestamp',
        type: 'uint256',
      },
    ],
    name: 'versions',
    outputs: [
      {
        components: [
          {
            internalType: 'bool',
            name: 'valid',
            type: 'bool',
          },
          {
            internalType: 'Fixed6',
            name: 'price',
            type: 'int256',
          },
          {
            components: [
              {
                internalType: 'Fixed6',
                name: '_value',
                type: 'int256',
              },
            ],
            internalType: 'struct Accumulator6',
            name: 'makerValue',
            type: 'tuple',
          },
          {
            components: [
              {
                internalType: 'Fixed6',
                name: '_value',
                type: 'int256',
              },
            ],
            internalType: 'struct Accumulator6',
            name: 'longValue',
            type: 'tuple',
          },
          {
            components: [
              {
                internalType: 'Fixed6',
                name: '_value',
                type: 'int256',
              },
            ],
            internalType: 'struct Accumulator6',
            name: 'shortValue',
            type: 'tuple',
          },
          {
            components: [
              {
                internalType: 'Fixed6',
                name: '_value',
                type: 'int256',
              },
            ],
            internalType: 'struct Accumulator6',
            name: 'makerFee',
            type: 'tuple',
          },
          {
            components: [
              {
                internalType: 'Fixed6',
                name: '_value',
                type: 'int256',
              },
            ],
            internalType: 'struct Accumulator6',
            name: 'takerFee',
            type: 'tuple',
          },
          {
            components: [
              {
                internalType: 'Fixed6',
                name: '_value',
                type: 'int256',
              },
            ],
            internalType: 'struct Accumulator6',
            name: 'makerOffset',
            type: 'tuple',
          },
          {
            components: [
              {
                internalType: 'Fixed6',
                name: '_value',
                type: 'int256',
              },
            ],
            internalType: 'struct Accumulator6',
            name: 'takerPosOffset',
            type: 'tuple',
          },
          {
            components: [
              {
                internalType: 'Fixed6',
                name: '_value',
                type: 'int256',
              },
            ],
            internalType: 'struct Accumulator6',
            name: 'takerNegOffset',
            type: 'tuple',
          },
          {
            components: [
              {
                internalType: 'Fixed6',
                name: '_value',
                type: 'int256',
              },
            ],
            internalType: 'struct Accumulator6',
            name: 'settlementFee',
            type: 'tuple',
          },
          {
            components: [
              {
                internalType: 'Fixed6',
                name: '_value',
                type: 'int256',
              },
            ],
            internalType: 'struct Accumulator6',
            name: 'liquidationFee',
            type: 'tuple',
          },
        ],
        internalType: 'struct Version',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const
