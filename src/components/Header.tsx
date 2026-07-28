import React, { useState } from 'react';
import { UserAccount } from '../types';
import { Swords, PlusCircle, Layers, Sliders, Volume2, VolumeX, Music, Globe, User, ShieldCheck, TrendingUp } from 'lucide-react';
import { sounds } from '../utils/audio';

interface HeaderProps {
  activeTab: 'creator' | 'arena' | 'deck' | 'simulator' | 'community' | 'progression';
  setActiveTab: (tab: 'creator' | 'arena' | 'deck' | 'simulator' | 'community' | 'progression') => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  savedCardsCount: number;
  currentUser: UserAccount | null;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  soundEnabled,
  setSoundEnabled,
  savedCardsCount,
  currentUser,
  onOpenAuth,
}) => {
  const [bgmActive, setBgmActive] = useState(false);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.enabled = next;
    if (next) sounds.playCardFlip();
  };

  const toggleBgm = () => {
    const active = sounds.toggleBgm();
    setBgmActive(active);
    if (active) sounds.playPowerUp();
  };

  const navItems = [
    { id: 'creator', label: 'Card Creator', icon: PlusCircle },
    { id: 'progression', label: 'Daily Training', icon: TrendingUp },
    { id: 'arena', label: 'Battle Arena', icon: Swords },
    { id: 'community', label: 'Online 1v1 Vault', icon: Globe },
    { id: 'deck', label: `My Deck (${savedCardsCount})`, icon: Layers },
    { id: 'simulator', label: 'Habit Simulator', icon: Sliders },
  ] as const;

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-violet-900/40 px-3 lg:px-8 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer" onClick={() => setActiveTab('creator')}>
            <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 blur-sm opacity-80 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative px-3 py-1.5 bg-slate-900 rounded-lg border border-violet-500/50 flex items-center gap-2">
              <Swords className="w-6 h-6 text-violet-400 animate-pulse" />
              <span className="text-2xl font-black tracking-wider bg-gradient-to-r from-violet-400 via-fuchsia-300 to-cyan-400 bg-clip-text text-transparent font-mono">
                DUEL<span className="text-amber-400">R</span>
              </span>
            </div>
          </div>
          <span className="hidden xl:inline-block text-[11px] uppercase tracking-widest text-slate-400 font-semibold border-l border-slate-800 pl-3">
            Anime Stat Card & 1v1 Duel Engine
          </span>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  sounds.playCardFlip();
                  setActiveTab(item.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30 border border-violet-400/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Controls: Sound, Music, and Auth */}
        <div className="flex items-center gap-2">
          {/* Audio Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute SFX' : 'Enable SFX'}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 transition-colors"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Synth BGM Music Toggle */}
          <button
            onClick={toggleBgm}
            title={bgmActive ? 'Stop Battle Synth Music' : 'Play Battle Synth Music'}
            className={`p-2 rounded-lg border text-xs font-mono flex items-center gap-1 transition-all ${
              bgmActive
                ? 'bg-amber-950/80 border-amber-500/60 text-amber-300 ring-2 ring-amber-500/30'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400'
            }`}
          >
            <Music className={`w-4 h-4 ${bgmActive ? 'animate-bounce text-amber-300' : ''}`} />
            <span className="hidden sm:inline">{bgmActive ? 'BGM ON' : 'BGM'}</span>
          </button>

          {/* Account Login Button */}
          <button
            onClick={() => {
              sounds.playButtonClick();
              onOpenAuth();
            }}
            className={`py-1.5 px-3 rounded-lg border text-xs font-bold font-mono flex items-center gap-1.5 transition-all ${
              currentUser
                ? 'bg-violet-950/80 border-violet-500/50 text-amber-300 hover:bg-violet-900'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
          >
            {currentUser ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="truncate max-w-[100px]">{currentUser.hunterName}</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-violet-400" />
                <span>Login</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

