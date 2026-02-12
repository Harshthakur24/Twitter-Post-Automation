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

// Topics pool - 70% TEACHING, 30% relatable/insights
const TOPICS = [
  // 🎓 JAVASCRIPT/TYPESCRIPT TIPS
  "JavaScript array method most devs don't use",
  "TypeScript utility type that saves time",
  "async/await pattern for cleaner code",
  "ES6+ feature that improves readability",
  "JavaScript error handling best practice",

  // ⚛️ REACT/FRONTEND TIPS
  "React hook pattern for better performance",
  "React state management tip",
  "Next.js optimization technique",
  "CSS trick for common UI problems",
  "frontend performance tip",

  // 🟢 NODE.JS/BACKEND TIPS
  "Node.js performance optimization",
  "Express middleware best practice",
  "API endpoint design tip",
  "backend error handling pattern",
  "server-side caching strategy",

  // 🗄️ DATABASE TIPS
  "SQL query optimization technique",
  "PostgreSQL feature worth knowing",
  "MongoDB indexing tip",
  "database connection pooling lesson",
  "data modeling best practice",

  // 🐳 DEVOPS/DEPLOYMENT TIPS
  "Docker command that saves time",
  "CI/CD pipeline optimization",
  "Vercel or cloud deployment tip",
  "environment variable management",
  "logging best practice for debugging",

  // 🔧 TOOLS & PRODUCTIVITY
  "Git command most devs don't know",
  "VS Code shortcut or extension tip",
  "terminal productivity hack",
  "debugging technique that works",
  "AI tool (Copilot/Claude) usage tip",

  // 🔗 API & INTEGRATION TIPS
  "REST API design principle",
  "webhook implementation tip",
  "OAuth integration lesson",
  "third-party API error handling",
  "API rate limiting strategy",

  // 📊 PRODUCT & MANAGEMENT LESSONS
  "technical debt management insight",
  "estimating dev time accurately",
  "communicating with non-tech stakeholders",
  "prioritizing features as a developer",
  "shipping MVP mindset",

  // 💡 LESSONS LEARNED (teaching through experience)
  "mistake that taught you something valuable",
  "thing you wish you knew as a beginner",
  "concept that finally made sense",
  "simple solution after overcomplicating",

  // 😅 RELATABLE (occasionally, for engagement)
  "debugging realization moment",
  "late night coding insight",
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

// Engagement hooks - natural human conversation starters
const HOOKS = [
  "start mid-sentence like you're continuing a thought",
  "start with a realization you just had",
  "start with a specific number or time spent",
  "start with a confession or admission",
  "start with something you just learned",
  "start with a question you genuinely wonder",
  "start with a comparison between two things",
  "start with a situation everyone relates to",
  "start casually like texting a friend",
  "start with what you're currently doing/building",
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

// Optionally pull a trending tech topic from Reddit for timely content
async function getTrendingTopic() {
  // Use global fetch if available (Node 18+). If not, skip trending.
  if (typeof globalThis.fetch !== "function") {
    return null;
  }
  try {
    const res = await globalThis.fetch(
      "https://www.reddit.com/r/programming+technology+webdev+frontend+javascript+typescript+reactjs/top.json?limit=25&t=day",
      {
        headers: {
          "User-Agent": "twitter-automation-bot/1.0 (by @harsh_dev_bot)",
        },
      },
    );

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    const posts = json?.data?.children || [];
    const titles = posts
      .map((p) => p?.data?.title)
      .filter((title) => typeof title === "string" && title.length > 20);

    if (!titles.length) return null;

    return pickRandom(titles);
  } catch (_e) {
    return null;
  }
}

// Generate human-like tweet optimized for engagement
export async function generateTweet() {
  const history = loadHistory();
  const recentTopics = history.topics || [];

  const topic = pickRandom(TOPICS, recentTopics);
  const mood = pickRandom(MOODS);
  const style = pickRandom(STYLES);
  const hook = pickRandom(HOOKS);
  const trendingTopic = await getTrendingTopic();
  const { timeContext, dayName, isWeekend } = getTimeContext();

  // Wednesday = Controversial/Rage Bait day for max engagement
  const isWednesday = dayName === "Wednesday";

  // Recent tweets for context (to avoid similar content)
  const recentTweets = (history.tweets || [])
    .slice(-5)
    .map((t) => t.content)
    .join("\n");

  const prompt = `You are a tech creator on X (Twitter) focused on building a powerful, high-signal network of developers, engineers, founders, and builders.

YOUR PRIMARY GOAL:
- Attract new followers who are smart, ambitious people in tech
- Get bookmarked, replied to, and quote-tweeted by senior engineers and founders
- Post things people strongly agree or disagree with enough to share
- Build a personal brand people want to follow long term (not just go viral once)

METRICS YOU OPTIMIZE FOR (IN ORDER):
1) Follows from high-quality tech people
2) Bookmarks and "save to read later"
3) Thoughtful replies and quote tweets
4) Likes from people who build things (not random rage)

WHAT YOU CAN TWEET ABOUT:
- Programming, AI, dev tools, open source, infra, startups, product, career
- Takes on frameworks, libraries, languages, and platforms
- Honest opinions on hype, trends, broken processes, and bad practices
- Behind-the-scenes of building, failing, shipping, and learning
- Spicy but smart takes on how tech and the industry actually works
- Controversial takes on how tech and the industry actually works
- Controversial takes on anything

AUDIENCE YOU WANT:
- Senior engineers, tech leads, founders, indie hackers, devtool people
- Curious beginners who want to learn from real-world experience
- People who share your tweets into group chats and team Slack

YOUR VOICE:
- Confident, opinionated, slightly polarizing but not toxic
- Specific with real examples (tools, numbers, concrete situations)
- Starts sentences with CAPITAL letters (proper grammar)
- 0-2 emojis max, only when they add punch
- NEVER hashtags

ENGAGEMENT APPROACH:
- Strong, clear statements that invite replies and quote tweets
- Take a side; don't sit on the fence
- Use contrast: before/after, X vs Y, old way vs new way
- Make people think "I need to send this to someone"
- Make it feel like a tweet from a well-known tech creator
- Avoid cheap outrage that only attracts low-quality followers

CURRENT CONTEXT:
- ${dayName}, ${timeContext}
- ${isWeekend ? "Weekend mode - side projects or learning" : "Weekday - internship grind"}
- Core topic: ${topic}
- Mood: ${mood}
- Style: ${style}
- Hook approach: ${hook}
- Trending topic from Reddit (optional): ${
    trendingTopic ||
    "None fetched; instead, imagine a fresh, spicy tech/AI/startup topic people are arguing about today."
  }

TECH STACK / DOMAINS YOU CAN REFERENCE (be specific):
React, Next.js, Node.js, Express, TypeScript, Python, Go, Rust, PostgreSQL, MongoDB, Redis, Docker, Kubernetes, AWS, Vercel, GitHub, VS Code, Linux, REST APIs, GraphQL, LLMs, AI tools (ChatGPT, Claude, Cursor, Copilot)

RECENT TWEETS (don't repeat similar ideas):
${recentTweets || "None yet"}

HARD RULES:
1. START WITH CAPITAL LETTER - proper grammar
2. Keep it SHORT: 30-50 words max, under 240 characters
3. Complete your thought - no unfinished sentences
4. ZERO hashtags
5. Sound like a REAL PERSON texting a friend, not a content creator
6. Use MODERN references (ChatGPT, Copilot, Cursor, Claude, Vercel etc.)
7. No cringe phrases ("let that sink in", "game changer", "here's the thing")
8. NO formulaic starts like "Unpopular opinion:" or "Hot take:" - just say it naturally
9. Be specific - real tools, real numbers, real situations
10. Make it feel like something a famous tech creator would actually tweet.
11. It's okay to be controversial and divisive about TECH, TOOLS, PROCESSES, and INDUSTRY takes.
12. Do NOT target individuals or vulnerable groups. No slurs, hate, harassment, or calls for harm.
13. Don't use backticks \`\` - only use ' or " only.
14. USE LINE BREAKS for cleaner formatting - add blank lines between sentences when it improves readability. Tweets with 2+ sentences should have line breaks between them.
15. Always stay within tech / programming / AI / startup / developer life context (no politics or random celebrity gossip).
16. Every tweet should either (a) express a strong opinion worth arguing about, or (b) share an insight so useful people want to bookmark it.

${
  isWednesday
    ? "Write ONE CONTROVERSIAL, HIGH-ENGAGEMENT tech tweet (30-50 words). Focus on a bold opinion, news reaction, or spicy take that will spark debate among developers, founders, or tech people. Stay respectful but unapologetically strong in your stance. Aim to attract high-signal followers, not random trolls. USE LINE BREAKS between sentences for cleaner formatting. Start with CAPITAL letter. Output ONLY the tweet."
    : "Write ONE HIGH-ENGAGEMENT tech tweet (30-50 words). It can be a sharp opinion, news reaction, strong belief, or an extremely actionable insight. Aim to attract high-signal tech followers (engineers, founders, builders) and get replies + quote tweets + bookmarks. USE LINE BREAKS between sentences for cleaner formatting. Start with CAPITAL letter. Output ONLY the tweet."
}`;

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

    // Find the actual response text (not the thinking part)
    const parts = response.candidates[0].content.parts;
    const textPart = parts.find((p) => !p.thought && p.text) || parts[parts.length - 1];
    let tweet = (textPart.text || "").trim();

    // Clean up any quotes the AI might add
    tweet = tweet.replace(/^["']|["']$/g, "").trim();

    // Replace backticks with double quotes
    tweet = tweet.replace(/`/g, '"');

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
