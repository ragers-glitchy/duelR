import React from 'react';
import { 
  Flame, Zap, Moon, Shield, Sparkles, Sword, Crown, Sun, Snowflake, 
  Eye, Skull, Compass, Crosshair, Feather, Heart, Radio, Activity,
  Terminal, Cpu, Box, Disc
} from 'lucide-react';
import { ElementalAffinity } from '../types';

interface VectorCardArtProps {
  cardName: string;
  classType: string;
  elementalAffinity: ElementalAffinity | string;
  rank: string;
  title: string;
  overallPower: number;
  customVectorId?: string;
}

export const VectorCardArt: React.FC<VectorCardArtProps> = ({
  cardName,
  classType,
  elementalAffinity,
  rank,
  title,
  overallPower,
}) => {
  // Determine vector theme colors, icons, and SVG pattern based on element & class
  const getVectorTheme = () => {
    switch (elementalAffinity) {
      case 'Void':
        return {
          gradient: 'from-purple-950 via-slate-950 to-indigo-950',
          borderColor: 'border-purple-500/60',
          glowColor: 'shadow-purple-500/30',
          accentHex: '#a855f7',
          secondaryHex: '#6366f1',
          bgSvgPattern: 'void-portal',
          primaryIcon: Moon,
          secondaryIcon: Skull,
          badgeBg: 'bg-purple-900/80 text-purple-200 border-purple-400/40',
        };
      case 'Flame':
        return {
          gradient: 'from-red-950 via-slate-950 to-amber-950',
          borderColor: 'border-amber-500/60',
          glowColor: 'shadow-red-500/30',
          accentHex: '#f59e0b',
          secondaryHex: '#ef4444',
          bgSvgPattern: 'flame-burst',
          primaryIcon: Flame,
          secondaryIcon: Sword,
          badgeBg: 'bg-amber-900/80 text-amber-200 border-amber-400/40',
        };
      case 'Cyber':
        return {
          gradient: 'from-cyan-950 via-slate-950 to-blue-950',
          borderColor: 'border-cyan-400/60',
          glowColor: 'shadow-cyan-500/30',
          accentHex: '#06b6d4',
          secondaryHex: '#3b82f6',
          bgSvgPattern: 'cyber-hex',
          primaryIcon: Cpu,
          secondaryIcon: Terminal,
          badgeBg: 'bg-cyan-900/80 text-cyan-200 border-cyan-400/40',
        };
      case 'Frost':
        return {
          gradient: 'from-blue-950 via-slate-950 to-sky-950',
          borderColor: 'border-sky-400/60',
          glowColor: 'shadow-sky-500/30',
          accentHex: '#38bdf8',
          secondaryHex: '#60a5fa',
          bgSvgPattern: 'frost-crystal',
          primaryIcon: Snowflake,
          secondaryIcon: Shield,
          badgeBg: 'bg-sky-900/80 text-sky-200 border-sky-400/40',
        };
      case 'Lightning':
        return {
          gradient: 'from-yellow-950 via-slate-950 to-amber-950',
          borderColor: 'border-yellow-400/60',
          glowColor: 'shadow-yellow-500/30',
          accentHex: '#eab308',
          secondaryHex: '#f59e0b',
          bgSvgPattern: 'lightning-sparks',
          primaryIcon: Zap,
          secondaryIcon: Crosshair,
          badgeBg: 'bg-yellow-900/80 text-yellow-200 border-yellow-400/40',
        };
      case 'Holy':
        return {
          gradient: 'from-amber-950 via-slate-950 to-yellow-950',
          borderColor: 'border-amber-300/60',
          glowColor: 'shadow-amber-400/30',
          accentHex: '#fde047',
          secondaryHex: '#f59e0b',
          bgSvgPattern: 'holy-halo',
          primaryIcon: Sun,
          secondaryIcon: Crown,
          badgeBg: 'bg-amber-900/80 text-amber-100 border-amber-300/40',
        };
      case 'Shadow':
      default:
        return {
          gradient: 'from-slate-950 via-purple-950 to-zinc-950',
          borderColor: 'border-fuchsia-500/60',
          glowColor: 'shadow-fuchsia-500/30',
          accentHex: '#d946ef',
          secondaryHex: '#8b5cf6',
          bgSvgPattern: 'shadow-eye',
          primaryIcon: Eye,
          secondaryIcon: Feather,
          badgeBg: 'bg-fuchsia-900/80 text-fuchsia-200 border-fuchsia-400/40',
        };
    }
  };

  const theme = getVectorTheme();
  const PrimaryIcon = theme.primaryIcon;
  const SecondaryIcon = theme.secondaryIcon;

  return (
    <div
      className={`relative w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 ${theme.borderColor} bg-gradient-to-br ${theme.gradient} shadow-2xl ${theme.glowColor} flex flex-col justify-between p-4 group select-none`}
    >
      {/* SVG Background Vector Patterns */}
      <svg
        className="absolute inset-0 w-full h-full opacity-30 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Radial Grid Pattern */}
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke={theme.accentHex} strokeWidth="0.5" strokeOpacity="0.4" />
          </pattern>
          {/* Hexagon Cyber Pattern */}
          <pattern id="hex" width="40" height="40" patternUnits="userSpaceOnUse">
            <polygon
              points="20,0 40,10 40,30 20,40 0,30 0,10"
              fill="none"
              stroke={theme.secondaryHex}
              strokeWidth="0.6"
              strokeOpacity="0.3"
            />
          </pattern>
          {/* Glowing Aura Gradient */}
          <radialGradient id="auraGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={theme.accentHex} stopOpacity="0.6" />
            <stop offset="60%" stopColor={theme.secondaryHex} stopOpacity="0.2" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Base Grid Overlay */}
        <rect width="100%" height="100%" fill="url(#grid)" />
        {elementalAffinity === 'Cyber' && <rect width="100%" height="100%" fill="url(#hex)" />}

        {/* Central Geometric Vector Magic Rings */}
        <circle cx="50%" cy="50%" r="35%" fill="url(#auraGlow)" />
        <circle cx="50%" cy="50%" r="32%" fill="none" stroke={theme.accentHex} strokeWidth="1.5" strokeDasharray="8,6" className="animate-[spin_20s_linear_infinite]" />
        <circle cx="50%" cy="50%" r="24%" fill="none" stroke={theme.secondaryHex} strokeWidth="1" strokeDasharray="4,4" className="animate-[spin_12s_linear_infinite_reverse]" />

        {/* Crosshair & Vector Ruler Lines */}
        <line x1="10%" y1="50%" x2="90%" y2="50%" stroke={theme.accentHex} strokeWidth="0.5" strokeDasharray="2,4" strokeOpacity="0.5" />
        <line x1="50%" y1="10%" x2="50%" y2="90%" stroke={theme.accentHex} strokeWidth="0.5" strokeDasharray="2,4" strokeOpacity="0.5" />
      </svg>

      {/* Top Banner Tag */}
      <div className="relative z-10 flex items-center justify-between">
        <div className={`px-2.5 py-1 rounded-lg backdrop-blur-md border ${theme.badgeBg} text-[11px] font-mono font-black flex items-center gap-1.5 shadow-md`}>
          <PrimaryIcon className="w-3.5 h-3.5 animate-pulse" />
          <span className="uppercase tracking-wider">{elementalAffinity} VECTOR ART</span>
        </div>

        <div className="px-2.5 py-1 rounded-lg bg-slate-950/90 border border-amber-400/50 text-amber-300 text-xs font-mono font-black shadow-lg flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>PWR {overallPower}</span>
        </div>
      </div>

      {/* Center Character Vector Art Emblem */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto">
        {/* Outer Pulsing Vector Halo */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-28 h-28 rounded-full bg-gradient-to-r from-violet-600/30 via-fuchsia-600/30 to-amber-500/30 blur-xl animate-pulse"></div>

          {/* Stylized Vector Shield / Crest Frame */}
          <div className="relative w-24 h-24 rounded-2xl bg-slate-950/80 backdrop-blur-xl border-2 border-white/20 p-3 shadow-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500">
            {/* Background Vector Art Pattern SVG inside Frame */}
            <svg className="absolute inset-0 w-full h-full p-2 pointer-events-none opacity-40" viewBox="0 0 100 100">
              <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="none" stroke={theme.accentHex} strokeWidth="2" />
              <polygon points="50,15 85,30 85,70 50,85 15,70 15,30" fill="none" stroke={theme.secondaryHex} strokeWidth="1" />
            </svg>

            {/* Main Central Vector Icon */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              <PrimaryIcon className="w-10 h-10 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
              <SecondaryIcon className="w-4 h-4 text-amber-300 absolute -bottom-1 -right-1 drop-shadow-md" />
            </div>
          </div>
        </div>

        {/* Character Title / Vector Archetype Text */}
        <div className="mt-3 text-center">
          <span className="px-3 py-0.5 rounded-full bg-slate-950/90 border border-white/20 text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest block mb-0.5">
            {classType} ARCHETYPE
          </span>
          <p className="text-xs font-bold italic text-amber-300 font-serif drop-shadow-md">
            "{title}"
          </p>
        </div>
      </div>

      {/* Bottom Footer Vector Art Specs */}
      <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-white/10 pt-2 bg-slate-950/60 backdrop-blur-md rounded-lg px-2.5">
        <span className="flex items-center gap-1">
          <Crown className="w-3 h-3 text-amber-400" />
          <span className="text-white font-bold">{cardName}</span>
        </span>
        <span className="text-amber-300 font-black">{rank}</span>
      </div>
    </div>
  );
};
