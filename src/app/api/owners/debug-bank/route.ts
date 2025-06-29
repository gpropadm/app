import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    console.log('🏦 BANK DEBUG: Starting...')
    
    const user = await requireAuth(request)
    console.log('✅ User authenticated:', { id: user.id, companyId: user.companyId })
    
    const data = await request.json()
    console.log('📝 Received data:', JSON.stringify(data, null, 2))
    
    // Test 1: Create owner without bank account
    const ownerData = {
      name: 'TESTE BANK DEBUG',
      email: `bank.debug.${Date.now()}@test.com`,
      phone: '(61) 99999-0000',
      document: `999.${Date.now().toString().slice(-3)}.999-99`,
      address: 'Rua Debug',
      city: 'Brasília',
      state: 'DF',
      zipCode: '70000-000',
      companyId: user.companyId,
      userId: user.id
    }
    
    console.log('👤 Creating test owner:', ownerData)
    const owner = await prisma.owner.create({ data: ownerData })
    console.log('✅ Owner created:', owner.id)
    
    // Test 2: Create bank account separately
    const bankData = {
      ownerId: owner.id,
      bankName: 'Banco Teste Debug',
      bankCode: '999',
      accountType: 'Conta Corrente',
      agency: '9999',
      account: '99999',
      accountDigit: '9',
      pixKey: 'debug@teste.com',
      isDefault: true,
      isActive: true
    }
    
    console.log('🏦 Creating test bank account:', bankData)
    const bankAccount = await prisma.bankAccounts.create({ data: bankData })
    console.log('✅ Bank account created:', bankAccount.id)
    
    // Test 3: Fetch owner with bank accounts
    const ownerWithBank = await prisma.owner.findUnique({
      where: { id: owner.id }
    })
    
    const bankAccounts = await prisma.bankAccounts.findMany({
      where: { ownerId: owner.id }
    })
    
    console.log('📊 Owner with bank accounts:', {
      owner: ownerWithBank?.name,
      bankAccounts: bankAccounts.length
    })
    
    // Cleanup
    await prisma.bankAccounts.delete({ where: { id: bankAccount.id } })
    await prisma.owner.delete({ where: { id: owner.id } })
    console.log('🧹 Cleanup completed')
    
    return NextResponse.json({
      success: true,
      message: 'Bank account test completed successfully',
      tests: {
        ownerCreation: 'OK',
        bankCreation: 'OK', 
        fetching: 'OK',
        cleanup: 'OK'
      },
      data: {
        owner: ownerWithBank,
        bankAccounts: bankAccounts
      }
    })
    
  } catch (error) {
    console.error('❌ BANK DEBUG Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro no teste de conta bancária',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.substring(0, 1000) : undefined
    }, { status: 500 })
  }
}