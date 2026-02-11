import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { saveOutline, getUserOutlines, deleteOutline } from '@/lib/db/operations';

export const runtime = 'nodejs';

// GET /api/outlines - List saved outlines for the current user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const outlines = await getUserOutlines(userId);
    return NextResponse.json({ success: true, outlines });
  } catch (error) {
    console.error('Error fetching outlines:', error);
    return NextResponse.json({ error: 'Failed to fetch outlines' }, { status: 500 });
  }
}

// POST /api/outlines - Save a new outline
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, outline, config } = body;

    if (!title || !outline) {
      return NextResponse.json({ error: 'Missing required fields: title, outline' }, { status: 400 });
    }

    const saved = await saveOutline({
      userId,
      title,
      outline,
      config: config || null,
    });

    return NextResponse.json({ success: true, outline: saved });
  } catch (error) {
    console.error('Error saving outline:', error);
    return NextResponse.json({ error: 'Failed to save outline' }, { status: 500 });
  }
}

// DELETE /api/outlines - Delete an outline by ID
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing outline id' }, { status: 400 });
    }

    await deleteOutline(parseInt(id, 10));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting outline:', error);
    return NextResponse.json({ error: 'Failed to delete outline' }, { status: 500 });
  }
}
