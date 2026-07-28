import { AnimeCard, BattleParticipant, BattleResult, TurnLog } from '../types';
import { getElementalAdvantage } from './statCalculator';

export function runBattleSimulation(card1: AnimeCard, card2: AnimeCard): BattleResult {
  const startTime = Date.now();

  const calculateMaxHp = (c: AnimeCard) => Math.round(c.stats.VIT * 14 + c.stats.WIL * 8 + 350);

  const p1: BattleParticipant = {
    card: card1,
    maxHp: calculateMaxHp(card1),
    currentHp: calculateMaxHp(card1),
    energy: 20,
  };

  const p2: BattleParticipant = {
    card: card2,
    maxHp: calculateMaxHp(card2),
    currentHp: calculateMaxHp(card2),
    energy: 20,
  };

  const turnLogs: TurnLog[] = [];
  let turnCount = 1;
  const maxTurns = 20;

  // Faster fighter goes first
  let attacker = card1.stats.AGI >= card2.stats.AGI ? p1 : p2;
  let defender = attacker === p1 ? p2 : p1;

  while (p1.currentHp > 0 && p2.currentHp > 0 && turnCount <= maxTurns) {
    // Turn execution
    const attackerCard = attacker.card;
    const defenderCard = defender.card;

    // Energy charge
    attacker.energy = Math.min(100, attacker.energy + 25);

    // Dodge check based on AGI difference
    const agiDiff = defenderCard.stats.AGI - attackerCard.stats.AGI;
    const dodgeChance = Math.max(0.05, Math.min(0.40, 0.15 + agiDiff * 0.005));
    const isDodged = Math.random() < dodgeChance;

    let damage = 0;
    let isCritical = false;
    let actionType: TurnLog['actionType'] = 'attack';
    let actionName = 'Standard Attack';
    let narration = '';

    const { multiplier: elementMult, message: elementEffect } = getElementalAdvantage(
      attackerCard.elementalAffinity,
      defenderCard.elementalAffinity
    );

    if (isDodged) {
      actionType = 'dodge';
      actionName = 'Quick Reflexes';
      narration = `${defenderCard.cardName} vanished into a blur, completely dodging ${attackerCard.cardName}'s strike!`;
    } else {
      // Check if Ultimate Move ready
      if (attacker.energy >= 100) {
        actionType = 'ultimate';
        actionName = attackerCard.ultimateMove?.name || 'Ultimate Overdrive';
        attacker.energy = 0;

        const maxStat = Math.max(
          attackerCard.stats.STR,
          attackerCard.stats.INT,
          attackerCard.stats.WIL
        );
        const baseDmg = maxStat * 4.2 + 80;
        damage = Math.round(baseDmg * elementMult * (0.95 + Math.random() * 0.15));
        isCritical = Math.random() < 0.4;
        if (isCritical) damage = Math.round(damage * 1.5);

        narration = `${attackerCard.cardName} channels full power and casts [${actionName}]! ${attackerCard.ultimateMove?.description || ''}`;
      } else {
        // Skill or normal attack
        const useSkill = Math.random() < 0.35;
        if (useSkill && attackerCard.passiveSkill?.name) {
          actionType = 'skill';
          actionName = attackerCard.passiveSkill.name;
          const mainStat = Math.max(attackerCard.stats.STR, attackerCard.stats.INT);
          damage = Math.round((mainStat * 2.5 + 40) * elementMult * (0.9 + Math.random() * 0.2));
          narration = `${attackerCard.cardName} activates passive skill [${actionName}]!`;
        } else {
          actionType = 'attack';
          actionName = attackerCard.stats.STR >= attackerCard.stats.INT ? 'Heavy Physical Strike' : 'Arcane Energy Blast';
          const primaryStat = Math.max(attackerCard.stats.STR, attackerCard.stats.INT);
          const critChance = Math.max(0.1, Math.min(0.5, attackerCard.stats.WIL * 0.005));
          isCritical = Math.random() < critChance;

          damage = Math.round((primaryStat * 1.8 + 20) * elementMult * (0.85 + Math.random() * 0.3));
          if (isCritical) damage = Math.round(damage * 1.6);

          narration = `${attackerCard.cardName} delivers a ${isCritical ? 'CRITICAL ' : ''}${actionName} against ${defenderCard.cardName}!`;
        }
      }

      // Apply defense mitigation from VIT
      const defenseMitigation = Math.min(0.4, (defenderCard.stats.VIT / 100) * 0.35);
      damage = Math.max(25, Math.round(damage * (1 - defenseMitigation)));

      defender.currentHp = Math.max(0, defender.currentHp - damage);
    }

    turnLogs.push({
      turn: turnCount,
      attackerId: attackerCard.id,
      attackerName: attackerCard.cardName,
      defenderName: defenderCard.cardName,
      actionType,
      actionName,
      damage,
      isCritical,
      isDodged,
      narration,
      elementEffect: elementEffect !== 'Neutral Element' ? elementEffect : undefined,
    });

    if (defender.currentHp <= 0) break;

    // Swap turns
    const temp = attacker;
    attacker = defender;
    defender = temp;

    turnCount++;
  }

  const winner = p1.currentHp > 0 ? p1 : p2;
  const loser = winner === p1 ? p2 : p1;

  // Determine MVP Stat of winner
  const wStats = winner.card.stats;
  const highestStatEntry = Object.entries(wStats).reduce(
    (max, curr) => (curr[0] !== 'overall' && curr[1] > max[1] ? curr : max),
    ['STR', 0]
  );

  const duration = Math.round((Date.now() - startTime) / 1000);

  return {
    winnerId: winner.card.id,
    winnerName: winner.card.cardName,
    loserName: loser.card.cardName,
    turnLogs,
    aiCommentary: `${winner.card.cardName} overwhelmed ${loser.card.cardName} through superior ${highestStatEntry[0]} power (${highestStatEntry[1]}) and relentless habit-driven stamina!`,
    mvpStat: `${highestStatEntry[0]} (${highestStatEntry[1]})`,
    battleDurationSecs: duration,
  };
}
