#!/usr/bin/env tsx
/**
 * Script to update BLOB_READ_WRITE_TOKEN in production environment only
 */

const PROJECT_ID = 'prj_XnFwnQbE0vgXEWaKQ2OdcvIdvSAE';
const TEAM_ID = 'team_XLS4r1tfJ0Myv7zfinX8fJmo';
const BLOB_TOKEN = 'vercel_blob_rw_SlxPDoGc9J1gs1Tf_XeKagti3GPrJ8byvCdP3xBFsdTYvac';

async function updateProductionEnvVar() {
  // Try to get token from environment or from Vercel CLI config
  let vercelToken = process.env.VERCEL_TOKEN;
  
  if (!vercelToken) {
    // Try to read from Vercel config
    try {
      const { readFileSync } = await import('fs');
      const { join } = await import('path');
      const { homedir } = await import('os');
      const authPath = join(homedir(), '.vercel', 'auth.json');
      const authData = JSON.parse(readFileSync(authPath, 'utf-8'));
      vercelToken = Object.values(authData as Record<string, any>)[0]?.token;
    } catch (e) {
      // Ignore errors
    }
  }

  if (!vercelToken) {
    console.error('❌ Error: VERCEL_TOKEN not found');
    console.log('Please set VERCEL_TOKEN environment variable or ensure Vercel CLI is authenticated');
    console.log('Get token from: https://vercel.com/account/tokens');
    process.exit(1);
  }

  const url = `https://api.vercel.com/v9/projects/${PROJECT_ID}/env?upsert=true&teamId=${TEAM_ID}`;

  try {
    console.log('Updating BLOB_READ_WRITE_TOKEN in production...');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vercelToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: 'BLOB_READ_WRITE_TOKEN',
        value: BLOB_TOKEN,
        type: 'secret',
        target: ['production'],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Failed:`, error);
      const errorJson = await response.json().catch(() => null);
      if (errorJson) {
        console.error('Error details:', JSON.stringify(errorJson, null, 2));
      }
      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ Successfully updated BLOB_READ_WRITE_TOKEN in production');
    if (result.created) {
      console.log(`   Created: ${result.created.length} environment variable(s)`);
    }
    if (result.updated) {
      console.log(`   Updated: ${result.updated.length} environment variable(s)`);
    }
  } catch (error) {
    console.error(`❌ Error:`, error);
    process.exit(1);
  }
}

updateProductionEnvVar().catch(console.error);

