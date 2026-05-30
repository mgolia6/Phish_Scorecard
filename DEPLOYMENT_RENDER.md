# Deploying Phish Scorecard to Render

A complete step-by-step guide to deploy your Phish Scorecard application to Render.

---

## Why Render?

- ✅ **GitHub Integration**: Easy connection to your repo
- ✅ **Free Tier**: Free tier available for testing
- ✅ **PostgreSQL**: Built-in managed PostgreSQL database
- ✅ **Auto-Deploy**: Automatic deployments on git push
- ✅ **Environment Variables**: Easy secret management
- ✅ **Custom Domains**: Add your own domain
- ✅ **Simple Dashboard**: Intuitive UI

---

## Prerequisites

- GitHub account (your code is already there!)
- Email address for Render account
- No credit card needed for free tier

---

## Step-by-Step Deployment

### Step 1: Create Render Account

1. Go to **https://render.com**
2. Click **"Get Started"** button
3. Click **"Sign up with GitHub"**
4. Authorize Render to access your GitHub account
5. You'll be redirected to Render dashboard

**Screenshot**: You should see "Dashboard" with "New +" button

---

### Step 2: Create PostgreSQL Database

1. Click **"New +"** button (top right)
2. Select **"PostgreSQL"**
3. Fill in the form:
   - **Name**: `phish-scorecard-db`
   - **Database**: `phish_scorecard`
   - **User**: `postgres`
   - **Region**: Choose closest to you
   - **Plan**: Select **"Free"** (for testing)
4. Click **"Create Database"**

**Wait**: Render will create your database (takes ~2 minutes)

**Screenshot**: You'll see database details page with connection info

---

### Step 3: Copy Database Connection String

1. On the database details page, look for **"Internal Database URL"**
2. Copy the entire URL (looks like: `postgresql://user:pass@host:5432/db`)
3. Save it somewhere - you'll need it in Step 6

**Important**: Use "Internal Database URL" (not External)

---

### Step 4: Create Web Service

1. Click **"New +"** button again
2. Select **"Web Service"**
3. Click **"Connect a repository"**
4. Find and select **"Phish_Scorecard"**
5. Click **"Connect"**

**Screenshot**: You'll see service configuration page

---

### Step 5: Configure Web Service

Fill in the form:

| Field | Value |
|-------|-------|
| **Name** | `phish-scorecard` |
| **Environment** | `Node` |
| **Build Command** | `npm install && cd client && npm run build && cd ..` |
| **Start Command** | `npm start` |
| **Plan** | `Free` |

**Important**: Make sure Build Command is correct!

---

### Step 6: Add Environment Variables

1. Scroll down to **"Environment"** section
2. Click **"Add Environment Variable"**
3. Add these variables one by one:

#### Variable 1: Database URL
- **Key**: `DATABASE_URL`
- **Value**: Paste the connection string from Step 3
- Click **"Add"**

#### Variable 2: Node Environment
- **Key**: `NODE_ENV`
- **Value**: `production`
- Click **"Add"**

#### Variable 3: Port
- **Key**: `PORT`
- **Value**: `3000`
- Click **"Add"**

#### Variable 4: JWT Secret

First, generate a secret in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then add:
- **Key**: `JWT_SECRET`
- **Value**: Paste the generated string
- Click **"Add"**

**Screenshot**: You should see 4 environment variables listed

---

### Step 7: Deploy

1. Scroll down to bottom
2. Click **"Create Web Service"**
3. Render will start building and deploying

**What's happening:**
- Installing dependencies
- Building frontend
- Starting backend
- Connecting to database

**This takes 3-5 minutes**

**Screenshot**: You'll see deployment logs in real-time

---

### Step 8: Monitor Deployment

1. Watch the **"Logs"** section
2. You should see messages like:
   - `npm install...`
   - `Building frontend...`
   - `Server running on port 3000`

3. When you see **"Server running"**, deployment is complete!

**If you see errors:**
- Check environment variables
- Check build command
- See Troubleshooting section below

---

### Step 9: Get Your Live URL

1. At the top of the page, you'll see your service URL
2. It looks like: `https://phish-scorecard.onrender.com`
3. Copy this URL

**This is your live app!**

---

### Step 10: Initialize Database Schema

Now you need to create the database tables.

#### Option A: Using Render Shell (Recommended)

1. In your Render dashboard, click on your **Web Service**
2. Go to **"Shell"** tab
3. Run this command:
   ```bash
   psql $DATABASE_URL -f init-db.sql
   ```

4. You should see output like:
   ```
   CREATE TABLE
   CREATE TABLE
   CREATE INDEX
   ```

**Done!** Your database is initialized

#### Option B: Using Local psql

1. Copy your `DATABASE_URL` from environment variables
2. In your terminal, run:
   ```bash
   psql "your-database-url-here" -f init-db.sql
   ```

---

### Step 11: Test Your Deployment

1. Open your browser
2. Go to your live URL from Step 9
3. You should see the Phish Scorecard login page!

**Try these features:**
- ✅ Sign up with a new account
- ✅ Search for a Phish show
- ✅ Rate some songs
- ✅ Check your personal stats

---

### Step 12: Add Custom Domain (Optional)

If you want a custom domain like `phishscorecard.com`:

1. In Render dashboard, click your **Web Service**
2. Go to **"Settings"** tab
3. Scroll to **"Custom Domain"**
4. Enter your domain name
5. Follow DNS configuration instructions
6. Update your domain registrar's nameservers

---

## Troubleshooting

### Deployment fails / shows error

**Check logs:**
1. Click on your Web Service
2. Go to **"Logs"** tab
3. Look for error messages

**Common errors:**

**Error: "Build failed"**
- Check Build Command is correct
- Verify `package.json` exists
- Check for syntax errors

**Error: "Cannot find module"**
- Run `npm install` locally to verify
- Check `package.json` dependencies

**Error: "Port already in use"**
- Render assigns port automatically
- Don't hardcode port in code

### App starts but shows blank page

**Check:**
1. Frontend build succeeded
2. Check browser console for errors
3. Check app logs for errors

**Fix:**
- Rebuild frontend: `npm run build`
- Push to GitHub to redeploy

### Database connection failed

**Check connection:**
1. Verify `DATABASE_URL` is set correctly
2. Test locally:
   ```bash
   psql "your-database-url"
   ```

**If it fails:**
- Verify database exists
- Check credentials
- Recreate database if needed

### Sign up / Login not working

**Check:**
1. Database tables exist
2. Run: `psql $DATABASE_URL -c "\dt"`
3. Should see `users`, `shows`, `ratings` tables

**If tables missing:**
- Run `init-db.sql` again

### Show search returns no results

**Verify:**
1. Phish.net API is accessible
2. Check app logs for API errors
3. Try different search terms

---

## Managing Your Deployment

### View Logs

1. Click on your **Web Service**
2. Go to **"Logs"** tab
3. See real-time application logs

### Redeploy

**Automatic**: Just push to GitHub
```bash
git push origin main
```

**Manual**: 
1. Click on your Web Service
2. Go to **"Deployments"** tab
3. Click **"Redeploy"** on latest deployment

### Update Environment Variables

1. Click on your **Web Service**
2. Go to **"Environment"** tab
3. Edit or add variables
4. Changes take effect on next deploy

### Monitor Performance

1. Click on your **Web Service**
2. Go to **"Metrics"** tab
3. See CPU, memory, and request metrics

---

## Auto-Deploy on Git Push

Render automatically deploys when you push to GitHub!

**To trigger a deployment:**
```bash
git add .
git commit -m "Your message"
git push origin main
```

**Render will:**
1. Detect the push
2. Pull latest code
3. Run build command
4. Deploy automatically

**No manual steps needed!**

---

## Cost Breakdown

**Free Tier:**
- Web Service: Free (with limitations)
- PostgreSQL: Free for 90 days
- **Total**: Free (limited time)

**After free tier:**
- Web Service: ~$7/month
- PostgreSQL: ~$15/month
- **Total**: ~$22/month

**Note**: Free tier services spin down after 15 minutes of inactivity

---

## Comparison: Railway vs Render

| Feature | Railway | Render |
|---------|---------|--------|
| Free Tier | $5/month credits | Free (limited) |
| Setup Time | 5 minutes | 10 minutes |
| Auto-Deploy | Yes | Yes |
| Custom Domain | Yes | Yes |
| PostgreSQL | Included | Included |
| Ease of Use | Very Easy | Easy |
| Recommended | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## Support & Resources

### Render Documentation
- https://render.com/docs

### Troubleshooting Guide
- https://render.com/docs/troubleshooting

### Community Help
- Render Discord: https://discord.gg/render

### Your Project
- GitHub: https://github.com/mgolia6/Phish_Scorecard
- Developer Guide: See DEVELOPER_GUIDE.md

---

## Quick Reference

```bash
# Initialize database (from Render Shell)
psql $DATABASE_URL -f init-db.sql

# Check database tables
psql $DATABASE_URL -c "\dt"

# View environment variables
env | grep DATABASE_URL
```

---

## Congratulations! 🎉

Your Phish Scorecard is now live on the internet! Share your URL with friends and start collecting show ratings.

**Live URL**: `https://your-app-name.onrender.com`

---

**Last Updated**: May 29, 2026  
**Version**: 2.0
