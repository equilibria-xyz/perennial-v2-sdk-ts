import { GraphQLClient } from 'graphql-request'
import { Address, getAddress } from 'viem'

import { gql } from '../../types/gql'
import { AccumulatorType, AccumulatorTypes, BigOrZero, last7dBounds } from '../../utils'
import { VaultSnapshot2 } from './chain'

export async function fetchVault7dAccumulations({
  vaultAddress,
  vaultSnapshot,
  graphClient,
  latestBlockNumber,
}: {
  vaultAddress: Address
  vaultSnapshot: VaultSnapshot2
  graphClient: GraphQLClient
  latestBlockNumber: bigint
}) {
  const { from } = last7dBounds()

  const startVersionQuery = gql(`
  query UpdatedNearestTimestamp($market: Bytes!, $account: Bytes!, $timestamp: BigInt!) {
    updateds(
      where: { market: $market, account: $account, version_gte: $timestamp }
      first: 1, orderBy: version, orderDirection: asc
    ) { version, market, blockNumber }
  }
`)
  const startBlockNumbers = await Promise.all(
    vaultSnapshot.registrations.map(async (registration) => {
      const result = await graphClient.request(startVersionQuery, {
        market: registration.market,
        account: vaultAddress,
        timestamp: from.toString(),
      })

      return {
        market: registration.market,
        // If there are no update events, use the latest blocknumber with an offset to accounting for indexing delay
        blockNumber: BigOrZero(result.updateds[0]?.blockNumber ?? latestBlockNumber - 100n),
      }
    }),
  )

  const accountPositionQuery = gql(`
  query VaultAccountPosition($market: Bytes!, $account: Bytes!, $blockNumber: Int!) {
    start: marketAccountPositions(
      where: { market: $market, account: $account }
      block: { number: $blockNumber }
    ) {
      market, lastUpdatedVersion, lastUpdatedBlockNumber
      maker, openNotional, openSize
      accumulatedValue, accumulatedKeeperFees, accumulatedPositionFees, accumulatedMakerPositionFee
      netDeposits, accumulatedPnl, accumulatedFunding, accumulatedInterest, collateral
      weightedFunding, weightedInterest, weightedMakerPositionFees, totalWeight
    }

    now: marketAccountPositions(where: { market: $market, account: $account }) {
      market, lastUpdatedVersion, lastUpdatedBlockNumber
      maker, openNotional, openSize
      accumulatedValue, accumulatedKeeperFees, accumulatedPositionFees, accumulatedMakerPositionFee
      netDeposits, accumulatedPnl, accumulatedFunding, accumulatedInterest, collateral
      weightedFunding, weightedInterest, weightedMakerPositionFees, totalWeight
    }
  }
`)

  const accountPositions = await Promise.all(
    startBlockNumbers.map(async ({ market, blockNumber }) =>
      graphClient.request(accountPositionQuery, {
        market: market,
        account: vaultAddress,
        blockNumber: Number(blockNumber),
      }),
    ),
  )

  return {
    vaultAddress,
    marketValues: accountPositions.map((accountPosition) => {
      const now = accountPosition.now.at(0)
      const start = accountPosition.start.at(0)
      const totalWeight = BigOrZero(now?.totalWeight) - BigOrZero(start?.totalWeight)
      const weightedAverageFundingInterest =
        totalWeight > 0n
          ? (BigOrZero(now?.weightedFunding) -
              BigOrZero(start?.weightedFunding) +
              BigOrZero(now?.weightedInterest) -
              BigOrZero(start?.weightedInterest)) /
            totalWeight
          : 0n
      const weightedAverageMakerPositionFees =
        totalWeight > 0n
          ? (BigOrZero(now?.weightedMakerPositionFees) - BigOrZero(start?.weightedMakerPositionFees)) / totalWeight
          : 0n

      return {
        market: getAddress(accountPosition.now[0].market),
        weightedAverageFundingInterest,
        weightedAverageMakerPositionFees,
        accumulated: AccumulatorTypes.map((accumulatorType) => ({
          [accumulatorType.type]:
            BigOrZero(accountPosition.now.at(0)?.[accumulatorType.realizedKey]) -
            BigOrZero(accountPosition.start.at(0)?.[accumulatorType.realizedKey]),
        })).reduce((acc, curr) => {
          return { ...acc, ...curr }
        }, {} as Record<AccumulatorType, bigint>),
      }
    }),
  }
}
