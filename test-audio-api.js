#!/usr/bin/env node
/**
 * Test script for audio generation API
 * 
 * Usage:
 *   node test-audio-api.js [bookId] [userId]
 * 
 * Example:
 *   node test-audio-api.js 1 demo-user-123
 */

const bookId = process.argv[2] || '1';
const userId = process.argv[3] || 'demo-user-123';

const testAudioAPI = async () => {
  console.log('='.repeat(60));
  console.log('Audio API Test');
  console.log('='.repeat(60));
  console.log(`Book ID: ${bookId}`);
  console.log(`User ID: ${userId}`);
  console.log('');

  try {
    // First, fetch book details
    console.log('Step 1: Fetching book details...');
    const bookResponse = await fetch(`http://localhost:3000/api/books/${bookId}`);
    
    if (!bookResponse.ok) {
      console.error(`❌ Failed to fetch book: ${bookResponse.status}`);
      const error = await bookResponse.text();
      console.error('Error:', error);
      return;
    }

    const bookData = await bookResponse.json();
    console.log(`✓ Book found: "${bookData.book.title}"`);
    console.log(`  Chapters: ${bookData.book.chapters?.length || 0}`);
    
    if (!bookData.book.chapters || bookData.book.chapters.length === 0) {
      console.error('❌ Book has no chapters. Cannot generate audio.');
      return;
    }

    // Select first chapter for test
    const firstChapterNumber = bookData.book.chapters[0].chapterNumber;
    console.log(`  Testing with chapter ${firstChapterNumber}`);
    console.log('');

    // Test audio generation
    console.log('Step 2: Generating audio for first chapter...');
    const requestBody = {
      userId,
      bookId: bookId.toString(),
      chapterNumbers: [firstChapterNumber],
      voice: 'alloy',
      speed: 1.0,
      model: 'tts-1',
    };

    console.log('Request:', JSON.stringify(requestBody, null, 2));
    console.log('');

    const audioResponse = await fetch('http://localhost:3000/api/generate/audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    console.log(`Response status: ${audioResponse.status}`);
    
    const audioData = await audioResponse.json();
    console.log('Response data:', JSON.stringify(audioData, null, 2));
    console.log('');

    if (!audioResponse.ok) {
      console.error('❌ Audio generation failed');
      console.error('Error:', audioData.error);
      console.error('Details:', audioData.details);
      if (audioData.hint) {
        console.error('Hint:', audioData.hint);
      }
      return;
    }

    if (audioData.success) {
      console.log('✓ Audio generation succeeded!');
      if (audioData.type === 'chapters') {
        console.log(`  Generated ${audioData.chapters.length} chapter(s)`);
        audioData.chapters.forEach(ch => {
          console.log(`  - Chapter ${ch.chapterNumber}: ${ch.audioUrl}`);
        });
      } else if (audioData.type === 'full') {
        console.log(`  Full audiobook: ${audioData.audioUrl}`);
      }
    } else {
      console.error('❌ API returned success: false');
      console.error('Error:', audioData.error || audioData.details);
    }

  } catch (error) {
    console.error('❌ Test failed with exception:');
    console.error(error.message);
    console.error(error.stack);
  }

  console.log('');
  console.log('='.repeat(60));
};

testAudioAPI();
