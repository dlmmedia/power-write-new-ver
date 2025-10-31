// TTS Service for Audiobook Generation using OpenAI TTS
import { put } from '@vercel/blob';

export interface TTSConfig {
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  speed?: number; // 0.25 to 4.0
  model?: 'tts-1' | 'tts-1-hd';
}

export interface AudioResult {
  audioUrl: string;
  duration: number; // estimated in seconds
  size: number; // file size in bytes
}

export class TTSService {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly defaultVoice: TTSConfig['voice'] = 'alloy';
  private readonly defaultSpeed: number = 1.0;
  private readonly defaultModel: TTSConfig['model'] = 'tts-1'; // Cost-effective

  constructor() {
    // Use OpenAI API directly
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for TTS');
    }
    
    console.log('✓ TTS using OpenAI API');
    this.apiKey = process.env.OPENAI_API_KEY;
    this.apiUrl = 'https://api.openai.com/v1/audio/speech';
  }

  /**
   * Generate audiobook for full text
   * Splits long text into chunks if needed (OpenAI has 4096 char limit)
   */
  async generateAudiobook(
    text: string,
    config: TTSConfig = {},
    bookTitle?: string
  ): Promise<AudioResult> {
    try {
      if (!this.apiKey) {
        throw new Error('OPENAI_API_KEY is required for TTS');
      }

      console.log(`Generating audiobook (${text.length} characters)...`);

      const voice = config.voice || this.defaultVoice;
      const speed = config.speed || this.defaultSpeed;
      const model = config.model || this.defaultModel;

      // Split text into chunks if needed (OpenAI limit: 4096 chars)
      const chunks = this.splitTextIntoChunks(text, 4000);
      console.log(`Split into ${chunks.length} chunks`);

      const audioBuffers: Buffer[] = [];
      let totalSize = 0;

      // Generate audio for each chunk
      for (let i = 0; i < chunks.length; i++) {
        console.log(`Generating audio chunk ${i + 1}/${chunks.length}...`);
        
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            voice,
            input: chunks[i],
            speed,
            response_format: 'mp3',
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenAI TTS API error: ${response.status} ${errorText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        audioBuffers.push(buffer);
        totalSize += buffer.length;
      }

      // Combine all audio buffers
      const combinedBuffer = Buffer.concat(audioBuffers);

      // Upload to Vercel Blob
      const filename = bookTitle 
        ? `audiobooks/${this.sanitizeFilename(bookTitle)}-full.mp3`
        : `audiobooks/book-${Date.now()}.mp3`;
      
      // Upload to Vercel Blob
      // @vercel/blob automatically detects BLOB_READ_WRITE_TOKEN from environment
      // In Vercel deployments, the token is automatically available
      if (!process.env.BLOB_READ_WRITE_TOKEN && process.env.NODE_ENV === 'production') {
        console.warn('⚠️ BLOB_READ_WRITE_TOKEN not found in production. Blob operations may fail.');
      }
      
      const blob = await put(filename, combinedBuffer, {
        access: 'public',
        contentType: 'audio/mpeg',
      });

      // Estimate duration (rough: 150 words per minute, 5 chars per word)
      const estimatedDuration = Math.ceil((text.length / 5) / 150 * 60);

      console.log(`Audiobook generated: ${blob.url}`);
      
      return {
        audioUrl: blob.url,
        duration: estimatedDuration,
        size: totalSize,
      };
    } catch (error) {
      console.error('Error generating audiobook:', error);
      throw new Error(`Failed to generate audiobook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate audio for a single chapter
   */
  async generateChapterAudio(
    chapterText: string,
    chapterNumber: number,
    bookTitle: string,
    config: TTSConfig = {}
  ): Promise<AudioResult> {
    try {
      if (!this.apiKey) {
        throw new Error('OPENAI_API_KEY is required for TTS');
      }

      console.log(`Generating audio for chapter ${chapterNumber}...`);

      const voice = config.voice || this.defaultVoice;
      const speed = config.speed || this.defaultSpeed;
      const model = config.model || this.defaultModel;

      // Split if needed
      const chunks = this.splitTextIntoChunks(chapterText, 4000);
      const audioBuffers: Buffer[] = [];
      let totalSize = 0;

      for (const chunk of chunks) {
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            voice,
            input: chunk,
            speed,
            response_format: 'mp3',
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenAI TTS API error: ${response.status} ${errorText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        audioBuffers.push(buffer);
        totalSize += buffer.length;
      }

      const combinedBuffer = Buffer.concat(audioBuffers);

      // Upload to Vercel Blob
      // @vercel/blob automatically detects BLOB_READ_WRITE_TOKEN from environment
      // In Vercel deployments, the token is automatically available
      const filename = `audiobooks/${this.sanitizeFilename(bookTitle)}/chapter-${chapterNumber}.mp3`;
      if (!process.env.BLOB_READ_WRITE_TOKEN && process.env.NODE_ENV === 'production') {
        console.warn('⚠️ BLOB_READ_WRITE_TOKEN not found in production. Blob operations may fail.');
      }
      
      const blob = await put(filename, combinedBuffer, {
        access: 'public',
        contentType: 'audio/mpeg',
      });

      const estimatedDuration = Math.ceil((chapterText.length / 5) / 150 * 60);

      console.log(`Chapter ${chapterNumber} audio generated: ${blob.url}`);
      
      return {
        audioUrl: blob.url,
        duration: estimatedDuration,
        size: totalSize,
      };
    } catch (error) {
      console.error(`Error generating chapter ${chapterNumber} audio:`, error);
      throw new Error(`Failed to generate chapter audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate audio for multiple chapters in parallel (with rate limiting)
   */
  async generateMultipleChapters(
    chapters: Array<{ number: number; text: string; title: string }>,
    bookTitle: string,
    config: TTSConfig = {},
    onProgress?: (current: number, total: number) => void
  ): Promise<Array<{ chapterNumber: number; audioUrl: string; duration: number }>> {
    const results = [];
    
    // Process chapters sequentially to avoid rate limiting
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      console.log(`Processing chapter ${chapter.number} (${i + 1}/${chapters.length})`);
      
      const audio = await this.generateChapterAudio(
        chapter.text,
        chapter.number,
        bookTitle,
        config
      );
      
      results.push({
        chapterNumber: chapter.number,
        audioUrl: audio.audioUrl,
        duration: audio.duration,
      });

      if (onProgress) {
        onProgress(i + 1, chapters.length);
      }

      // Add small delay to respect rate limits
      if (i < chapters.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Split text into chunks respecting sentence boundaries
   */
  private splitTextIntoChunks(text: string, maxChars: number): string[] {
    if (text.length <= maxChars) {
      return [text];
    }

    const chunks: string[] = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length <= maxChars) {
        currentChunk += sentence;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Sanitize filename for safe storage
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }
}

export const ttsService = new TTSService();
