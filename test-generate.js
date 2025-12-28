import { config } from "dotenv";
import { generateTweet } from "./tweet-generator.js";

config();

// Generate sample tweets without posting (for testing)
async function testGenerate() {
  console.log("\n🧪 Tweet Generator Test\n");
  console.log("Generating 5 sample tweets...\n");
  console.log("─".repeat(60));
  
  for (let i = 1; i <= 5; i++) {
    try {
      const { tweet, topic } = await generateTweet();
      
      console.log(`\n${i}. Topic: ${topic}`);
      console.log(`   "${tweet}"`);
      console.log(`   [${tweet.length}/280 chars]`);
      
      // Small delay to avoid rate limits
      if (i < 5) {
        await new Promise(r => setTimeout(r, 1000));
      }
    } catch (error) {
      console.error(`\n${i}. Error: ${error.message}`);
    }
  }
  
  console.log("\n" + "─".repeat(60));
  console.log("\n✅ Test complete! These tweets were NOT posted.\n");
}

testGenerate().catch(console.error);

