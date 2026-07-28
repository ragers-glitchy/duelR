import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { AnimeCard, ActivityLog, CardProgression, RankType, SkillStats } from '../types';
import { VectorCardArt } from './VectorCardArt';
import { determineRank } from '../utils/statCalculator';
import {
  Dumbbell,
  BookOpen,
  Footprints,
  Moon,
  Flame,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Award,
  History,
  PlusCircle,
  Zap,
  ChevronRight,
  Music,
  Code,
  Palette,
  Gamepad2,
  ShieldAlert,
  Sliders,
  BarChart3,
  Check,
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface CardProgressionHubProps {
  userCards: AnimeCard[];
  onUpdateCard: (updatedCard: AnimeCard) => void;
  onNavigateToCreator: () => void;
}

interface FloatingPopup {
  id: string;
  text: string;
  subtext?: string;
  color: string;
}

export const CardProgressionHub: React.FC<CardProgressionHubProps> = ({
  userCards,
  onUpdateCard,
  onNavigateToCreator,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string>(userCards[0]?.id || '');
  
  // Custom training input states
  const [trainingCategory, setTrainingCategory] = useState<'workout' | 'skills' | 'study' | 'steps' | 'sleep' | 'penalty'>('workout');
  const [workoutTypeInput, setWorkoutTypeInput] = useState<'Powerlifting' | 'Calisthenics' | 'Cardio'>('Powerlifting');
  const [workoutMinsInput, setWorkoutMinsInput] = useState<number>(45);
  const [skillHrsInput, setSkillHrsInput] = useState<number>(1.5);
  const [studyHrsInput, setStudyHrsInput] = useState<number>(2);
  const [stepsInput, setStepsInput] = useState<number>(8000);
  const [sleepHrsInput, setSleepHrsInput] = useState<number>(8);
  const [penaltyNote, setPenaltyNote] = useState<string>('Skipped scheduled training session');

  const [levelUpMessage, setLevelUpMessage] = useState<string | null>(null);
  const [rankUpMessage, setRankUpMessage] = useState<string | null>(null);
  const [floatingPopups, setFloatingPopups] = useState<FloatingPopup[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  const [streakCount, setStreakCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('duelr_training_streak');
      return saved ? parseInt(saved, 10) : 1;
    } catch {
      return 1;
    }
  });

  const selectedCard = userCards.find((c) => c.id === selectedCardId) || userCards[0];

  if (!selectedCard) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-violet-950 border border-violet-500/40 flex items-center justify-center text-amber-300 mx-auto">
          <TrendingUp className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white font-mono">No Anime Cards in Your Deck</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Create your first anime card using your real-life workout, study, and skill metrics to unlock Daily Training!
        </p>
        <button
          onClick={onNavigateToCreator}
          className="py-3 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl inline-flex items-center gap-2 font-mono"
        >
          <PlusCircle className="w-4 h-4 text-amber-300" />
          <span>Create Your First Card</span>
        </button>
      </div>
    );
  }

  // Ensure skillStats exist on selected card with smart defaults
  const currentSkillStats: SkillStats = selectedCard.skillStats || {
    skills: Math.max(10, Math.min(99, Math.round((selectedCard.metrics.skillHoursSpent || 0) > 0 ? (selectedCard.metrics.skillHoursSpent! * 16) + selectedCard.stats.WIL * 0.3 : Math.round(selectedCard.stats.INT * 0.4 + selectedCard.stats.WIL * 0.3)))),
    academics: Math.max(10, Math.min(99, selectedCard.stats.INT)),
    physique: Math.max(10, Math.min(99, selectedCard.stats.STR)),
    discipline: Math.max(10, Math.min(99, selectedCard.stats.WIL)),
  };

  // Trigger floating popup feedback
  const triggerDopaminePopup = (text: string, subtext?: string, isNegative = false) => {
    const newPopup: FloatingPopup = {
      id: `popup-${Date.now()}-${Math.random()}`,
      text,
      subtext,
      color: isNegative
        ? 'from-rose-500 to-red-600 border-rose-400 text-white'
        : 'from-amber-400 via-violet-400 to-cyan-300 border-amber-300 text-slate-950',
    };

    setFloatingPopups((prev) => [...prev, newPopup]);
    setTimeout(() => {
      setFloatingPopups((prev) => prev.filter((p) => p.id !== newPopup.id));
    }, 2400);
  };

  // Helper to re-calculate overall power
  const calculateOverall = (stats: typeof selectedCard.stats): number => {
    const raw = (stats.STR * 1.1 + stats.INT * 1.1 + stats.AGI * 1.0 + stats.VIT * 1.0 + stats.WIL * 1.1) / 5.3;
    return Math.min(99, Math.max(10, Math.round(raw)));
  };

  // Hard Mode Rank helper & next rank threshold
  const getRankThresholdInfo = (overall: number) => {
    if (overall >= 95) return { currentRank: 'EX-Rank' as RankType, nextRank: null, neededOverall: 0, progressPct: 100 };
    if (overall >= 88) return { currentRank: 'S-Rank' as RankType, nextRank: 'EX-Rank', neededOverall: 95 - overall, progressPct: ((overall - 88) / (95 - 88)) * 100 };
    if (overall >= 78) return { currentRank: 'A-Rank' as RankType, nextRank: 'S-Rank', neededOverall: 88 - overall, progressPct: ((overall - 78) / (88 - 78)) * 100 };
    if (overall >= 65) return { currentRank: 'B-Rank' as RankType, nextRank: 'A-Rank', neededOverall: 78 - overall, progressPct: ((overall - 65) / (78 - 65)) * 100 };
    if (overall >= 50) return { currentRank: 'C-Rank' as RankType, nextRank: 'B-Rank', neededOverall: 65 - overall, progressPct: ((overall - 50) / (65 - 50)) * 100 };
    if (overall >= 35) return { currentRank: 'D-Rank' as RankType, nextRank: 'C-Rank', neededOverall: 50 - overall, progressPct: ((overall - 35) / (50 - 35)) * 100 };
    return { currentRank: 'E-Rank' as RankType, nextRank: 'D-Rank', neededOverall: 35 - overall, progressPct: (overall / 35) * 100 };
  };

  // Apply real-life daily training session
  const handleLogDailyTraining = (
    categoryName: string,
    title: string,
    description: string,
    type: ActivityLog['type'],
    statDeltas: Partial<Record<'STR' | 'INT' | 'AGI' | 'VIT' | 'WIL', number>>,
    skillDeltas: Partial<SkillStats>,
    baseXp: number
  ) => {
    // Screen shake
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);

    // Audio SFX
    if (type === 'penalty') {
      sounds.playDefeatSound();
    } else {
      sounds.playPowerUp();
    }

    const newStats = { ...selectedCard.stats };
    const newSkillStats = { ...currentSkillStats };

    // Apply stat changes
    let statSummary = '';
    (Object.keys(statDeltas) as Array<'STR' | 'INT' | 'AGI' | 'VIT' | 'WIL'>).forEach((st) => {
      const delta = statDeltas[st] || 0;
      newStats[st] = Math.min(99, Math.max(10, newStats[st] + delta));
      statSummary += `${delta > 0 ? '+' : ''}${delta} ${st} `;
    });

    // Apply skill changes
    let skillSummary = '';
    (Object.keys(skillDeltas) as Array<keyof SkillStats>).forEach((sk) => {
      const delta = skillDeltas[sk] || 0;
      newSkillStats[sk] = Math.min(99, Math.max(10, newSkillStats[sk] + delta));
      skillSummary += `${delta > 0 ? '+' : ''}${delta} ${sk} `;
    });

    const previousRank = selectedCard.rank;
    const newOverall = calculateOverall(newStats);
    newStats.overall = newOverall;
    const newRank = determineRank(newOverall);

    // Check rank breakthrough!
    if (newRank !== previousRank && type !== 'penalty') {
      sounds.playVictoryFanfare();
      setRankUpMessage(`⚡ RANK BREAKTHROUGH! ${selectedCard.cardName} ASCENDED TO ${newRank}!`);
      confetti({
        particleCount: 150,
        spread: 120,
        origin: { y: 0.4 },
        colors: ['#f59e0b', '#8b5cf6', '#ec4899', '#10b981', '#38bdf8'],
      });
      setTimeout(() => setRankUpMessage(null), 5000);
    }

    // Increment streak
    const newStreak = type === 'penalty' ? 1 : streakCount + 1;
    setStreakCount(newStreak);
    try {
      localStorage.setItem('duelr_training_streak', newStreak.toString());
    } catch (e) {
      console.warn('Failed to save streak:', e);
    }

    // Trigger floating popup
    triggerDopaminePopup(
      baseXp > 0 ? `+${baseXp} EXP GAINED!` : `${baseXp} EXP PENALTY!`,
      `${title} (${statSummary.trim()})`,
      baseXp < 0
    );

    if (baseXp > 0) {
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#fbbf24', '#a855f7', '#38bdf8', '#34d399'],
      });
    }

    // Level XP Engine (Hard mode exponential curve)
    const progression: CardProgression = selectedCard.progression || {
      level: 1,
      currentXp: 0,
      maxXp: 150,
      statXp: { STR: 0, INT: 0, AGI: 0, VIT: 0, WIL: 0 },
      activityLogs: [],
    };

    let newCurrentXp = progression.currentXp + baseXp;
    let newLevel = progression.level;
    let newMaxXp = progression.maxXp;
    let leveledUp = false;

    if (newCurrentXp < 0) newCurrentXp = 0;

    while (newCurrentXp >= newMaxXp) {
      newCurrentXp -= newMaxXp;
      newLevel += 1;
      newMaxXp = Math.round(150 * Math.pow(newLevel, 1.4));
      leveledUp = true;
    }

    if (leveledUp) {
      sounds.playVictoryFanfare();
      setLevelUpMessage(`🎉 LEVEL UP! ${selectedCard.cardName} REACHED LEVEL ${newLevel}!`);
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#f59e0b', '#ec4899', '#8b5cf6', '#10b981'],
      });
      setTimeout(() => setLevelUpMessage(null), 4000);
    }

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      type,
      title,
      description,
      statChanges: statDeltas,
      skillChanges: skillDeltas,
      xpEarned: baseXp,
    };

    const updatedCard: AnimeCard = {
      ...selectedCard,
      rank: newRank,
      stats: newStats,
      skillStats: newSkillStats,
      progression: {
        level: newLevel,
        currentXp: newCurrentXp,
        maxXp: newMaxXp,
        statXp: progression.statXp,
        activityLogs: [newLog, ...(progression.activityLogs || [])],
      },
    };

    onUpdateCard(updatedCard);
  };

  const progression: CardProgression = selectedCard.progression || {
    level: 1,
    currentXp: 0,
    maxXp: 150,
    statXp: { STR: 0, INT: 0, AGI: 0, VIT: 0, WIL: 0 },
    activityLogs: [],
  };

  const rankInfo = getRankThresholdInfo(selectedCard.stats.overall);

  // Preset Quests for Quick Training
  const quickPresets = [
    {
      id: 'piano-session',
      title: '🎹 Piano / Instrument Mastery (45m)',
      desc: 'Focused musical practice on classical/modern pieces',
      category: 'skill_practice' as const,
      icon: Music,
      color: 'from-amber-600 to-yellow-600',
      stats: { INT: +1, WIL: +1 },
      skills: { pianoMusic: +2 },
      xp: 50,
    },
    {
      id: 'coding-session',
      title: '💻 Code & Algorithm Engineering (2h)',
      desc: 'Built software modules with zero phone distractions',
      category: 'skill_practice' as const,
      icon: Code,
      color: 'from-fuchsia-600 to-purple-600',
      stats: { INT: +2, WIL: +1 },
      skills: { codingTech: +3 },
      xp: 65,
    },
    {
      id: 'heavy-lift',
      title: '🏋️ Heavy Muscle & Power Workout (60m)',
      desc: 'High intensity weight training / progressive overload',
      category: 'workout' as const,
      icon: Dumbbell,
      color: 'from-red-600 to-orange-600',
      stats: { STR: +2, VIT: +1 },
      skills: { physique: +2 },
      xp: 60,
    },
    {
      id: 'skills-practice',
      title: '🧠 Skills Focus Practice (Hours Spent)',
      desc: 'Dedicated practice on coding, design, crafts, instruments, or technical skills',
      category: 'skill_practice' as const,
      icon: Sparkles,
      color: 'from-amber-600 to-yellow-600',
      stats: { INT: +1, WIL: +2 },
      skills: { skills: +3 },
      xp: 60,
    },
    {
      id: 'deep-study',
      title: '📚 Academic Deep Focus (2h+)',
      desc: 'Intense studying and research with high retention',
      category: 'study' as const,
      icon: BookOpen,
      color: 'from-cyan-600 to-blue-600',
      stats: { INT: +2, WIL: +1 },
      skills: { academics: +2 },
      xp: 55,
    },
  ];

  return (
    <div className={`max-w-7xl mx-auto px-4 py-8 space-y-8 relative transition-transform ${isShaking ? 'translate-x-1 translate-y-1' : ''}`}>
      {/* Floating Popups */}
      <div className="fixed top-20 right-6 z-50 pointer-events-none space-y-2">
        {floatingPopups.map((popup) => (
          <div
            key={popup.id}
            className={`p-3.5 rounded-2xl bg-gradient-to-r ${popup.color} border shadow-2xl animate-bounce font-mono text-center flex flex-col items-center justify-center`}
          >
            <span className="font-black text-sm tracking-wide">{popup.text}</span>
            {popup.subtext && <span className="text-[10px] opacity-90 font-bold">{popup.subtext}</span>}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/80 border border-violet-500/30 text-violet-300 text-xs font-mono mb-3">
          <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
          <span>DAILY TRAINING & SKILL PROGRESSION ENGINE</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
          Daily Training <span className="bg-gradient-to-r from-amber-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">& Skill Matrix</span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto mt-2">
          Input your daily workouts, piano practice, coding, academics, or art sessions. Progressively evolve your character's card rank from <span className="text-amber-400 font-bold font-mono">E-Rank</span> up to <span className="text-cyan-300 font-bold font-mono">EX-Rank</span>!
        </p>

        {/* Streak Counter Banner */}
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-slate-900 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold shadow-lg">
          <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>{streakCount} DAY DISCIPLINE STREAK</span>
          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40">
            +{Math.min(50, streakCount * 5)}% EXP MULTIPLIER
          </span>
        </div>
      </div>

      {/* Card Selector Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto max-w-full">
          <span className="text-xs font-mono text-slate-400 uppercase font-bold mr-2">Select Card:</span>
          {userCards.map((card) => (
            <button
              key={card.id}
              onClick={() => {
                sounds.playCardFlip();
                setSelectedCardId(card.id);
              }}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 whitespace-nowrap ${
                card.id === selectedCard.id
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg border border-violet-400/30 ring-2 ring-violet-500/30'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>{card.cardName}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-amber-300 border border-slate-700">
                {card.rank} • Lvl {card.progression?.level || 1}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={onNavigateToCreator}
          className="py-1.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Create New Card</span>
        </button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Card Artwork, Rank Breakthrough Bar & Skill Matrix */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5">
            {/* Level Up & Rank Up Notifications */}
            {rankUpMessage && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500 via-fuchsia-600 to-cyan-500 text-slate-950 font-black text-xs font-mono text-center shadow-lg animate-bounce flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>{rankUpMessage}</span>
              </div>
            )}

            {levelUpMessage && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-xs font-mono text-center shadow-lg animate-bounce flex items-center justify-center gap-2">
                <Award className="w-4 h-4 text-amber-300" />
                <span>{levelUpMessage}</span>
              </div>
            )}

            {/* Vector Artwork View */}
            <VectorCardArt
              cardName={selectedCard.cardName}
              classType={selectedCard.classType}
              elementalAffinity={selectedCard.elementalAffinity}
              rank={selectedCard.rank}
              title={selectedCard.title}
              overallPower={selectedCard.stats.overall}
            />

            {/* Hard Rank Progression Meter */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 font-mono">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  RANK PROGRESSION TIER
                </span>
                <span className="text-amber-300 font-black text-sm px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40">
                  {selectedCard.rank}
                </span>
              </div>

              {/* Progress to Next Rank */}
              <div className="space-y-1">
                <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800 relative">
                  <div
                    className="bg-gradient-to-r from-amber-500 via-fuchsia-500 to-cyan-400 h-full transition-all duration-500"
                    style={{ width: `${Math.min(100, rankInfo.progressPct)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Overall Power: <strong className="text-white">{selectedCard.stats.overall}</strong></span>
                  {rankInfo.nextRank ? (
                    <span className="text-amber-300">Need +{rankInfo.neededOverall} Power to reach {rankInfo.nextRank}</span>
                  ) : (
                    <span className="text-cyan-300 font-bold">MAX RANK REACHED!</span>
                  )}
                </div>
              </div>
            </div>

            {/* Level & EXP Progress */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 font-mono">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold">LEVEL & EXP ENGINE</span>
                <span className="text-violet-400 font-black text-sm">Level {progression.level}</span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full transition-all"
                  style={{ width: `${Math.min(100, (progression.currentXp / progression.maxXp) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{progression.currentXp} / {progression.maxXp} EXP</span>
                <span>{Math.round((progression.currentXp / progression.maxXp) * 100)}%</span>
              </div>
            </div>

            {/* Skill Stats Matrix */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                  Specialized Skill Stats
                </h3>
                <span className="text-[10px] text-slate-400">Uneven Talents</span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-amber-300 font-bold flex items-center gap-1">🧠 Skills Practice (Hours Spent)</span>
                    <span className="text-white font-black">{currentSkillStats.skills} / 99</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full" style={{ width: `${(currentSkillStats.skills / 99) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-cyan-300 font-bold flex items-center gap-1">📚 Academics / Focus</span>
                    <span className="text-white font-black">{currentSkillStats.academics} / 99</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-400 h-full" style={{ width: `${(currentSkillStats.academics / 99) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-red-400 font-bold flex items-center gap-1">🏋️ Physique / Power</span>
                    <span className="text-white font-black">{currentSkillStats.physique} / 99</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-gradient-to-r from-red-500 to-orange-400 h-full" style={{ width: `${(currentSkillStats.physique / 99) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span className="text-emerald-300 font-bold flex items-center gap-1">🎯 Discipline / Willpower</span>
                    <span className="text-white font-black">{currentSkillStats.discipline} / 99</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full" style={{ width: `${(currentSkillStats.discipline / 99) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Daily Training Input Center & Quick Presets */}
        <div className="lg:col-span-7 space-y-6">
          {/* Detailed Training Logger Form */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                Input Daily Training Accomplishments
              </h3>
              <p className="text-xs text-slate-400">Select what real-life workout or skill practice you did today to log precise stat gains!</p>
            </div>

            {/* Category Selector Buttons */}
            <div className="flex flex-wrap gap-1.5 font-mono text-xs">
              {[
                { id: 'workout', label: '🏋️ Workout', icon: Dumbbell },
                { id: 'skills', label: '🧠 Skills (Hours Spent)', icon: Sparkles },
                { id: 'study', label: '📚 Study', icon: BookOpen },
                { id: 'steps', label: '🚶 Steps', icon: Footprints },
                { id: 'sleep', label: '💤 Sleep', icon: Moon },
                { id: 'penalty', label: '⚠️ Penalty', icon: AlertTriangle },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    sounds.playButtonClick();
                    setTrainingCategory(cat.id as any);
                  }}
                  className={`py-1.5 px-3 rounded-lg font-bold transition-all ${
                    trainingCategory === cat.id
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow border border-violet-400/40'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Category Specific Input Fields */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
              {trainingCategory === 'workout' && (
                <div className="space-y-3 font-mono">
                  <div className="flex justify-between items-center text-xs text-amber-300 font-bold border-b border-slate-800 pb-1">
                    <span>🏋️ WORKOUT & PHYSICAL TRAINING LOG</span>
                    <span className="text-[10px] text-slate-400">+STR, +AGI, +Physique Skill</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Workout Focus</label>
                      <select
                        value={workoutTypeInput}
                        onChange={(e: any) => setWorkoutTypeInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                      >
                        <option value="Powerlifting">Powerlifting / Heavy Gym</option>
                        <option value="Calisthenics">Calisthenics / Bodyweight</option>
                        <option value="Cardio">Cardio / Running Sprint</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Duration (Minutes)</label>
                      <input
                        type="number"
                        min="10"
                        max="240"
                        value={workoutMinsInput}
                        onChange={(e) => setWorkoutMinsInput(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const strGain = Math.min(3, Math.max(1, Math.round(workoutMinsInput / 30)));
                      const physGain = Math.min(4, Math.max(1, Math.round(workoutMinsInput / 20)));
                      handleLogDailyTraining(
                        'Workout',
                        `Logged ${workoutMinsInput}m ${workoutTypeInput} Training`,
                        `Completed physical session focusing on strength and endurance.`,
                        'workout',
                        { STR: +strGain, AGI: workoutTypeInput === 'Cardio' ? +2 : +1 },
                        { physique: +physGain },
                        Math.round(workoutMinsInput * 1.2)
                      );
                    }}
                    className="w-full py-2 bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold text-xs rounded-lg shadow font-mono"
                  >
                    Log Workout & Increase Physique Power
                  </button>
                </div>
              )}

              {trainingCategory === 'skills' && (
                <div className="space-y-3 font-mono">
                  <div className="flex justify-between items-center text-xs text-amber-300 font-bold border-b border-slate-800 pb-1">
                    <span>🧠 SKILLS PRACTICE LOG (HOURS SPENT)</span>
                    <span className="text-[10px] text-slate-400">+INT, +WIL, +Skills Level</span>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Skills Practice Duration (Hours Spent)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="14"
                      value={skillHrsInput}
                      onChange={(e) => setSkillHrsInput(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const skillGain = Math.min(5, Math.max(1, Math.round(skillHrsInput * 1.5)));
                      handleLogDailyTraining(
                        'Skills Practice',
                        `Logged ${skillHrsInput}h Skills Practice`,
                        `Dedicated skill development and practice session.`,
                        'skill_practice',
                        { INT: +1, WIL: +2 },
                        { skills: +skillGain },
                        Math.round(skillHrsInput * 30)
                      );
                    }}
                    className="w-full py-2 bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-bold text-xs rounded-lg shadow font-mono"
                  >
                    Log Skill Practice Hours Spent
                  </button>
                </div>
              )}

              {trainingCategory === 'study' && (
                <div className="space-y-3 font-mono">
                  <div className="flex justify-between items-center text-xs text-cyan-300 font-bold border-b border-slate-800 pb-1">
                    <span>📚 ACADEMIC STUDY & RESEARCH LOG</span>
                    <span className="text-[10px] text-slate-400">+INT, +WIL, +Academics Skill</span>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Study Duration (Hours)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="14"
                      value={studyHrsInput}
                      onChange={(e) => setStudyHrsInput(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const acadGain = Math.min(4, Math.max(1, Math.round(studyHrsInput * 1.2)));
                      handleLogDailyTraining(
                        'Study',
                        `Logged ${studyHrsInput}h Academic Study Session`,
                        `Deep focus learning and knowledge acquisition.`,
                        'study',
                        { INT: +2, WIL: +1 },
                        { academics: +acadGain },
                        Math.round(studyHrsInput * 25)
                      );
                    }}
                    className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs rounded-lg shadow font-mono"
                  >
                    Log Study Session & Boost Academics
                  </button>
                </div>
              )}

              {trainingCategory === 'steps' && (
                <div className="space-y-3 font-mono">
                  <div className="flex justify-between items-center text-xs text-emerald-300 font-bold border-b border-slate-800 pb-1">
                    <span>🚶 DAILY STEP MILESTONE LOG</span>
                    <span className="text-[10px] text-slate-400">+AGI, +VIT</span>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Daily Steps Count</label>
                    <input
                      type="number"
                      step="500"
                      min="1000"
                      max="40000"
                      value={stepsInput}
                      onChange={(e) => setStepsInput(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const agiGain = stepsInput >= 10000 ? 2 : 1;
                      handleLogDailyTraining(
                        'Steps',
                        `Logged ${stepsInput.toLocaleString()} Daily Steps`,
                        `Maintained high physical movement throughout the day.`,
                        'steps',
                        { AGI: +agiGain, VIT: +1 },
                        {},
                        Math.round(stepsInput / 180)
                      );
                    }}
                    className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs rounded-lg shadow font-mono"
                  >
                    Log Step Count & Boost Agility
                  </button>
                </div>
              )}

              {trainingCategory === 'sleep' && (
                <div className="space-y-3 font-mono">
                  <div className="flex justify-between items-center text-xs text-indigo-300 font-bold border-b border-slate-800 pb-1">
                    <span>💤 SLEEP & RECOVERY LOG</span>
                    <span className="text-[10px] text-slate-400">+VIT, +WIL</span>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Sleep Duration (Hours)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="4"
                      max="12"
                      value={sleepHrsInput}
                      onChange={(e) => setSleepHrsInput(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const vitGain = sleepHrsInput >= 7.5 ? 2 : 1;
                      handleLogDailyTraining(
                        'Sleep',
                        `Logged ${sleepHrsInput}h Circadian Sleep Recovery`,
                        `Optimal neurological recovery and cellular repair.`,
                        'sleep',
                        { VIT: +vitGain, WIL: +1 },
                        {},
                        Math.round(sleepHrsInput * 6)
                      );
                    }}
                    className="w-full py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs rounded-lg shadow font-mono"
                  >
                    Log Sleep & Boost Vitality
                  </button>
                </div>
              )}

              {trainingCategory === 'penalty' && (
                <div className="space-y-3 font-mono">
                  <div className="flex justify-between items-center text-xs text-rose-400 font-bold border-b border-slate-800 pb-1">
                    <span>⚠️ PENALTY / SLOTH RELAPSE LOG</span>
                    <span className="text-[10px] text-rose-400">-STR, -VIT, EXP Penalty</span>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Penalty Description</label>
                    <input
                      type="text"
                      value={penaltyNote}
                      onChange={(e) => setPenaltyNote(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <button
                    onClick={() => {
                      handleLogDailyTraining(
                        'Penalty',
                        `Logged Penalty: ${penaltyNote}`,
                        `Relapsed on training discipline.`,
                        'penalty',
                        { STR: -1, VIT: -1 },
                        {},
                        -30
                      );
                    }}
                    className="w-full py-2 bg-gradient-to-r from-rose-800 to-red-900 text-white font-bold text-xs rounded-lg shadow font-mono"
                  >
                    Apply Discipline Penalty & Deduct Stats
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Log Presets */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Quick Presets
              </h3>
              <span className="text-xs text-slate-400 font-mono">Fast 1-Click Logging</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {quickPresets.map((quest) => {
                const Icon = quest.icon;
                return (
                  <button
                    key={quest.id}
                    onClick={() =>
                      handleLogDailyTraining(
                        quest.title,
                        quest.title,
                        quest.desc,
                        quest.category,
                        quest.stats,
                        quest.skills,
                        quest.xp
                      )
                    }
                    className="group bg-slate-950 border border-slate-800 hover:border-violet-500/80 rounded-xl p-3 text-left transition-all hover:scale-[1.01] flex items-start justify-between gap-2 shadow-md"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${quest.color} text-white shadow`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors font-mono">
                          {quest.title}
                        </h4>
                        <p className="text-[10px] text-slate-400">{quest.desc}</p>
                        <div className="flex flex-wrap gap-1 mt-1 font-mono text-[9px]">
                          {Object.entries(quest.stats).map(([st, val]) => (
                            <span key={st} className="px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-500/30 text-emerald-300">
                              +{val} {st}
                            </span>
                          ))}
                          <span className="px-1.5 py-0.2 rounded bg-amber-950 border border-amber-500/30 text-amber-300">
                            +{quest.xp} EXP
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors mt-1" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Activity Logs Timeline */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                Training History & Skill Logs
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {progression.activityLogs?.length || 0} Record(s)
              </span>
            </div>

            {(!progression.activityLogs || progression.activityLogs.length === 0) ? (
              <p className="text-xs text-slate-500 font-mono py-6 text-center">
                No activity logs yet. Log your first training session above!
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {progression.activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-3 text-xs font-mono"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">{log.title}</span>
                        <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{log.description}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1">
                      {Object.entries(log.statChanges).map(([st, val]) => (
                        <span
                          key={st}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            val! > 0 ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {val! > 0 ? `+${val}` : val} {st}
                        </span>
                      ))}
                      {log.skillChanges && Object.entries(log.skillChanges).map(([sk, val]) => (
                        <span key={sk} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30 font-bold">
                          +{val} {sk}
                        </span>
                      ))}
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-500/30 font-bold">
                        {log.xpEarned > 0 ? `+${log.xpEarned}` : log.xpEarned} EXP
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
