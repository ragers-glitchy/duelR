import React, { useState } from 'react';
import { UserMetrics, WorkoutType, AnimeCard } from '../types';
import { calculateStats, determineRank, calculateSkillStats } from '../utils/statCalculator';
import { Sparkles, Dumbbell, BookOpen, Moon, Flame, Zap, ArrowRight, Image as ImageIcon, Loader2, User, ShieldAlert, Check, Music, Code, Palette, Gamepad2 } from 'lucide-react';
import { sounds } from '../utils/audio';

interface CardCreatorFormProps {
  onCardCreated: (card: AnimeCard) => void;
}

interface SampleAvatar {
  id: string;
  name: string;
  gender: 'male' | 'female';
  title: string;
  element: string;
  elementalAffinity: string;
  icon: string;
}

const AVATAR_PRESETS: SampleAvatar[] = [
  // 3 Boys
  {
    id: 'male-shadow-monarch',
    name: 'Shadow Monarch',
    gender: 'male',
    title: 'Void Monarch (Male)',
    element: 'Void 🌀',
    elementalAffinity: 'Void',
    icon: '🔮',
  },
  {
    id: 'male-fiery-warrior',
    name: 'Fiery Martial Artist',
    gender: 'male',
    title: 'Flame Juggernaut (Male)',
    element: 'Flame 🔥',
    elementalAffinity: 'Flame',
    icon: '🔥',
  },
  {
    id: 'male-cyber-hero',
    name: 'Cyber Strategist',
    gender: 'male',
    title: 'Quantum Vanguard (Male)',
    element: 'Cyber ⚙️',
    elementalAffinity: 'Cyber',
    icon: '⚡',
  },
  // 3 Girls
  {
    id: 'female-frost-empress',
    name: 'Frost Empress',
    gender: 'female',
    title: 'Glacial Assassin (Female)',
    element: 'Frost ❄️',
    elementalAffinity: 'Frost',
    icon: '❄️',
  },
  {
    id: 'female-blade-hashira',
    name: 'Blade Hashira',
    gender: 'female',
    title: 'Shadow Samurai (Female)',
    element: 'Shadow 👁️',
    elementalAffinity: 'Shadow',
    icon: '👁️',
  },
  {
    id: 'female-arcane-sage',
    name: 'Arcane Sage',
    gender: 'female',
    title: 'Celestial Archon (Female)',
    element: 'Holy ✨',
    elementalAffinity: 'Holy',
    icon: '✨',
  },
];

export const CardCreatorForm: React.FC<CardCreatorFormProps> = ({ onCardCreated }) => {
  const [metrics, setMetrics] = useState<UserMetrics>({
    name: 'Kaito Kuro',
    heightCm: 178,
    weightKg: 72,
    age: 22,
    workoutType: 'Calisthenics',
    workoutMinsPerDay: 20,
    dailySteps: 4000,
    studyFocusHours: 1.5,
    focusQuality: 2,
    phoneFreeDeepWorkHours: 1,
    sleepHours: 7,
    consistencyDays: 3,
    habitStreakDays: 2,
    skillHoursSpent: 1.5,
    customAvatarUrl: '',
  });

  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(AVATAR_PRESETS[0].id);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live computed stats
  const computedStats = calculateStats(metrics);
  const projectedRank = determineRank(computedStats.overall);
  const computedSkillStats = calculateSkillStats(metrics, computedStats);

  const handleSelectPresetAvatar = (avatar: SampleAvatar) => {
    sounds.playCardFlip();
    setSelectedAvatarId(avatar.id);
  };

  const handleWorkoutTypeChange = (type: WorkoutType) => {
    sounds.playCardFlip();
    setMetrics((prev) => ({ ...prev, workoutType: type }));
  };

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedAvatarId('custom');
        setMetrics((prev) => ({
          ...prev,
          customAvatarUrl: event.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Derive dynamic habit-to-anime power translations
  const workoutPowerTranslation =
    metrics.workoutType === 'Powerlifting'
      ? "Titan's Iron Density: Heavy Impact"
      : metrics.workoutType === 'Calisthenics'
      ? 'Unbroken Bodyweight Flow: Kinetic Burst'
      : metrics.workoutType === 'Cardio'
      ? 'Sonic Velocity Stride: High Stamina'
      : 'Dormant Aura';

  const focusPowerTranslation =
    metrics.studyFocusHours >= 6 && metrics.focusQuality >= 4
      ? 'Akashic Flow State: Domain of Infinite Insight'
      : metrics.studyFocusHours >= 3
      ? 'Hyper-Synapse Concentration'
      : 'Basic Clarity Shield';

  const deepWorkTranslation =
    metrics.phoneFreeDeepWorkHours >= 4
      ? 'Void Focus Barrier: Zero Distraction Domain'
      : metrics.phoneFreeDeepWorkHours >= 2
      ? 'Distraction Disruption Field'
      : 'Transient Mind';

  const stepsTranslation =
    metrics.dailySteps >= 15000
      ? 'Godspeed Flash Step: Supersonic Motion'
      : metrics.dailySteps >= 10000
      ? 'Shadow Step Footwork'
      : 'Steady Pace';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    sounds.playPowerUp();

    try {
      setLoadingStep('Translating Real Habits to High-Aura Anime Powers...');

      // 1. Generate Card Lore
      const loreRes = await fetch('/api/generate-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics, stats: computedStats }),
      });

      if (!loreRes.ok) {
        throw new Error('Failed to reach AI generator. Check server logs.');
      }

      const loreData = await loreRes.json();

      const selectedPreset = AVATAR_PRESETS.find((p) => p.id === selectedAvatarId);
      const chosenElement = selectedPreset?.elementalAffinity || loreData.elementalAffinity || 'Void';

      const newCard: AnimeCard = {
        id: `card-${Date.now()}`,
        createdAt: new Date().toISOString(),
        cardName: loreData.cardName || metrics.name,
        title: loreData.title || 'Master of Habits',
        rank: projectedRank,
        classType: loreData.classType || 'Shadow Fighter',
        elementalAffinity: chosenElement as any,
        stats: computedStats,
        skillStats: computedSkillStats,
        metrics,
        passiveSkill: loreData.passiveSkill || {
          name: focusPowerTranslation,
          description: 'Passively boosts stats based on daily streak consistency and focus.',
        },
        ultimateMove: loreData.ultimateMove || {
          name: workoutPowerTranslation,
          description: 'Channels accumulated mental focus and physical training into a devastation strike.',
        },
        flavorText: loreData.flavorText || 'A relentless fighter forged through daily discipline and focused determination.',
        visualPrompt: loreData.visualPrompt || '',
        imageUrl: '',
      };

      sounds.playUltimateChime();
      onCardCreated(newCard);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred while generating card.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/80 border border-violet-500/30 text-violet-300 text-xs font-mono mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>STAT CONVERSION & ANIME POWER ENGINE v2.5</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
          Forge Your <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">Anime Stat Card</span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto mt-2">
          Input your real-life workout routine, study focus, sleep, and physical metrics. We normalize your stats into STR, INT, AGI, VIT, WIL and translate your habits directly into high-aura anime powers!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Inputs (7 Columns) */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          {/* Section 0: Character Avatar Selector (3 Boys / 3 Girls) */}
          <div>
            <div className="flex items-center justify-between text-violet-400 font-bold text-base mb-3 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-amber-400" />
                <span>Choose Character Avatar Preset (3 Male / 3 Female Archetypes)</span>
              </div>
            </div>

            {/* Avatar Preset Grid */}
            <div className="space-y-3">
              {/* Boys Row */}
              <div>
                <span className="text-[11px] font-mono font-bold text-cyan-300 uppercase block mb-1.5">
                  Male Vector Archetypes:
                </span>
                <div className="grid grid-cols-3 gap-3">
                  {AVATAR_PRESETS.filter((a) => a.gender === 'male').map((avatar) => {
                    const isSelected = selectedAvatarId === avatar.id;
                    return (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => handleSelectPresetAvatar(avatar)}
                        className={`relative rounded-xl overflow-hidden border-2 transition-all p-2 flex flex-col items-center justify-between bg-gradient-to-b from-slate-900 to-slate-950 ${
                          isSelected
                            ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105 shadow-xl shadow-amber-500/20'
                            : 'border-slate-800 hover:border-slate-600 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-xl bg-slate-950 border border-amber-400/30 flex items-center justify-center text-2xl shadow-inner mb-1.5 relative">
                          <span>{avatar.icon}</span>
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 p-0.5 rounded-full shadow">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-white leading-tight font-mono text-center">
                          {avatar.name}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono mt-0.5">{avatar.element}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Girls Row */}
              <div>
                <span className="text-[11px] font-mono font-bold text-fuchsia-300 uppercase block mb-1.5">
                  Female Vector Archetypes:
                </span>
                <div className="grid grid-cols-3 gap-3">
                  {AVATAR_PRESETS.filter((a) => a.gender === 'female').map((avatar) => {
                    const isSelected = selectedAvatarId === avatar.id;
                    return (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => handleSelectPresetAvatar(avatar)}
                        className={`relative rounded-xl overflow-hidden border-2 transition-all p-2 flex flex-col items-center justify-between bg-gradient-to-b from-slate-900 to-slate-950 ${
                          isSelected
                            ? 'border-fuchsia-400 ring-2 ring-fuchsia-400/50 scale-105 shadow-xl shadow-fuchsia-500/20'
                            : 'border-slate-800 hover:border-slate-600 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-xl bg-slate-950 border border-fuchsia-400/30 flex items-center justify-center text-2xl shadow-inner mb-1.5 relative">
                          <span>{avatar.icon}</span>
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 bg-fuchsia-500 text-slate-950 p-0.5 rounded-full shadow">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-white leading-tight font-mono text-center">
                          {avatar.name}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono mt-0.5">{avatar.element}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Identity & Physical Metrics */}
          <div>
            <div className="flex items-center gap-2 text-violet-400 font-bold text-base mb-4 border-b border-slate-800 pb-2">
              <Dumbbell className="w-5 h-5 text-amber-400" />
              <span>1. Player Identity & Physical Profile</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Hunter / Player Name</label>
                <input
                  type="text"
                  value={metrics.name}
                  onChange={(e) => setMetrics({ ...metrics, name: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                  placeholder="e.g. Kaito Kuro"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Age</label>
                <input
                  type="number"
                  min="12"
                  max="100"
                  value={metrics.age}
                  onChange={(e) => setMetrics({ ...metrics, age: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Height (cm)</label>
                <input
                  type="number"
                  min="100"
                  max="230"
                  value={metrics.heightCm}
                  onChange={(e) => setMetrics({ ...metrics, heightCm: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  min="30"
                  max="200"
                  value={metrics.weightKg}
                  onChange={(e) => setMetrics({ ...metrics, weightKg: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Physical Activity */}
          <div>
            <div className="flex items-center gap-2 text-violet-400 font-bold text-base mb-4 border-b border-slate-800 pb-2">
              <Flame className="w-5 h-5 text-red-400" />
              <span>2. Physical Activity & Training (STR / AGI)</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Workout Focus Type</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(['Powerlifting', 'Calisthenics', 'Cardio', 'None'] as WorkoutType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleWorkoutTypeChange(type)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                        metrics.workoutType === type
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/20'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-300">Workout Duration</label>
                    <span className="text-xs font-mono text-amber-400">{metrics.workoutMinsPerDay} mins/day</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="180"
                    step="5"
                    value={metrics.workoutMinsPerDay}
                    onChange={(e) => setMetrics({ ...metrics, workoutMinsPerDay: Number(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-300">Daily Steps Count</label>
                    <span className="text-xs font-mono text-cyan-400">{metrics.dailySteps.toLocaleString()} steps</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="30000"
                    step="500"
                    value={metrics.dailySteps}
                    onChange={(e) => setMetrics({ ...metrics, dailySteps: Number(e.target.value) })}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Mental Activity */}
          <div>
            <div className="flex items-center gap-2 text-violet-400 font-bold text-base mb-4 border-b border-slate-800 pb-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <span>3. Mental Mastery & Focus (INT / WIL)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Daily Study / Focus (Hrs)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="16"
                  value={metrics.studyFocusHours}
                  onChange={(e) => setMetrics({ ...metrics, studyFocusHours: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Focus Quality (1 to 5)</label>
                <select
                  value={metrics.focusQuality}
                  onChange={(e) => setMetrics({ ...metrics, focusQuality: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                >
                  <option value={1}>1 - Easily Distracted</option>
                  <option value={2}>2 - Low Focus</option>
                  <option value={3}>3 - Moderate Concentration</option>
                  <option value={4}>4 - High Flow State</option>
                  <option value={5}>5 - Hyper Focus (No Distractions)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phone-Free Deep Work (Hrs)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="12"
                  value={metrics.phoneFreeDeepWorkHours}
                  onChange={(e) => setMetrics({ ...metrics, phoneFreeDeepWorkHours: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Recovery & Consistency */}
          <div>
            <div className="flex items-center gap-2 text-violet-400 font-bold text-base mb-4 border-b border-slate-800 pb-2">
              <Moon className="w-5 h-5 text-indigo-400" />
              <span>4. Recovery & Consistency (VIT)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Sleep (Hours/night)</label>
                <input
                  type="number"
                  step="0.5"
                  min="3"
                  max="12"
                  value={metrics.sleepHours}
                  onChange={(e) => setMetrics({ ...metrics, sleepHours: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Consistency (Days/Month)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={metrics.consistencyDays}
                  onChange={(e) => setMetrics({ ...metrics, consistencyDays: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Active Streak (Days)</label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={metrics.habitStreakDays}
                  onChange={(e) => setMetrics({ ...metrics, habitStreakDays: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Skills Practice */}
          <div>
            <div className="flex items-center gap-2 text-violet-400 font-bold text-base mb-4 border-b border-slate-800 pb-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>5. Skills Focus (Hours Spent)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">🧠 Skills Practice (Hours Spent / Day)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="16"
                  value={metrics.skillHoursSpent || 0}
                  onChange={(e) => setMetrics({ ...metrics, skillHoursSpent: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                  placeholder="e.g. 2.5"
                />
                <p className="text-[11px] text-slate-500 mt-1">Total hours spent daily practicing skills (coding, crafts, design, instruments, or specialized focus).</p>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-mono">
              {errorMsg}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm md:text-base tracking-wide shadow-xl shadow-violet-600/30 flex items-center justify-center gap-3 transition-all duration-300 transform active:scale-98 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-amber-300" />
                <span>{loadingStep || 'Generating Anime Stat Card...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                <span>SUMMON ANIME STAT CARD</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Live Preview Gauges & Anime Power Translation Sidebar (5 Columns) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl sticky top-20 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Live Stat & Power Preview
            </h3>
            <span className="px-2.5 py-1 rounded bg-slate-950 border border-violet-500/40 text-amber-400 text-xs font-mono font-bold">
              {projectedRank}
            </span>
          </div>

          {/* Overall Power Level gauge */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
            <div className="text-xs uppercase font-mono tracking-wider text-slate-400">OVERALL POWER LEVEL</div>
            <div className="text-4xl md:text-5xl font-black text-amber-400 font-mono my-1 tracking-tight">
              {computedStats.overall} <span className="text-xs text-slate-500">/ 99</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400 h-full transition-all duration-500"
                style={{ width: `${computedStats.overall}%` }}
              ></div>
            </div>
          </div>

          {/* Live Habit-to-Anime Power Translation Callout */}
          <div className="bg-slate-950 p-4 rounded-xl border border-violet-500/30 space-y-2.5 font-mono text-xs">
            <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Translated Anime Powers:</span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Study ({metrics.studyFocusHours}h):</span>
              <span className="text-cyan-300 font-bold truncate max-w-[180px] text-right">{focusPowerTranslation}</span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Workout ({metrics.workoutMinsPerDay}m):</span>
              <span className="text-amber-300 font-bold truncate max-w-[180px] text-right">{workoutPowerTranslation}</span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Deep Work ({metrics.phoneFreeDeepWorkHours}h):</span>
              <span className="text-fuchsia-300 font-bold truncate max-w-[180px] text-right">{deepWorkTranslation}</span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Daily Steps ({metrics.dailySteps.toLocaleString()}):</span>
              <span className="text-emerald-300 font-bold truncate max-w-[180px] text-right">{stepsTranslation}</span>
            </div>
          </div>

          {/* Individual Stat Bars */}
          <div className="space-y-3 font-mono text-xs">
            {/* STR */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="font-bold text-red-400">STR (Strength / Power)</span>
                <span className="text-white font-bold">{computedStats.STR}</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-red-600 to-amber-500 h-full transition-all duration-300"
                  style={{ width: `${computedStats.STR}%` }}
                ></div>
              </div>
            </div>

            {/* INT */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="font-bold text-cyan-400">INT (Intelligence / Focus)</span>
                <span className="text-white font-bold">{computedStats.INT}</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-cyan-600 to-blue-500 h-full transition-all duration-300"
                  style={{ width: `${computedStats.INT}%` }}
                ></div>
              </div>
            </div>

            {/* AGI */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="font-bold text-emerald-400">AGI (Agility / Steps)</span>
                <span className="text-white font-bold">{computedStats.AGI}</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-emerald-600 to-teal-400 h-full transition-all duration-300"
                  style={{ width: `${computedStats.AGI}%` }}
                ></div>
              </div>
            </div>

            {/* VIT */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="font-bold text-indigo-400">VIT (Vitality / Sleep)</span>
                <span className="text-white font-bold">{computedStats.VIT}</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-indigo-600 to-purple-500 h-full transition-all duration-300"
                  style={{ width: `${computedStats.VIT}%` }}
                ></div>
              </div>
            </div>

            {/* WIL */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="font-bold text-fuchsia-400">WIL (Willpower / Streak)</span>
                <span className="text-white font-bold">{computedStats.WIL}</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-fuchsia-600 to-pink-500 h-full transition-all duration-300"
                  style={{ width: `${computedStats.WIL}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
