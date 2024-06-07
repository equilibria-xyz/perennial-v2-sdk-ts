import PerennialSDK from './Perennial'

export default PerennialSDK

/* #################### Library #################### */

// Market - Chain
export {
  type MarketOracles,
  type MarketSnapshot,
  type UserMarketSnapshot,
  type MarketSnapshots,
  fetchMarketOracles,
  fetchMarketSnapshots,
} from './lib/markets/chain'

// Market - Graph
export {
  type SubPositionChange,
  type OpenOrder,
  type Markets,
  fetchActivePositionPnl,
  fetchActivePositionHistory,
  fetchHistoricalPositions,
  fetchSubPositions,
  fetchOpenOrders,
  fetchMarket24hrData,
  fetchMarket7dData,
  getPriceAtVersion,
  fetchTradeHistory,
} from './lib/markets/graph'

// Market - Transactions
export {
  buildCancelOrderTx,
  buildUpdateMarketTx,
  buildLimitOrderTx,
  buildTakeProfitTx,
  buildStopLossTx,
  buildSubmitVaaTx,
  type BuildSubmitVaaTxArgs,
  type CancelOrderDetails,
  type BuildLimitOrderTxArgs,
  type BuildTakeProfitTxArgs,
  type BuildStopLossTxArgs,
  type BuildUpdateMarketTxArgs,
} from './lib/markets/tx'

// Vault - Chain
export {
  type VaultSnapshot,
  type VaultSnapshots,
  type VaultAccountSnapshot,
  type ChainVaultAccountSnapshot,
  type ChainVaultSnapshot,
  type VaultPositionHistory,
  fetchVaultSnapshots,
  fetchVaultPositionHistory,
} from './lib/vaults/chain'

// Vault - Graph
export { fetchVault7dAccumulations } from './lib/vaults/graph'

// Vault - Transactions
export {
  buildDepositTx,
  buildRedeemSharesTx,
  buildClaimTx,
  type BuildDepositTxArgs,
  type BuildRedeemSharesTxArgs,
  type BuildClaimTxArgs,
} from './lib/vaults/tx'

// Operator - Transaction
export { buildApproveUSDCTx, buildApproveMarketFactoryTx, buildApproveVaultFactoryTx } from './lib/operators'

/* #################### Constants #################### */

export * as constants from './constants'

// Contracts
export {
  MultiInvokerAddresses,
  MarketFactoryAddresses,
  VaultFactoryAddresses,
  PythFactoryAddresses,
  OracleFactoryAddresses,
  DSUAddresses,
  USDCAddresses,
} from './constants/contracts'

export {
  getUSDCContract,
  getDSUContract,
  getMultiInvokerContract,
  getMarketFactoryContract,
  getVaultFactoryContract,
  getPythFactoryContract,
  getMarketContract,
  getVaultContract,
  getOracleContract,
  getKeeperOracleContract,
} from './lib/contracts'

// Vaults
export {
  PerennialVaultType,
  SupportedVaults,
  VaultMetadata,
  ChainVaults,
  chainVaultsWithAddress,
} from './constants/vaults'

// Units
export { MaxUint256, WeiPerEther } from './constants/units'

// Network
export {
  DefaultChain,
  SupportedChainIds,
  type SupportedChainId,
  chainIdToChainMap,
  chains,
  isSupportedChain,
  mainnetChains,
  isTestnet,
  ExplorerURLs,
  ExplorerNames,
} from './constants/network'

// Markets
export {
  SupportedAsset,
  QuoteCurrency,
  PositionSide,
  PositionStatus,
  AssetMetadata,
  type AssetMetadataType,
  ChainMarkets,
  chainAssetsWithAddress,
  addressToAsset,
  TriggerComparison,
  OrderTypes,
  orderTypes,
  triggerOrderTypes,
  type InterfaceFee,
} from './constants/markets'

/* #################### ABIs #################### */

export { ERC20Abi } from './abi/ERC20.abi'
export { LensAbi } from './abi/Lens.abi'
export { MarketAbi } from './abi/Market.abi'
export { MarketFactoryAbi } from './abi/MarketFactory.abi'
export { MultiInvokerAbi } from './abi/MultiInvoker.abi'
export { OracleAbi } from './abi/Oracle.abi'
export { VaultAbi } from './abi/Vault.abi'
export { VaultFactoryAbi } from './abi/VaultFactory.abi'
export { VaultLensAbi } from './abi/VaultLens.abi'
export { KeeperOracleAbi } from './abi/KeeperOracle.abi'
export { PythFactoryAbi } from './abi/PythFactory.abi'

/* #################### Types #################### */

export { type JumpRateUtilizationCurve, type MultiInvokerAction } from './types/perennial'

// Graph Types
export * from './types/gql'

/* #################### Utils #################### */

export * as utils from './utils'

// Array Utils
export { notEmpty, sum, unique, equal, range } from './utils/arrayUtils'

// Accumulator Utils
export {
  type AccumulatorType,
  AccumulatorTypes,
  type RealizedAccumulations,
  accumulateRealized,
} from './utils/accumulatorUtils'

// Big6 Utils
export { BigOrZero, formatBig6, formatBig6Percent, formatBig6USDPrice, Big6Math } from './utils/big6Utils'

// Big18 Utils
export { formatBig18, formatBig18Percent, formatBig18USDPrice, Big18Math } from './utils/big18Utils'

// Contract Utils
export { getVaultAddressForType, bufferGasLimit, parseViemContractCustomError } from './utils/contractUtils'

// Funding and Interest Rate Utils
export { computeInterestRate, calculateFundingForSides } from './utils/fundingAndInterestUtils'

// Graph Utils
export { queryAll } from './utils/graphUtils'

// MultiInvoker Utils
export {
  buildNoop,
  buildUpdateMarket,
  buildUpdateVault,
  buildPlaceTriggerOrder,
  buildCancelOrder,
  buildCommitPrice,
  buildLiquidate,
  buildApproveTarget,
  mergeMultiInvokerTxs,
} from './utils/multiinvoker'

// Payoff Utils
export { linearTransform, microPowerTwoTransform, milliPowerTwoTransform } from './utils/payoffUtils'

// Position Utils
export {
  magnitude,
  side,
  efficiency,
  calcLiquidationPrice,
  calcLeverage,
  calcMakerExposure,
  closedOrResolved,
  calcNotional,
  calcMakerStats,
  getPositionFromSelectedMarket,
  getSideFromPosition,
  getStatusForSnapshot,
  calcTakerLiquidity,
  isActivePosition,
  calcSkew,
  calcFundingRates,
  calcTradeFee,
  calcPriceImpactFromTradeFee,
  calcEstExecutionPrice,
  calcInterfaceFee,
  calcTotalPositionChangeFee,
  isFailedClose,
  calcLpExposure,
  UpdateNoOp,
  calcMaxLeverage,
} from './utils/positionUtils'

// Pyth Utils
export { getRecentVaa, buildCommitmentsForOracles, pythPriceToBig6 } from './utils/pythUtils'

// Time Utils
export {
  Second,
  Minute,
  Hour,
  Day,
  Year,
  nowSeconds,
  timeToSeconds,
  last24hrBounds,
  last7dBounds,
  formatDateRelative,
} from './utils/timeUtils'

export { PriceFeed, EvmPriceServiceConnection } from '@perennial/pyth-evm-js'
