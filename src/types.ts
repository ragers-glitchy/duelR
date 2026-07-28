export type WorkoutType = 'Powerlifting' | 'Calisthenics' | 'Cardio' | 'None';

export interface SkillStats {
  skills: number;          // Overall Skill Level (10-99)
  academics: number;       // Academic & Study Focus (10-99)
  physique: number;        // Physical Power & Muscle (10-99)
  discipline: number;      // Willpower & Deep Work (10-99)
}

export interface UserMetrics {
  name: string;
  heightCm: number;
  weightKg: number;
  age: number;
  workoutType: WorkoutType;
  workoutMinsPerDay: number;
  dailySteps: number;
  studyFocusHours: number;
  focusQuality: number; // 1-5
  phoneFreeDeepWorkHours: number;
  sleepHours: number;
  consistencyDays: number;
  habitStreakDays: number;
  customAvatarUrl?: string;
  skillHoursSpent?: number; // Hours spent on skills per day
}

export interface CardStats {
  STR: number;
  INT: number;
  AGI: number;
  VIT: number;
  WIL: number;
  overall: number;
}

export type ElementalAffinity = 'Void' | 'Lightning' | 'Flame' | 'Frost' | 'Cyber' | 'Holy' | 'Shadow';
export type RankType = 'EX-Rank' | 'S-Rank' | 'A-Rank' | 'B-Rank' | 'C-Rank' | 'D-Rank' | 'E-Rank';

export interface SkillDetails {
  name: string;
  nameTranslation?: string;
  description: string;
  statBonus?: Partial<Record<'STR' | 'INT' | 'AGI' | 'VIT' | 'WIL', number>>;
}

export interface UltimateMoveDetails {
  name: string;
  nameTranslation?: string;
  description: string;
  basePower?: number;
}

export interface UserAccount {
  email: string;
  hunterName: string;
  wins: number;
  losses: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'workout' | 'study' | 'steps' | 'sleep' | 'streak' | 'penalty' | 'skill_practice';
  title: string;
  description: string;
  statChanges: Partial<Record<'STR' | 'INT' | 'AGI' | 'VIT' | 'WIL', number>>;
  skillChanges?: Partial<SkillStats>;
  xpEarned: number;
}

export interface CardProgression {
  level: number;
  currentXp: number;
  maxXp: number;
  statXp: Record<'STR' | 'INT' | 'AGI' | 'VIT' | 'WIL', number>;
  activityLogs: ActivityLog[];
}

export interface AnimeCard {
  id: string;
  createdAt: string;
  cardName: string;
  title: string;
  rank: RankType;
  classType: string;
  elementalAffinity: ElementalAffinity;
  stats: CardStats;
  skillStats?: SkillStats;
  metrics: UserMetrics;
  passiveSkill: SkillDetails;
  ultimateMove: UltimateMoveDetails;
  flavorText: string;
  visualPrompt: string;
  imageUrl?: string;
  ownerEmail?: string;
  ownerName?: string;
  publishedAt?: string;
  progression?: CardProgression;
}

export interface BattleParticipant {
  card: AnimeCard;
  currentHp: number;
  maxHp: number;
  energy: number;
}

export interface TurnLog {
  turn: number;
  attackerId: string;
  attackerName: string;
  defenderName: string;
  actionType: 'attack' | 'skill' | 'ultimate' | 'dodge' | 'counter';
  actionName: string;
  damage: number;
  isCritical: boolean;
  isDodged: boolean;
  narration: string;
  elementEffect?: string;
}

export interface BattleResult {
  winnerId: string;
  winnerName: string;
  loserName: string;
  turnLogs: TurnLog[];
  aiCommentary: string;
  mvpStat: string;
  battleDurationSecs: number;
}
