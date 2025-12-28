/**
 * GitHub Actions Tweet Poster
 * Simplified script for posting via GitHub Actions cron
 * No persistent state needed - just generates and posts
 */

import { config } from "dotenv";
import { generateTweet } from "./tweet-generator.js";
import { postTweet, verifyCredentials } from "./twitter-client.js";

config();

// Format time in IST
const formatIST = (date = new Date()) =>
  date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

async function main() {
  console.log("\n" + "=".repeat(50));
  console.log("🐦 Twitter Auto-Poster (GitHub Actions)");
  console.log(`📅 ${formatIST()}`);
  console.log("=".repeat(50));

  // Verify Twitter credentials
  console.log("\n🔐 Verifying Twitter credentials...");
  const auth = await verifyCredentials();

  if (!auth.success) {
    console.error("\n❌ Twitter authentication failed!");
    console.log("   Please check your GitHub Secrets are set correctly.");
    process.exit(1);
  }

  console.log(`✅ Authenticated as @${auth.username}`);

  // Generate tweet
  console.log("\n📝 Generating tweet...");
  const { tweet, topic } = await generateTweet();
  console.log(`   Topic: ${topic}`);
  console.log(`   Tweet: "${tweet}"`);

  // Post to Twitter
  console.log("\n📤 Posting to Twitter...");
  const result = await postTweet(tweet);

  if (result.success) {
    console.log("\n" + "=".repeat(50));
    console.log("✅ SUCCESS! Tweet posted!");
    console.log(`   Tweet ID: ${result.id}`);
    console.log("=".repeat(50));
    process.exit(0);
  } else {
    console.error("\n❌ Failed to post tweet:", result.error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Fatal error:", error.message);
  process.exit(1);
});

