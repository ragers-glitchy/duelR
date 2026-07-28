import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// CORS & Preflight headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Persistent Database File Setup
const DB_FILE = path.join(process.cwd(), 'data_db.json');

interface UserAccount {
  email: string;
  hunterName: string;
  passwordHash: string;
  createdAt: string;
  wins: number;
  losses: number;
}

interface DBStructure {
  users: UserAccount[];
  cards: any[];
}

function loadDB(): DBStructure {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading db file, re-initializing:', e);
  }
  const defaultDb: DBStructure = {
    users: [
      {
        email: 'pro.hunter@duelr.com',
        hunterName: 'Ren the Shadow Sovereign',
        passwordHash: 'hunter123',
        createdAt: new Date().toISOString(),
        wins: 14,
        losses: 2,
      },
    ],
    cards: [
      {
        id: 'online-card-1',
        createdAt: new Date().toISOString(),
        cardName: 'Ren Kurogane',
        title: 'Shadow Sovereign of Midnight Grinds',
        rank: 'EX-Rank',
        classType: 'Void Berserker',
        elementalAffinity: 'Void',
        ownerEmail: 'pro.hunter@duelr.com',
        ownerName: 'Ren Kurogane',
        stats: { STR: 94, INT: 91, AGI: 96, VIT: 88, WIL: 98, overall: 93 },
        metrics: {
          name: 'Ren Kurogane',
          heightCm: 182,
          weightKg: 78,
          age: 23,
          workoutType: 'Powerlifting',
          workoutMinsPerDay: 90,
          dailySteps: 18000,
          studyFocusHours: 8,
          focusQuality: 5,
          phoneFreeDeepWorkHours: 6,
          sleepHours: 8,
          consistencyDays: 30,
          habitStreakDays: 45,
        },
        passiveSkill: {
          name: 'Akashic Void Flow',
          description: 'Passively gains +15 INT and 25% crit rate when study hours exceed 6.',
        },
        ultimateMove: {
          name: 'Shadow Domain Shatter',
          description: 'Channels accumulated willpower into a multi-strike void rift dealing 180% damage.',
        },
        flavorText: 'Forged in the fires of 45 continuous days of deep focus and brutal powerlifting.',
      },
      {
        id: 'online-card-2',
        createdAt: new Date().toISOString(),
        cardName: 'Aria Frost',
        title: 'Glacial Empress of Infinite Focus',
        rank: 'S-Rank',
        classType: 'Frost Assassin',
        elementalAffinity: 'Frost',
        ownerEmail: 'aria@duelr.io',
        ownerName: 'Aria Frost',
        stats: { STR: 78, INT: 95, AGI: 92, VIT: 82, WIL: 90, overall: 87 },
        metrics: {
          name: 'Aria Frost',
          heightCm: 168,
          weightKg: 58,
          age: 21,
          workoutType: 'Calisthenics',
          workoutMinsPerDay: 60,
          dailySteps: 14000,
          studyFocusHours: 7,
          focusQuality: 5,
          phoneFreeDeepWorkHours: 5,
          sleepHours: 8,
          consistencyDays: 28,
          habitStreakDays: 21,
        },
        passiveSkill: {
          name: 'Zero-Kelvin Concentration',
          description: 'Freezes enemy action bar by 20% on every critical strike.',
        },
        ultimateMove: {
          name: 'Absolute Zero Flash Step',
          description: 'Delivers 5 rapid glacial slashes bypassing 30% enemy armor.',
        },
        flavorText: 'Mastered calisthenics and unbroken deep work to command absolute thermal silence.',
      },
      {
        id: 'online-card-3',
        createdAt: new Date().toISOString(),
        cardName: 'Kenji Blaze',
        title: 'Flame Juggernaut of Iron Will',
        rank: 'S-Rank',
        classType: 'Flame Sentinel',
        elementalAffinity: 'Flame',
        ownerEmail: 'kenji@gym.com',
        ownerName: 'Kenji Blaze',
        stats: { STR: 96, INT: 75, AGI: 84, VIT: 92, WIL: 88, overall: 87 },
        metrics: {
          name: 'Kenji Blaze',
          heightCm: 185,
          weightKg: 88,
          age: 25,
          workoutType: 'Powerlifting',
          workoutMinsPerDay: 120,
          dailySteps: 12000,
          studyFocusHours: 4,
          focusQuality: 4,
          phoneFreeDeepWorkHours: 3,
          sleepHours: 7,
          consistencyDays: 25,
          habitStreakDays: 30,
        },
        passiveSkill: {
          name: 'Titan Muscle Blast',
          description: 'Increases STR by +20% when HP falls below 50%.',
        },
        ultimateMove: {
          name: 'Promethean Heavy Impact',
          description: 'Unleashes a devastating firestorm punch dealing massive physical damage.',
        },
        flavorText: 'Trained by daily heavy deadlifts and relentless fiery determination.',
      },
    ],
  };
  saveDB(defaultDb);
  return defaultDb;
}

function saveDB(db: DBStructure) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving db file:', e);
  }
}

// Global DB instance
let db = loadDB();

// Initialize GoogleGenAI server-side with required httpOptions
const getGenAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY environment variable is not set.');
  }
  return new GoogleGenAI({
    apiKey: apiKey || 'DUMMY_KEY_FOR_DEV_CONTAINER',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// --- AUTH & COMMUNITY CARDS DATABASE API ENDPOINTS ---

// Register New Account
app.post('/api/auth/register', (req, res) => {
  const { email, password, hunterName } = req.body;
  if (!email || !password || !hunterName) {
    return res.status(400).json({ error: 'Email, password, and Hunter Name are required.' });
  }

  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists. Please login instead.' });
  }

  const newUser: UserAccount = {
    email: email.toLowerCase(),
    hunterName,
    passwordHash: password, // Simple string match for demo database
    createdAt: new Date().toISOString(),
    wins: 0,
    losses: 0,
  };

  db.users.push(newUser);
  saveDB(db);

  res.json({
    message: 'Hunter Account created successfully!',
    user: {
      email: newUser.email,
      hunterName: newUser.hunterName,
      wins: newUser.wins,
      losses: newUser.losses,
    },
  });
});

// Login Account
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.passwordHash !== password) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const userCards = db.cards.filter((c) => c.ownerEmail?.toLowerCase() === user.email.toLowerCase());

  res.json({
    message: 'Login successful!',
    user: {
      email: user.email,
      hunterName: user.hunterName,
      wins: user.wins,
      losses: user.losses,
    },
    userCards,
  });
});

// Fetch Community Online Cards for 1v1 Duels
app.get('/api/community-cards', (req, res) => {
  res.json({
    cards: db.cards,
    totalCount: db.cards.length,
  });
});

// Publish / Save Card to Online Global Vault
app.post('/api/cards/publish', (req, res) => {
  const { card, ownerEmail, ownerName } = req.body;
  if (!card || !card.id) {
    return res.status(400).json({ error: 'Valid AnimeCard is required.' });
  }

  const cardToSave = {
    ...card,
    ownerEmail: ownerEmail ? ownerEmail.toLowerCase() : 'anonymous@duelr.com',
    ownerName: ownerName || card.cardName || 'Hunter',
    publishedAt: new Date().toISOString(),
  };

  const existingIdx = db.cards.findIndex((c) => c.id === card.id);
  if (existingIdx >= 0) {
    db.cards[existingIdx] = cardToSave;
  } else {
    db.cards.unshift(cardToSave);
  }

  saveDB(db);

  res.json({
    message: 'Card successfully published to the Online Global Community Vault!',
    card: cardToSave,
  });
});

// Record Battle Stats (Win / Loss update)
app.post('/api/auth/record-battle', (req, res) => {
  const { email, won } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (user) {
    if (won) {
      user.wins = (user.wins || 0) + 1;
    } else {
      user.losses = (user.losses || 0) + 1;
    }
    saveDB(db);
    return res.json({ wins: user.wins, losses: user.losses });
  }
  res.status(404).json({ error: 'User not found' });
});

// 1. Generate Card Lore JSON API
app.post('/api/generate-card', async (req, res) => {
  try {
    const { metrics, stats } = req.body;
    if (!metrics || !stats) {
      return res.status(400).json({ error: 'Metrics and stats are required' });
    }

    const ai = getGenAIClient();

    const promptText = `
You are the master lore generator for "DuelR", an anime stat card battle game.
Generate high-aura anime character lore, class, elemental affinity, passive skill, ultimate move, flavor text, and visual artwork prompt for a player based on their real habits.

IMPORTANT: Translate real-life habits into epic, high-aura shonen anime powers!
For example:
- Consistent Study -> "Domain Expansion: Akashic Flow State" or "Hyper-Synapse Overclock"
- Daily Step Count (10k+) -> "Godspeed Flash Step" or "Supersonic Velocity Stride"
- Heavy Workouts -> "Unbroken Iron Muscle Density" or "Titan's Kinetic Impact"
- Phone-Free Deep Work -> "Void Focus Barrier: Zero Distraction Field"
- Restful Sleep & Streak -> "Undying Phoenix Regeneration" or "Limitless Willpower"

User Metrics:
Name: ${metrics.name || 'Hunter'}
Stats (1-99): STR: ${stats.STR}, INT: ${stats.INT}, AGI: ${stats.AGI}, VIT: ${stats.VIT}, WIL: ${stats.WIL} (Overall Power Level: ${stats.overall})
Workout: ${metrics.workoutType}, ${metrics.workoutMinsPerDay} mins/day, Steps: ${metrics.dailySteps}/day
Study/Focus: ${metrics.studyFocusHours} hrs/day (Focus Quality: ${metrics.focusQuality}/5, Deep Work: ${metrics.phoneFreeDeepWorkHours} hrs)
Sleep & Consistency: ${metrics.sleepHours} hrs sleep, Streak: ${metrics.habitStreakDays || 0} days

Return JSON adhering strictly to this schema:
{
  "cardName": "${metrics.name || 'Hunter'}",
  "title": "Anime title, e.g., Shadow Monarch of Midnight Grinds / Sovereign of Akashic Flow / Flash Step Reaper",
  "rank": "${stats.overall >= 92 ? 'EX-Rank' : stats.overall >= 80 ? 'S-Rank' : stats.overall >= 65 ? 'A-Rank' : stats.overall >= 50 ? 'B-Rank' : 'C-Rank'}",
  "classType": "Anime class e.g., Void Berserker / Cyber Strategist / Flame Sentinel / Speed Monk / Holy Archon",
  "elementalAffinity": "Select one: Void, Lightning, Flame, Frost, Cyber, Holy, or Shadow",
  "passiveSkill": {
    "name": "Creative skill name translating study/deep work habit into anime power",
    "description": "Short anime passive skill detailing how their habit translates to combat advantage."
  },
  "ultimateMove": {
    "name": "Creative ultimate move translating physical training/streak into epic strike",
    "description": "Cinematic combat description based on their highest stat."
  },
  "flavorText": "2 sentences of high-aura epic anime lore describing how their daily discipline built their terrifying aura.",
  "visualPrompt": "Detailed prompt for anime artwork generation describing character appearance, class armor, glowing aura, background elements, high quality anime art style."
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cardName: { type: Type.STRING },
            title: { type: Type.STRING },
            rank: { type: Type.STRING },
            classType: { type: Type.STRING },
            elementalAffinity: { type: Type.STRING },
            passiveSkill: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ['name', 'description'],
            },
            ultimateMove: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ['name', 'description'],
            },
            flavorText: { type: Type.STRING },
            visualPrompt: { type: Type.STRING },
          },
          required: [
            'cardName',
            'title',
            'rank',
            'classType',
            'elementalAffinity',
            'passiveSkill',
            'ultimateMove',
            'flavorText',
            'visualPrompt',
          ],
        },
      },
    });

    const cardLore = JSON.parse(response.text || '{}');
    res.json(cardLore);
  } catch (err: unknown) {
    console.error('Error in /api/generate-card:', err);
    res.status(500).json({
      error: 'Failed to generate card lore with AI.',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

// 2. Generate Card Image API
app.post('/api/generate-card-image', async (req, res) => {
  try {
    const { visualPrompt, elementalAffinity, classType } = req.body;
    if (!visualPrompt) {
      return res.status(400).json({ error: 'visualPrompt is required' });
    }

    const ai = getGenAIClient();
    const fullPrompt = `Masterpiece high quality anime character portrait, ${visualPrompt}. Elemental ${elementalAffinity || 'energy'} aura, ${classType || 'warrior'} outfit, dramatic lightning/particles, clean studio anime line art, 8k resolution, card illustration.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [{ text: fullPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: '1:1',
        },
      },
    });

    let imageUrl = '';
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageUrl) {
      return res.status(500).json({ error: 'No image data returned from image model' });
    }

    res.json({ imageUrl });
  } catch (err: unknown) {
    console.error('Error in /api/generate-card-image:', err);
    res.status(500).json({
      error: 'Failed to generate card image.',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

// 3. AI Battle Commentary API
app.post('/api/battle-narrative', async (req, res) => {
  try {
    const { cardA, cardB, winnerName, logs } = req.body;
    const ai = getGenAIClient();

    const prompt = `
You are the legendary anime combat announcer for "DuelR".
Two legendary fighters faced off in the arena:

Fighter 1: ${cardA.cardName} (${cardA.title}) - Class: ${cardA.classType}, Element: ${cardA.elementalAffinity}, Rank: ${cardA.rank}. Ultimate: "${cardA.ultimateMove?.name}"
Fighter 2: ${cardB.cardName} (${cardB.title}) - Class: ${cardB.classType}, Element: ${cardB.elementalAffinity}, Rank: ${cardB.rank}. Ultimate: "${cardB.ultimateMove?.name}"

Winner: ${winnerName}

Combat Log Summary:
${JSON.stringify(logs, null, 2)}

Write an exciting, high-octane 3-sentence battle commentary summarizing why ${winnerName} won, highlighting their key stat advantage or ultimate move activation, with intense shonen anime flair.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    res.json({ commentary: response.text || `${winnerName} claims a glorious victory in the arena!` });
  } catch (err: unknown) {
    console.error('Error in /api/battle-narrative:', err);
    res.json({ commentary: `${req.body.winnerName || 'The victor'} triumphs through sheer discipline and overwhelming stat advantage!` });
  }
});

// Explicit API 404 handler to ensure /api routes ALWAYS return JSON and never Vite HTML fallback
app.use('/api', (req, res) => {
  res.status(404).json({ error: `API endpoint ${req.originalUrl} not found.` });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DuelR server running on http://localhost:${PORT}`);
  });
}

startServer();
