import {
  Address,
  Hex,
  PublicClient,
  decodeFunctionData,
  encodeAbiParameters,
  getContractAddress,
  keccak256,
  maxUint256,
  pad,
  parseEther,
  toHex,
  zeroAddress,
} from 'viem'

import { Big6Math, Big18Math, MultiInvokerAbi, parseViemContractCustomError } from '..'
import { DSUAddresses, MultiInvokerAddresses, SupportedMarket } from '../constants'
import { SupportedChainId } from '../constants'
import { CommonOverrides } from '../types/shared'
import { addressForMarket } from './addressUtils'
import { buildUpdateMarket, encodeInvoke, mergeMultiInvokerTxs } from './multiinvoker'

export function generateNonce() {
  return BigInt(Date.now())
}

/**
 * Adds a signer override to the overrides object if the signer is not already set.
 * @param walletClientSigner - The address of the wallet client signer.
 * @param overrides - The {@link CommonOverrides} object.
 * @returns The updated overrides object.
 */
export function addSignerOverrideFromWalletClientSigner({
  walletClientSigner,
  overrides,
}: {
  walletClientSigner?: Address
} & CommonOverrides) {
  return Boolean(overrides?.signer) ? overrides : { ...overrides, signer: walletClientSigner }
}

/**
 * The address used to simulate intent updates.
 */
export const IntentSimulationSender = getContractAddress({ from: zeroAddress, nonce: maxUint256 })

/**
 * Checks if an intent is fillable by simulating the intent update on the market.
 * @param txData - The transaction data to be sent.
 * @param market - The address or {@link SupportedMarket} of the market.
 * @param publicClient - The public client to be used for the simulation.
 * @param chainId - The chain ID to be used for the simulation.
 * @returns An object with a boolean indicating if the intent is fillable and an optional error string.
 */
export async function checkIntentFillable({
  txData,
  market,
  chainId,
  publicClient,
}: {
  txData: { to: Address; data: Hex; value: bigint }
  market: Address | SupportedMarket
  chainId: SupportedChainId
  publicClient: PublicClient
}): Promise<{ fillable: boolean; error?: string }> {
  const marketAddress = addressForMarket(chainId, market)
  const multiInvokerUpdate = buildUpdateMarket({
    market: marketAddress,
    collateral: Big6Math.fromFloatString(_simulationCollateralAmount),
    wrap: false,
  })
  const txDataWithDeposit = mergeMultiInvokerTxs([
    encodeInvoke({ chainId, actions: [multiInvokerUpdate], address: IntentSimulationSender, value: 0n }),
    txData,
  ])

  try {
    const { functionName, args } = decodeFunctionData({
      abi: MultiInvokerAbi,
      data: txDataWithDeposit.data,
    })
    if (functionName !== 'invoke') return { fillable: false, error: 'Invalid data' }

    await publicClient.simulateContract({
      address: txDataWithDeposit.to,
      value: txDataWithDeposit.value,
      abi: MultiInvokerAbi,
      functionName: 'invoke',
      args: args.length === 2 ? [args[0], args[1]] : [args[0]],
      account: IntentSimulationSender,
      stateOverride: _intentUpdateStateOverrides(chainId),
    })
  } catch (error: unknown) {
    return { fillable: false, error: parseViemContractCustomError(error) }
  }
  return { fillable: true }
}

// Simulation constants
const _simulationCollateralAmount = (1_000_000_000).toString()
const _intentUpdateStateOverrides = (chainId: SupportedChainId) => [
  {
    // Give Sender some ETH to pay for gas
    address: IntentSimulationSender,
    balance: parseEther('1'),
  },
  {
    // Give Sender DSU and update allowance
    address: DSUAddresses[chainId],
    stateDiff: [
      {
        slot: keccak256(encodeAbiParameters([{ type: 'address' }, { type: 'uint256' }], [IntentSimulationSender, 1n])),
        value: pad(toHex(Big18Math.fromFloatString(_simulationCollateralAmount))),
      },
      {
        slot: keccak256(
          encodeAbiParameters(
            [{ type: 'address' }, { type: 'bytes32' }],
            [
              MultiInvokerAddresses[chainId],
              keccak256(encodeAbiParameters([{ type: 'address' }, { type: 'uint256' }], [IntentSimulationSender, 2n])),
            ],
          ),
        ),
        value: pad(toHex(Big18Math.fromFloatString(_simulationCollateralAmount))),
      },
    ],
  },
]
