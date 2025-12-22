// TTS Service for Audiobook Generation using OpenAI TTS and Gemini TTS
import { put } from '@vercel/blob';
import { sanitizeForExport } from '@/lib/utils/text-sanitizer';

// TTS Provider types
export type TTSProvider = 'openai' | 'gemini';

// OpenAI TTS supports 11 voices (as of 2024)
export type OpenAIVoiceId = 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'fable' | 'nova' | 'onyx' | 'sage' | 'shimmer' | 'verse';

// Gemini TTS supports 30 voices
export type GeminiVoiceId = 
  | 'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Leda' | 'Orus' | 'Aoede'
  | 'Callirrhoe' | 'Autonoe' | 'Enceladus' | 'Iapetus' | 'Umbriel' | 'Algieba'
  | 'Despina' | 'Erinome' | 'Algenib' | 'Rasalgethi' | 'Laomedeia' | 'Achernar'
  | 'Alnilam' | 'Schedar' | 'Gacrux' | 'Pulcherrima' | 'Achird' | 'Zubenelgenubi'
  | 'Vindemiatrix' | 'Sadachbia' | 'Sadaltager' | 'Sulafat';

// Combined voice type for backwards compatibility
export type VoiceId = OpenAIVoiceId | GeminiVoiceId;

export interface TTSConfig {
  provider?: TTSProvider;
  voice?: VoiceId;
  speed?: number; // 0.25 to 4.0 for OpenAI, Gemini uses natural language prompts
  model?: 'tts-1' | 'tts-1-hd'; // OpenAI models
  geminiModel?: 'gemini-2.5-pro-preview-tts' | 'gemini-2.5-flash-preview-tts'; // Gemini models
}

export interface AudioResult {
  audioUrl: string;
  duration: number; // estimated in seconds
  size: number; // file size in bytes
}

// Gemini API URL
const GEMINI_TTS_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export class TTSService {
  private openaiApiKey: string | null = null;
  private geminiApiKey: string | null = null;
  private readonly openaiApiUrl: string = 'https://api.openai.com/v1/audio/speech';
  private readonly defaultVoice: TTSConfig['voice'] = 'alloy';
  private readonly defaultGeminiVoice: GeminiVoiceId = 'Kore';
  private readonly defaultSpeed: number = 1.0;
  private readonly defaultModel: TTSConfig['model'] = 'tts-1'; // Cost-effective
  private readonly defaultGeminiModel: NonNullable<TTSConfig['geminiModel']> = 'gemini-2.5-flash-preview-tts';
  private openaiInitialized: boolean = false;
  private geminiInitialized: boolean = false;

  constructor() {
    // Don't throw in constructor to avoid build-time errors
    // Initialization will happen lazily when service is actually used
  }
  
  /**
   * Initialize OpenAI service - called lazily when needed
   */
  private ensureOpenAIInitialized(): void {
    if (this.openaiInitialized) return;
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for OpenAI TTS');
    }
    
    // Validate BLOB token is available (but don't throw - will check at upload time)
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.warn('⚠️ BLOB_READ_WRITE_TOKEN is not configured. Audio generation will fail until configured.');
    } else {
      console.log('✓ Blob storage configured');
    }
    
    console.log('✓ TTS using OpenAI API');
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.openaiInitialized = true;
  }

  /**
   * Initialize Gemini service - called lazily when needed
   */
  private ensureGeminiInitialized(): void {
    if (this.geminiInitialized) return;
    
    const apiKey = process.env.GEMINI_API_KEY;
    console.log(`[Gemini TTS] Checking API key: ${apiKey ? `found (${apiKey.substring(0, 10)}...)` : 'NOT FOUND'}`);
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required for Gemini TTS');
    }
    
    // Validate BLOB token is available (but don't throw - will check at upload time)
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.warn('⚠️ BLOB_READ_WRITE_TOKEN is not configured. Audio generation will fail until configured.');
    } else {
      console.log('✓ Blob storage configured');
    }
    
    console.log('✓ TTS using Gemini API');
    this.geminiApiKey = apiKey;
    this.geminiInitialized = true;
  }
  
  /**
   * Initialize the appropriate service based on provider
   */
  private ensureInitialized(provider: TTSProvider = 'openai'): void {
    if (provider === 'gemini') {
      this.ensureGeminiInitialized();
    } else {
      this.ensureOpenAIInitialized();
    }
  }
  
  /**
   * Get the OpenAI API key (ensures initialization)
   */
  private getOpenAIApiKey(): string {
    this.ensureOpenAIInitialized();
    return this.openaiApiKey!;
  }

  /**
   * Get the Gemini API key (ensures initialization)
   */
  private getGeminiApiKey(): string {
    this.ensureGeminiInitialized();
    return this.geminiApiKey!;
  }

  /**
   * Generate audiobook for full text
   * Supports both OpenAI and Gemini providers
   */
  async generateAudiobook(
    text: string,
    config: TTSConfig = {},
    bookTitle?: string
  ): Promise<AudioResult> {
    const provider = config.provider || 'openai';
    
    if (provider === 'gemini') {
      return this.generateGeminiAudiobook(text, config, bookTitle);
    }
    
    return this.generateOpenAIAudiobook(text, config, bookTitle);
  }

  /**
   * Generate audiobook using OpenAI TTS
   */
  private async generateOpenAIAudiobook(
    text: string,
    config: TTSConfig = {},
    bookTitle?: string
  ): Promise<AudioResult> {
    try {
      const apiKey = this.getOpenAIApiKey();

      const cleanedText = sanitizeForExport(text);
      console.log(`[OpenAI TTS] Generating audiobook (${cleanedText.length} characters)...`);

      const voice = config.voice || this.defaultVoice;
      const speed = config.speed || this.defaultSpeed;
      const model = config.model || this.defaultModel;

      // Split text into chunks if needed (OpenAI limit: 4096 chars)
      const chunks = this.splitTextIntoChunks(cleanedText, 4000);
      console.log(`[OpenAI TTS] Split into ${chunks.length} chunks`);

      const audioBuffers: Buffer[] = [];
      let totalSize = 0;

      for (let i = 0; i < chunks.length; i++) {
        console.log(`[OpenAI TTS] Generating audio chunk ${i + 1}/${chunks.length}...`);
        
        const response = await fetch(this.openaiApiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
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

      const combinedBuffer = Buffer.concat(audioBuffers);
      const timestamp = Date.now();
      const filename = bookTitle 
        ? `audiobooks/${this.sanitizeFilename(bookTitle)}-full-${timestamp}.mp3`
        : `audiobooks/book-${timestamp}.mp3`;
      
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        throw new Error('BLOB_READ_WRITE_TOKEN is not configured. Cannot upload audio file.');
      }
      
      console.log(`[OpenAI TTS] Uploading to Vercel Blob: ${filename}`);
      const blob = await put(filename, combinedBuffer, {
        access: 'public',
        contentType: 'audio/mpeg',
        token: process.env.BLOB_READ_WRITE_TOKEN,
        addRandomSuffix: false,
        allowOverwrite: false,
      });

      const estimatedDuration = Math.ceil((cleanedText.length / 5) / 150 * 60);
      console.log(`[OpenAI TTS] Audiobook generated: ${blob.url}`);
      
      return {
        audioUrl: blob.url,
        duration: estimatedDuration,
        size: totalSize,
      };
    } catch (error) {
      console.error('[OpenAI TTS] Error generating audiobook:', error);
      throw new Error(`Failed to generate audiobook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate audiobook using Gemini TTS
   */
  private async generateGeminiAudiobook(
    text: string,
    config: TTSConfig = {},
    bookTitle?: string
  ): Promise<AudioResult> {
    try {
      const apiKey = this.getGeminiApiKey();

      const cleanedText = sanitizeForExport(text);
      console.log(`[Gemini TTS] Generating audiobook (${cleanedText.length} characters)...`);

      const voice = (config.voice as GeminiVoiceId) || this.defaultGeminiVoice;
      const geminiModel: string = config.geminiModel || this.defaultGeminiModel;

      // Split text into chunks (Gemini TTS can timeout on long text, use smaller chunks)
      const chunks = this.splitTextIntoChunks(cleanedText, 1500);
      console.log(`[Gemini TTS] Split into ${chunks.length} chunks`);

      // Collect raw PCM buffers (not WAV) to concatenate properly
      const pcmBuffers: Buffer[] = [];
      let totalPcmSize = 0;

      for (let i = 0; i < chunks.length; i++) {
        console.log(`[Gemini TTS] Generating audio chunk ${i + 1}/${chunks.length}...`);
        
        // Get raw PCM data (not WAV) for proper concatenation
        const pcmBuffer = await this.generateGeminiAudioChunkRaw(chunks[i], voice, geminiModel, apiKey);
        pcmBuffers.push(pcmBuffer);
        totalPcmSize += pcmBuffer.length;
      }

      // Combine all PCM data and create a single WAV file
      const combinedPcm = Buffer.concat(pcmBuffers);
      const combinedBuffer = this.pcmToWav(combinedPcm, 24000, 1, 16);
      
      const timestamp = Date.now();
      const filename = bookTitle 
        ? `audiobooks/${this.sanitizeFilename(bookTitle)}-gemini-full-${timestamp}.wav`
        : `audiobooks/book-gemini-${timestamp}.wav`;
      
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        throw new Error('BLOB_READ_WRITE_TOKEN is not configured. Cannot upload audio file.');
      }
      
      console.log(`[Gemini TTS] Uploading to Vercel Blob: ${filename}`);
      const blob = await put(filename, combinedBuffer, {
        access: 'public',
        contentType: 'audio/wav',
        token: process.env.BLOB_READ_WRITE_TOKEN,
        addRandomSuffix: false,
        allowOverwrite: false,
      });

      const estimatedDuration = Math.ceil((cleanedText.length / 5) / 150 * 60);
      console.log(`[Gemini TTS] Audiobook generated: ${blob.url}`);
      
      return {
        audioUrl: blob.url,
        duration: estimatedDuration,
        size: combinedBuffer.length,
      };
    } catch (error) {
      console.error('[Gemini TTS] Error generating audiobook:', error);
      throw new Error(`Failed to generate Gemini audiobook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a single audio chunk using Gemini TTS API (returns raw PCM data)
   * Use this when concatenating multiple chunks
   */
  private async generateGeminiAudioChunkRaw(
    text: string,
    voice: GeminiVoiceId,
    model: string,
    apiKey: string
  ): Promise<Buffer> {
    const url = `${GEMINI_TTS_API_URL}/${model}:generateContent?key=${apiKey}`;
    
    console.log(`[Gemini TTS] Calling API with voice: ${voice}, model: ${model}, text length: ${text.length}`);
    
    const requestBody = {
      contents: [{
        parts: [{ text }]
      }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice
            }
          }
        }
      }
    };

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini TTS API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      
      // Extract audio data from response
      const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!audioData) {
        throw new Error('No audio data in Gemini response');
      }

      // Return raw PCM data (don't convert to WAV yet - caller will combine and convert)
      return Buffer.from(audioData, 'base64');
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('[Gemini TTS] Chunk generation error:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Gemini TTS request timed out after 5 minutes');
      }
      throw error;
    }
  }

  /**
   * Generate a single audio chunk using Gemini TTS API (returns WAV)
   * Use this for single-chunk operations (like voice preview)
   */
  private async generateGeminiAudioChunk(
    text: string,
    voice: GeminiVoiceId,
    model: string,
    apiKey: string
  ): Promise<Buffer> {
    const pcmBuffer = await this.generateGeminiAudioChunkRaw(text, voice, model, apiKey);
    // Convert PCM to WAV (Gemini returns PCM 16bit 24kHz mono)
    return this.pcmToWav(pcmBuffer, 24000, 1, 16);
  }

  /**
   * Convert raw PCM data to WAV format
   */
  private pcmToWav(pcmBuffer: Buffer, sampleRate: number, channels: number, bitsPerSample: number): Buffer {
    const byteRate = sampleRate * channels * (bitsPerSample / 8);
    const blockAlign = channels * (bitsPerSample / 8);
    const dataSize = pcmBuffer.length;
    const headerSize = 44;
    const fileSize = headerSize + dataSize - 8;

    const wavBuffer = Buffer.alloc(headerSize + dataSize);
    
    // RIFF header
    wavBuffer.write('RIFF', 0);
    wavBuffer.writeUInt32LE(fileSize, 4);
    wavBuffer.write('WAVE', 8);
    
    // fmt chunk
    wavBuffer.write('fmt ', 12);
    wavBuffer.writeUInt32LE(16, 16); // fmt chunk size
    wavBuffer.writeUInt16LE(1, 20); // audio format (PCM)
    wavBuffer.writeUInt16LE(channels, 22);
    wavBuffer.writeUInt32LE(sampleRate, 24);
    wavBuffer.writeUInt32LE(byteRate, 28);
    wavBuffer.writeUInt16LE(blockAlign, 32);
    wavBuffer.writeUInt16LE(bitsPerSample, 34);
    
    // data chunk
    wavBuffer.write('data', 36);
    wavBuffer.writeUInt32LE(dataSize, 40);
    pcmBuffer.copy(wavBuffer, 44);
    
    return wavBuffer;
  }

  /**
   * Generate audio for a single chapter
   * Supports both OpenAI and Gemini providers
   */
  async generateChapterAudio(
    chapterText: string,
    chapterNumber: number,
    bookTitle: string,
    config: TTSConfig = {}
  ): Promise<AudioResult> {
    const provider = config.provider || 'openai';
    
    if (provider === 'gemini') {
      return this.generateGeminiChapterAudio(chapterText, chapterNumber, bookTitle, config);
    }
    
    return this.generateOpenAIChapterAudio(chapterText, chapterNumber, bookTitle, config);
  }

  /**
   * Generate chapter audio using OpenAI TTS
   */
  private async generateOpenAIChapterAudio(
    chapterText: string,
    chapterNumber: number,
    bookTitle: string,
    config: TTSConfig = {}
  ): Promise<AudioResult> {
    try {
      const apiKey = this.getOpenAIApiKey();

      const cleanedText = sanitizeForExport(chapterText);
      console.log(`[OpenAI TTS] Generating audio for chapter ${chapterNumber} (${cleanedText.length} chars)...`);

      const voice = config.voice || this.defaultVoice;
      const speed = config.speed || this.defaultSpeed;
      const model = config.model || this.defaultModel;

      const chunks = this.splitTextIntoChunks(cleanedText, 4000);
      const audioBuffers: Buffer[] = [];
      let totalSize = 0;

      for (const chunk of chunks) {
        const response = await fetch(this.openaiApiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
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
      const timestamp = Date.now();
      const filename = `audiobooks/${this.sanitizeFilename(bookTitle)}/chapter-${chapterNumber}-${timestamp}.mp3`;
      
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        throw new Error('BLOB_READ_WRITE_TOKEN is not configured. Cannot upload audio file.');
      }
      
      console.log(`[OpenAI TTS] Uploading chapter ${chapterNumber} to Vercel Blob: ${filename}`);
      const blob = await put(filename, combinedBuffer, {
        access: 'public',
        contentType: 'audio/mpeg',
        token: process.env.BLOB_READ_WRITE_TOKEN,
        addRandomSuffix: false,
        allowOverwrite: false,
      });

      const estimatedDuration = Math.ceil((cleanedText.length / 5) / 150 * 60);
      console.log(`[OpenAI TTS] Chapter ${chapterNumber} audio generated: ${blob.url}`);
      
      return {
        audioUrl: blob.url,
        duration: estimatedDuration,
        size: totalSize,
      };
    } catch (error) {
      console.error(`[OpenAI TTS] Error generating chapter ${chapterNumber} audio:`, error);
      throw new Error(`Failed to generate chapter audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate chapter audio using Gemini TTS
   */
  private async generateGeminiChapterAudio(
    chapterText: string,
    chapterNumber: number,
    bookTitle: string,
    config: TTSConfig = {}
  ): Promise<AudioResult> {
    try {
      const apiKey = this.getGeminiApiKey();

      const cleanedText = sanitizeForExport(chapterText);
      console.log(`[Gemini TTS] Generating audio for chapter ${chapterNumber} (${cleanedText.length} chars)...`);

      const voice = (config.voice as GeminiVoiceId) || this.defaultGeminiVoice;
      const geminiModel = config.geminiModel || this.defaultGeminiModel;

      // Use smaller chunks for Gemini to avoid timeouts
      const chunks = this.splitTextIntoChunks(cleanedText, 1500);
      
      // Collect raw PCM buffers (not WAV) to concatenate properly
      const pcmBuffers: Buffer[] = [];
      let totalPcmSize = 0;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`[Gemini TTS] Processing chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`);
        // Get raw PCM data (not WAV) for proper concatenation
        const pcmBuffer = await this.generateGeminiAudioChunkRaw(chunk, voice, geminiModel, apiKey);
        pcmBuffers.push(pcmBuffer);
        totalPcmSize += pcmBuffer.length;
      }

      // Combine all PCM data and create a single WAV file
      const combinedPcm = Buffer.concat(pcmBuffers);
      const combinedBuffer = this.pcmToWav(combinedPcm, 24000, 1, 16);
      
      const timestamp = Date.now();
      const filename = `audiobooks/${this.sanitizeFilename(bookTitle)}/chapter-${chapterNumber}-gemini-${timestamp}.wav`;
      
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        throw new Error('BLOB_READ_WRITE_TOKEN is not configured. Cannot upload audio file.');
      }
      
      console.log(`[Gemini TTS] Uploading chapter ${chapterNumber} to Vercel Blob: ${filename}`);
      const blob = await put(filename, combinedBuffer, {
        access: 'public',
        contentType: 'audio/wav',
        token: process.env.BLOB_READ_WRITE_TOKEN,
        addRandomSuffix: false,
        allowOverwrite: false,
      });

      const estimatedDuration = Math.ceil((cleanedText.length / 5) / 150 * 60);
      console.log(`[Gemini TTS] Chapter ${chapterNumber} audio generated: ${blob.url}`);
      
      return {
        audioUrl: blob.url,
        duration: estimatedDuration,
        size: combinedBuffer.length,
      };
    } catch (error) {
      console.error(`[Gemini TTS] Error generating chapter ${chapterNumber} audio:`, error);
      throw new Error(`Failed to generate Gemini chapter audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    
    console.log(`[TTS Service] Starting generation of ${chapters.length} chapters`);
    
    // Process chapters sequentially to avoid rate limiting
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      console.log(`[TTS Service] Processing chapter ${chapter.number} (${i + 1}/${chapters.length})`);
      
      const startTime = Date.now();
      const audio = await this.generateChapterAudio(
        chapter.text,
        chapter.number,
        bookTitle,
        config
      );
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      
      console.log(`[TTS Service] Chapter ${chapter.number} completed in ${elapsed}s`);
      
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
        console.log(`[TTS Service] Waiting 1s before next chapter...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`[TTS Service] All ${chapters.length} chapters completed successfully`);
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
