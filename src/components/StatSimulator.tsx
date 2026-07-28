import React, { useState } from 'react';
import { UserMetrics, WorkoutType } from '../types';
import { calculateStats, determineRank } from '../utils/statCalculator';
import { Sliders, Sparkles, TrendingUp, Zap, ArrowUpRight, Flame, Moon, BookOpen } from 'lucide-react';
import { sounds } from '../utils/audio';

export const StatSimulator: React.FC = () => {
  const [metrics, setMetrics] = useState<UserMetrics>({
    name: 'Habit Optimizer',
    heightCm: 178,
    weightKg: 72,
    age: 22,
    workoutType: 'Powerlifting',
    workoutMinsPerDay: 45,
    dailySteps: 8000,
    studyFocusHours: 3,
    focusQuality: 3,
    phoneFreeDeepWorkHours: 2,
    sleepHours: 6.5,
    consistencyDays: 15,
    habitStreakDays: 7,
  });

  const baseStats = calculateStats(metrics);
  const baseRank = determineRank(baseStats.overall);

  // Target EX-Rank stats goal calculation
  const sleepNeeded = Math.max(8.5, metrics.sleepHours);
  const stepsNeeded = Math.max(15000, metrics.dailySteps);
  const deepWorkNeeded = Math.max(5, metrics.phoneFreeDeepWorkHours);
  const streakNeeded = Math.max(30, metrics.habitStreakDays);

  const optimizedMetrics: UserMetrics = {
    ...metrics,
    sleepHours: sleepNeeded,
    dailySteps: stepsNeeded,
    phoneFreeDeepWorkHours: deepWorkNeeded,
    habitStreakDays: streakNeeded,
    focusQuality: 5,
    workoutMinsPerDay: Math.max(60, metrics.workoutMinsPerDay),
  };

  const optimizedStats = calculateStats(optimizedMetrics);
  const optimizedRank = determineRank(optimizedStats.overall);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Title */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-3">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>HABIT OPTIMIZATION ENGINE</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
          Habit-to-Stat <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-300 bg-clip-text text-transparent">Simulator</span>
        </h1>
        <p className="text-slate-400 text-sm max-w-xl mx-auto mt-2">
          Adjust habit sliders to simulate how adding +1.5h sleep, 5,000 steps, or 2 hours of deep work elevates your Power Level and Rank Tier!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sliders Form (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="w-5 h-5 text-cyan-400" />
            Adjust Habit Parameters
          </h3>

          {/* Workout Mins */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-1">
              <span>Daily Workout Duration</span>
              <span className="text-amber-400 font-mono font-bold">{metrics.workoutMinsPerDay} mins/day</span>
            </div>
            <input
              type="range"
              min="0"
              max="150"
              step="5"
              value={metrics.workoutMinsPerDay}
              onChange={(e) => {
                sounds.playCardFlip();
                setMetrics({ ...metrics, workoutMinsPerDay: Number(e.target.value) });
              }}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Steps */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-1">
              <span>Daily Steps</span>
              <span className="text-cyan-400 font-mono font-bold">{metrics.dailySteps.toLocaleString()} steps</span>
            </div>
            <input
              type="range"
              min="1000"
              max="25000"
              step="500"
              value={metrics.dailySteps}
              onChange={(e) => {
                sounds.playCardFlip();
                setMetrics({ ...metrics, dailySteps: Number(e.target.value) });
              }}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Study / Focus Hours */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-1">
              <span>Study / Focus Hours</span>
              <span className="text-purple-400 font-mono font-bold">{metrics.studyFocusHours} hrs/day</span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              step="0.5"
              value={metrics.studyFocusHours}
              onChange={(e) => {
                sounds.playCardFlip();
                setMetrics({ ...metrics, studyFocusHours: Number(e.target.value) });
              }}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>

          {/* Deep Work */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-1">
              <span>Phone-Free Deep Work Hours</span>
              <span className="text-fuchsia-400 font-mono font-bold">{metrics.phoneFreeDeepWorkHours} hrs/day</span>
            </div>
            <input
              type="range"
              min="0"
              max="8"
              step="0.5"
              value={metrics.phoneFreeDeepWorkHours}
              onChange={(e) => {
                sounds.playCardFlip();
                setMetrics({ ...metrics, phoneFreeDeepWorkHours: Number(e.target.value) });
              }}
              className="w-full accent-fuchsia-500 cursor-pointer"
            />
          </div>

          {/* Sleep Hours */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-1">
              <span>Sleep Nightly Rest</span>
              <span className="text-indigo-400 font-mono font-bold">{metrics.sleepHours} hours</span>
            </div>
            <input
              type="range"
              min="3"
              max="10"
              step="0.5"
              value={metrics.sleepHours}
              onChange={(e) => {
                sounds.playCardFlip();
                setMetrics({ ...metrics, sleepHours: Number(e.target.value) });
              }}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Habit Streak */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-1">
              <span>Habit Streak Days</span>
              <span className="text-emerald-400 font-mono font-bold">{metrics.habitStreakDays} days</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={metrics.habitStreakDays}
              onChange={(e) => {
                sounds.playCardFlip();
                setMetrics({ ...metrics, habitStreakDays: Number(e.target.value) });
              }}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Comparison Gauges (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Rank Projection Comparison
          </h3>

          {/* Current vs Target Power Level */}
          <div className="grid grid-cols-2 gap-4 text-center font-mono">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Current Rank</span>
              <span className="text-2xl font-black text-white block my-1">{baseRank}</span>
              <span className="text-xs text-amber-400 font-bold">PWR: {baseStats.overall}</span>
            </div>

            <div className="bg-gradient-to-b from-emerald-950/80 to-slate-950 p-4 rounded-xl border border-emerald-500/40">
              <span className="text-[10px] text-emerald-300 uppercase tracking-wider block">Max Potential</span>
              <span className="text-2xl font-black text-amber-300 block my-1">{optimizedRank}</span>
              <span className="text-xs text-emerald-400 font-bold">PWR: {optimizedStats.overall}</span>
            </div>
          </div>

          {/* Optimization Recommendations */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
              ⚡ Action Blueprint for Rank Upgrade:
            </span>

            <div className="flex items-center justify-between text-slate-300">
              <span>Nightly Sleep Target:</span>
              <span className="text-indigo-400 font-bold">8.5 Hours (+{Math.max(0, 8.5 - metrics.sleepHours).toFixed(1)}h)</span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span>Daily Step Goal:</span>
              <span className="text-cyan-400 font-bold">15,000 Steps</span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span>Phone-Free Deep Focus:</span>
              <span className="text-fuchsia-400 font-bold">4.0 Hours</span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span>Habit Streak Goal:</span>
              <span className="text-emerald-400 font-bold">30 Days</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-xs text-cyan-200">
            <span className="font-bold text-cyan-300 block mb-1">PRO-TIP:</span>
            Sleep and Deep Work hours contribute the highest multiplicative scaling to Vitality and Willpower. A 30-day streak unlocks S-Rank status instantly!
          </div>
        </div>
      </div>
    </div>
  );
};
