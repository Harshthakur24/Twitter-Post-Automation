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

// Topics pool - mix of educational, relatable, and engaging content
const TOPICS = [
  // 🎓 TEACHING - Quick Tips (high value)
  "useful JavaScript/TypeScript trick",
  "React performance tip",
  "Node.js best practice",
  "SQL optimization technique",
  "Git command that saves time",
  "Docker tip for beginners",
  "API design principle",
  "debugging technique that works",
  "VS Code productivity tip",
  "clean code principle",

  // 😅 RELATABLE - Developer Struggles
  "debugging session gone wrong",
  "that moment when the bug was obvious",
  "imposter syndrome reality",
  "deadline vs code quality dilemma",
  "production bug panic moment",
  "code review feedback that hurt but helped",
  "overengineering confession",
  "stack overflow copy-paste reality",
  "meeting that could have been an email",
  "coffee and code dependency",

  // 💡 INSIGHTS - Lessons Learned
  "mistake that taught you the most",
  "thing you wish you knew earlier",
  "opinion that changed with experience",
  "simple solution after complex attempts",
  "tool that changed your workflow",
  "concept that finally clicked",
  "advice you'd give your past self",
  "unpopular but true tech opinion",

  // 🚀 WINS - Celebrating Progress
  "small win worth celebrating",
  "performance optimization success",
  "feature you're proud of building",
  "problem you finally solved",
  "skill gap you closed",

  // 🤔 QUESTIONS - Community Engagement
  "genuine question about a tech choice",
  "asking for others' experiences",
  "debate starter about best practices",
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

  const prompt = `You are a software engineer who tweets authentically about tech. Your tweets are a MIX of:
- TEACHING: Tips, tricks, and concepts that help others learn
- RELATABLE: Developer struggles and moments everyone experiences  
- INSIGHTS: Lessons learned and honest opinions
- WINS: Celebrating progress and breakthroughs

YOUR GOAL:
- Create tweets that feel HUMAN and REAL
- Sometimes teach, sometimes just share a relatable moment
- Build connection through authenticity
- Provide value OR make people smile/nod in agreement

WHO YOU ARE:
- CS student / product integration intern with real experience
- Goes through the same struggles as every developer
- Celebrates small wins and admits to mistakes
- Part of the dev community, not above it

YOUR VOICE:
- Conversational and natural (like texting a dev friend)
- Specific with real examples (actual tools, real numbers)
- Starts sentences with CAPITAL letters (proper grammar)
- Can be funny, vulnerable, proud, or educational
- 0-2 emojis max, only when they add personality
- NEVER hashtags

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
1. START WITH CAPITAL LETTER - proper grammar always
2. Keep it SHORT: 30-50 words max, under 220 characters
3. TEACH something valuable - a tip, trick, concept, or insight
4. Complete your thought - don't leave sentences unfinished
5. ZERO hashtags
6. No generic advice without specifics
7. No cringe phrases ("let that sink in", "game changer")
8. No thread bait or engagement bait
9. Be specific - mention real tools, numbers, or examples
10. Sound like a helpful developer, not a content creator

GOOD TWEET EXAMPLES (mix of styles):

TEACHING:
- "Quick tip: Use 'git stash -u' to include untracked files. Saved me so many times when switching branches."
- "Redis isn't just for caching. Use it as a message queue with LPUSH/BRPOP. Simple pub/sub without Kafka complexity."

RELATABLE:
- "Spent 2 hours debugging. The bug? A missing 's' in 'users'. I'm taking a walk."
- "The confidence I have pushing to main vs the anxiety 5 minutes later is unmatched."

INSIGHTS:
- "I used to think clean code meant short code. Now I know readable code beats clever code every time."
- "Biggest lesson from my internship: The hardest bugs are usually wrong assumptions, not complex logic."

WINS:
- "Finally got our API response time under 100ms. One database index. That's it. Sometimes simple wins."

Write ONE tweet (30-50 words). Match the topic's vibe - teach if it's a tip, be relatable if it's a struggle, share insight if it's a lesson. Start with CAPITAL letter. Output ONLY the tweet text.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.9,
        topP: 0.95,
        maxOutputTokens: 2048,
        thinkingConfig: {
          thinkingBudget: 1024,
        },
      },
    });

    let tweet = response.candidates[0].content.parts[0].text.trim();

    // Clean up any quotes the AI might add
    tweet = tweet.replace(/^["']|["']$/g, "").trim();

    // Remove any hashtags that slipped through
    tweet = tweet.replace(/#\w+/g, "").trim();

    // Ensure first letter is capitalized
    if (tweet.length > 0) {
      tweet = tweet.charAt(0).toUpperCase() + tweet.slice(1);
    }

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
