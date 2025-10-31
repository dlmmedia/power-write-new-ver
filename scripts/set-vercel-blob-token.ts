#!/usr/bin/env tsx
/**
 * Script to set BLOB_READ_WRITE_TOKEN in Vercel project
 * 
 * Usage:
 *   VERCEL_TOKEN=your_vercel_token tsx scripts/set-vercel-blob-token.ts
 * 
 * Or set VERCEL_TOKEN in your environment first:
 *   export VERCEL_TOKEN=your_vercel_token
 *   tsx scripts/set-vercel-blob-token.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const PROJECT_ID = 'prj_XnFwnQbE0vgXEWaKQ2OdcvIdvSAE';
const TEAM_ID = 'team_XLS4r1tfJ0Myv7zfinX8fJmo';
const BLOB_TOKEN = 'vercel_blob_rw_SlxPDoGc9J1gs1Tf_XeKagti3GPrJ8byvCdP3xBFsdTYvac';

async function setVercelEnvVar() {
  const vercelToken = process.env.VERCEL_TOKEN;
  
  if (!vercelToken) {
    console.error('❌ Error: VERCEL_TOKEN environment variable is required');
    console.log('\nTo get your Vercel token:');
    console.log('1. Go to https://vercel.com/account/tokens');
    console.log('2. Create a new token');
    console.log('3. Run: export VERCEL_TOKEN=your_token');
    console.log('4. Then run this script again\n');
    process.exit(1);
  }

  const url = `https://api.vercel.com/v9/projects/${PROJECT_ID}/env?upsert=true&teamId=${TEAM_ID}`;
  
  // Set for all environments: production, preview, development
  const targets = ['production', 'preview', 'development'];

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vercelToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: 'BLOB_READ_WRITE_TOKEN',
        value: BLOB_TOKEN,
        type: 'secret', // Encrypted secret
        target: targets,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Failed to set environment variable:`, error);
      const errorJson = await response.json().catch(() => null);
      if (errorJson) {
        console.error('Error details:', JSON.stringify(errorJson, null, 2));
      }
    } else {
      const result = await response.json();
      console.log(`✅ Successfully set BLOB_READ_WRITE_TOKEN for: ${targets.join(', ')}`);
      if (result.created) {
        console.log(`   Created: ${result.created}`);
      }
      if (result.updated) {
        console.log(`   Updated: ${result.updated}`);
      }
    }
  } catch (error) {
    console.error(`❌ Error setting environment variable:`, error);
  }

  console.log('\n✅ Environment variable configuration complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Go to Vercel dashboard and verify the variable is set:');
  console.log(`   https://vercel.com/${TEAM_ID}/power-write-new-ver/settings/environment-variables`);
  console.log('2. Check for and remove any redundant blob variables:');
  console.log('   - VERCEL_BLOB_READ_WRITE_TOKEN (if exists)');
  console.log('   - Any other blob-related tokens');
  console.log('3. Redeploy your project to apply the new variable');
}

setVercelEnvVar().catch(console.error);

