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
    }
  }

  get write() {
    const walletClient = this.config.walletClient
    if (!walletClient || !walletClient.account) {
      throw new Error('Wallet client required for write methods.')
    }

    const { chainId } = this.config
    const address = walletClient.account

    const txOpts = { account: address, chainId, chain: chainIdToChainMap[chainId] }

    return {
      deployAccount: async (...args: Parameters<typeof this.build.deployAccount>) => {
        const { deployAccount } = this.build.deployAccount(...args)
        const signature = await walletClient.signTypedData({ ...deployAccount, ...txOpts })
        return {
          signature,
          deployAccount,
        }
      },

      withdrawal: async (...args: Parameters<typeof this.build.withdrawal>) => {
        const { withdrawal } = this.build.withdrawal(...args)
        const signature = await walletClient.signTypedData({ ...withdrawal, ...txOpts })
        return {
          signature,
          withdrawal,
        }
      },

      marketTransfer: async (...args: Parameters<typeof this.build.marketTransfer>) => {
        const { marketTransfer } = this.build.marketTransfer(...args)
        const signature = await walletClient.signTypedData({ ...marketTransfer, ...txOpts })
        return {
          signature,
          marketTransfer,
        }
      },

      rebalanceConfigChange: async (...args: Parameters<typeof this.build.rebalanceConfigChange>) => {
        const { rebalanceConfigChange } = this.build.rebalanceConfigChange(...args)
        const signature = await walletClient.signTypedData({ ...rebalanceConfigChange, ...txOpts })
        return {
          signature,
          rebalanceConfigChange,
        }
      },

      relayedSignerUpdate: async (...args: Parameters<typeof this.build.relayedSignerUpdate>) => {
        const { signerUpdate, relayedSignerUpdate } = this.build.relayedSignerUpdate(...args)
        const outerSignature = await walletClient.signTypedData({ ...relayedSignerUpdate, ...txOpts })
        const innerSignature = await walletClient.signTypedData({ ...signerUpdate, ...txOpts })
        return {
          outerSignature,
          innerSignature,
          signerUpdate,
          relayedSignerUpdate,
        }
      },

      relayedOperatorUpdate: async (...args: Parameters<typeof this.build.relayedOperatorUpdate>) => {
        const { operatorUpdate, relayedOperatorUpdate } = this.build.relayedOperatorUpdate(...args)
        const outerSignature = await walletClient.signTypedData({ ...relayedOperatorUpdate, ...txOpts })
        const innerSignature = await walletClient.signTypedData({ ...operatorUpdate, ...txOpts })
        return {
          outerSignature,
          innerSignature,
          operatorUpdate,
          relayedOperatorUpdate,
        }
      },

      relayedGroupCancellation: async (...args: Parameters<typeof this.build.relayedGroupCancellation>) => {
        const { groupCancellation, relayedGroupCancellation } = this.build.relayedGroupCancellation(...args)
        const outerSignature = await walletClient.signTypedData({ ...relayedGroupCancellation, ...txOpts })
        const innerSignature = await walletClient.signTypedData({ ...groupCancellation, ...txOpts })
        return {
          outerSignature,
          innerSignature,
          groupCancellation,
          relayedGroupCancellation,
        }
      },

      relayedNonceCancellation: async (...args: Parameters<typeof this.build.relayedNonceCancellation>) => {
        const { nonceCancellation, relayedNonceCancellation } = this.build.relayedNonceCancellation(...args)
        const outerSignature = await walletClient.signTypedData({ ...relayedNonceCancellation, ...txOpts })
        const innerSignature = await walletClient.signTypedData({ ...nonceCancellation, ...txOpts })
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
