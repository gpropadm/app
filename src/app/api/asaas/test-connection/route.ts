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

// Testar API Key fornecida pelo usuário
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { success: false, message: 'Não autorizado' }, 
        { status: 401 }
      )
    }

    const body = await request.json()
    const { asaasApiKey } = body

    if (!asaasApiKey) {
      return NextResponse.json({
        success: false,
        message: 'API Key é obrigatória'
      }, { status: 400 })
    }

    // Testar API Key diretamente
    const { AsaasSplitService } = await import('@/lib/asaas-split-service')
    const testService = new AsaasSplitService(asaasApiKey)
    const testResult = await testService.testConnection()

    if (!testResult.success) {
      return NextResponse.json({
        success: false,
        message: `API Key inválida: ${testResult.error}`
      })
    }

    // Salvar configuração no banco
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    await prisma.company.update({
      where: { id: session.user.companyId },
      data: {
        asaasApiKey: asaasApiKey,
        asaasWalletId: testResult.accountInfo?.walletId,
        asaasEnabled: true,
        updatedAt: new Date()
      }
    })

    await prisma.$disconnect()

    return NextResponse.json({
      success: true,
      message: 'ASAAS conectado e configurado com sucesso!',
      accountInfo: testResult.accountInfo
    })
  } catch (error) {
    console.error('Erro ao testar ASAAS:', error)
    return NextResponse.json({
      success: false,
      message: `Erro interno: ${error.message}`
    }, { status: 500 })
  }
}