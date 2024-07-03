# Perennial SDK

[![npm version](https://badge.fury.io/js/@perennial%2Fsdk.svg)](https://badge.fury.io/js/@perennial%2Fsdk)

An SDK for building applications on top of Perennial.

## Warning:

**_This SDK is under heavy development and may change significantly before it is finalized. We highly recommend not using any floating versions when declaring as a dependency._**

## API Documentation

https://sdk-docs.perennial.finance/

## Installation

### Yarn

```
$ yarn add @perennial/sdk
```

### npm

```
$ npm install @perennial/sdk --save
```

## Getting started

### Initialization

**Read-Only Usage**

To initalize the package you'll need to specify three `env` variables:

- `RPC_URL_ARBITRUM`: A RPC url for Arbitrum which **must** support `eth_call`
- `GRAPH_URL_ARBITRUM`: A hosted subgraph url for the Perennial protocol. This argument is optional, but graph dependant read methods will throw an error if it is omitted.
  - You can find the Perennial subgraph repo [here](https://github.com/equilibria-xyz/perennial-v2-subgraph)
- `PYTH_URL`: A url for Pyth

Once you have these, you can initalize the SDK:

```javascript
const RPC_URL = process.env.RPC_URL
const GRAPH_URL = process.env.GRAPH_URL
const PYTH_URL = process.env.PYTH_URL

const sdk = new PerennialSdk({
  chainId: 42161,
  rpcUrl: RPC_URL,
  graphUrl: GRAPH_URL,
  pythUrl: PYTH_URL || 'https://hermes.pyth.network',
  walletClient: undefined,
})
```

**Read/Write Usage**

In addition to the previous `env` varibles, you need to initalize the wallet:

```javascript
import { arbitrum } from 'viem/chains'
import { useWalletClient } from 'wagmi'

const RPC_URL = process.env.RPC_URL
const GRAPH_URL = process.env.GRAPH_URL
const PYTH_URL = process.env.PYTH_URL

const walletClient = useWalletClient({ chainId: arbitrum.id })

const sdk = new PerennialSdk({
  chainId: arbitrum.id,
  rpcUrl: RPC_URL,
  graphUrl: GRAPH_URL,
  pythUrl: PYTH_URL || 'https://hermes.pyth.network',
  walletClient: walletClient.data,
  supportedMarkets, // Define a subset of our supported markets. When omitted, defaults to all supported markets.
})
```

After the SDK has been initalized calls can be made like this:

```javascript
const tradeHistory = await sdk.markets.read.tradeHistory({
  address: '0x325cd6b3cd80edb102ac78848f5b127eb6db13f3',
})
```

## Examples

### Simple Perennial API

This example wraps the Perennial SDK to enable users operating in different languages to access the functionality of the SDK via an API. Once setup you can make calls like below to generate up to date market information:

```bash
curl --request POST \
  --url http://localhost:3000/api/generic \
  --header 'Content-Type: application/json' \
  --data '{
  "apiKey": "XXX",
  "func": "marketSnapshots",
  "args": {
    "address": "0xA87a233e8a7d8951fF790A2e39738086cb5f71b7"
  }
}'
```

See the example code here [here](https://github.com/equilibria-xyz/perennial-v2-sdk-ts/tree/main/examples/simple_api)

## Methods

### Read methods

View a complete list of the read methods provided here:

https://sdk-docs.perennial.finance/classes/lib_markets.MarketsModule.html#read

#### Market Snapshots

Fetch the current state of Perennial markets and user positions.

```typescript
import { SupportedMarket } from '@perennial/sdk'

const marketSnapshots = await sdk.markets.read.marketSnapshots({
  address: WalletAddress,
  onError: () => console.error('Error fetching market snapshots.'),
  onSuccess: () => console.log('Market snapshots fetched successfully.'),
})

console.log(marketSnapshots.market[SupportedMarket.eth]) // ETH market state
console.log(marketSnapshots.user[SupportedMarket.eth]) // User ETH position state
```

#### Active Position Pnl

Fetch PnL data for an open user position.

```typescript
import { getAddress } from "viem"
import { arbitrum } from "viem/chains"
import { ChainMarkets, SupportedMarket } from "@perennial/sdk"

const marketSnapshots = await sdk.markets.read.marketSnapshots({...})

const userPositionPnlData = await sdk.markets.read.activePositionPnl({
    marketSnapshots,
    address: getAddress(<userAddress>),
    markets: [SupportedMarket.eth, SupportedMarket.btc]
})
```

#### Open Orders

Fetch open orders for a set of markets for a given user.

```typescript
import { SupportedMarket } from '@perennial/sdk'

const openOrders = await sdk.markets.read.openOrders({
  address: getAddress(<userAddress>),
  markets: [SupportedMarket.eth],
  chainId,
  first: 100,
  skip: 0,
  isMaker: false // Set to true to fetch orders for maker positions
})
```

#### Position history

Fetch position history for a given user

```typescript
import { SupportedMarket } from '@perennial/sdk'

const positionHistory = await sdk.markets.read.historicalPositions({
  address,
  markets: [SupportedMarket.btc, SupportedMarket.eth],
  chainId,
  fromTs, // bigint - start timestamp
  toTs, // bigint - end timestamp in seconds
  first: 100,
  skip: 0,
  maker: false, // Set to true to fetch history for maker positions
})
```

#### Active position history

Fetch the change history for an active position

```typescript
const activePositionHistory = await sdk.markets.read.activePositionHistory({
  market: SupportedMarket.eth,
  address,
  positionId,
  first: 100,
  skip: 0,
  chainId,
})
```

#### Market 24hr and 7d data

```typescript
const ethMarket24hrData = await sdk.markets.read.market24hrData({
  market: [SupportedMarket.eth],
  chainId,
})
```

#### Trade History

Fetch the trade history across all markets for a given address. Limited to a 30 day window

```typescript
const tradeHistory = await sdk.markets.read.tradeHistory({
  address,
  fromTs, // from timestamp in seconds
  toTs, // to timestamp in seconds
})
```

### Write Methods

View a complete list of the write methods provided here:

https://sdk-docs.perennial.finance/classes/lib_markets.MarketsModule.html#write

#### ModifyPosition

The `modifyPosition` method provides the ability to combine multiple market actions (open/close, increase/decrease, deposit/withdraw collateral, SL/TP) in a single transaction. For more granular control, see `Combining market actions` below.

When values are provided for `stopLossPrice` or `takeProfitPrice`, the resulting order/s will fully close the position. To set partial close SL/TP orders, please use the `stopLoss`, `takeProfit`, or `placeOrder` methods.

```typescript
const marketOracles = await sdk.markets.read.marketOracles()
const marketSnapshots = await sdk.markets.read.marketSnapshots({...})
const ethMarketSnapshot = marketSnapshots.market[SupportedMarket.eth]
const ethUserMarketSnapshot = marketSnapshots.user[SupportedMarket.eth]

sdk.markets.write.modifyPosition({
  marketAddress: ethMarketSnapshot.market,
  address: getAddress(<User address>),
  // marketSnapshots and marketOracles parameters are optional, but it is recommended
  // to prefetch these in your application to prevent unnecessary refetches
  // when calling this method.
  marketSnapshots,
  marketOracles,
  collateralDelta, // Add or remove collateral
  positionAbs, // Absolute position size post change
  stopLossPrice, // Optional Stop loss trigger price
  takeProfitPrice, // Optional Take profit trigger price
  cancelOrderDetails, // Optional list of existing orders to cancel
  interfaceFee,
  referralFee,
  stopLossFees,
  takeProfitFees,
})
```

#### PlaceOrder

The `placeOrder` method can be used to set combined limit, stop loss and take profit orders.

```typescript
const marketOracles = await sdk.markets.read.marketOracles()
const marketSnapshots = await sdk.markets.read.marketSnapshots({...})
const ethMarketSnapshot = marketSnapshots.market[SupportedMarket.eth]
const ethUserMarketSnapshot = marketSnapshots.user[SupportedMarket.eth]

sdk.markets.write.placeOrder({
  marketAddress: ethMarketSnapshot.market,
  address: getAddress(<User address>),
  // As with `modifyPosition`, marketSnapshots and marketOracles are optional but recommended.
  marketSnapshots,
  marketOracles,
  orderType, // See `OrderTypes` enum for options
  side, // Position side
  limitPrice,
  stopLossPrice,
  takeProfitPrice,
  collateralDelta,
  delta, // Position size delta
  cancelOrderDetails, // Optional list of existing orders to cancel
  triggerComparison, // Comparator used for order execution. See `TriggerComparison` enum for options
  limitOrderFees,
  stopLossFees,
  takeProfitFees
})
```

#### Update market

Send an update market transaction. Can be used to increase/decrease an existing position, open/close a position and deposit or withdraw collateral.

```typescript
const marketOracles = await sdk.markets.read.marketOracles()
const marketSnapshots = await sdk.markets.read.marketSnapshots({...})
const ethMarketSnapshot = marketSnapshots.market[SupportedMarket.eth]
const ethUserMarketSnapshot = marketSnapshots.user[SupportedMarket.eth]

sdk.markets.write.update({
  address,
  marketAddress: ethMarketSnapshot.market,
  collateralDelta, // A negative collateral delta value withdraws collateral
  positionAbs, // Absolute size of desired position
  side,
  marketOracles,
  marketSnapshots,
  onCommitmentError, // on error
})
```

#### Limit order

Send a limit order transaction.

```typescript
sdk.markets.write.limitOrder({
  address,
  marketAddress
  side,
  limitPrice,
  delta, // Size of order to place
  selectedLimitComparison, // Trigger comparison for order execution (see TriggerComparison enum)
  interfaceFee, // Optional interface fee to charge
  referralFee, // Optional referral fee to charge
})
```

#### Stop loss

Send a stop loss order transaction.

```typescript
sdk.markets.write.stopLoss({
  address,
  marketAddress
  side,
  stopLossPrice,
  delta, // Size of order to place
  selectedLimitComparison, // Trigger comparison for order execution (see TriggerComparison enum)
  interfaceFee, // Optional interface fee to charge
  referralFee, // Optional referral fee to charge
})
```

#### Take profit

Send a take profit order transaction.

```typescript
sdk.markets.write.takeProfit({
  address,
  marketAddress
  side,
  takeProfitPrice,
  delta, // Size of order to place
  selectedLimitComparison, // Trigger comparison for order execution (see TriggerComparison enum)
  interfaceFee, // Optional interface fee to charge
  referralFee, // Optional referral fee to charge
})
```

#### Cancel order

Cancel a selection of open orders. Use the `sdk.markets.read.openOrders` method to fetch all currently standing orders.

```typescript
import { getAddress } from 'viem'

const ordersToCancel = [
  { market: getAddress(ethMarketAddress), nonce: BigInt(orderA.nonce) },
  { market: getAddress(ethMarketAddress), nonce: BigInt(orderB.nonce) },
]

sdk.markets.write.cancelOrder({
  address, // Wallet address
  orderDetails: ordersToCancel,
})
```

### Build Methods

Build transaction data for various operations on Perennial to have greater control over execution. The API's for our build methods are identical to the writes, but return an object with the transaction data which can then be executed seperately. View a complete list of the build methods provided here:

https://sdk-docs.perennial.finance/classes/lib_markets.MarketsModule.html#build

#### Combining market actions

Using our transaction builders, you can combine various market operations into a single transaction using `mergeMultiInvokerTxs`.

Under the hood, `placeOrder` and `modifyPosition` leverage this feature to provide multiple options for interacting with the protocol.

```typescript
async function modifyPosition(args: BuildModifyPositionTxArgs) {
  let stopLossTx
  let takeProfitTx
  let cancelOrderTx

  const updateMarketTx = await sdk.markets.build.update(args)
  const isTaker = args.positionSide === PositionSide.short || args.positionSide === PositionSide.long

  if (args.stopLossPrice && isTaker) {
    stopLossTx = await sdk.markets.build.stopLoss({
      marketAddress: args.marketAddress,
      stopLossPrice: args.stopLossPrice,
      side: args.positionSide as PositionSide.long | PositionSide.short,
      delta: TriggerOrderFullCloseMagicValue,
      interfaceFee: args.stopLossFees?.interfaceFee,
      referralFee: args.stopLossFees?.referralFee,
      maxFee: OrderExecutionDeposit,
    })
  }

  if (args.takeProfitPrice && isTaker) {
    takeProfitTx = await sdk.markets.build.takeProfit({
      address,
      marketAddress: args.marketAddress,
      takeProfitPrice: args.takeProfitPrice,
      side: args.positionSide as PositionSide.long | PositionSide.short,
      delta: TriggerOrderFullCloseMagicValue,
      maxFee: OrderExecutionDeposit,
      interfaceFee: args.takeProfitFees?.interfaceFee,
      referralFee: args.takeProfitFees?.referralFee,
    })
  }

  if (args.cancelOrderDetails?.length) {
    cancelOrderTx = sdk.markets.build.cancelOrder({
      orderDetails: args.cancelOrderDetails,
    })
  }

  const multiInvokerTxs = [updateMarketTx, takeProfitTx, stopLossTx, cancelOrderTx].filter(notEmpty)

  return mergeMultiInvokerTxs(multiInvokerTxs)
}
```
