import { Address, PublicClient, WalletClient, zeroAddress } from 'viem'

import { SupportedChainId, chainIdToChainMap } from '../../constants'
import { OptionalAddress } from '../../types/shared'
import { throwIfZeroAddress } from '../../utils/addressUtils'
import {
  BuildDeployAccountSigningPayloadArgs,
  buildDeployAccountSigningPayload,
} from './intent/buildDeployAccountSigningPayload'
import {
  BuildMarketTransferSigningPayloadArgs,
  buildMarketTransferSigningPayload,
} from './intent/buildMarketTransferSigningPayload'
import {
  BuildRebalanceConfigChangeSigningPayloadArgs,
  buildRebalanceConfigChangeSigningPayload,
} from './intent/buildRebalanceConfigChangeSigningPayload'
import {
  BuildRelayedAccessUpdateBatchSigningPayloadArgs,
  buildRelayedAccessUpdateBatchSigningPayload,
} from './intent/buildRelayedAccessUpdateBatchSigningPayload'
import {
  BuildRelayedGroupCancellationSigningPayloadArgs,
  buildRelayedGroupCancellationSigningPayload,
} from './intent/buildRelayedGroupCancellationSigningPayload'
import {
  BuildRelayedNonceCancellationSigningPayloadArgs,
  buildRelayedNonceCancellationSigningPayload,
} from './intent/buildRelayedNonceCancellationSigningPayload'
import {
  BuildRelayedOperatorUpdateSigningPayloadArgs,
  buildRelayedOperatorUpdateSigningPayload,
} from './intent/buildRelayedOperatorUpdateSigningPayload'
import {
  BuildRelayedSignerUpdateSigningPayloadArgs,
  buildRelayedSignerUpdateSigningPayload,
} from './intent/buildRelayedSignerUpdateSigningPayload'
import {
  BuildWithdrawalSigningPayloadArgs,
  buildWithdrawalSigningPayload,
} from './intent/buildWithdrawalSigningPayload'
import { ReadCollateralAccountAddressArgs, readCollateralAccountAddress } from './read/collateralAccountAddress'

type OmitBound<T> = Omit<T, 'chainId' | 'publicClient' | 'address'>
export class CollateralAccountModule {
  private config: {
    chainId: SupportedChainId
    publicClient: PublicClient
    walletClient?: WalletClient
    operatingFor?: Address
  }
  private defaultAddress: Address = zeroAddress

  constructor(config: {
    chainId: SupportedChainId
    publicClient: PublicClient
    walletClient?: WalletClient
    operatingFor?: Address
  }) {
    this.config = config
    this.defaultAddress = config.operatingFor ?? config.walletClient?.account?.address ?? this.defaultAddress
  }

  get read() {
    return {
      collateralAccountAddress: (args: OmitBound<ReadCollateralAccountAddressArgs> & OptionalAddress = {}) => {
        const address = args.address ?? this.defaultAddress
        throwIfZeroAddress(address)

        return readCollateralAccountAddress({
          chainId: this.config.chainId,
          publicClient: this.config.publicClient,
          ...args,
          address,
        })
      },
    }
  }

  get build() {
    return {
      signed: {
        deployAccount: (args: OmitBound<BuildDeployAccountSigningPayloadArgs> & OptionalAddress) => {
          const address = args.address ?? this.defaultAddress
          throwIfZeroAddress(address)

          return buildDeployAccountSigningPayload({ chainId: this.config.chainId, ...args, address })
        },

        withdrawal: (args: OmitBound<BuildWithdrawalSigningPayloadArgs> & OptionalAddress) => {
          const address = args.address ?? this.defaultAddress
          throwIfZeroAddress(address)

          return buildWithdrawalSigningPayload({ chainId: this.config.chainId, ...args, address })
        },

        marketTransfer: (args: OmitBound<BuildMarketTransferSigningPayloadArgs> & OptionalAddress) => {
          const address = args.address ?? this.defaultAddress
          throwIfZeroAddress(address)

          return buildMarketTransferSigningPayload({ chainId: this.config.chainId, ...args, address })
        },

        rebalanceConfigChange: (args: OmitBound<BuildRebalanceConfigChangeSigningPayloadArgs> & OptionalAddress) => {
          const address = args.address ?? this.defaultAddress
          throwIfZeroAddress(address)

          return buildRebalanceConfigChangeSigningPayload({ chainId: this.config.chainId, ...args, address })
        },

        relayedSignerUpdate: (args: OmitBound<BuildRelayedSignerUpdateSigningPayloadArgs> & OptionalAddress) => {
          const address = args.address ?? this.defaultAddress
          throwIfZeroAddress(address)

          return buildRelayedSignerUpdateSigningPayload({ chainId: this.config.chainId, ...args, address })
        },

        relayedOperatorUpdate: (args: OmitBound<BuildRelayedOperatorUpdateSigningPayloadArgs> & OptionalAddress) => {
          const address = args.address ?? this.defaultAddress
          throwIfZeroAddress(address)

          return buildRelayedOperatorUpdateSigningPayload({ chainId: this.config.chainId, ...args, address })
        },

        relayedAccessUpdateBatch: (
          args: OmitBound<BuildRelayedAccessUpdateBatchSigningPayloadArgs> & OptionalAddress,
        ) => {
          const address = args.address ?? this.defaultAddress
          throwIfZeroAddress(address)

          return buildRelayedAccessUpdateBatchSigningPayload({ chainId: this.config.chainId, ...args, address })
        },

        relayedGroupCancellation: (
          args: OmitBound<BuildRelayedGroupCancellationSigningPayloadArgs> & OptionalAddress,
        ) => {
          const address = args.address ?? this.defaultAddress
          throwIfZeroAddress(address)

          return buildRelayedGroupCancellationSigningPayload({ chainId: this.config.chainId, ...args, address })
        },

        relayedNonceCancellation: (
          args: OmitBound<BuildRelayedNonceCancellationSigningPayloadArgs> & OptionalAddress,
        ) => {
          const address = args.address ?? this.defaultAddress
          throwIfZeroAddress(address)

          return buildRelayedNonceCancellationSigningPayload({ chainId: this.config.chainId, ...args, address })
        },
      },
    }
  }

  get write() {
    const walletClient = this.config.walletClient
    if (!walletClient || !walletClient.account) {
      throw new Error('Wallet client required for write methods.')
    }

    const { chainId } = this.config
    const address = walletClient.account

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const txOpts = { account: address, chainId, chain: chainIdToChainMap[chainId] }

    return {}
  }

  get sign() {
    const walletClient = this.config.walletClient
    if (!walletClient || !walletClient.account) {
      throw new Error('Wallet client required for write methods.')
    }

    const { chainId } = this.config
    const address = walletClient.account

    const signOpts = { account: address, chainId, chain: chainIdToChainMap[chainId] }

    return {
      deployAccount: async (...args: Parameters<typeof this.build.signed.deployAccount>) => {
        const { deployAccount } = this.build.signed.deployAccount(...args)
        const signature = await walletClient.signTypedData({ ...deployAccount, ...signOpts })
        return {
          signature,
          deployAccount,
        }
      },

      withdrawal: async (...args: Parameters<typeof this.build.signed.withdrawal>) => {
        const { withdrawal } = this.build.signed.withdrawal(...args)
        const signature = await walletClient.signTypedData({ ...withdrawal, ...signOpts })
        return {
          signature,
          withdrawal,
        }
      },

      marketTransfer: async (...args: Parameters<typeof this.build.signed.marketTransfer>) => {
        const { marketTransfer } = this.build.signed.marketTransfer(...args)
        const signature = await walletClient.signTypedData({ ...marketTransfer, ...signOpts })
        return {
          signature,
          marketTransfer,
        }
      },

      rebalanceConfigChange: async (...args: Parameters<typeof this.build.signed.rebalanceConfigChange>) => {
        const { rebalanceConfigChange } = this.build.signed.rebalanceConfigChange(...args)
        const signature = await walletClient.signTypedData({ ...rebalanceConfigChange, ...signOpts })
        return {
          signature,
          rebalanceConfigChange,
        }
      },

      relayedSignerUpdate: async (...args: Parameters<typeof this.build.signed.relayedSignerUpdate>) => {
        const { signerUpdate, relayedSignerUpdate } = this.build.signed.relayedSignerUpdate(...args)
        const outerSignature = await walletClient.signTypedData({ ...relayedSignerUpdate, ...signOpts })
        const innerSignature = await walletClient.signTypedData({ ...signerUpdate, ...signOpts })
        return {
          outerSignature,
          innerSignature,
          signerUpdate,
          relayedSignerUpdate,
        }
      },

      relayedOperatorUpdate: async (...args: Parameters<typeof this.build.signed.relayedOperatorUpdate>) => {
        const { operatorUpdate, relayedOperatorUpdate } = this.build.signed.relayedOperatorUpdate(...args)
        const outerSignature = await walletClient.signTypedData({ ...relayedOperatorUpdate, ...signOpts })
        const innerSignature = await walletClient.signTypedData({ ...operatorUpdate, ...signOpts })
        return {
          outerSignature,
          innerSignature,
          operatorUpdate,
          relayedOperatorUpdate,
        }
      },

      relayedAccessUpdateBatch: async (...args: Parameters<typeof this.build.signed.relayedAccessUpdateBatch>) => {
        const { relayedAccessUpdateBatch, accessUpdateBatch } = this.build.signed.relayedAccessUpdateBatch(...args)
        const outerSignature = await walletClient.signTypedData({ ...relayedAccessUpdateBatch, ...signOpts })
        const innerSignature = await walletClient.signTypedData({ ...accessUpdateBatch, ...signOpts })
        return {
          outerSignature,
          innerSignature,
          relayedAccessUpdateBatch,
          accessUpdateBatch,
        }
      },
      relayedGroupCancellation: async (...args: Parameters<typeof this.build.signed.relayedGroupCancellation>) => {
        const { groupCancellation, relayedGroupCancellation } = this.build.signed.relayedGroupCancellation(...args)
        const outerSignature = await walletClient.signTypedData({ ...relayedGroupCancellation, ...signOpts })
        const innerSignature = await walletClient.signTypedData({ ...groupCancellation, ...signOpts })
        return {
          outerSignature,
          innerSignature,
          groupCancellation,
          relayedGroupCancellation,
        }
      },

      relayedNonceCancellation: async (...args: Parameters<typeof this.build.signed.relayedNonceCancellation>) => {
        const { nonceCancellation, relayedNonceCancellation } = this.build.signed.relayedNonceCancellation(...args)
        const outerSignature = await walletClient.signTypedData({ ...relayedNonceCancellation, ...signOpts })
        const innerSignature = await walletClient.signTypedData({ ...nonceCancellation, ...signOpts })
        return {
          outerSignature,
          innerSignature,
          nonceCancellation,
          relayedNonceCancellation,
        }
      },
    }
  }
}
