import { NextResponse } from 'next/server';
import { BOOK_LAYOUTS, getLayoutOptions, getLayoutsByCategory } from '@/lib/types/book-layouts';

/**
 * GET /api/layouts
 * Returns all available book layout templates
 */
export async function GET() {
  try {
    // Get all layout options for UI
    const layouts = getLayoutOptions();
    
    // Group layouts by category
    const byCategory = {
      fiction: getLayoutsByCategory('fiction').map(l => ({
        id: l.id,
        name: l.name,
        description: l.description,
        columns: l.columns.count,
        features: l.features,
      })),
      'non-fiction': getLayoutsByCategory('non-fiction').map(l => ({
        id: l.id,
        name: l.name,
        description: l.description,
        columns: l.columns.count,
        features: l.features,
      })),
      academic: getLayoutsByCategory('academic').map(l => ({
        id: l.id,
        name: l.name,
        description: l.description,
        columns: l.columns.count,
        features: l.features,
      })),
      specialty: getLayoutsByCategory('specialty').map(l => ({
        id: l.id,
        name: l.name,
        description: l.description,
        columns: l.columns.count,
        features: l.features,
      })),
    };

    return NextResponse.json({
      success: true,
      layouts,
      byCategory,
      total: layouts.length,
    });
  } catch (error) {
    console.error('Error fetching layouts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch layouts' },
      { status: 500 }
    );
  }
}
















