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
  fetchActivePositionsPnl,
  fetchActivePositionHistory,
  fetchHistoricalPositions,
  fetchSubPositions,
  fetchOpenOrders,
  fetchMarkets24hrData,
  fetchMarketsHistoricalData,
  fetchTradeHistory,
} from './lib/markets/graph'

// Market - Transactions
export {
  buildCancelOrderTx,
  buildUpdateMarketTx,
  buildLimitOrderTx,
  buildTakeProfitTx,
  buildStopLossTx,
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
  ChainlinkFactoryAddresses,
  CryptexFactoryAddresses,
  OracleFactoryAddresses,
  DSUAddresses,
  USDCAddresses,
  EmptysetReserveAddresses,
} from './constants/contracts'

export {
  getUSDCContract,
  getDSUContract,
  getEmptysetReserveContarct,
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
  SupportedMarket,
  SupportedMarket as SupportedAsset, // Deprecated - use SupportedMarket
  QuoteCurrency,
  PositionSide,
  PositionStatus,
  MarketMetadata,
  MarketMetadata as AssetMetadata, // Deprecated - Use MarketMetadata
  MarketMetadataType,
  type MarketMetadataType as AssetMetadataType, // Deprecated - Use MarketMetadataType
  ChainMarkets,
  chainMarketsWithAddress,
  chainMarketsWithAddress as chainAssetsWithAddress, // Deprecated - Use chainMarketsWithAddress
  addressToMarket,
  addressToMarket as addressToAsset, // Deprecated - Use addressToMarket
  TriggerComparison,
  OrderTypes,
  orderTypes,
  triggerOrderTypes,
  type InterfaceFee,
  OrderExecutionDeposit,
  TriggerOrderFullCloseMagicValue,
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
export { KeeperFactoryAbi, KeeperFactoryAbi as PythFactoryAbi } from './abi/KeeperFactory.abi'
export { EmptysetReserveAbi } from './abi/EmptysetReserve.abi'
export { FactoryAbi } from './abi/Factory.abi'
export { OracleFactoryAbi } from './abi/OracleFactory.abi'
export { PayoffAbi } from './abi/Payoff.abi'

/* #################### Types #################### */

export { type JumpRateUtilizationCurve, type MultiInvokerAction } from './types/perennial'

// Graph Types
export * from './types/gql'

/* #################### Utils #################### */

export * as utils from './utils'

// Array Utils
export { chunk, notEmpty, sum, unique, equal, range } from './utils/arrayUtils'

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
export {
  computeInterestRate,
  calculateFundingAndInterestForSides,
  calculateFundingAndInterestForSides as calculateFundingForSides, // Deprecated - Use calculateFundingAndInterestForSides
} from './utils/fundingAndInterestUtils'

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
export {
  linearTransform,
  microPowerTwoTransform,
  decimalTransform,
  inverseTransform,
  linearUntransform,
  microPowerTwoUntransform,
  decimalUntransform,
  inverseUntransform,
} from './utils/payoffUtils'

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
  waitForOrderSettlement,
} from './utils/positionUtils'

// Oracle Utils
export {
  type OracleProviderType as OracleProvider,
  type OracleClients,
  type UpdateDataRequest,
  type UpdateDataResponse,
  oracleProviderTypeForFactoryAddress,
  oracleCommitmentsLatest,
  oracleCommitmentsTimestamp,
  marketOraclesToUpdateDataRequest,
} from './lib/oracle'

// Pyth Utils
export { buildCommitmentsForOracles, pythMarketOpen, pythPriceToBig18 } from './lib/oracle/pyth'
// Cryptex Utils
export { fetchPrices } from './lib/oracle/cryptex'

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

// Graph Types
export { Bucket as AccumulationBucket } from './types/gql/graphql'

export { PriceUpdate, HermesClient } from '@pythnetwork/hermes-client'
