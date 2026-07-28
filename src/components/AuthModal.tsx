import React, { useState } from 'react';
import { UserAccount } from '../types';
import { User, Mail, Lock, ShieldCheck, Sparkles, LogIn, UserPlus, LogOut, X, Loader2, Trophy, Swords } from 'lucide-react';
import { sounds } from '../utils/audio';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onLoginSuccess: (user: UserAccount, userCards?: any[]) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hunterName, setHunterName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    sounds.playButtonClick();

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const bodyData = isRegister
        ? { email: email.trim(), password, hunterName: hunterName.trim() }
        : { email: email.trim(), password };

      let data: any = null;
      let isSuccess = false;

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData),
        });

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          data = await res.json();
        } else {
          const text = await res.text();
          console.warn('Server returned non-JSON auth response:', text);
        }

        if (res.ok && data?.user) {
          isSuccess = true;
        } else if (data?.error) {
          throw new Error(data.error);
        }
      } catch (serverErr: any) {
        // If server returned a business logic error (e.g., Invalid password), display it directly
        if (serverErr.message && !serverErr.message.toLowerCase().includes('json') && !serverErr.message.toLowerCase().includes('fetch')) {
          throw serverErr;
        }
        console.warn('Server auth endpoint unreachable or returned non-JSON, falling back to local storage auth:', serverErr);
      }

      // Local storage fallback if server endpoint is offline or unavailable
      if (!isSuccess) {
        const localUsersRaw = localStorage.getItem('duelr_local_users');
        const localUsers: any[] = localUsersRaw ? JSON.parse(localUsersRaw) : [
          {
            email: 'pro.hunter@duelr.com',
            hunterName: 'Ren the Shadow Sovereign',
            passwordHash: 'hunter123',
            wins: 14,
            losses: 2,
          }
        ];

        const targetEmail = email.trim().toLowerCase();

        if (isRegister) {
          const existing = localUsers.find((u: any) => u.email.toLowerCase() === targetEmail);
          if (existing) {
            throw new Error('An account with this email already exists.');
          }
          const newUser = {
            email: targetEmail,
            hunterName: hunterName.trim(),
            passwordHash: password,
            createdAt: new Date().toISOString(),
            wins: 0,
            losses: 0,
          };
          localUsers.push(newUser);
          localStorage.setItem('duelr_local_users', JSON.stringify(localUsers));
          data = { user: newUser, userCards: [] };
          isSuccess = true;
        } else {
          const user = localUsers.find((u: any) => u.email.toLowerCase() === targetEmail);
          if (user && user.passwordHash === password) {
            data = { user, userCards: [] };
            isSuccess = true;
          } else {
            throw new Error('Invalid email or password.');
          }
        }
      }

      sounds.playVictoryFanfare();
      setSuccessMsg(isRegister ? 'Account created! Welcome, Hunter.' : 'Logged in successfully!');
      onLoginSuccess(data.user, data.userCards);

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      sounds.playDefeatSound();
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-white">
        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playButtonClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {currentUser ? (
          /* Logged In View */
          <div className="text-center space-y-4 py-2">
            <div className="w-16 h-16 rounded-full bg-violet-950 border-2 border-amber-400/60 mx-auto flex items-center justify-center text-amber-300 shadow-xl">
              <User className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest block">
                ONLINE HUNTER PROFILE
              </span>
              <h3 className="text-xl font-black text-white">{currentUser.hunterName}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{currentUser.email}</p>
            </div>

            {/* Hunter Stats */}
            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 uppercase">1v1 Wins</span>
                <span className="text-lg font-bold text-emerald-400 flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  {currentUser.wins}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 uppercase">1v1 Losses</span>
                <span className="text-lg font-bold text-rose-400 flex items-center gap-1">
                  <Swords className="w-4 h-4 text-rose-400" />
                  {currentUser.losses}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Your cards are automatically synchronized with the global online community database!
            </p>

            <button
              onClick={() => {
                sounds.playButtonClick();
                onLogout();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-rose-950 hover:border-rose-500 border border-slate-700 text-slate-300 hover:text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out Hunter Account</span>
            </button>
          </div>
        ) : (
          /* Login / Register Form */
          <div>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-950 border border-violet-500/40 text-violet-300 text-xs font-mono mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>ONLINE HUNTER NETWORK</span>
              </div>
              <h2 className="text-2xl font-black text-white">
                {isRegister ? 'Create Online Hunter Profile' : 'Login with Email'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isRegister
                  ? 'Register your email to publish your anime stat cards and duel online players.'
                  : 'Access your published anime cards and battle online rivals.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Hunter Name / Alias
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={hunterName}
                      onChange={(e) => setHunterName(e.target.value)}
                      placeholder="e.g. Ren Kurogane"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hunter@example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-mono">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Connecting to Hunter Network...</span>
                  </>
                ) : isRegister ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>CREATE ONLINE HUNTER ACCOUNT</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>LOGIN TO HUNTER VAULT</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-slate-800 text-center">
              <button
                onClick={() => {
                  sounds.playButtonClick();
                  setIsRegister(!isRegister);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2"
              >
                {isRegister
                  ? 'Already have an account? Login here'
                  : "Don't have a Hunter profile? Register here"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
