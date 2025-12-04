import { NextResponse } from 'next/server';
import { initTodosTable } from '@/lib/db';

export async function GET() {
  try {
    const success = await initTodosTable();

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Todos table initialized successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to initialize todos table'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}
