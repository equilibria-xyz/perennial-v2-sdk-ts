import { Address, Hex, decodeFunctionData, encodeAbiParameters, encodeFunctionData, zeroAddress } from 'viem'

import { MultiInvokerAbi } from '../abi/MultiInvoker.abi'
import { PositionSide } from '../constants/markets'
import { MultiInvokerAction } from '../types/perennial'
import { UpdateNoOp } from './positionUtils'

export const buildNoop = (): MultiInvokerAction => ({
  action: 0,
  args: '0x',
})

export const buildUpdateMarket = ({
  market,
  maker,
  long,
  short,
  collateral,
  wrap,
  interfaceFee,
  interfaceFee2,
}: {
  market: Address
  maker?: bigint
  long?: bigint
  short?: bigint
  collateral?: bigint
  wrap?: boolean
  interfaceFee?: {
    amount: bigint
    receiver: Address
    unwrap: boolean
  }
  interfaceFee2?: {
    amount: bigint
    receiver: Address
    unwrap: boolean
  }
}): MultiInvokerAction => ({
  action: 1,
  args: encodeAbiParameters(
    [
      { type: 'address' },
      { type: 'uint256' },
      { type: 'uint256' },
      { type: 'uint256' },
      { type: 'int256' },
      { type: 'bool' },
      {
        type: 'tuple',
        name: 'interfaceFee1',
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
            name: 'unwrap',
            type: 'bool',
          },
        ],
      },
      {
        type: 'tuple',
        name: 'interfaceFee2',
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
            name: 'unwrap',
            type: 'bool',
          },
        ],
      },
    ],
    [
      market,
      maker ?? UpdateNoOp,
      long ?? UpdateNoOp,
      short ?? UpdateNoOp,
      collateral ?? 0n,
      !!wrap,
      interfaceFee ?? EmptyInterfaceFee,
      interfaceFee2 ?? EmptyInterfaceFee,
    ],
  ),
})

export const buildUpdateVault = ({
  vault,
  deposit,
  redeem,
  claim,
  wrap,
}: {
  vault: Address
  deposit?: bigint
  redeem?: bigint
  claim?: bigint
  wrap?: boolean
}): MultiInvokerAction => ({
  action: 2,
  args: encodeAbiParameters(
    ['address', 'uint256', 'uint256', 'uint256', 'bool'].map((type) => ({ type })),
    [vault, deposit ?? 0n, redeem ?? 0n, claim ?? 0n, wrap],
  ),
})

const PlaceTriggerOrderInputs = [
  {
    internalType: 'IMarket',
    name: 'market',
    type: 'address',
  },
  {
    type: 'tuple',
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
        internalType: 'UFixed6',
        name: 'fee',
        type: 'uint256',
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
        type: 'tuple',
        name: 'interfaceFee1',
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
            name: 'unwrap',
            type: 'bool',
          },
        ],
      },
      {
        type: 'tuple',
        name: 'interfaceFee2',
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
            name: 'unwrap',
            type: 'bool',
          },
        ],
      },
    ],
  },
] as const

export const buildPlaceTriggerOrder = ({
  market,
  side,
  comparison,
  maxFee,
  triggerPrice,
  delta,
  interfaceFee,
  interfaceFee2,
}: {
  market: Address
  side: PositionSide.long | PositionSide.short
  comparison: 'lte' | 'gte'
  maxFee: bigint
  triggerPrice: bigint
  delta: bigint
  interfaceFee?: {
    amount: bigint
    receiver: Address
    unwrap: boolean
  }
  interfaceFee2?: {
    amount: bigint
    receiver: Address
    unwrap: boolean
  }
}): MultiInvokerAction => ({
  action: 3,
  args: encodeAbiParameters(PlaceTriggerOrderInputs, [
    market,
    {
      side: side === 'long' ? 1 : 2,
      comparison: comparison === 'lte' ? -1 : 1,
      fee: maxFee,
      price: triggerPrice,
      delta,
      interfaceFee1: interfaceFee ?? EmptyInterfaceFee,
      interfaceFee2: interfaceFee2 ?? EmptyInterfaceFee,
    },
  ]),
})

export const buildCancelOrder = ({ market, nonce }: { market: Address; nonce: bigint }): MultiInvokerAction => ({
  action: 4,
  args: encodeAbiParameters(
    ['address', 'uint256'].map((type) => ({ type })),
    [market, nonce],
  ),
})

export const buildCommitPrice = ({
  keeperFactory,
  version,
  value,
  ids,
  vaa,
  revertOnFailure,
}: {
  keeperFactory: Address
  version: bigint
  value: bigint
  ids: string[]
  vaa: string
  revertOnFailure: boolean
}): MultiInvokerAction => ({
  action: 6,
  args: encodeAbiParameters(
    ['address', 'uint256', 'bytes32[]', 'uint256', 'bytes', 'bool'].map((type) => ({ type })),
    [keeperFactory, value, ids, version, vaa, revertOnFailure],
  ),
})

export const buildLiquidate = ({ market, user }: { market: Address; user: Address }): MultiInvokerAction => ({
  action: 7,
  args: encodeAbiParameters(
    ['address', 'address'].map((type) => ({ type })),
    [market, user],
  ),
})

export const buildApproveTarget = ({ target }: { target: Address }): MultiInvokerAction => ({
  action: 8,
  args: encodeAbiParameters(
    ['address'].map((type) => ({ type })),
    [target],
  ),
})

export const EmptyInterfaceFee: {
  amount: bigint
  receiver: Address
  unwrap: boolean
} = { amount: 0n, receiver: zeroAddress, unwrap: false }

export const mergeMultiInvokerTxs = (
  transactionData: {
    data: Hex
    value: bigint
    to: Address
  }[],
) => {
  if (transactionData.length === 0) {
    throw new Error('No transaction data provided')
  }

  let actions: MultiInvokerAction[] = []

  for (const { data } of transactionData) {
    const { args } = decodeFunctionData({
      abi: MultiInvokerAbi,
      data,
    })
    actions = [...actions, ...args.flatMap((arg: MultiInvokerAction) => arg)]
  }

  const data = encodeFunctionData({
    functionName: 'invoke',
    abi: MultiInvokerAbi,
    args: [actions],
  })

  return {
    data,
    value: transactionData.reduce((acc, { value }) => acc + value, 0n),
    to: transactionData[0].to,
  }
}
