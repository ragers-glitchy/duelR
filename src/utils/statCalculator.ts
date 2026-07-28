import { CardStats, ElementalAffinity, RankType, SkillStats, UserMetrics, WorkoutType } from '../types';

export function clamp(val: number, min = 10, max = 99): number {
  return Math.max(min, Math.min(max, Math.round(val)));
}

export function calculateSkillStats(metrics: UserMetrics, baseStats: CardStats): SkillStats {
  // Skills calculation based on Hours Spent per day
  const skillHrs = metrics.skillHoursSpent || 0;
  const skills = clamp(skillHrs > 0 ? skillHrs * 16 + baseStats.WIL * 0.3 : clamp(baseStats.INT * 0.4 + baseStats.WIL * 0.3, 15, 80), 10, 99);

  // Academics calculation based on study focus hours
  const academics = clamp(metrics.studyFocusHours * 12 + metrics.focusQuality * 5, 10, 99);

  // Physique calculation based on physical STR & workout
  const physique = baseStats.STR;

  // Discipline & Deep Work focus
  const discipline = clamp(metrics.phoneFreeDeepWorkHours * 15 + metrics.focusQuality * 4, 10, 99);

  return {
    skills,
    academics,
    physique,
    discipline,
  };
}

export function calculateStats(metrics: UserMetrics): CardStats {
  const {
    weightKg,
    workoutType,
    workoutMinsPerDay,
    dailySteps,
    studyFocusHours,
    focusQuality,
    phoneFreeDeepWorkHours,
    sleepHours,
    consistencyDays,
    habitStreakDays,
  } = metrics;

  // Intensity factor
  let intensityFactor = 0.5;
  if (workoutType === 'Powerlifting') intensityFactor = 1.5;
  else if (workoutType === 'Calisthenics') intensityFactor = 1.3;
  else if (workoutType === 'Cardio') intensityFactor = 1.0;

  // Weight ratio normalized around 75kg
  const weightRatio = Math.max(0.6, (weightKg || 70) / 75);

  // STR = Clamp( (Workout Mins * Intensity Factor) / (Weight Ratio), 10, 99 )
  const rawStr = (workoutMinsPerDay * intensityFactor) / weightRatio;
  const STR = clamp(rawStr, 10, 99);

  // INT = Clamp( (Study Hours * 12) + (Focus Quality * 5), 10, 99 )
  const rawInt = studyFocusHours * 12 + focusQuality * 5;
  const INT = clamp(rawInt, 10, 99);

  // AGI = Clamp( (Daily Steps / 150) + (Cardio Mins * 0.8), 10, 99 )
  const cardioMins = workoutType === 'Cardio' ? workoutMinsPerDay : workoutMinsPerDay * 0.3;
  const rawAgi = dailySteps / 150 + cardioMins * 0.8;
  const AGI = clamp(rawAgi, 10, 99);

  // VIT = Clamp( (Sleep Hours * 8) + (Consistency Days * 2), 10, 99 )
  const rawVit = sleepHours * 8 + (consistencyDays || 0) * 2;
  const VIT = clamp(rawVit, 10, 99);

  // WIL = Clamp( (Deep Work Hours * 15) + (Habit Streak * 3), 10, 99 )
  const rawWil = phoneFreeDeepWorkHours * 15 + (habitStreakDays || 0) * 3;
  const WIL = clamp(rawWil, 10, 99);

  const overall = Math.round((STR + INT + AGI + VIT + WIL) / 5);

  return { STR, INT, AGI, VIT, WIL, overall };
}

export function determineRank(overall: number): RankType {
  if (overall >= 95) return 'EX-Rank';
  if (overall >= 88) return 'S-Rank';
  if (overall >= 78) return 'A-Rank';
  if (overall >= 65) return 'B-Rank';
  if (overall >= 50) return 'C-Rank';
  if (overall >= 35) return 'D-Rank';
  return 'E-Rank';
}

export function getElementalAdvantage(
  attackerElem: ElementalAffinity,
  defenderElem: ElementalAffinity
): { multiplier: number; message: string } {
  if (attackerElem === defenderElem) {
    return { multiplier: 1.0, message: 'Neutral Element Matchup' };
  }

  const advantages: Record<string, string> = {
    Flame: 'Frost',
    Frost: 'Cyber',
    Cyber: 'Lightning',
    Lightning: 'Flame',
    Holy: 'Shadow',
    Shadow: 'Holy',
    Void: 'Holy', // Void dominates Holy, Shadow dominates Void, etc.
  };

  if (advantages[attackerElem] === defenderElem) {
    return { multiplier: 1.3, message: `${attackerElem} counters ${defenderElem}! (+30% DMG)` };
  }

  if (advantages[defenderElem] === attackerElem) {
    return { multiplier: 0.8, message: `${attackerElem} resisted by ${defenderElem} (-20% DMG)` };
  }

  return { multiplier: 1.0, message: 'Neutral Element' };
}

export function getElementTheme(element: ElementalAffinity) {
  switch (element) {
    case 'Flame':
      return {
        bgGradient: 'from-amber-950/80 via-red-950/90 to-orange-950/80',
        borderColor: 'border-amber-500',
        textColor: 'text-amber-400',
        glowColor: 'shadow-amber-500/40',
        badgeBg: 'bg-gradient-to-r from-red-600 to-amber-600',
        accentHex: '#f59e0b',
        icon: '🔥',
      };
    case 'Frost':
      return {
        bgGradient: 'from-sky-950/80 via-blue-950/90 to-cyan-950/80',
        borderColor: 'border-cyan-400',
        textColor: 'text-cyan-300',
        glowColor: 'shadow-cyan-400/40',
        badgeBg: 'bg-gradient-to-r from-cyan-600 to-blue-600',
        accentHex: '#38bdf8',
        icon: '❄️',
      };
    case 'Lightning':
      return {
        bgGradient: 'from-yellow-950/80 via-amber-950/90 to-cyan-950/80',
        borderColor: 'border-yellow-400',
        textColor: 'text-yellow-300',
        glowColor: 'shadow-yellow-400/40',
        badgeBg: 'bg-gradient-to-r from-yellow-500 to-cyan-500',
        accentHex: '#facc15',
        icon: '⚡',
      };
    case 'Cyber':
      return {
        bgGradient: 'from-fuchsia-950/80 via-purple-950/90 to-pink-950/80',
        borderColor: 'border-fuchsia-500',
        textColor: 'text-fuchsia-400',
        glowColor: 'shadow-fuchsia-500/40',
        badgeBg: 'bg-gradient-to-r from-fuchsia-600 to-pink-600',
        accentHex: '#d946ef',
        icon: '⚙️',
      };
    case 'Holy':
      return {
        bgGradient: 'from-yellow-950/60 via-amber-900/70 to-emerald-950/80',
        borderColor: 'border-emerald-400',
        textColor: 'text-emerald-300',
        glowColor: 'shadow-emerald-400/40',
        badgeBg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
        accentHex: '#10b981',
        icon: '✨',
      };
    case 'Shadow':
      return {
        bgGradient: 'from-zinc-950/90 via-purple-950/90 to-slate-950/90',
        borderColor: 'border-purple-500',
        textColor: 'text-purple-300',
        glowColor: 'shadow-purple-500/40',
        badgeBg: 'bg-gradient-to-r from-purple-800 to-indigo-900',
        accentHex: '#a855f7',
        icon: '👁️',
      };
    case 'Void':
    default:
      return {
        bgGradient: 'from-indigo-950/90 via-slate-950/90 to-violet-950/90',
        borderColor: 'border-violet-500',
        textColor: 'text-violet-300',
        glowColor: 'shadow-violet-500/40',
        badgeBg: 'bg-gradient-to-r from-violet-600 to-indigo-600',
        accentHex: '#8b5cf6',
        icon: '🌀',
      };
  }
}
