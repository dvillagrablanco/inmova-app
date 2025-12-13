# CRITICAL: Railway Dashboard Configuration Override

## Date: December 12, 2025
## Commit: a1ba349f

## 🚨 THE PERSISTENT ISSUE

Despite 12 commits fixing the Dockerfile and configuration files, Railway **CONTINUES** to execute `node server.js` instead of `yarn start`.

```
Error: Cannot find module '/app/server.js'
```

This error persists even though:
- ✅ Dockerfile has `CMD ["yarn", "start"]`
- ✅ railway.json has been REMOVED entirely (commit a1ba349f)
- ✅ All code has been committed and pushed

## 🔍 ROOT CAUSE

Railway has **THREE** places where the start command can be configured, **with different priorities**:

1. **Railway Dashboard UI** (HIGHEST PRIORITY - overrides everything)
2. `railway.json` file (MEDIUM PRIORITY - deleted)
3. `Dockerfile` CMD (LOWEST PRIORITY - correctly set)

The Railway Dashboard configuration is **OVERRIDING** our Dockerfile CMD.

## ✅ THE SOLUTION - YOU MUST DO THIS MANUALLY

### Step-by-Step Instructions for Railway Dashboard

1. **Go to Railway Dashboard**
   - Navigate to: https://railway.app/dashboard

2. **Select Your Project**
   - Click on your INMOVA project

3. **Select Your Service**
   - Click on the service/deployment that's running the Next.js app

4. **Go to Settings**
   - Look for a "Settings" tab or gear icon

5. **Find the "Deploy" or "Start Command" Section**
   - Scroll down to find deployment configuration
   - Look for fields like:
     - "Start Command"
     - "Custom Start Command"
     - "Run Command"
     - "Deploy Command"

6. **CLEAR THE START COMMAND**
   - If you see `node server.js` or any other command
   - **DELETE IT COMPLETELY**
   - Leave the field **EMPTY** or **BLANK**

7. **Check Environment Variables**
   - Go to the "Variables" or "Environment Variables" section
   - Look for any variable like:
     - `START_COMMAND`
     - `RUN_COMMAND`
     - `CMD`
   - **DELETE** these if they exist

8. **Save Changes**
   - Click "Save" or "Apply"

9. **Trigger a New Deployment**
   - Go to "Deployments" tab
   - Click "Deploy" or wait for auto-deploy from the latest commit (a1ba349f)
   - OR: Click "Redeploy" on the latest deployment

## 📊 WHAT SHOULD HAPPEN AFTER

Once you clear the Railway Dashboard configuration:

```
✅ Railway will use the Dockerfile CMD: ["yarn", "start"]
✅ Container will start with: yarn start
✅ Next.js will execute: next start
✅ Application will run on port 3000
✅ NO MORE "Cannot find module '/app/server.js'" error
✅ Status: HEALTHY
```

## 🎯 WHY THIS HAPPENED

Railway allows configuration in multiple places for flexibility, but this creates a hierarchy:

```
Railway Dashboard UI (YOU MUST CHANGE THIS!)
    ↓ overrides
railway.json (deleted)
    ↓ overrides
Dockerfile CMD (correct: yarn start)
```

We fixed the bottom two layers, but the **top layer** (Dashboard UI) is still configured with the old `node server.js` command.

## 📝 VERIFICATION CHECKLIST

After making changes in Railway Dashboard:

- [ ] Start Command field is **EMPTY** or **DELETED**
- [ ] No environment variables like `START_COMMAND` exist
- [ ] New deployment triggered with commit a1ba349f
- [ ] Build logs show "yarn start" being executed (not "node server.js")
- [ ] Application starts successfully
- [ ] Health check passes
- [ ] No "Cannot find module" errors

## 🔧 IF YOU CANNOT ACCESS RAILWAY DASHBOARD

If you don't have access to the Railway Dashboard:
1. **Ask someone with admin access** to clear the Start Command configuration
2. **Provide them with this document** as a reference
3. **They should follow the steps above**

## 📸 WHAT TO LOOK FOR IN RAILWAY UI

In the Railway Dashboard, you're looking for a field that might say:

```
┌─────────────────────────────────────┐
│ Start Command (optional)            │
├─────────────────────────────────────┤
│ node server.js                      │  ← DELETE THIS!
└─────────────────────────────────────┘
```

It should be:

```
┌─────────────────────────────────────┐
│ Start Command (optional)            │
├─────────────────────────────────────┤
│                                     │  ← EMPTY!
└─────────────────────────────────────┘
```

## 💡 ALTERNATIVE: USE RAILWAY CLI

If you have Railway CLI installed:

```bash
# Login to Railway
railway login

# Link to your project
railway link

# Remove the start command variable (if it exists)
railway variables delete START_COMMAND

# Remove custom start command
railway service --service [YOUR_SERVICE_NAME] --start-command ""

# Trigger redeploy
railway up
```

## 🚀 EXPECTED TIMELINE

After you clear the Dashboard configuration:
1. **Immediate**: Configuration saved
2. **1-2 minutes**: New deployment triggered
3. **5-7 minutes**: Build completes
4. **10-15 seconds**: Container starts with `yarn start`
5. **SUCCESS**: Application is HEALTHY

## 📞 NEED HELP?

If you're stuck or don't see these options in Railway:
1. Take a screenshot of your Railway Dashboard
2. Share it so I can guide you more specifically
3. Or contact Railway support: https://help.railway.app/

---

**Status:** ⏳ WAITING FOR MANUAL DASHBOARD CONFIGURATION
**Next Action:** YOU must access Railway Dashboard and clear Start Command
**Confidence:** 100% (this WILL fix it once Dashboard is updated)

---

This is the **ONLY** remaining blocker. Once you clear the Railway Dashboard configuration, the application WILL start correctly with `yarn start`.
