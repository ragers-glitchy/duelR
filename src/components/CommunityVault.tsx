import React, { useState, useEffect } from 'react';
import { AnimeCard, UserAccount } from '../types';
import { VectorCardArt } from './VectorCardArt';
import { Sparkles, Swords, Search, Filter, ShieldCheck, Globe, Trophy, RefreshCw, Loader2, Check } from 'lucide-react';
import { sounds } from '../utils/audio';

interface CommunityVaultProps {
  currentUser: UserAccount | null;
  userCards: AnimeCard[];
  onChallengeCard: (opponentCard: AnimeCard) => void;
  onOpenAuth: () => void;
  onPublishSuccess?: (card: AnimeCard) => void;
}

export const CommunityVault: React.FC<CommunityVaultProps> = ({
  currentUser,
  userCards,
  onChallengeCard,
  onOpenAuth,
  onPublishSuccess,
}) => {
  const [onlineCards, setOnlineCards] = useState<AnimeCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedElement, setSelectedElement] = useState<string>('All');
  const [selectedRank, setSelectedRank] = useState<string>('All');
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [publishedMap, setPublishedMap] = useState<Record<string, boolean>>({});

  const fetchCommunityCards = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/community-cards');
      if (res.ok) {
        const data = await res.json();
        setOnlineCards(data.cards || []);
      }
    } catch (e) {
      console.error('Failed to fetch community cards:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityCards();
  }, []);

  const handlePublishCard = async (card: AnimeCard) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    setPublishingId(card.id);
    sounds.playButtonClick();

    try {
      const res = await fetch('/api/cards/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card,
          ownerEmail: currentUser.email,
          ownerName: currentUser.hunterName,
        }),
      });

      if (res.ok) {
        sounds.playVictoryFanfare();
        setPublishedMap((prev) => ({ ...prev, [card.id]: true }));
        fetchCommunityCards();
        if (onPublishSuccess) onPublishSuccess(card);
      }
    } catch (e) {
      console.error('Failed to publish card:', e);
    } finally {
      setPublishingId(null);
    }
  };

  // Filter online cards
  const filteredCards = onlineCards.filter((card) => {
    const matchesSearch =
      card.cardName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (card.ownerName && card.ownerName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesElement =
      selectedElement === 'All' || card.elementalAffinity === selectedElement;

    const matchesRank =
      selectedRank === 'All' || card.rank === selectedRank;

    return matchesSearch && matchesElement && matchesRank;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-3">
          <Globe className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>ONLINE COMMUNITY NETWORK & 1v1 MATCHMAKING</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
          Global <span className="bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-400 bg-clip-text text-transparent">Anime Hunter Vault</span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto mt-2">
          Browse anime cards published by players online. Challenge any real player's card to an epic 1v1 duel or publish your own cards to the global database!
        </p>
      </div>

      {/* User Status Bar & Quick Publish Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-950 border border-violet-500/40 flex items-center justify-center text-amber-300">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-mono text-slate-400 uppercase">ONLINE STATUS</div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              {currentUser ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Logged in as <strong className="text-amber-400">{currentUser.hunterName}</strong> ({currentUser.email})</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span className="text-slate-300">Guest Mode (Login with email to publish cards)</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div>
          {!currentUser ? (
            <button
              onClick={() => {
                sounds.playButtonClick();
                onOpenAuth();
              }}
              className="py-2 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg flex items-center gap-1.5 transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <span>Login / Register Account</span>
            </button>
          ) : (
            <button
              onClick={() => {
                sounds.playButtonClick();
                fetchCommunityCards();
              }}
              className="py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500 text-cyan-300 font-mono text-xs flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Online Cards ({onlineCards.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* User's Created Cards to Publish Section (If logged in) */}
      {currentUser && userCards.length > 0 && (
        <div className="bg-slate-900/60 border border-violet-500/20 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Your Created Cards (Publish to Online Database):
            </h3>
            <span className="text-xs text-slate-400 font-mono">{userCards.length} Card(s) Saved</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userCards.map((card) => {
              const isAlreadyPublished = publishedMap[card.id] || onlineCards.some((c) => c.id === card.id);
              return (
                <div key={card.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-white">{card.cardName}</h4>
                    <span className="text-[10px] font-mono text-amber-400">{card.rank} • {card.elementalAffinity} • PWR {card.stats.overall}</span>
                  </div>

                  <button
                    onClick={() => handlePublishCard(card)}
                    disabled={publishingId === card.id || isAlreadyPublished}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1 ${
                      isAlreadyPublished
                        ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-300 cursor-default'
                        : 'bg-violet-600 hover:bg-violet-500 text-white shadow-md'
                    }`}
                  >
                    {publishingId === card.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isAlreadyPublished ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Online</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-3.5 h-3.5" />
                        <span>Publish</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search online players or cards..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-3 w-full md:w-auto font-mono text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Element:</span>
            <select
              value={selectedElement}
              onChange={(e) => setSelectedElement(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="All">All Elements</option>
              <option value="Void">Void 🔮</option>
              <option value="Flame">Flame 🔥</option>
              <option value="Frost">Frost ❄️</option>
              <option value="Cyber">Cyber ⚡</option>
              <option value="Lightning">Lightning ⚡</option>
              <option value="Holy">Holy ✨</option>
              <option value="Shadow">Shadow 👁️</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Rank:</span>
            <select
              value={selectedRank}
              onChange={(e) => setSelectedRank(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="All">All Ranks</option>
              <option value="EX-Rank">EX-Rank</option>
              <option value="S-Rank">S-Rank</option>
              <option value="A-Rank">A-Rank</option>
              <option value="B-Rank">B-Rank</option>
              <option value="C-Rank">C-Rank</option>
            </select>
          </div>
        </div>
      </div>

      {/* Online Cards Grid */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
          <p className="text-xs font-mono text-slate-400">Fetching Online Community Hunter Cards...</p>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <p className="text-slate-400 text-sm font-mono">No online cards found matching your query.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedElement('All');
              setSelectedRank('All');
            }}
            className="text-xs text-amber-400 hover:underline font-mono"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map((card) => (
            <div
              key={card.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/60 rounded-2xl p-4 shadow-xl space-y-4 transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between"
            >
              <div>
                {/* Vector Card Art Header */}
                <VectorCardArt
                  cardName={card.cardName}
                  classType={card.classType}
                  elementalAffinity={card.elementalAffinity}
                  rank={card.rank}
                  title={card.title}
                  overallPower={card.stats.overall}
                />

                {/* Owner Tag */}
                <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span>Hunter: <strong className="text-amber-300">{card.ownerName || card.cardName}</strong></span>
                  <span className="text-cyan-400 font-bold">1v1 Online</span>
                </div>

                {/* Passive & Ultimate Summary */}
                <div className="mt-3 space-y-1.5 text-xs font-mono">
                  <div className="text-slate-300 flex justify-between">
                    <span className="text-slate-400">Passive:</span>
                    <span className="text-cyan-300 font-bold truncate max-w-[180px]">{card.passiveSkill?.name}</span>
                  </div>
                  <div className="text-slate-300 flex justify-between">
                    <span className="text-slate-400">Ultimate:</span>
                    <span className="text-amber-300 font-bold truncate max-w-[180px]">{card.ultimateMove?.name}</span>
                  </div>
                </div>
              </div>

              {/* Challenge Button */}
              <button
                onClick={() => {
                  sounds.playPowerUp();
                  onChallengeCard(card);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs tracking-wider uppercase shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 transition-all transform active:scale-98"
              >
                <Swords className="w-4 h-4 text-amber-300" />
                <span>CHALLENGE 1v1 DUEL</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
