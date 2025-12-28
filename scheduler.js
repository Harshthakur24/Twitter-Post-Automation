import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { config } from "dotenv";

config();

// Data directory for persistent storage (Docker-friendly)
const DATA_DIR = process.env.DATA_DIR || ".";
const SCHEDULE_FILE = join(DATA_DIR, "schedule-state.json");

// Ensure data directory exists
if (DATA_DIR !== "." && !existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// Load scheduler state
function loadScheduleState() {
  try {
    if (existsSync(SCHEDULE_FILE)) {
      return JSON.parse(readFileSync(SCHEDULE_FILE, "utf-8"));
    }
  } catch (_e) {
    console.log("Creating new schedule state");
  }
  return { 
    lastPost: null, 
    nextScheduled: null,
    postCount: 0 
  };
}

// Save scheduler state
function saveScheduleState(state) {
  writeFileSync(SCHEDULE_FILE, JSON.stringify(state, null, 2));
}

// Generate random hour (biased towards active hours)
function getRandomHour() {
  // Weighted towards times when people are active
  // Morning: 8-11 AM (weight: 20%)
  // Afternoon: 12-5 PM (weight: 35%)
  // Evening: 6-10 PM (weight: 35%)
  // Late night: 11 PM - 1 AM (weight: 10%)
  
  const rand = Math.random();
  
  if (rand < 0.20) {
    // Morning: 8-11
    return 8 + Math.floor(Math.random() * 4);
  } else if (rand < 0.55) {
    // Afternoon: 12-17
    return 12 + Math.floor(Math.random() * 6);
  } else if (rand < 0.90) {
    // Evening: 18-22
    return 18 + Math.floor(Math.random() * 5);
  } else {
    // Late night: 23, 0, 1
    const lateHours = [23, 0, 1];
    return lateHours[Math.floor(Math.random() * 3)];
  }
}

// Generate random minute
function getRandomMinute() {
  return Math.floor(Math.random() * 60);
}

// Calculate next post time (every ~2 days with some variance)
export function calculateNextPostTime(fromDate = new Date()) {
  // Base interval: 2 days (48 hours)
  // Add variance: -6 to +6 hours to seem more natural
  const baseHours = 48;
  const varianceHours = Math.floor(Math.random() * 13) - 6; // -6 to +6
  const totalHours = baseHours + varianceHours;
  
  // Calculate the base next date
  const nextDate = new Date(fromDate.getTime() + totalHours * 60 * 60 * 1000);
  
  // Set to a random "good" hour
  nextDate.setHours(getRandomHour(), getRandomMinute(), 0, 0);
  
  return nextDate;
}

// Check if it's time to post
export function shouldPostNow() {
  const state = loadScheduleState();
  
  // First run ever
  if (!state.nextScheduled) {
    return true;
  }
  
  const now = new Date();
  const scheduledTime = new Date(state.nextScheduled);
  
  return now >= scheduledTime;
}

// Update schedule after posting
export function updateScheduleAfterPost() {
  const state = loadScheduleState();
  const now = new Date();
  
  state.lastPost = now.toISOString();
  state.nextScheduled = calculateNextPostTime(now).toISOString();
  state.postCount = (state.postCount || 0) + 1;
  
  saveScheduleState(state);
  
  console.log(`\n📅 Schedule updated:`);
  console.log(`   Last post: ${now.toLocaleString()}`);
  console.log(`   Next post: ${new Date(state.nextScheduled).toLocaleString()}`);
  console.log(`   Total posts: ${state.postCount}`);
  
  return state;
}

// Get time until next post
export function getTimeUntilNextPost() {
  const state = loadScheduleState();
  
  if (!state.nextScheduled) {
    return { hours: 0, minutes: 0, ready: true };
  }
  
  const now = new Date();
  const next = new Date(state.nextScheduled);
  const diffMs = next - now;
  
  if (diffMs <= 0) {
    return { hours: 0, minutes: 0, ready: true };
  }
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return { hours, minutes, ready: false };
}

// Get current schedule status
export function getScheduleStatus() {
  const state = loadScheduleState();
  const timeUntil = getTimeUntilNextPost();
  
  return {
    ...state,
    timeUntil,
    nextScheduledFormatted: state.nextScheduled 
      ? new Date(state.nextScheduled).toLocaleString() 
      : "Not scheduled"
  };
}

// Initialize schedule if not exists
export function initializeSchedule() {
  const state = loadScheduleState();
  
  if (!state.nextScheduled) {
    // For first run, schedule within next few hours
    const now = new Date();
    const initialDelay = Math.floor(Math.random() * 4) + 1; // 1-4 hours
    const firstPost = new Date(now.getTime() + initialDelay * 60 * 60 * 1000);
    firstPost.setMinutes(getRandomMinute());
    
    state.nextScheduled = firstPost.toISOString();
    saveScheduleState(state);
    
    console.log(`🚀 Schedule initialized!`);
    console.log(`   First post scheduled for: ${firstPost.toLocaleString()}`);
  }
  
  return state;
}

export { loadScheduleState };

