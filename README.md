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

The AI generates tweets optimized for **natural engagement** (not spam):

**Personality:**
- CS final year student / product integration intern
- Shares genuine wins AND struggles
- Has opinions backed by experience
- Casual but smart (like talking to a dev friend)
- Uses 0-2 emojis max, NEVER hashtags

**Engagement Strategies (Natural, Not Manipulative):**
- Mini-stories with unexpected outcomes
- Hot takes that invite friendly debate
- Genuine questions you're wondering about
- Specific tips from real experience
- Relatable developer moments

### Topics (Tech & Engineering Focused)

- System design decisions & scaling challenges
- Framework opinions & tech stack choices
- Debugging stories & production incidents
- Learning journeys & concepts that clicked
- Engineering culture & team dynamics
- Performance wins & automation hacks
- Career insights & interview experiences
- Side projects & open source work

**Tech Referenced:** React, Next.js, Node.js, TypeScript, Python, PostgreSQL, MongoDB, Docker, AWS, Vercel, and more...

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

## 🛡️ Twitter Safety & Best Practices

This bot is designed to **avoid getting flagged or banned**:

**Built-in Safety:**
- ✅ Posts every ~2 days (not spammy frequency)
- ✅ Random timing with ±6 hour variance
- ✅ No hashtags (spam signal)
- ✅ No engagement bait ("RT if you agree")
- ✅ No repetitive content (tracks history)
- ✅ Human-like varied content
- ✅ Specific, authentic voice

**What You Should Do:**
1. **Engage Manually**: Like, reply, and retweet regularly
2. **Reply to Comments**: Respond to people who engage with your tweets
3. **Stay Active**: Don't ONLY use automation
4. **Monitor Quality**: Check generated tweets occasionally
5. **Keep It Authentic**: The bot sounds like you, so stay consistent

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

