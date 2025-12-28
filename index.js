import { config } from "dotenv";
import { generateTweet, saveToHistory } from "./tweet-generator.js";
import { postTweet, verifyCredentials } from "./twitter-client.js";
import { 
  shouldPostNow, 
  updateScheduleAfterPost, 
  getScheduleStatus,
  initializeSchedule 
} from "./scheduler.js";

config();

// Check interval: every 5 minutes
const CHECK_INTERVAL = 5 * 60 * 1000;

// Main posting function
async function executePost() {
  console.log("\n" + "=".repeat(50));
  console.log(`🐦 Attempting to post at ${new Date().toLocaleString()}`);
  console.log("=".repeat(50));
  
  try {
    // Generate tweet
    console.log("\n📝 Generating tweet...");
    const { tweet, topic } = await generateTweet();
    console.log(`   Topic: ${topic}`);
    console.log(`   Tweet: "${tweet}"`);
    
    // Post to Twitter
    console.log("\n📤 Posting to Twitter...");
    const result = await postTweet(tweet);
    
    if (result.success) {
      // Save to history
      saveToHistory(tweet, topic);
      
      // Update schedule for next post
      updateScheduleAfterPost();
      
      console.log("\n✅ Success! Tweet posted and scheduled next one.");
    } else {
      console.log("\n❌ Failed to post. Will retry at next scheduled time.");
    }
    
    return result;
  } catch (error) {
    console.error("\n❌ Error during posting:", error.message);
    return { success: false, error: error.message };
  }
}

// Main loop
async function main() {
  console.log("\n" + "╔".padEnd(52, "═") + "╗");
  console.log("║" + "  Twitter Auto-Poster - CS Student Edition  ".padEnd(51) + "║");
  console.log("╚".padEnd(52, "═") + "╝\n");
  
  // Verify Twitter credentials
  console.log("🔐 Verifying Twitter credentials...");
  const auth = await verifyCredentials();
  
  if (!auth.success) {
    console.error("\n❌ Cannot start - Twitter authentication failed!");
    console.log("   Please check your .env file has correct credentials.");
    process.exit(1);
  }
  
  // Initialize schedule
  initializeSchedule();
  
  // Show current status
  const status = getScheduleStatus();
  console.log("\n📊 Current Status:");
  console.log(`   Total posts made: ${status.postCount || 0}`);
  console.log(`   Next post: ${status.nextScheduledFormatted}`);
  
  if (status.timeUntil.ready) {
    console.log(`   Status: Ready to post!`);
  } else {
    console.log(`   Time until next: ${status.timeUntil.hours}h ${status.timeUntil.minutes}m`);
  }
  
  console.log("\n⏳ Starting scheduler loop (checking every 5 minutes)...\n");
  
  // Check immediately on start
  await checkAndPost();
  
  // Then check every 5 minutes
  setInterval(checkAndPost, CHECK_INTERVAL);
}

// Check if should post and do it
async function checkAndPost() {
  const status = getScheduleStatus();
  
  if (shouldPostNow()) {
    await executePost();
  } else {
    // Silent check - only log occasionally
    const now = new Date();
    if (now.getMinutes() === 0) { // Log once per hour
      console.log(`[${now.toLocaleTimeString()}] ⏰ Next post in ${status.timeUntil.hours}h ${status.timeUntil.minutes}m`);
    }
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n👋 Shutting down gracefully...");
  console.log("   Your schedule is saved. Run again to continue.");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n\n👋 Received termination signal...");
  process.exit(0);
});

// Start the bot
main().catch(console.error);

