import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Creating expenses table...')
    
    // Create the expenses table using raw SQL - PostgreSQL compatible
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "expenses" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "description" TEXT NOT NULL,
        "amount" DECIMAL(10,2) NOT NULL,
        "category" TEXT NOT NULL,
        "date" TIMESTAMP NOT NULL,
        "year" INTEGER NOT NULL,
        "month" INTEGER NOT NULL,
        "type" TEXT NOT NULL DEFAULT 'operational',
        "receipt" TEXT,
        "notes" TEXT,
        "companyId" TEXT,
        "userId" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `
    
    console.log('✅ Expenses table created successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Expenses table created successfully'
    })
  } catch (error) {
    console.error('❌ Error creating expenses table:', error)
    return NextResponse.json(
      { error: 'Failed to create expenses table', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}