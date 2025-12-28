# 🐦 Twitter Auto-Poster

[![CI/CD Pipeline](https://github.com/Harshthakur24/Twitter-Post-Automation/actions/workflows/ci.yml/badge.svg)](https://github.com/Harshthakur24/Twitter-Post-Automation/actions/workflows/ci.yml)

Automated Twitter posting that generates human-like tweets about CS/tech topics. Posts every ~2 days at random times to look natural.

## Features

- **AI-Generated Content**: Uses Gemini AI to generate authentic, human-like tweets
- **Smart Scheduling**: Posts every ~2 days with random timing (±6 hours variance)
- **Natural Timing**: Weighted towards active hours (afternoon/evening)
- **Topic Variety**: Rotates through 30+ tech-related topics
- **Anti-Repetition**: Tracks history to avoid similar content
- **Mood Variation**: Different tones to keep content fresh
- **No Hashtags**: Avoids spammy hashtag usage

## Setup

### 1. Get Twitter API Credentials

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new Project and App
3. Set up User Authentication (OAuth 1.0a)
4. Get your API Key, API Secret, Access Token, and Access Token Secret

### 2. Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Create an API key

### 3. Configure Environment

```bash
# Copy the template
copy env-template.txt .env

# Edit .env with your actual credentials
```

### 4. Install Dependencies

```bash
npm install
```

## Usage

### Start the Auto-Poster (Runs Continuously)

```bash
npm start
```

This starts a background process that:
- Checks every 5 minutes if it's time to post
- Posts automatically when scheduled
- Shows hourly status updates
- Saves state so you can restart anytime

### Test Tweet Generation (Without Posting)

```bash
npm run test-generate
```

Generates 5 sample tweets to see what kind of content it creates.

### Force Post Now

```bash
# Preview what would be posted
npm run post-now

# Actually post it
npm run post-now -- --yes
```

## How It Works

### Scheduling

- Base interval: 48 hours (2 days)
- Random variance: ±6 hours to look natural
- Time weighting:
  - Morning (8-11 AM): 20%
  - Afternoon (12-5 PM): 35%
  - Evening (6-10 PM): 35%
  - Late night: 10%

### Content Generation

The AI generates tweets with this personality:
- CS final year student
- Product integration intern
- Shares wins AND struggles
- Casual but not too informal
- Uses 0-2 emojis max
- Never uses hashtags
- References real tech (React, Node, Docker, AWS, etc.)

### Topics Include

- Full stack development
- Product integration work
- Automation hacks
- AI/ML thoughts
- DevOps experiences
- Internship life
- Debugging stories
- Side projects
- Interview prep
- And 20+ more...

## Files

```
├── .github/workflows/ # CI/CD pipeline
├── tests/             # Unit tests
├── index.js           # Main scheduler loop
├── tweet-generator.js # AI tweet generation
├── twitter-client.js  # Twitter API wrapper
├── scheduler.js       # Timing logic
├── post-now.js        # Manual posting
├── test-generate.js   # Test tweet generation
├── render.yaml        # Render deployment config
├── eslint.config.js   # Linting configuration
└── .env               # Your credentials (create from template)
```

## Tips for Staying Under the Radar

1. **Don't Post Too Often**: Stick to the 2-day interval
2. **Vary Your Manual Activity**: Occasionally like, reply, retweet manually
3. **Engage Authentically**: Reply to comments on your automated tweets
4. **Monitor Performance**: If engagement drops, review tweet quality
5. **Keep It Running**: Random timing is key - don't always post at fixed times

## 🚀 Deployment (Render - FREE)

**✅ Completely FREE - No credit card required**

1. Go to [render.com](https://render.com) and sign up with GitHub
2. Click **"New +"** → **"Background Worker"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `twitter-autoposter`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
5. Add Environment Variables:
   - `TWITTER_API_KEY` = your key
   - `TWITTER_API_SECRET` = your secret
   - `TWITTER_ACCESS_TOKEN` = your token
   - `TWITTER_ACCESS_TOKEN_SECRET` = your token secret
   - `GEMINI_API_KEY` = your gemini key
6. Click **"Create Background Worker"**

That's it! Your bot will start running immediately.

> ⚠️ **Note**: Free tier workers may spin down after inactivity but will restart on the next scheduled check.

### Setting Up Auto-Deploy

To enable automatic deployment when you push to GitHub:

1. In Render dashboard, go to your service → **Settings**
2. Copy the **Deploy Hook** URL
3. In GitHub repo → **Settings** → **Secrets and variables** → **Actions**
4. Add secret: `RENDER_DEPLOY_HOOK` = your deploy hook URL
5. Also add: `GEMINI_API_KEY` = your Gemini key (for tests)

Now every push to `main` will automatically deploy! 🚀

## 🧪 CI/CD Pipeline

The GitHub Actions pipeline runs on every push and PR:

| Stage | What it does |
|-------|--------------|
| **Lint** | ESLint + Prettier code quality checks |
| **Security** | `npm audit` for vulnerabilities |
| **Test** | Unit tests for tweet validation |
| **Deploy** | Auto-deploys to Render on main branch |

### Run Locally

```bash
npm run lint        # Check code quality
npm run lint:fix    # Auto-fix issues
npm run format      # Format code
npm test            # Run unit tests
```

## Troubleshooting

**Authentication Failed**
- Double-check all 4 Twitter credentials in `.env`
- Make sure your Twitter app has Read and Write permissions

**Rate Limited**
- Twitter has API limits - the bot handles this gracefully
- It will retry at the next scheduled time

**Gemini API Error**
- Check your Gemini API key
- Verify you have quota remaining

## License

MIT - Use responsibly!

