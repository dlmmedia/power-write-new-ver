# Update Production BLOB_READ_WRITE_TOKEN

## Current Situation

**Current Production Token:**
```
vercel_blob_rw_2c4ozw7pgS0D4a72_IgSjuk11269Eem5YfvlUxCji6Uzwto
```

**New Token to Set:**
```
vercel_blob_rw_SlxPDoGc9J1gs1Tf_XeKagti3GPrJ8byvCdP3xBFsdTYvac
```

## Step-by-Step Dashboard Update

### 1. Open Vercel Dashboard
Go to: https://vercel.com/team_XLS4r1tfJ0Myv7zfinX8fJmo/power-write-new-ver/settings/environment-variables

### 2. Find BLOB_READ_WRITE_TOKEN
- Look for the variable named `BLOB_READ_WRITE_TOKEN` in the Production environment section
- You should see it listed with value `[Encrypted]`

### 3. Update the Value
1. Click the **"..."** (three dots) menu next to `BLOB_READ_WRITE_TOKEN` in the Production row
2. Click **"Edit"**
3. In the "Value" field, paste: `vercel_blob_rw_SlxPDoGc9J1gs1Tf_XeKagti3GPrJ8byvCdP3xBFsdTYvac`
4. Make sure **"Production"** is selected
5. Click **"Save"**

### 4. Verify the Update
After saving, verify by:
1. The variable should still show as `[Encrypted]` (this is normal - Vercel encrypts the value)
2. You should see a timestamp showing when it was last updated

### 5. Redeploy (Optional)
If you want the new token to take effect immediately:
1. Go to **Deployments** tab
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**
4. Optionally check **"Use existing Build Cache"** for faster redeploy

**Note:** New deployments will automatically use the updated token value, so redeployment is only needed if you want it active immediately on the current deployment.

## Verification

After updating, you can verify the change worked by:
1. Waiting for the next deployment
2. Testing blob storage functionality (audio generation, cover uploads)
3. Checking logs in Vercel dashboard for any blob-related errors

## Quick Link
Direct link to environment variables:
**https://vercel.com/team_XLS4r1tfJ0Myv7zfinX8fJmo/power-write-new-ver/settings/environment-variables**



