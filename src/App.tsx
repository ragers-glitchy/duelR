import React, { useState, useEffect } from 'react';
import { AnimeCard, UserAccount } from './types';
import { Header } from './components/Header';
import { CardCreatorForm } from './components/CardCreatorForm';
import { BattleArena } from './components/BattleArena';
import { DeckManager } from './components/DeckManager';
import { StatSimulator } from './components/StatSimulator';
import { CommunityVault } from './components/CommunityVault';
import { CardProgressionHub } from './components/CardProgressionHub';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'creator' | 'arena' | 'deck' | 'simulator' | 'community' | 'progression'>('creator');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [userCards, setUserCards] = useState<AnimeCard[]>([]);
  const [preselectedOpponent, setPreselectedOpponent] = useState<AnimeCard | null>(null);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Load saved user cards and account from local storage
  useEffect(() => {
    try {
      const savedCards = localStorage.getItem('duelr_user_cards');
      if (savedCards) {
        const parsed = JSON.parse(savedCards);
        if (Array.isArray(parsed)) setUserCards(parsed);
      }

      const savedUser = localStorage.getItem('duelr_current_user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser && parsedUser.email) setCurrentUser(parsedUser);
      }
    } catch (e) {
      console.warn('Failed to load local storage data:', e);
    }
  }, []);

  const handleLoginSuccess = (user: UserAccount, serverUserCards?: AnimeCard[]) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('duelr_current_user', JSON.stringify(user));
    } catch (e) {
      console.warn('Failed to save current user:', e);
    }

    if (serverUserCards && serverUserCards.length > 0) {
      // Merge with existing local cards
      const existingIds = new Set(userCards.map((c) => c.id));
      const newUnique = serverUserCards.filter((c) => !existingIds.has(c.id));
      const merged = [...newUnique, ...userCards];
      saveCardsToStorage(merged);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('duelr_current_user');
  };

  // Save cards to local storage
  const saveCardsToStorage = (cards: AnimeCard[]) => {
    setUserCards(cards);
    try {
      localStorage.setItem('duelr_user_cards', JSON.stringify(cards));
    } catch (e) {
      console.warn('Failed to save user cards:', e);
    }
  };

  const handleCardCreated = (newCard: AnimeCard) => {
    const cardWithOwner = {
      ...newCard,
      ownerEmail: currentUser?.email || 'guest@duelr.com',
      ownerName: currentUser?.hunterName || newCard.cardName,
    };
    const updated = [cardWithOwner, ...userCards];
    saveCardsToStorage(updated);

    // If logged in, automatically publish to global database
    if (currentUser) {
      fetch('/api/cards/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card: cardWithOwner,
          ownerEmail: currentUser.email,
          ownerName: currentUser.hunterName,
        }),
      }).catch((e) => console.warn('Background auto-publish failed:', e));
    }

    setActiveTab('deck');
  };

  const handleUpdateCard = (updatedCard: AnimeCard) => {
    const updatedList = userCards.map((c) => (c.id === updatedCard.id ? updatedCard : c));
    saveCardsToStorage(updatedList);

    // Auto publish updated card to server database if user is logged in
    if (currentUser) {
      fetch('/api/cards/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card: updatedCard,
          ownerEmail: currentUser.email,
          ownerName: currentUser.hunterName,
        }),
      }).catch((e) => console.warn('Failed to sync updated card to server:', e));
    }
  };

  const handleDeleteCard = (cardId: string) => {
    const updated = userCards.filter((c) => c.id !== cardId);
    saveCardsToStorage(updated);
  };

  const handleBattleCard = (card: AnimeCard) => {
    setPreselectedOpponent(card);
    setActiveTab('arena');
  };

  const handleChallengeCommunityCard = (opponentCard: AnimeCard) => {
    setPreselectedOpponent(opponentCard);
    setActiveTab('arena');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-violet-500 selection:text-white flex flex-col relative overflow-x-hidden">
      {/* Anime arcade grid overlay background */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e1b4b15_1px,transparent_1px),linear-gradient(to_bottom,#1e1b4b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0"></div>

      {/* Glow Orbs */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none z-0"></div>
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none z-0"></div>

      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        savedCardsCount={userCards.length}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main View Container */}
      <main className="flex-1 relative z-10 pb-12">
        {activeTab === 'creator' && (
          <CardCreatorForm onCardCreated={handleCardCreated} />
        )}

        {activeTab === 'progression' && (
          <CardProgressionHub
            userCards={userCards}
            onUpdateCard={handleUpdateCard}
            onNavigateToCreator={() => setActiveTab('creator')}
          />
        )}

        {activeTab === 'arena' && (
          <BattleArena
            userCards={userCards}
            preselectedOpponent={preselectedOpponent}
          />
        )}

        {activeTab === 'community' && (
          <CommunityVault
            currentUser={currentUser}
            userCards={userCards}
            onChallengeCard={handleChallengeCommunityCard}
            onOpenAuth={() => setIsAuthOpen(true)}
            onPublishSuccess={(publishedCard) => {
              if (!userCards.some((c) => c.id === publishedCard.id)) {
                saveCardsToStorage([publishedCard, ...userCards]);
              }
            }}
          />
        )}

        {activeTab === 'deck' && (
          <DeckManager
            userCards={userCards}
            onDeleteCard={handleDeleteCard}
            onBattleCard={handleBattleCard}
            onCreateNew={() => setActiveTab('creator')}
          />
        )}

        {activeTab === 'simulator' && <StatSimulator />}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>DUELR © 2026 • Real Habit Anime Stat Card & Online 1v1 Combat Engine</span>
          <span className="text-slate-600 font-bold">Online Database Active • Powered by Gemini 2.0 Flash AI & Express</span>
        </div>
      </footer>
    </div>
  );
}

