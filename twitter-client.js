import { TwitterApi } from "twitter-api-v2";
import { config } from "dotenv";

config();

// Initialize Twitter client
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

// Post tweet to Twitter
export async function postTweet(content) {
  try {
    const result = await twitterClient.v2.tweet(content);
    console.log(`✓ Tweet posted successfully!`);
    console.log(`  Tweet ID: ${result.data.id}`);
    console.log(`  Content: "${content}"`);
    return { success: true, id: result.data.id };
  } catch (error) {
    console.error("✗ Failed to post tweet:", error.message);

    // Handle rate limits gracefully
    if (error.code === 429) {
      console.log("  Rate limited - will retry later");
    }

    return { success: false, error: error.message };
  }
}

// Verify credentials
export async function verifyCredentials() {
  try {
    const me = await twitterClient.v2.me();
    console.log(`✓ Authenticated as @${me.data.username}`);
    return { success: true, username: me.data.username };
  } catch (error) {
    console.error("✗ Authentication failed:", error.message);
    return { success: false, error: error.message };
  }
}
