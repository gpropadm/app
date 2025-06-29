import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    console.log('🏦 RAW BANK: Starting...')
    
    const user = await requireAuth(request)
    console.log('✅ User authenticated:', { id: user.id, companyId: user.companyId })
    
    // Test 1: Check what tables exist
    console.log('📊 Checking database tables...')
    
    try {
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `
      console.log('📋 Available tables:', tables)
    } catch (tableError) {
      console.log('⚠️ Could not list tables:', tableError)
    }
    
    // Test 2: Try different table name variations
    const possibleNames = ['BankAccount', 'bankaccounts', 'bank_accounts', 'BankAccounts']
    
    for (const tableName of possibleNames) {
      try {
        console.log(`🔍 Testing table name: ${tableName}`)
        const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${tableName}" LIMIT 1`)
        console.log(`✅ Table ${tableName} exists:`, result)
      } catch (error) {
        console.log(`❌ Table ${tableName} not found`)
      }
    }
    
    // Test 3: Check owner table structure
    try {
      const ownerStructure = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'owners' 
        ORDER BY ordinal_position
      `
      console.log('👤 Owner table structure:', ownerStructure)
    } catch (structError) {
      console.log('⚠️ Could not get owner structure:', structError)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database structure analysis completed',
      note: 'Check console logs for detailed information'
    })
    
  } catch (error) {
    console.error('❌ RAW BANK Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro na análise do banco',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}