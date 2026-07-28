import React, { useState } from 'react';
import { AnimeCard, RankType, ElementalAffinity } from '../types';
import { AnimeCardView } from './AnimeCardView';
import { PRESET_RIVALS } from '../data/presetRivals';
import { Layers, Search, Filter, Plus, Swords } from 'lucide-react';
import { sounds } from '../utils/audio';

interface DeckManagerProps {
  userCards: AnimeCard[];
  onDeleteCard: (cardId: string) => void;
  onBattleCard: (card: AnimeCard) => void;
  onCreateNew: () => void;
}

export const DeckManager: React.FC<DeckManagerProps> = ({
  userCards,
  onDeleteCard,
  onBattleCard,
  onCreateNew,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'user' | 'rivals'>('all');
  const [selectedElement, setSelectedElement] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const allCards =
    selectedCategory === 'user'
      ? userCards
      : selectedCategory === 'rivals'
      ? PRESET_RIVALS
      : [...userCards, ...PRESET_RIVALS];

  const filteredCards = allCards.filter((c) => {
    const matchesSearch =
      c.cardName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.classType.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesElement = selectedElement === 'ALL' || c.elementalAffinity === selectedElement;

    return matchesSearch && matchesElement;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/80 border border-violet-500/30 text-violet-300 text-xs font-mono mb-2">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>HUNTER CARD DECK & RIVAL VAULT</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Card Deck <span className="text-slate-400">({filteredCards.length} Cards)</span>
          </h1>
        </div>

        <button
          onClick={onCreateNew}
          className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs md:text-sm tracking-wide shadow-lg shadow-violet-600/30 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Summon New Card</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full md:w-auto">
          <button
            onClick={() => {
              sounds.playCardFlip();
              setSelectedCategory('all');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              selectedCategory === 'all'
                ? 'bg-violet-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Cards ({userCards.length + PRESET_RIVALS.length})
          </button>
          <button
            onClick={() => {
              sounds.playCardFlip();
              setSelectedCategory('user');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              selectedCategory === 'user'
                ? 'bg-violet-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            My Cards ({userCards.length})
          </button>
          <button
            onClick={() => {
              sounds.playCardFlip();
              setSelectedCategory('rivals');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              selectedCategory === 'rivals'
                ? 'bg-violet-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Anime Bosses ({PRESET_RIVALS.length})
          </button>
        </div>

        {/* Element Filter & Search */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Element Selector */}
          <select
            value={selectedElement}
            onChange={(e) => setSelectedElement(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none"
          >
            <option value="ALL">All Elements</option>
            <option value="Void">Void 🌀</option>
            <option value="Lightning">Lightning ⚡</option>
            <option value="Flame">Flame 🔥</option>
            <option value="Frost">Frost ❄️</option>
            <option value="Cyber">Cyber ⚙️</option>
            <option value="Holy">Holy ✨</option>
            <option value="Shadow">Shadow 👁️</option>
          </select>

          {/* Search Box */}
          <div className="relative flex-1 md:w-56">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or class..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredCards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
          {filteredCards.map((card) => (
            <AnimeCardView
              key={card.id}
              card={card}
              onBattleAgainst={onBattleCard}
              onDelete={userCards.some((uc) => uc.id === card.id) ? onDeleteCard : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800">
          <p className="text-slate-400 text-sm font-mono">No anime cards found matching criteria.</p>
          <button
            onClick={onCreateNew}
            className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold hover:bg-violet-500 transition-colors"
          >
            Create Your First Card
          </button>
        </div>
      )}
    </div>
  );
};
