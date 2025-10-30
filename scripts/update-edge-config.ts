#!/usr/bin/env tsx
/**
 * Script to update Vercel Edge Config with books data
 * 
 * Usage:
 * 1. Get books data from seed endpoint: curl -X POST http://localhost:3000/api/books/seed
 * 2. Copy the edgeConfigData from the response
 * 3. Run: npx tsx scripts/update-edge-config.ts <path-to-json-file>
 * 
 * Or use this script directly with the API response
 */

import * as fs from 'fs';
import * as path from 'path';

const EDGE_CONFIG_ID = 'ecfg_vrbccwwqmylae9vpbkcuvaldrmmg';

async function updateEdgeConfig(key: string, value: any, token: string) {
  const url = `https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items`;
  
  try {
    console.log('Updating Edge Config...');
    console.log('Key:', key);
    console.log('Books count:', value.books?.length || 0);
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            operation: 'upsert',
            key: key,
            value: value,
          }
        ]
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update Edge Config: ${response.status} - ${error}`);
    }

    const result = await response.json();
    console.log('✓ Edge Config updated successfully!');
    console.log('Result:', result);
    return result;
  } catch (error) {
    console.error('Error updating Edge Config:', error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  npx tsx scripts/update-edge-config.ts <json-file>');
    console.log('  npx tsx scripts/update-edge-config.ts --from-api');
    console.log('');
    console.log('Example:');
    console.log('  1. Fetch books: curl -X POST http://localhost:3000/api/books/seed > books.json');
    console.log('  2. Update Edge Config: npx tsx scripts/update-edge-config.ts books.json');
    process.exit(1);
  }

  // Get Vercel token from environment
  const vercelToken = process.env.VERCEL_TOKEN;
  if (!vercelToken) {
    console.error('Error: VERCEL_TOKEN environment variable not set');
    console.error('Get your token from: https://vercel.com/account/tokens');
    console.error('Then run: VERCEL_TOKEN=your_token npx tsx scripts/update-edge-config.ts');
    process.exit(1);
  }

  if (args[0] === '--from-api') {
    console.log('Fetching books from seed API...');
    const response = await fetch('http://localhost:3000/api/books/seed', {
      method: 'POST',
    });
    
    const data = await response.json();
    
    if (!data.edgeConfigData) {
      console.log('No new books to add');
      process.exit(0);
    }
    
    await updateEdgeConfig(
      data.edgeConfigData.key,
      data.edgeConfigData.value,
      vercelToken
    );
  } else {
    // Read from file
    const filePath = path.resolve(args[0]);
    
    if (!fs.existsSync(filePath)) {
      console.error(`Error: File not found: ${filePath}`);
      process.exit(1);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    if (!data.edgeConfigData) {
      console.error('Error: Invalid data format. Expected edgeConfigData property');
      process.exit(1);
    }

    await updateEdgeConfig(
      data.edgeConfigData.key,
      data.edgeConfigData.value,
      vercelToken
    );
  }
}

main().catch(console.error);
