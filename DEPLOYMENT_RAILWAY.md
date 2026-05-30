# Deploying Phish Scorecard to Railway

A complete step-by-step guide to deploy your Phish Scorecard application to Railway.

---

## Why Railway?

- ✅ **Easy Setup**: Connect GitHub and deploy in minutes
- ✅ **Free Tier**: $5/month free credits (enough for testing)
- ✅ **PostgreSQL Included**: Built-in database service
- ✅ **Auto-Deploy**: Deploys automatically when you push to GitHub
- ✅ **Environment Variables**: Easy to manage secrets
- ✅ **Custom Domain**: Add your own domain later
- ✅ **Monitoring**: Built-in logs and monitoring

---

## Prerequisites

- GitHub account (your code is already there!)
- Email address for Railway account
- Credit card (for free tier verification, won't be charged)

---

## Step-by-Step Deployment

### Step 1: Create Railway Account

1. Go to **https://railway.app**
2. Click **"Start Free"** button
3. Click **"Continue with GitHub"**
4. Authorize Railway to access your GitHub account
5. You'll be redirected to Railway dashboard

**Screenshot**: You should see a dashboard with "New Project" button

---

### Step 2: Create New Project

1. Click **"New Project"** button (top right)
2. Select **"Deploy from GitHub repo"**
3. You'll see a list of your repositories
4. Find and click **"Phish_Scorecard"**
5. Click **"Deploy Now"**

**What happens next**: Railway will start setting up your project

---

### Step 3: Add PostgreSQL Database

1. In your Railway project, click **"+ New"** button (top right)
2. Select **"Database"**
3. Choose **"PostgreSQL"**
4. Click **"Create"**

**Wait**: Railway will create a PostgreSQL database (takes ~1 minute)

**Screenshot**: You should see a PostgreSQL service added to your project

---

### Step 4: Configure Environment Variables

Now you need to set up environment variables for your backend.

#### 4a. Generate JWT Secret

Open your terminal and run:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output (it will be a long random string like: `a3f7b2c9e1d4f8a6...`)

#### 4b. Add Variables to Railway

1. Click on your **Node.js service** (the app, not the database)
2. Go to **"Variables"** tab
3. Click **"Add Variable"**
4. Add these variables one by one:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Paste the string you generated above |
| `PORT` | `3000` |

**Important**: Do NOT include `DATABASE_URL` - Railway will set this automatically!

**Screenshot**: You should see 3 variables listed

---

### Step 5: Connect Database to App

1. Click on your **PostgreSQL service**
2. Go to **"Variables"** tab
3. You'll see `DATABASE_URL` - copy it
4. Go back to your **Node.js service**
5. Click **"Variables"** tab
6. Click **"Add Variable"**
7. Name: `DATABASE_URL`
8. Value: Paste the PostgreSQL connection string
9. Click **"Add"**

**Screenshot**: Both services should now be connected

---

### Step 6: Initialize Database Schema

Now you need to run the SQL schema to create tables.

#### Option A: Using Railway CLI (Recommended)

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Navigate to your project directory:
   ```bash
   cd /home/ubuntu/Phish_Scorecard
   ```

4. Link to your Railway project:
   ```bash
   railway link
   ```

5. Run the database schema:
   ```bash
   railway run psql -f init-db.sql
   ```

**Wait**: This will create all the tables in your PostgreSQL database

#### Option B: Using pgAdmin (Web Interface)

1. Go to your PostgreSQL service in Railway
2. Click **"Connect"**
3. Copy the connection details
4. Go to **https://pgadmin.org** and create account
5. Add new server with Railway's connection details
6. Open query tool
7. Copy contents of `init-db.sql` and paste into query tool
8. Click **"Execute"**

---

### Step 7: Deploy Your App

1. Go back to your Railway project dashboard
2. Click on your **Node.js service**
3. Go to **"Deployments"** tab
4. You should see a deployment in progress
5. Wait for it to complete (status will show "Success")

**What's happening**: Railway is:
- Installing dependencies
- Building your app
- Starting the server

**This takes 2-3 minutes**

---

### Step 8: Get Your Live URL

1. Click on your **Node.js service**
2. Go to **"Settings"** tab
3. Look for **"Domains"** section
4. You'll see a URL like: `phish-scorecard-production-xxxx.up.railway.app`
5. This is your live app URL!

**Copy this URL** - you'll need it next

---

### Step 9: Test Your Deployment

1. Open your browser
2. Go to the URL from Step 8
3. You should see the Phish Scorecard login page!

**Try these:**
- ✅ Sign up with a new account
- ✅ Search for a Phish show
- ✅ Try to rate a song
- ✅ Check your personal stats

---

### Step 10: Add Custom Domain (Optional)

If you want a custom domain like `phishscorecard.com`:

1. In Railway, go to your **Node.js service**
2. Go to **"Settings"** tab
3. Click **"Add Domain"** under Domains
4. Enter your domain name
5. Follow the DNS configuration instructions
6. Point your domain registrar to Railway's nameservers

---

## Troubleshooting

### App won't start / shows error

**Check logs:**
1. Click on your Node.js service
2. Go to **"Logs"** tab
3. Look for error messages

**Common issues:**
- Missing `DATABASE_URL` variable
- Missing `JWT_SECRET` variable
- Database schema not initialized

**Fix:**
- Add missing variables
- Run `railway run psql -f init-db.sql` again

### Database connection failed

**Check connection:**
1. Click PostgreSQL service
2. Go to **"Variables"** tab
3. Copy `DATABASE_URL`
4. Test connection locally:
   ```bash
   psql "your-database-url-here"
   ```

**If it fails:**
- Verify PostgreSQL service is running
- Check firewall settings
- Recreate database

### Sign up / Login not working

**Check:**
1. Database tables exist: `railway run psql -c "\dt"`
2. `users` table is created
3. Check app logs for specific errors

### Show search returns no results

**Verify:**
1. Phish.net API is accessible
2. Check app logs for API errors
3. Try searching by different criteria

---

## Managing Your Deployment

### Viewing Logs

1. Click on your **Node.js service**
2. Go to **"Logs"** tab
3. See real-time logs of your app

### Redeploying

**Automatic**: Just push to GitHub
```bash
git push origin main
```
Railway will automatically redeploy!

**Manual**: Click **"Redeploy"** button in Deployments tab

### Updating Environment Variables

1. Click on service
2. Go to **"Variables"** tab
3. Edit or add variables
4. Changes take effect on next deploy

### Monitoring

1. Click on service
2. Go to **"Monitoring"** tab
3. See CPU, memory, and request metrics

---

## Next Steps

### After Successful Deployment

1. **Share your URL** with friends
2. **Test all features** thoroughly
3. **Monitor logs** for any errors
4. **Collect feedback** from users
5. **Plan new features** based on feedback

### Future Enhancements

- [ ] Add custom domain
- [ ] Set up email notifications
- [ ] Add monitoring alerts
- [ ] Implement backup strategy
- [ ] Set up CI/CD pipeline

---

## Cost Breakdown

**Free Tier ($5/month credits):**
- Node.js app: ~$5/month
- PostgreSQL database: Free (included)
- **Total**: Free with credits

**After free tier:**
- Node.js app: ~$7/month
- PostgreSQL database: ~$15/month
- **Total**: ~$22/month

**Ways to save:**
- Use free tier credits
- Optimize app performance
- Use smaller database instance

---

## Support & Resources

### Railway Documentation
- https://docs.railway.app/

### Common Issues
- https://docs.railway.app/troubleshooting

### Community Help
- Railway Discord: https://discord.gg/railway

### Your Project
- GitHub: https://github.com/mgolia6/Phish_Scorecard
- Developer Guide: See DEVELOPER_GUIDE.md

---

## Quick Reference Commands

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to project
railway link

# Initialize database
railway run psql -f init-db.sql

# View logs
railway logs

# Check environment variables
railway variables

# Redeploy
railway deploy
```

---

## Congratulations! 🎉

Your Phish Scorecard is now live on the internet! Share the URL with friends and start collecting show ratings.

**Live URL**: `https://your-app-name.up.railway.app`

---

**Last Updated**: May 29, 2026  
**Version**: 2.0
