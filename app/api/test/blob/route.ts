import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const envCheck = {
      BLOB_READ_WRITE_TOKEN: !!process.env.BLOB_READ_WRITE_TOKEN,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      NODE_ENV: process.env.NODE_ENV,
    };

    // Try to upload a test file
    let blobTest: {
      success: boolean;
      url?: string;
      error?: string;
    } = { success: false };

    try {
      const testContent = Buffer.from('This is a test file to verify blob storage is working.');
      const blob = await put(`test/blob-test-${Date.now()}.txt`, testContent, {
        access: 'public',
        contentType: 'text/plain',
      });

      blobTest = {
        success: true,
        url: blob.url,
      };
    } catch (error) {
      blobTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    return NextResponse.json({
      success: true,
      environment: envCheck,
      blobTest,
      message: 'Blob storage test completed',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        environment: {
          BLOB_READ_WRITE_TOKEN: !!process.env.BLOB_READ_WRITE_TOKEN,
          OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
          NODE_ENV: process.env.NODE_ENV,
        },
      },
      { status: 500 }
    );
  }
}

