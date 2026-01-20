# Railway MCP Server Setup Guide

## Problem
You're seeing errors like:
```
[error] No server info found
[info] Server not yet created, returning empty offerings
```

This means the Railway MCP server in Cursor needs to be configured with your Railway API credentials.

## Solution

✅ **Configuration structure has been added to your Cursor settings!**

You just need to add your Railway API token. Follow these steps:

### Step 1: Get Your Railway API Token

1. Go to [Railway Dashboard](https://railway.app)
2. Click on your profile (top right)
3. Go to **Account Settings** → **API**
4. Click **New Token**
5. Give it a name (e.g., "Cursor MCP")
6. Copy the token (starts with `rw_`)

### Step 2: Add Your Railway API Token

The Railway MCP server configuration has already been added to your Cursor settings file. You just need to replace the placeholder with your actual token:

1. Open Cursor Settings JSON:
   - Press `Cmd/Ctrl + Shift + P` (or `Cmd + Shift + P` on macOS)
   - Type "Preferences: Open User Settings (JSON)"
   - Press Enter

2. Find the `mcpServers.railway.env.RAILWAY_API_TOKEN` field

3. Replace `YOUR_RAILWAY_API_TOKEN_HERE` with your actual Railway API token from Step 1

The configuration should look like this:
```json
{
  "mcpServers": {
    "railway": {
      "command": "npx",
      "args": ["-y", "@railway/cli@latest", "mcp"],
      "env": {
        "RAILWAY_API_TOKEN": "rw_your_actual_token_here"
      }
    }
  }
}
```

**Note**: The settings file is located at:
- **macOS**: `~/Library/Application Support/Cursor/User/settings.json`

### Step 3: Restart Cursor

After configuring, restart Cursor completely:
1. Quit Cursor (`Cmd/Ctrl + Q`)
2. Reopen Cursor
3. The Railway MCP server should now be initialized

### Step 4: Verify Configuration

1. Open the MCP panel in Cursor (if available)
2. Check that the Railway server shows as "connected" or "ready"
3. The errors should no longer appear

## Alternative: Environment Variable Method

If the above doesn't work, you can also set the Railway API token as an environment variable:

### macOS/Linux:
```bash
export RAILWAY_API_TOKEN=rw_your_token_here
```

### Windows (PowerShell):
```powershell
$env:RAILWAY_API_TOKEN="rw_your_token_here"
```

Then restart Cursor from that terminal.

## Troubleshooting

### Still seeing "No server info found"?

1. **Check token format**: Railway tokens start with `rw_`
2. **Verify token is valid**: Test it with:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" https://api.railway.app/v1/user
   ```
3. **Check Cursor logs**: Look for more detailed error messages
4. **Reinstall Railway CLI**: 
   ```bash
   npm install -g @railway/cli
   ```

### MCP Server Not Appearing?

1. Make sure you're using a recent version of Cursor that supports MCP
2. Check Cursor's MCP documentation for the latest setup instructions
3. Try removing and re-adding the MCP server configuration

## Security Note

⚠️ **Important**: Never commit your Railway API token to version control. Keep it in Cursor's settings only, which are stored locally on your machine.

## Additional Resources

- [Railway API Documentation](https://docs.railway.app/reference/api)
- [Cursor MCP Documentation](https://docs.cursor.com/mcp)
- [Railway CLI Documentation](https://docs.railway.app/cli)
