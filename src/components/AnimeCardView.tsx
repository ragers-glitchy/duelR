import React, { useState, useRef } from 'react';
import { AnimeCard } from '../types';
import { getElementTheme } from '../utils/statCalculator';
import { Sparkles, Swords, Download, Share2, Trash2, Shield, Zap, Eye, Rotate3d, Check, Flame } from 'lucide-react';
import { sounds } from '../utils/audio';
import { VectorCardArt } from './VectorCardArt';

interface AnimeCardViewProps {
  card: AnimeCard;
  onBattleAgainst?: (card: AnimeCard) => void;
  onDelete?: (cardId: string) => void;
  showActions?: boolean;
}

export const AnimeCardView: React.FC<AnimeCardViewProps> = ({
  card,
  onBattleAgainst,
  onDelete,
  showActions = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'lore'>('stats');
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const theme = getElementTheme(card.elementalAffinity);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // Calculate rotation (-12 to 12 deg)
    setRotate({
      x: -y / 18,
      y: x / 18,
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    sounds.playCardFlip();
  };

  const handleShare = () => {
    const shareText = `Check out my DuelR Anime Card: ${card.cardName} (${card.rank} ${card.classType}) - Power Level: ${card.stats.overall}!`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center">
      {/* 3D Holographic Trading Card Container */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale3d(${
            isHovered ? 1.02 : 1
          }, ${isHovered ? 1.02 : 1}, 1)`,
          transition: isHovered ? 'none' : 'transform 0.5s ease-out',
        }}
        className={`relative w-full max-w-[380px] rounded-3xl p-4 bg-gradient-to-b ${theme.bgGradient} border-2 ${theme.borderColor} shadow-2xl transition-all duration-300 select-none overflow-hidden group cursor-pointer`}
      >
        {/* Holographic Sheen overlay */}
        <div
          className={`absolute inset-0 pointer-events-none rounded-3xl opacity-30 group-hover:opacity-60 transition-opacity bg-gradient-to-tr from-transparent via-white/20 to-transparent`}
          style={{
            transform: `translate(${rotate.y * 3}px, ${rotate.x * 3}px)`,
          }}
        ></div>

        {/* Card Header: Name, Rank, Element */}
        <div className="relative z-10 flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{theme.icon}</span>
            <div>
              <h2 className="text-lg font-black text-white tracking-wide font-mono leading-tight drop-shadow-md">
                {card.cardName}
              </h2>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.textColor}`}>
                {card.classType}
              </span>
            </div>
          </div>

          {/* Rank Badge */}
          <div
            className={`px-3 py-1 rounded-lg ${theme.badgeBg} text-white font-black text-xs font-mono shadow-lg border border-white/30 flex items-center gap-1`}
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>{card.rank}</span>
          </div>
        </div>

        {/* Vector Artwork Canvas */}
        <div className="relative z-10 w-full mb-3">
          <VectorCardArt
            cardName={card.cardName}
            classType={card.classType}
            elementalAffinity={card.elementalAffinity}
            rank={card.rank}
            title={card.title}
            overallPower={card.stats.overall}
          />
        </div>

        {/* Card View Switcher: Stats vs Skills vs Lore */}
        <div className="relative z-10 flex border-b border-white/10 mb-3 text-xs font-bold font-mono">
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-1.5 text-center transition-colors border-b-2 ${
              activeTab === 'stats'
                ? `${theme.textColor} border-current font-black`
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Stats
          </button>
          <button
            onClick={() => setActiveTab('skills' as any)}
            className={`flex-1 py-1.5 text-center transition-colors border-b-2 ${
              activeTab === ('skills' as any)
                ? `${theme.textColor} border-current font-black`
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Skills 🎹
          </button>
          <button
            onClick={() => setActiveTab('lore')}
            className={`flex-1 py-1.5 text-center transition-colors border-b-2 ${
              activeTab === 'lore'
                ? `${theme.textColor} border-current font-black`
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Lore
          </button>
        </div>

        {/* Stats Tab Content */}
        {activeTab === 'stats' ? (
          <div className="relative z-10 space-y-3">
            {/* 5 Stats Grid */}
            <div className="grid grid-cols-5 gap-1 text-center font-mono">
              <div className="bg-slate-950/70 p-1.5 rounded-lg border border-red-500/30">
                <div className="text-[9px] text-red-400 font-bold">STR</div>
                <div className="text-sm font-black text-white">{card.stats.STR}</div>
              </div>
              <div className="bg-slate-950/70 p-1.5 rounded-lg border border-cyan-500/30">
                <div className="text-[9px] text-cyan-400 font-bold">INT</div>
                <div className="text-sm font-black text-white">{card.stats.INT}</div>
              </div>
              <div className="bg-slate-950/70 p-1.5 rounded-lg border border-emerald-500/30">
                <div className="text-[9px] text-emerald-400 font-bold">AGI</div>
                <div className="text-sm font-black text-white">{card.stats.AGI}</div>
              </div>
              <div className="bg-slate-950/70 p-1.5 rounded-lg border border-indigo-500/30">
                <div className="text-[9px] text-indigo-400 font-bold">VIT</div>
                <div className="text-sm font-black text-white">{card.stats.VIT}</div>
              </div>
              <div className="bg-slate-950/70 p-1.5 rounded-lg border border-fuchsia-500/30">
                <div className="text-[9px] text-fuchsia-400 font-bold">WIL</div>
                <div className="text-sm font-black text-white">{card.stats.WIL}</div>
              </div>
            </div>

            {/* Passive Skill Box */}
            <div className="bg-slate-950/80 rounded-xl p-2.5 border border-white/10">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 font-mono mb-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>PASSIVE: {card.passiveSkill?.name || 'Habit Focus'}</span>
              </div>
              {card.passiveSkill?.nameTranslation && (
                <div className="text-[10px] text-cyan-300 font-mono font-bold mb-1 italic">
                  ⚡ Power Translation: {card.passiveSkill.nameTranslation}
                </div>
              )}
              <p className="text-[11px] text-slate-300 leading-snug">
                {card.passiveSkill?.description}
              </p>
            </div>

            {/* Ultimate Move Box */}
            <div className="bg-gradient-to-r from-red-950/80 to-amber-950/80 rounded-xl p-2.5 border border-amber-500/40">
              <div className="flex items-center justify-between text-xs font-bold text-amber-300 font-mono mb-1">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                  <span>ULTIMATE: {card.ultimateMove?.name}</span>
                </div>
              </div>
              {card.ultimateMove?.nameTranslation && (
                <div className="text-[10px] text-amber-300 font-mono font-bold mb-1 italic">
                  🔥 Power Translation: {card.ultimateMove.nameTranslation}
                </div>
              )}
              <p className="text-[11px] text-slate-200 leading-snug">
                {card.ultimateMove?.description}
              </p>
            </div>
          </div>
        ) : activeTab === ('skills' as any) ? (
          /* Skills & Specialization Matrix Content */
          <div className="relative z-10 space-y-2 font-mono text-[11px]">
            <div className="bg-slate-950/80 rounded-xl p-2.5 border border-violet-500/30 space-y-2">
              <div className="text-amber-300 font-bold text-[10px] uppercase tracking-wider flex justify-between items-center border-b border-slate-800 pb-1">
                <span>SKILL SPECIALIZATION MATRIX</span>
                <span className="text-violet-400">UNEVEN TALENTS</span>
              </div>

              {(() => {
                const skills = card.skillStats || {
                  skills: Math.max(10, Math.min(99, Math.round((card.metrics.skillHoursSpent || 0) > 0 ? (card.metrics.skillHoursSpent! * 16) + card.stats.WIL * 0.3 : Math.round(card.stats.INT * 0.4 + card.stats.WIL * 0.3)))),
                  academics: Math.max(10, Math.min(99, card.stats.INT)),
                  physique: Math.max(10, Math.min(99, card.stats.STR)),
                  discipline: Math.max(10, Math.min(99, card.stats.WIL)),
                };

                const skillList = [
                  { label: '🧠 Skills (Hours Spent)', val: skills.skills, color: 'from-amber-500 to-yellow-400', textCol: 'text-amber-300' },
                  { label: '📚 Academics / Focus', val: skills.academics, color: 'from-cyan-500 to-blue-400', textCol: 'text-cyan-300' },
                  { label: '🏋️ Physique / Power', val: skills.physique, color: 'from-red-500 to-orange-400', textCol: 'text-red-400' },
                  { label: '🎯 Discipline / Willpower', val: skills.discipline, color: 'from-emerald-500 to-teal-400', textCol: 'text-emerald-300' },
                ];

                return skillList.map((sk) => (
                  <div key={sk.label} className="space-y-0.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-300">{sk.label}</span>
                      <span className={`font-black ${sk.textCol}`}>{sk.val} / 99</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full bg-gradient-to-r ${sk.color}`}
                        style={{ width: `${(sk.val / 99) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        ) : (
          /* Lore Tab Content */
          <div className="relative z-10 space-y-3 font-sans">
            <div className="bg-slate-950/80 rounded-xl p-3 border border-white/10 text-xs text-slate-300 leading-relaxed italic">
              "{card.flavorText}"
            </div>

            <div className="bg-slate-950/80 rounded-xl p-3 border border-white/10 space-y-1.5 text-[11px] font-mono">
              <div className="text-slate-400 font-bold text-xs mb-1 border-b border-slate-800 pb-1">
                REAL-LIFE HABIT MATRIX
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Workout Routine:</span>
                <span className="text-amber-400 font-bold">
                  {card.metrics.workoutType} ({card.metrics.workoutMinsPerDay} m/d)
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Daily Steps:</span>
                <span className="text-cyan-400 font-bold">
                  {card.metrics.dailySteps.toLocaleString()} steps
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Study & Deep Work:</span>
                <span className="text-purple-400 font-bold">
                  {card.metrics.studyFocusHours}h Study | {card.metrics.phoneFreeDeepWorkHours}h Deep
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Sleep & Streak:</span>
                <span className="text-emerald-400 font-bold">
                  {card.metrics.sleepHours}h Sleep | {card.metrics.habitStreakDays || 0}d Streak
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons below card */}
      {showActions && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 max-w-[380px] w-full">
          {onBattleAgainst && (
            <button
              onClick={() => {
                sounds.playAttackSlash();
                onBattleAgainst(card);
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/30 transition-all"
            >
              <Swords className="w-4 h-4" />
              <span>DUEL IN ARENA</span>
            </button>
          )}

          <button
            onClick={handleShare}
            className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
            title="Copy Card Stats & Share"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-cyan-400" />}
            <span>{copied ? 'Copied!' : 'Share'}</span>
          </button>

          {onDelete && (
            <button
              onClick={() => onDelete(card.id)}
              className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-red-950/80 border border-slate-700 hover:border-red-500/50 text-slate-400 hover:text-red-300 transition-colors"
              title="Delete Card"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
