// API para testar conexão com ASAAS
// Endpoint: GET /api/asaas/test-connection

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PaymentSplitService } from '@/lib/payment-split-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'Não autorizado' }, 
        { status: 401 }
      )
    }

    // Testar configuração ASAAS da empresa
    const splitService = new PaymentSplitService()
    const result = await splitService.testCompanyAsaasSetup(session.user.companyId)

    return NextResponse.json({
      success: result.success,
      accountInfo: result.accountInfo,
      message: result.message,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Erro ao testar conexão ASAAS:', error)
    return NextResponse.json({
      success: false,
      message: `Erro ao testar conexão: ${error.message}`,
      timestamp: new Date().toISOString()
    })
  }
}

// Configurar empresa no ASAAS
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'Não autorizado' }, 
        { status: 401 }
      )
    }

    const body = await request.json()
    const { asaasApiKey } = body

    if (!asaasApiKey) {
      return NextResponse.json(
        { error: 'asaasApiKey é obrigatória' },
        { status: 400 }
      )
    }

    // Testar API Key antes de salvar
    const { AsaasSplitService } = await import('@/lib/asaas-split-service')
    const testService = new AsaasSplitService(asaasApiKey)
    const testResult = await testService.testConnection()

    if (!testResult.success) {
      return NextResponse.json(
        { error: `API Key inválida: ${testResult.error}` },
        { status: 400 }
      )
    }

    // Salvar configuração
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    const company = await prisma.company.update({
      where: { id: session.user.companyId },
      data: {
        asaasApiKey: asaasApiKey,
        asaasWalletId: testResult.accountInfo.walletId,
        asaasEnabled: true,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        asaasEnabled: true,
        asaasWalletId: true
      }
    })

    await prisma.$disconnect()

    return NextResponse.json({
      success: true,
      message: 'Configuração ASAAS salva com sucesso',
      company: {
        id: company.id,
        name: company.name,
        asaasEnabled: company.asaasEnabled,
        walletId: company.asaasWalletId
      },
      accountInfo: testResult.accountInfo
    })
  } catch (error) {
    console.error('Erro ao configurar ASAAS:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}