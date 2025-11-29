import { NextResponse } from 'next/server';
import { initDB } from '../../../../lib/db.js';

export async function GET(request) {
  try {
    const success = await initDB();

    if (success) {
      return NextResponse.json({
        message: 'Database initialized successfully',
        success: true
      });
    } else {
      return NextResponse.json({
        error: 'Failed to initialize database',
        success: false
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({
      error: error.message,
      success: false
    }, { status: 500 });
  }
}
