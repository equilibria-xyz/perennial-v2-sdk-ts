// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import '@perennial/core/contracts/interfaces/IMarket.sol';
import '@perennial/core/contracts/types/OracleReceipt.sol';
import '@perennial/oracle/contracts/interfaces/IOracle.sol';
import '@perennial/oracle/contracts/interfaces/IKeeperFactory.sol';
import * as Vault from '@perennial/vault/contracts/interfaces/IVault.sol';
import '@perennial/vault/contracts/interfaces/IVaultFactory.sol';
import '@equilibria/root/number/types/UFixed6.sol';

struct PriceCommitData {
  IKeeperFactory keeperFactory;
  uint256 value;
  bytes32[] ids;
  uint256 version;
  bytes updateData;
}

contract Lens {
  UFixed6 private constant noOp = UFixed6Lib.MAX;

  struct MarketSnapshot {
    IMarket marketAddress;
    MarketParameter parameter;
    RiskParameter riskParameter;
    Global global;
    IOracle oracle;
    Order pendingOrder;
    Position position;
    Position nextPosition;
    Position[] pendingPositions;
    Version[] versions;
    OracleVersion latestOracleVersion;
    uint256 currentOracleVersion;
  }

  struct MarketAccountSnapshot {
    IMarket marketAddress;
    address account;
    Local local;
    Order latestOrder;
    Order pendingOrder;
    Position position;
    Position nextPosition;
    Checkpoint checkpoint;
    Position[] pendingPositions;
    Version[] versions;
    OracleVersion[] oracleVersions;
    OracleReceipt[] oracleReceipts;
  }

  struct SnapshotResult {
    MarketSnapshot[] marketSnapshots;
    MarketAccountSnapshot[] marketAccountSnapshots;
  }

  struct SnapshotReturnValue {
    bytes[] commitmentStatus;
    bytes[] updateStatus;
    SnapshotResult preUpdate;
    SnapshotResult postUpdate;
  }

  function snapshot(
    PriceCommitData[] memory commits,
    IMarket[] memory markets,
    address account
  ) external returns (SnapshotReturnValue memory result) {
    // Snapshot pre
    MarketSnapshot[] memory preMarketSnapshots = new MarketSnapshot[](markets.length);
    MarketAccountSnapshot[] memory preMarketAccountSnapshots = new MarketAccountSnapshot[](markets.length);
    for (uint i = 0; i < markets.length; i++) {
      preMarketSnapshots[i] = snapshotMarket(markets[i]);
      preMarketAccountSnapshots[i] = snapshotMarketAccount(markets[i], account);
    }
    result.preUpdate.marketSnapshots = preMarketSnapshots;
    result.preUpdate.marketAccountSnapshots = preMarketAccountSnapshots;

    // Commit prices
    result.commitmentStatus = new bytes[](commits.length);
    for (uint i = 0; i < commits.length; i++) {
      result.commitmentStatus[i] = commit(commits[i].keeperFactory, commits[i].value, commits[i].ids, commits[i].version, commits[i].updateData);
    }

    // Update markets
    result.updateStatus = new bytes[](markets.length);
    for (uint i = 0; i < markets.length; i++) {
      result.updateStatus[i] = settle(markets[i], account);
    }

    // Snapshot post
    MarketSnapshot[] memory marketSnapshots = new MarketSnapshot[](markets.length);
    MarketAccountSnapshot[] memory marketAccountSnapshots = new MarketAccountSnapshot[](markets.length);
    for (uint i = 0; i < markets.length; i++) {
      marketSnapshots[i] = snapshotMarket(markets[i]);
      marketAccountSnapshots[i] = snapshotMarketAccount(markets[i], account);
    }

    result.postUpdate.marketSnapshots = marketSnapshots;
    result.postUpdate.marketAccountSnapshots = marketAccountSnapshots;
  }

  function snapshotMarket(IMarket market) public view returns (MarketSnapshot memory marketSnapshot) {
    marketSnapshot.marketAddress = market;
    marketSnapshot.parameter = market.parameter();
    marketSnapshot.riskParameter = market.riskParameter();
    marketSnapshot.global = market.global();
    marketSnapshot.position = market.position();
    marketSnapshot.pendingOrder = market.pending();
    marketSnapshot.pendingPositions = new Position[](marketSnapshot.global.currentId - marketSnapshot.global.latestId + 1);
    marketSnapshot.versions = new Version[](marketSnapshot.pendingPositions.length);
    marketSnapshot.oracle = IOracle(address(market.oracle()));
    for (uint j = 0; j < marketSnapshot.pendingPositions.length; j++) {
      marketSnapshot.pendingPositions[j] = (j == 0 ? marketSnapshot.position : marketSnapshot.pendingPositions[j - 1]).clone();
      if (j > 0) marketSnapshot.pendingPositions[j].update(market.pendingOrder(marketSnapshot.global.latestId + j));
      marketSnapshot.versions[j] = market.versions(marketSnapshot.pendingPositions[j].timestamp);
    }
    marketSnapshot.nextPosition = marketSnapshot.pendingPositions[marketSnapshot.pendingPositions.length - 1];
    marketSnapshot.latestOracleVersion = market.oracle().latest();
    marketSnapshot.currentOracleVersion = market.oracle().current();
  }

  function snapshotMarketAccount(IMarket market, address account) public view returns (MarketAccountSnapshot memory marketAccountSnapshot) {
    marketAccountSnapshot.marketAddress = market;
    marketAccountSnapshot.account = account;
    marketAccountSnapshot.local = market.locals(account);
    marketAccountSnapshot.latestOrder = market.pendingOrders(account, marketAccountSnapshot.local.latestId);
    marketAccountSnapshot.pendingOrder = market.pendings(account);
    marketAccountSnapshot.position = market.positions(account);
    marketAccountSnapshot.pendingPositions = new Position[](marketAccountSnapshot.local.currentId - marketAccountSnapshot.local.latestId + 1);
    marketAccountSnapshot.checkpoint = market.checkpoints(account, marketAccountSnapshot.position.timestamp);
    marketAccountSnapshot.versions = new Version[](marketAccountSnapshot.pendingPositions.length);
    marketAccountSnapshot.oracleVersions = new OracleVersion[](marketAccountSnapshot.pendingPositions.length);
    marketAccountSnapshot.oracleReceipts = new OracleReceipt[](marketAccountSnapshot.pendingPositions.length);
    IOracleProvider oracle = market.oracle();
    for (uint j = 0; j < marketAccountSnapshot.pendingPositions.length; j++) {
      marketAccountSnapshot.pendingPositions[j] = (j == 0 ? marketAccountSnapshot.position : marketAccountSnapshot.pendingPositions[j - 1]).clone();
      if (j > 0) marketAccountSnapshot.pendingPositions[j].update(market.pendingOrders(account, marketAccountSnapshot.local.latestId + j));
      marketAccountSnapshot.versions[j] = market.versions(marketAccountSnapshot.pendingPositions[j].timestamp);
      (marketAccountSnapshot.oracleVersions[j], marketAccountSnapshot.oracleReceipts[j]) = oracle.at(marketAccountSnapshot.pendingPositions[j].timestamp);
    }
    marketAccountSnapshot.nextPosition = marketAccountSnapshot.pendingPositions[marketAccountSnapshot.pendingPositions.length - 1];
  }

  // TODO: Can we make the commitment ignore any requested values, or figure out if we can commit for the requested version?
  function commit(IKeeperFactory keeperFactory, uint256 value, bytes32[] memory ids, uint256 version, bytes memory updateData) public returns (bytes memory) {
    try keeperFactory.commit{value: value}(ids, version, updateData) {
      return bytes('');
    } catch Error(string memory reason) {
      return bytes(reason);
    } catch Panic (uint errorCode) {
      return abi.encodePacked(errorCode);
    } catch (bytes memory reason) {
      return reason;
    }
  }

  function settle(IMarket market, address account) public returns (bytes memory) {
    try market.settle(account) {
      return bytes('');
    }
    catch (bytes memory err) {
      return err;
    }
  }
}

contract VaultLens {
  struct VaultSnapshot {
    IVault vault;
    string name;
    Vault.VaultParameter parameter;
    Fixed6 totalAssets;
    UFixed6 totalShares;
    uint256 totalMarkets;
    Vault.Registration[] registrations;
    Vault.Account vaultAccount;
    Vault.Checkpoint latestCheckpoint;
    Vault.Checkpoint currentCheckpoint;
    UFixed6 totalSettlementFee;
    UFixed6 vaultMinimum;
    Fixed6 totalMarketCollateral;
    Lens.MarketSnapshot[] marketSnapshots;
    Lens.MarketAccountSnapshot[] marketVaultSnapshots;
  }

  struct VaultAccountSnapshot {
    IVault vault;
    address account;
    Vault.Account accountData;
    UFixed6 assets;
    UFixed6 redemptionAssets;
    bool multiInvokerApproved;
  }

  struct SnapshotResult {
    VaultSnapshot[] vaultSnapshots;
    VaultAccountSnapshot[] vaultAccountSnapshots;
  }

  struct SnapshotReturnValue {
    bytes[] commitmentStatus;
    bytes[] updateStatus;
    bytes[] settleStatus;
    SnapshotResult preUpdate;
    SnapshotResult postUpdate;
  }

  function snapshot(
    PriceCommitData[] memory commits,
    Lens marketLens,
    IVault[] memory vaults,
    address account,
    address multiInvoker
  ) external returns (SnapshotReturnValue memory result) {
    // Snapshot pre
    VaultSnapshot[] memory preMarketSnapshots = new VaultSnapshot[](vaults.length);
    VaultAccountSnapshot[] memory preMarketAccountSnapshots = new VaultAccountSnapshot[](vaults.length);
    for (uint i = 0; i < vaults.length; i++) {
      preMarketSnapshots[i] = snapshotVault(vaults[i], marketLens, false);
      preMarketAccountSnapshots[i] = snapshotVaultAccount(vaults[i], account, multiInvoker, preMarketSnapshots[i].totalShares, preMarketSnapshots[i].totalAssets);
    }
    result.preUpdate.vaultSnapshots = preMarketSnapshots;
    result.preUpdate.vaultAccountSnapshots = preMarketAccountSnapshots;

    // Commit prices
    result.commitmentStatus = new bytes[](commits.length);
    for (uint i = 0; i < commits.length; i++) {
      result.commitmentStatus[i] = marketLens.commit(commits[i].keeperFactory, commits[i].value, commits[i].ids, commits[i].version, commits[i].updateData);
    }

    // Update markets
    result.settleStatus = new bytes[](vaults.length);
    result.updateStatus = new bytes[](vaults.length);
    for (uint i = 0; i < vaults.length; i++) {
      (result.updateStatus[i], result.settleStatus[i]) = updateAndSettle(vaults[i], account, result.preUpdate.vaultSnapshots[i].vaultMinimum);
    }

    // Snapshot post
    VaultSnapshot[] memory vaultSnapshots = new VaultSnapshot[](vaults.length);
    VaultAccountSnapshot[] memory vaultAccountSnapshots = new VaultAccountSnapshot[](vaults.length);
    for (uint i = 0; i < vaults.length; i++) {
      vaultSnapshots[i] = snapshotVault(vaults[i], marketLens, true);
      vaultAccountSnapshots[i] = snapshotVaultAccount(vaults[i], account, multiInvoker, vaultSnapshots[i].totalShares, vaultSnapshots[i].totalAssets);
    }

    result.postUpdate.vaultSnapshots = vaultSnapshots;
    result.postUpdate.vaultAccountSnapshots = vaultAccountSnapshots;
  }

  function snapshotVault(IVault vault, Lens marketLens, bool postSettle) public view returns (VaultSnapshot memory vaultSnapshot) {
    vaultSnapshot.vault = vault;
    vaultSnapshot.name = vault.name();
    vaultSnapshot.parameter = vault.parameter();
    vaultSnapshot.totalAssets = vault.totalAssets();
    vaultSnapshot.totalShares = vault.totalShares();
    vaultSnapshot.totalMarkets = vault.totalMarkets();
    vaultSnapshot.registrations = new Vault.Registration[](vaultSnapshot.totalMarkets);
    vaultSnapshot.marketSnapshots = new Lens.MarketSnapshot[](vaultSnapshot.totalMarkets);
    vaultSnapshot.marketVaultSnapshots = new Lens.MarketAccountSnapshot[](vaultSnapshot.totalMarkets);
    vaultSnapshot.vaultAccount = vault.accounts(address(0));
    vaultSnapshot.latestCheckpoint = vault.checkpoints(vaultSnapshot.vaultAccount.latest);
    vaultSnapshot.currentCheckpoint = vault.checkpoints(vaultSnapshot.vaultAccount.current);
    for (uint i = 0; i < vaultSnapshot.totalMarkets; i++) {
      vaultSnapshot.registrations[i] = vault.registrations(i);
      vaultSnapshot.marketSnapshots[i] = marketLens.snapshotMarket(vaultSnapshot.registrations[i].market);
      vaultSnapshot.marketVaultSnapshots[i] = marketLens.snapshotMarketAccount(vaultSnapshot.registrations[i].market, address(vault));
      vaultSnapshot.vaultMinimum = vaultSnapshot.vaultMinimum.add(vaultSnapshot.parameter.minDeposit);
      vaultSnapshot.totalMarketCollateral = vaultSnapshot.totalMarketCollateral.add(vaultSnapshot.marketVaultSnapshots[i].local.collateral);

      // Add settlement fee if the market weight is non-zero or the market collateral is non-zero
      if (!vaultSnapshot.registrations[i].weight.isZero() || !vaultSnapshot.marketVaultSnapshots[i].local.collateral.isZero()) {
        vaultSnapshot.totalSettlementFee = vaultSnapshot.totalSettlementFee.add(vaultSnapshot.parameter.minDeposit);
      }
    }

    // Simulate a checkpoint complete with the latest market collateral
    if (postSettle) vaultSnapshot.totalAssets = vaultSnapshot.totalMarketCollateral.add(vaultSnapshot.currentCheckpoint.assets);
  }

  function snapshotVaultAccount(IVault vault, address account, address multiInvoker, UFixed6 vaultShares, Fixed6 vaultAssets) public view returns (VaultAccountSnapshot memory vaultAccountSnapshot) {
    vaultAccountSnapshot.vault = vault;
    vaultAccountSnapshot.account = account;
    vaultAccountSnapshot.accountData = vault.accounts(account);

    // Manually calculate assets because the vault checkpoint won't reflect latest market data
    vaultAccountSnapshot.assets = vaultShares.isZero() ?
      vaultAccountSnapshot.accountData.shares :
      vaultAccountSnapshot.accountData.shares.muldiv(UFixed6Lib.from(vaultAssets.max(Fixed6Lib.ZERO)), vaultShares);
    vaultAccountSnapshot.redemptionAssets = vaultShares.isZero() ?
      vaultAccountSnapshot.accountData.redemption :
      vaultAccountSnapshot.accountData.redemption.muldiv(UFixed6Lib.from(vaultAssets.max(Fixed6Lib.ZERO)), vaultShares);
    vaultAccountSnapshot.multiInvokerApproved = IVaultFactory(address(vault.factory())).operators(account, multiInvoker);
  }

  function updateAndSettle(IVault vault, address account, UFixed6 vaultMinimum) public returns (bytes memory updateErr, bytes memory settleErr) {
    vault.asset().approve(address(vault));

    // Update the vault from a fake account
    try vault.update(address(this), vaultMinimum, UFixed6Lib.ZERO, UFixed6Lib.ZERO) {
      updateErr = bytes('');
    } catch (bytes memory err) {
      updateErr = err;
    }

    // Pay the settlement fee to allow for updates
    try vault.settle(account) {
      settleErr = bytes('');
    } catch (bytes memory err) {
      settleErr = err;
    }
  }
}
