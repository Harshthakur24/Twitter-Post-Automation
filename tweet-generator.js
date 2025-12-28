import { GoogleGenAI } from "@google/genai";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { config } from "dotenv";

config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Data directory for persistent storage (Docker-friendly)
const DATA_DIR = process.env.DATA_DIR || ".";
const HISTORY_FILE = join(DATA_DIR, "tweet-history.json");

// Ensure data directory exists
if (DATA_DIR !== "." && !existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// Topics pool - tech & engineering focused for engagement
const TOPICS = [
  // System Design & Architecture (high engagement)
  "system design decision you recently made",
  "scaling challenge you faced or solved",
  "microservices vs monolith real experience",
  "database choice that surprised you",

  // Engineering Hot Takes (drives discussion)
  "unpopular opinion about a popular framework",
  "overrated vs underrated tech tools",
  "things you unlearned as a developer",
  "mistakes that taught you the most",

  // Behind the Scenes (authenticity)
  "what your debugging process actually looks like",
  "real cost of technical debt you experienced",
  "production incident story (anonymized)",
  "code review feedback that changed your approach",

  // Learning Journey (relatable)
  "concept that finally clicked for you",
  "resource that actually helped you grow",
  "skill gap you're actively working on",
  "tech rabbit hole you went down",

  // Engineering Culture
  "what good engineering culture looks like",
  "red flags in engineering teams",
  "collaboration hack that improved your work",
  "documentation opinion from experience",

  // Practical Engineering
  "tool or library that saved you hours",
  "automation that was worth building",
  "testing strategy that caught real bugs",
  "performance optimization win",

  // Career & Growth
  "lesson from your internship/job",
  "interview experience insight (giving or receiving)",
  "how you approach learning new tech",
  "side project update or learning",

  // Developer Life (relatable content)
  "late night debugging realization",
  "moment you felt like a real engineer",
  "imposter syndrome and how you deal with it",
  "small win worth celebrating",
];

// Moods to vary the tone
const MOODS = [
  "genuinely excited about a discovery",
  "thoughtful after learning something",
  "mildly frustrated but finding humor in it",
  "quietly proud of progress",
  "curious and exploring new territory",
  "tired but satisfied with the work",
  "playfully sarcastic about dev life",
  "confidently sharing an opinion",
  "vulnerable about struggles",
  "hyped about a breakthrough",
];

// Tweet styles optimized for engagement (not spammy)
const STYLES = [
  // Story-driven (high engagement)
  "mini story with a twist or lesson (setup → unexpected outcome)",
  "before/after realization moment",

  // Opinion-driven (drives replies)
  "hot take that invites friendly debate",
  "unpopular opinion stated confidently",
  "comparing two approaches with your preference",

  // Question-driven (genuine curiosity)
  "genuine question you're wondering about",
  "asking for others' experiences on something",

  // Value-driven (gets saves/bookmarks)
  "specific tip from real experience",
  "thing you wish you knew earlier",
  "pattern you noticed that others might relate to",

  // Relatable (gets likes/engagement)
  "painfully relatable developer moment",
  "celebration of small engineering win",
  "honest admission that humanizes you",
];

// Engagement hooks - natural conversation starters
const HOOKS = [
  "start with a bold statement then explain",
  "start with 'I used to think X, now I think Y'",
  "start with a specific number or stat",
  "start mid-thought like continuing a conversation",
  "start with 'Hot take:' or 'Unpopular opinion:'",
  "start with a contradiction or unexpected combo",
  "start with 'TIL' or 'Today I learned'",
  "start with a question (not rhetorical)",
  "start with 'The thing about X is...'",
  "start with a direct statement of opinion",
];

// Time-based context
function getTimeContext() {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  let timeContext = "";
  if (hour >= 5 && hour < 9) timeContext = "early morning coding session";
  else if (hour >= 9 && hour < 12) timeContext = "morning productivity time";
  else if (hour >= 12 && hour < 14) timeContext = "lunch break coding";
  else if (hour >= 14 && hour < 18) timeContext = "afternoon work grind";
  else if (hour >= 18 && hour < 21) timeContext = "evening side project time";
  else if (hour >= 21 || hour < 2) timeContext = "late night coding session";
  else timeContext = "late night/early morning";

  return { timeContext, dayName: dayNames[day], isWeekend: day === 0 || day === 6 };
}

// Load tweet history to avoid repetition
function loadHistory() {
  try {
    if (existsSync(HISTORY_FILE)) {
      return JSON.parse(readFileSync(HISTORY_FILE, "utf-8"));
    }
  } catch (_e) {
    console.log("Starting fresh history");
  }
  return { tweets: [], topics: [], lastPosted: null };
}

// Save tweet to history
function saveToHistory(tweet, topic) {
  const history = loadHistory();
  history.tweets.push({
    content: tweet,
    topic: topic,
    timestamp: new Date().toISOString(),
  });
  // Keep only last 100 tweets in history
  if (history.tweets.length > 100) {
    history.tweets = history.tweets.slice(-100);
  }
  history.topics.push(topic);
  if (history.topics.length > 20) {
    history.topics = history.topics.slice(-20);
  }
  history.lastPosted = new Date().toISOString();
  writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

// Pick random item avoiding recent ones
function pickRandom(arr, recentlyUsed = []) {
  const available = arr.filter((item) => !recentlyUsed.includes(item));
  const pool = available.length > 0 ? available : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Generate human-like tweet optimized for engagement
export async function generateTweet() {
  const history = loadHistory();
  const recentTopics = history.topics || [];

  const topic = pickRandom(TOPICS, recentTopics);
  const mood = pickRandom(MOODS);
  const style = pickRandom(STYLES);
  const hook = pickRandom(HOOKS);
  const { timeContext, dayName, isWeekend } = getTimeContext();

  // Recent tweets for context (to avoid similar content)
  const recentTweets = (history.tweets || [])
    .slice(-5)
    .map((t) => t.content)
    .join("\n");

  const prompt = `You are a software engineering student/intern who tweets authentically about tech. Your tweets get engagement because they're REAL, SPECIFIC, and INTERESTING - not because they're trying to game the algorithm.

WHO YOU ARE:
- CS final year student doing product integration internship
- Genuinely passionate about building things
- Has real opinions from real experience
- Balances confidence with humility
- Part of the dev community, not above it

YOUR VOICE:
- Casual but smart (like talking to a friend who codes)
- Specific over generic (mention actual tools, real numbers, concrete examples)
- Opinionated but not arrogant
- Self-aware and sometimes self-deprecating
- Uses lowercase when it feels natural
- 0-2 emojis max, only when they add value
- NEVER hashtags (instant credibility killer)

ENGAGEMENT APPROACH (natural, not manipulative):
- Share genuine insights, not engagement bait
- Ask real questions you actually wonder about
- Make bold statements you can back up
- Tell mini-stories with unexpected endings
- Be vulnerable about struggles (builds connection)
- Celebrate wins without bragging

CURRENT CONTEXT:
- ${dayName}, ${timeContext}
- ${isWeekend ? "Weekend mode - side projects or learning" : "Weekday - internship grind"}
- Topic: ${topic}
- Mood: ${mood}
- Style: ${style}
- Hook approach: ${hook}

TECH STACK YOU ACTUALLY USE (be specific):
React, Next.js, Node.js, Express, TypeScript, Python, PostgreSQL, MongoDB, Redis, Docker, AWS, Vercel, Git, VS Code, Linux, REST APIs, GraphQL

RECENT TWEETS (don't repeat similar ideas):
${recentTweets || "None yet"}

HARD RULES:
1. Under 280 characters
2. ZERO hashtags
3. No "Just" at the start
4. No generic advice ("always test your code")
5. No cringe phrases ("let that sink in", "here's the thing", "game changer")
6. No thread bait ("A thread 🧵")
7. No engagement bait ("RT if you agree", "Like if you...")
8. Sound human, not like a content creator or AI
9. Be specific - vague tweets don't engage

GOOD TWEET EXAMPLES (for tone reference):
- "spent 3 hours debugging only to find a typo in my env variable. the variable was DATABASE_URL. i had typed DATABSE_URL."
- "hot take: most microservices architectures are just job security for the team that built them"
- "finally understood why everyone loves TypeScript. it's not about catching bugs, it's about autocomplete. that's it. that's the whole thing."
- "interviewer asked me to reverse a linked list. i mass a linked what? anyway i work here now somehow"

Write ONE tweet. Output ONLY the tweet text, nothing else.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.9, // Higher creativity
        topP: 0.95,
        maxOutputTokens: 150,
      },
    });

    let tweet = response.candidates[0].content.parts[0].text.trim();

    // Clean up any quotes the AI might add
    tweet = tweet.replace(/^["']|["']$/g, "").trim();

    // Remove any hashtags that slipped through
    tweet = tweet.replace(/#\w+/g, "").trim();

    // Ensure under 280 chars
    if (tweet.length > 280) {
      tweet = tweet.substring(0, 277) + "...";
    }

    return { tweet, topic };
  } catch (error) {
    console.error("Error generating tweet:", error);
    throw error;
  }
}

// Export for use in other files
export { saveToHistory, loadHistory };
