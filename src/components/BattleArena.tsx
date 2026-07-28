import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { AnimeCard, BattleResult, TurnLog } from '../types';
import { runBattleSimulation } from '../utils/battleEngine';
import { getElementalAdvantage, getElementTheme } from '../utils/statCalculator';
import { PRESET_RIVALS } from '../data/presetRivals';
import { AnimeCardView } from './AnimeCardView';
import { Swords, Zap, Flame, ShieldAlert, Trophy, RefreshCw, Sparkles, Play, FastForward } from 'lucide-react';
import { sounds } from '../utils/audio';

interface BattleArenaProps {
  userCards: AnimeCard[];
  preselectedOpponent?: AnimeCard | null;
}

export const BattleArena: React.FC<BattleArenaProps> = ({ userCards, preselectedOpponent }) => {
  const allAvailableCards = [...userCards, ...PRESET_RIVALS];

  const [card1, setCard1] = useState<AnimeCard>(
    userCards.length > 0 ? userCards[0] : PRESET_RIVALS[0]
  );
  const [card2, setCard2] = useState<AnimeCard>(
    preselectedOpponent || PRESET_RIVALS[1] || PRESET_RIVALS[0]
  );

  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [isFighting, setIsFighting] = useState(false);
  const [currentTurnIdx, setCurrentTurnIdx] = useState(0);
  const [displayedLogs, setDisplayedLogs] = useState<TurnLog[]>([]);
  const [arenaShaking, setArenaShaking] = useState(false);

  const [p1Hp, setP1Hp] = useState(100);
  const [p2Hp, setP2Hp] = useState(100);
  const [p1Energy, setP1Energy] = useState(20);
  const [p2Energy, setP2Energy] = useState(20);

  const [aiCommentary, setAiCommentary] = useState<string>('');
  const [loadingCommentary, setLoadingCommentary] = useState(false);

  const theme1 = getElementTheme(card1.elementalAffinity);
  const theme2 = getElementTheme(card2.elementalAffinity);

  const advantageP1 = getElementalAdvantage(card1.elementalAffinity, card2.elementalAffinity);

  useEffect(() => {
    if (preselectedOpponent) {
      setCard2(preselectedOpponent);
    }
  }, [preselectedOpponent]);

  const startBattle = async () => {
    sounds.playPowerUp();
    setIsFighting(true);
    setBattleResult(null);
    setCurrentTurnIdx(0);
    setDisplayedLogs([]);
    setAiCommentary('');

    // Reset HP & Energy
    setP1Hp(100);
    setP2Hp(100);
    setP1Energy(20);
    setP2Energy(20);

    const result = runBattleSimulation(card1, card2);
    setBattleResult(result);

    // Play turn animations sequentially
    const p1Max = card1.stats.VIT * 14 + card1.stats.WIL * 8 + 350;
    const p2Max = card2.stats.VIT * 14 + card2.stats.WIL * 8 + 350;

    let curP1Hp = p1Max;
    let curP2Hp = p2Max;
    let curP1Energy = 20;
    let curP2Energy = 20;

    for (let i = 0; i < result.turnLogs.length; i++) {
      const log = result.turnLogs[i];

      await new Promise((res) => setTimeout(res, 850));

      // Trigger SFX and screen shake based on action
      if (log.actionType === 'ultimate') {
        sounds.playUltimateChime();
        setArenaShaking(true);
        setTimeout(() => setArenaShaking(false), 500);
      } else if (log.actionType === 'attack' || log.actionType === 'skill') {
        sounds.playAttackSlash();
        if (log.damage > 80) {
          setArenaShaking(true);
          setTimeout(() => setArenaShaking(false), 300);
        }
      } else if (log.actionType === 'dodge') {
        sounds.playCardFlip();
      }

      // Energy & HP updates
      if (log.attackerId === card1.id) {
        curP1Energy = log.actionType === 'ultimate' ? 0 : Math.min(100, curP1Energy + 25);
        if (!log.isDodged) curP2Hp = Math.max(0, curP2Hp - log.damage);
      } else {
        curP2Energy = log.actionType === 'ultimate' ? 0 : Math.min(100, curP2Energy + 25);
        if (!log.isDodged) curP1Hp = Math.max(0, curP1Hp - log.damage);
      }

      setP1Hp(Math.round((curP1Hp / p1Max) * 100));
      setP2Hp(Math.round((curP2Hp / p2Max) * 100));
      setP1Energy(curP1Energy);
      setP2Energy(curP2Energy);

      setCurrentTurnIdx(i);
      setDisplayedLogs((prev) => [...prev, log]);
    }

    sounds.playVictoryFanfare();
    setIsFighting(false);

    // High dopamine victory fireworks confetti!
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#ef4444', '#f59e0b', '#8b5cf6', '#10b981', '#06b6d4'],
    });

    // Fetch AI commentary
    try {
      setLoadingCommentary(true);
      const res = await fetch('/api/battle-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardA: card1,
          cardB: card2,
          winnerName: result.winnerName,
          logs: result.turnLogs.slice(0, 5),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.commentary) setAiCommentary(data.commentary);
      }
    } catch (e) {
      console.warn('AI Commentary fetch failed:', e);
      setAiCommentary(result.aiCommentary);
    } finally {
      setLoadingCommentary(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Title Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/30 text-red-300 text-xs font-mono mb-3">
          <Swords className="w-3.5 h-3.5 text-amber-400" />
          <span>HEAD-TO-HEAD ANIME COMBAT ARENA</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
          Battle <span className="bg-gradient-to-r from-red-500 via-amber-400 to-yellow-400 bg-clip-text text-transparent">Matchup</span>
        </h1>
        <p className="text-slate-400 text-sm max-w-xl mx-auto mt-2">
          Select two fighters. Their real habits dictate combat stats, speed, passive skills, dodge chance, and ultimate strikes!
        </p>
      </div>

      {/* Opponent Selection & Stage Setup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
        {/* Fighter 1 Picker */}
        <div>
          <label className="block text-xs font-bold font-mono text-slate-300 mb-2 uppercase tracking-wider">
            Player 1 (Challenger)
          </label>
          <select
            value={card1.id}
            onChange={(e) => {
              const selected = allAvailableCards.find((c) => c.id === e.target.value);
              if (selected) {
                sounds.playCardFlip();
                setCard1(selected);
              }
            }}
            disabled={isFighting}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-violet-500"
          >
            <optgroup label="Your Saved Cards">
              {userCards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.cardName} ({c.rank} - {c.classType}) - PWR: {c.stats.overall}
                </option>
              ))}
            </optgroup>
            <optgroup label="Anime Boss Rivals">
              {PRESET_RIVALS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.cardName} ({c.rank} - {c.classType}) - PWR: {c.stats.overall}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Fighter 2 Picker */}
        <div>
          <label className="block text-xs font-bold font-mono text-slate-300 mb-2 uppercase tracking-wider">
            Player 2 (Opponent / Rival)
          </label>
          <select
            value={card2.id}
            onChange={(e) => {
              const selected = allAvailableCards.find((c) => c.id === e.target.value);
              if (selected) {
                sounds.playCardFlip();
                setCard2(selected);
              }
            }}
            disabled={isFighting}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-violet-500"
          >
            <optgroup label="Anime Boss Rivals">
              {PRESET_RIVALS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.cardName} ({c.rank} - {c.classType}) - PWR: {c.stats.overall}
                </option>
              ))}
            </optgroup>
            <optgroup label="Your Saved Cards">
              {userCards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.cardName} ({c.rank} - {c.classType}) - PWR: {c.stats.overall}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Start Battle Trigger */}
      <div className="flex flex-col items-center justify-center gap-2">
        <button
          onClick={startBattle}
          disabled={isFighting || card1.id === card2.id}
          className="py-4 px-10 rounded-2xl bg-gradient-to-r from-red-600 via-amber-500 to-yellow-500 hover:from-red-500 hover:to-yellow-400 text-black font-black text-base md:text-lg tracking-wider shadow-2xl shadow-red-600/40 flex items-center gap-3 transition-all transform active:scale-95 disabled:opacity-50"
        >
          <Swords className="w-6 h-6 animate-pulse" />
          <span>{isFighting ? 'COMBAT IN PROGRESS...' : 'COMMENCE ANIME DUEL'}</span>
        </button>

        {card1.id === card2.id && (
          <span className="text-xs text-red-400 font-mono">Please select two different fighters to battle.</span>
        )}
      </div>

      {/* Arena Visual Stage */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-950 p-6 md:p-8 rounded-3xl border-2 border-slate-800 shadow-2xl relative overflow-hidden transition-transform duration-75 ${arenaShaking ? 'translate-x-1.5 translate-y-1 scale-[1.01] border-red-500' : ''}`}>
        {/* Fighter 1 Card & Meter */}
        <div className="lg:col-span-5 flex flex-col items-center space-y-4">
          {/* Health & Energy Bar P1 */}
          <div className="w-full bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold font-mono">
              <span className="text-white flex items-center gap-1.5">
                <span>{theme1.icon}</span>
                <span>{card1.cardName}</span>
              </span>
              <span className="text-emerald-400">{p1Hp}% HP</span>
            </div>
            {/* HP Bar */}
            <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
                style={{ width: `${p1Hp}%` }}
              ></div>
            </div>

            {/* Energy Bar */}
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-1">
              <span>Ultimate Charge</span>
              <span className="text-amber-400 font-bold">{p1Energy}%</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-300"
                style={{ width: `${p1Energy}%` }}
              ></div>
            </div>
          </div>

          <AnimeCardView card={card1} showActions={false} />
        </div>

        {/* VS Divider & Live Status (2 Columns) */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center text-center py-4">
          <div className="relative mb-4">
            <div className="absolute -inset-2 bg-gradient-to-r from-red-600 to-amber-500 rounded-full blur opacity-75 animate-pulse"></div>
            <div className="relative w-16 h-16 bg-slate-900 border-2 border-amber-400 rounded-full flex items-center justify-center text-amber-400 font-black font-mono text-xl shadow-2xl">
              VS
            </div>
          </div>

          {/* Elemental Matchup Note */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-slate-300 space-y-1">
            <div className="font-bold text-amber-400">Matchup Advantage</div>
            <div className="text-xs font-semibold text-emerald-400">{advantageP1.message}</div>
          </div>
        </div>

        {/* Fighter 2 Card & Meter */}
        <div className="lg:col-span-5 flex flex-col items-center space-y-4">
          {/* Health & Energy Bar P2 */}
          <div className="w-full bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold font-mono">
              <span className="text-white flex items-center gap-1.5">
                <span>{theme2.icon}</span>
                <span>{card2.cardName}</span>
              </span>
              <span className="text-emerald-400">{p2Hp}% HP</span>
            </div>
            {/* HP Bar */}
            <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
                style={{ width: `${p2Hp}%` }}
              ></div>
            </div>

            {/* Energy Bar */}
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-1">
              <span>Ultimate Charge</span>
              <span className="text-amber-400 font-bold">{p2Energy}%</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-300"
                style={{ width: `${p2Energy}%` }}
              ></div>
            </div>
          </div>

          <AnimeCardView card={card2} showActions={false} />
        </div>
      </div>

      {/* Combat Log & AI Victory Report */}
      {displayedLogs.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Anime Battle Play-by-Play Log
            </h3>
            <span className="text-xs font-mono text-slate-400">Turn {displayedLogs.length}</span>
          </div>

          <div className="space-y-3 font-mono text-xs max-h-80 overflow-y-auto pr-2">
            {displayedLogs.map((log, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border transition-all ${
                  log.actionType === 'ultimate'
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                    : log.actionType === 'dodge'
                    ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-200'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex justify-between items-center font-bold mb-1">
                  <span className="text-amber-400 uppercase">
                    [Turn {log.turn}] {log.attackerName} ➔ {log.actionName}
                  </span>
                  <span className={log.isDodged ? 'text-cyan-400' : 'text-red-400'}>
                    {log.isDodged ? 'DODGED' : `-${log.damage} DMG`}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300">{log.narration}</p>
                {log.elementEffect && (
                  <span className="text-[10px] text-emerald-400 block mt-1">{log.elementEffect}</span>
                )}
              </div>
            ))}
          </div>

          {/* Victory Announcement */}
          {battleResult && !isFighting && (
            <div className="bg-gradient-to-r from-amber-950/90 via-violet-950/90 to-slate-950 p-6 rounded-2xl border-2 border-amber-500/50 shadow-2xl text-center space-y-3 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>VICTORY DECLARED</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-black text-amber-300 tracking-wide font-mono">
                {battleResult.winnerName} VICTORTIOUS!
              </h2>

              <p className="text-sm text-slate-300 max-w-xl mx-auto italic font-serif">
                {loadingCommentary ? 'Fetching AI battle report commentary...' : aiCommentary || battleResult.aiCommentary}
              </p>

              <div className="inline-block px-4 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300">
                MVP Stat Factor: <span className="text-amber-400 font-bold">{battleResult.mvpStat}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
