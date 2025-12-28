import { config } from "dotenv";
import { generateTweet, saveToHistory } from "./tweet-generator.js";
import { postTweet, verifyCredentials } from "./twitter-client.js";
import { updateScheduleAfterPost } from "./scheduler.js";

config();

// Force post a tweet right now (for testing or manual override)
async function postNow() {
  console.log("\n🚀 Force posting now...\n");
  
  // Verify credentials first
  const auth = await verifyCredentials();
  if (!auth.success) {
    console.error("❌ Authentication failed. Check your .env file.");
    process.exit(1);
  }
  
  // Generate and post
  console.log("📝 Generating tweet...");
  const { tweet, topic } = await generateTweet();
  
  console.log(`\n📋 Generated Tweet:`);
  console.log(`   Topic: ${topic}`);
  console.log(`   Content: "${tweet}"`);
  console.log(`   Length: ${tweet.length}/280 chars\n`);
  
  // Ask for confirmation via command line arg
  const args = process.argv.slice(2);
  if (!args.includes("--yes") && !args.includes("-y")) {
    console.log("⚠️  Add --yes or -y to actually post this tweet.");
    console.log("   Example: npm run post-now -- --yes\n");
    process.exit(0);
  }
  
  console.log("📤 Posting to Twitter...");
  const result = await postTweet(tweet);
  
  if (result.success) {
    saveToHistory(tweet, topic);
    updateScheduleAfterPost();
    console.log("\n✅ Tweet posted successfully!");
  } else {
    console.log("\n❌ Failed to post tweet.");
  }
  
  process.exit(result.success ? 0 : 1);
}

postNow().catch(console.error);

