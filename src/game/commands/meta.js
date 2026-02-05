/**
 * Meta Commands - shop, buy, use, stats
 */

import { MSG } from '../messages.js';

export function cmdShop(game) {
  game.print(MSG.SHOP_HEADER, 'system');
  game.print(`보유 DATA: ${game.meta.saved.totalData}`, 'system');
  game.print('');

  const items = game.meta.getShopItems();
  items.forEach((item, index) => {
    const status = item.owned ? '[보유중]' : `${item.cost} DATA`;
    game.print(`  ${index + 1}. ${item.name} - ${status}`);
    game.print(`     ${item.desc}`, 'system');
  });

  game.print('');
  game.print('구매: buy <번호>', 'system');
}

export function cmdBuy(game, itemIndex) {
  if (isNaN(itemIndex) || itemIndex < 1) {
    game.print('사용법: buy <번호>', 'error');
    return false;
  }

  const result = game.meta.buyItem(itemIndex - 1);

  if (result.success) {
    game.print(result.message, 'success');
    game.leftPanel.logEvent(`🛒 구매: ${result.itemName}`, 'success');
    game.achievementsUI.updateStats();
    return true;
  } else {
    game.print(result.message, 'error');
    return false;
  }
}

export function cmdUse(game, itemKey) {
  if (!itemKey) {
    game.print('사용법: use <아이템>', 'error');
    game.print('사용 가능: o2 (비상 산소)', 'system');
    return false;
  }

  switch (itemKey) {
    case 'o2':
      if (!game.state.hasEmergencyO2) {
        game.print('비상 산소가 없습니다.', 'error');
        return false;
      }
      game.state.hasEmergencyO2 = false;
      game.state.resources.o2 = Math.min(100, game.state.resources.o2 + 30);
      game.print('비상 산소 사용! O2 +30%', 'success');
      game.leftPanel.logEvent('💨 비상 산소 사용 (+30%)', 'success');
      return true;

    default:
      game.print(`알 수 없는 아이템: ${itemKey}`, 'error');
      return false;
  }
}

export function cmdStats(game) {
  const stats = game.meta.saved.stats;

  game.print(MSG.STATS_HEADER, 'system');
  game.print('');
  game.print(`총 플레이 횟수: ${stats.totalRuns}`);
  game.print(`탈출 성공: ${stats.escapes}`);
  game.print(`총 획득 DATA: ${stats.totalDataEarned}`);
  game.print(`현재 DATA: ${game.meta.saved.totalData}`);
  game.print('');
  game.print(`최단 탈출 시간: ${stats.fastestEscape > 0 ? stats.fastestEscape + '초' : '-'}`);
  game.print(`위기 탈출 횟수: ${stats.dangerEscapes}`);
}
