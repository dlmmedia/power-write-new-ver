#!/usr/bin/env node

// Test outline generation directly
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('Testing Outline Generation...\n');
console.log('Environment Check:');
console.log('- AI_GATEWAY_API_KEY:', process.env.AI_GATEWAY_API_KEY ? '✓ Set' : '✗ Missing');
console.log('- AI_GATEWAY_URL:', process.env.AI_GATEWAY_URL || 'https://ai-gateway.vercel.sh/v1');
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Missing');
console.log();

// Test API call
async function testOutlineGeneration() {
  try {
    console.log('Sending request to http://localhost:3001/api/generate/outline...\n');
    
    const response = await fetch('http://localhost:3001/api/generate/outline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'demo-user-001',
        config: {
          basicInfo: {
            title: 'Test Mystery Novel',
            author: 'Test Author',
            genre: 'Mystery',
          },
          content: {
            description: 'A thrilling mystery about a detective solving a complex case.',
            numChapters: 10,
            targetWordCount: 80000,
            bookStructure: 'Linear'
          },
          writingStyle: {
            tone: 'Suspenseful',
            style: 'Descriptive',
            pov: 'Third Person',
            tense: 'Past',
            narrativeVoice: 'Professional'
          },
          plot: {
            narrativeStructure: 'Three-Act',
            pacing: 'Fast-paced'
          },
          audience: {
            targetAudience: 'Adult'
          },
          customInstructions: ''
        },
        referenceBooks: []
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✓ SUCCESS!');
      console.log('\nGenerated Outline:');
      console.log('- Title:', data.outline.title);
      console.log('- Author:', data.outline.author);
      console.log('- Genre:', data.outline.genre);
      console.log('- Chapters:', data.outline.chapters.length);
      console.log('\nFirst Chapter:');
      console.log('  -', data.outline.chapters[0].title);
      console.log('  -', data.outline.chapters[0].summary.substring(0, 100) + '...');
    } else {
      console.log('✗ FAILED');
      console.log('Status:', response.status);
      console.log('Error:', data.error);
      console.log('Details:', data.details);
    }
  } catch (error) {
    console.error('✗ REQUEST FAILED');
    console.error('Error:', error.message);
    console.error('\nMake sure:');
    console.error('1. Dev server is running (npm run dev --webpack)');
    console.error('2. Server is on port 3001');
    console.error('3. .env.local has AI_GATEWAY_API_KEY and DATABASE_URL');
  }
}

testOutlineGeneration();
