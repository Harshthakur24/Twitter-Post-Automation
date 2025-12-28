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

// Topics pool - rotates naturally
const TOPICS = [
  "full stack development tips and struggles",
  "product integration work and learnings",
  "automation ideas and hacks",
  "AI and machine learning thoughts",
  "DevOps and deployment experiences",
  "internship life and experiences",
  "coding late night sessions",
  "debugging horror stories",
  "tech stack choices and opinions",
  "open source contributions",
  "side project updates",
  "interview prep and job hunting",
  "college final year struggles",
  "hackathon experiences",
  "learning new frameworks",
  "API integration challenges",
  "database optimization learnings",
  "cloud services experiences",
  "Docker and containerization",
  "CI/CD pipeline setups",
  "code review learnings",
  "pair programming experiences",
  "tech Twitter observations",
  "productivity tips for devs",
  "imposter syndrome feelings",
  "celebrating small wins",
  "tech industry news reactions",
  "weekend coding sessions",
  "coffee and code life",
  "remote work experiences"
];

// Moods to vary the tone
const MOODS = [
  "excited and enthusiastic",
  "reflective and thoughtful", 
  "slightly frustrated but learning",
  "proud of recent achievement",
  "curious and exploring",
  "tired but motivated",
  "humorous and light",
  "serious and professional",
  "grateful and appreciative",
  "determined and focused"
];

// Tweet styles for variety
const STYLES = [
  "short observation (1-2 sentences)",
  "quick tip or hack",
  "question to engage followers",
  "hot take or opinion",
  "personal experience story",
  "learning share",
  "celebration of small win",
  "relatable struggle",
  "motivational thought",
  "funny tech observation"
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
  } catch (e) {
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
    timestamp: new Date().toISOString()
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
  const available = arr.filter(item => !recentlyUsed.includes(item));
  const pool = available.length > 0 ? available : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Generate human-like tweet
export async function generateTweet() {
  const history = loadHistory();
  const recentTopics = history.topics || [];
  
  const topic = pickRandom(TOPICS, recentTopics);
  const mood = pickRandom(MOODS);
  const style = pickRandom(STYLES);
  const { timeContext, dayName, isWeekend } = getTimeContext();
  
  // Recent tweets for context (to avoid similar content)
  const recentTweets = (history.tweets || []).slice(-5).map(t => t.content).join("\n");
  
  const prompt = `You are a CS final year student doing a product integration internship. You're active on tech Twitter and tweet about your experiences naturally.

PERSONALITY:
- Genuine and authentic, not trying too hard
- Mix of professional insights and relatable struggles  
- Uses casual language but not overly informal
- Sometimes uses lowercase for casual vibes
- Occasionally uses emojis but not excessively (0-2 max)
- Never uses hashtags (they look spammy)
- Never sounds like marketing or AI-generated
- Has opinions but isn't arrogant
- Shares both wins and struggles honestly

CURRENT CONTEXT:
- It's ${dayName}, ${timeContext}
- ${isWeekend ? "Weekend vibes - maybe working on side projects or chilling" : "Weekday - balancing internship and college"}
- Topic to write about: ${topic}
- Current mood: ${mood}
- Tweet style: ${style}

AVOID (these were recent tweets, don't repeat similar ideas):
${recentTweets || "No recent tweets yet"}

RULES:
- Keep it under 280 characters
- NO hashtags ever
- Sound like a real person, not a content creator
- Be specific when possible (mention actual tech, situations)
- Don't start with "Just" too often
- Vary sentence structure
- Sometimes use incomplete sentences or casual grammar
- Can include mild frustration or humor about dev life
- Don't be preachy or give unsolicited advice
- Reference real tools: React, Node, Docker, AWS, MongoDB, PostgreSQL, etc.

Write ONE tweet. Output ONLY the tweet text, nothing else.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.9, // Higher creativity
        topP: 0.95,
        maxOutputTokens: 150
      }
    });
    
    let tweet = response.candidates[0].content.parts[0].text.trim();
    
    // Clean up any quotes the AI might add
    tweet = tweet.replace(/^["']|["']$/g, '').trim();
    
    // Remove any hashtags that slipped through
    tweet = tweet.replace(/#\w+/g, '').trim();
    
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

