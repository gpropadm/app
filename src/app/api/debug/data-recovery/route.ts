import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DATA RECOVERY: Starting diagnosis...')
    
    const user = await requireAuth(request)
    console.log('✅ User authenticated:', { id: user.id, companyId: user.companyId })
    
    // Check tables and data counts without deleting anything
    const diagnostics = {
      users: 0,
      companies: 0,
      owners: 0,
      ownersForUser: 0,
      bankAccounts: 0,
      properties: 0,
      tableStructure: {},
      sampleOwners: [],
      sampleBankAccounts: []
    }
    
    try {
      // Count users
      diagnostics.users = await prisma.user.count()
      console.log('👥 Total users:', diagnostics.users)
      
      // Count companies
      diagnostics.companies = await prisma.company.count()
      console.log('🏢 Total companies:', diagnostics.companies)
      
      // Count all owners
      diagnostics.owners = await prisma.owner.count()
      console.log('👤 Total owners:', diagnostics.owners)
      
      // Count owners for current user
      diagnostics.ownersForUser = await prisma.owner.count({
        where: { userId: user.id }
      })
      console.log('👤 Owners for current user:', diagnostics.ownersForUser)
      
      // Try to get sample owners for current user
      const sampleOwners = await prisma.owner.findMany({
        where: { userId: user.id },
        take: 3,
        include: {
          bankAccounts: true,
          properties: true
        }
      })
      diagnostics.sampleOwners = sampleOwners.map(owner => ({
        id: owner.id,
        name: owner.name,
        email: owner.email,
        bankAccountsCount: owner.bankAccounts?.length || 0,
        propertiesCount: owner.properties?.length || 0
      }))
      console.log('📋 Sample owners for user:', diagnostics.sampleOwners)
      
    } catch (prismaError) {
      console.error('❌ Prisma error:', prismaError)
    }
    
    try {
      // Try different ways to access bank accounts
      const bankAccountMethods = []
      
      // Method 1: Using bankAccounts (plural)
      try {
        const count1 = await prisma.bankAccounts.count()
        diagnostics.bankAccounts = count1
        bankAccountMethods.push({ method: 'bankAccounts', count: count1, success: true })
        
        const sample1 = await prisma.bankAccounts.findMany({ take: 3 })
        diagnostics.sampleBankAccounts = sample1.map(ba => ({
          id: ba.id,
          ownerId: ba.ownerId,
          bankName: ba.bankName
        }))
        
      } catch (err1) {
        bankAccountMethods.push({ method: 'bankAccounts', error: err1.message, success: false })
      }
      
      // Method 2: Using BankAccount (singular) - raw SQL
      try {
        const count2 = await prisma.$queryRawUnsafe('SELECT COUNT(*) as count FROM "BankAccount"')
        bankAccountMethods.push({ method: 'BankAccount (raw)', count: count2, success: true })
      } catch (err2) {
        bankAccountMethods.push({ method: 'BankAccount (raw)', error: err2.message, success: false })
      }
      
      diagnostics.tableStructure = { bankAccountMethods }
      
    } catch (bankError) {
      console.error('❌ Bank account error:', bankError)
    }
    
    try {
      // Count properties
      diagnostics.properties = await prisma.property.count()
      console.log('🏠 Total properties:', diagnostics.properties)
    } catch (propError) {
      console.error('❌ Property error:', propError)
    }
    
    console.log('📊 Full diagnostics:', diagnostics)
    
    return NextResponse.json({
      success: true,
      message: 'Data recovery diagnostics completed',
      diagnostics,
      timestamp: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        companyId: user.companyId
      }
    })
    
  } catch (error) {
    console.error('❌ DATA RECOVERY Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro na recuperação de dados',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}