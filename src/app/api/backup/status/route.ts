import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const user = await requireAuth(request)
    
    console.log('📊 Verificando status dos dados...', { userId: user.id })
    
    // Contar todos os dados da empresa
    const [
      userCount,
      companyCount,
      ownerCount,
      propertyCount,
      bankAccountCount,
      leadCount,
      contractCount,
      paymentCount,
      tenantCount,
      maintenanceCount
    ] = await Promise.all([
      prisma.user.count({
        where: { companyId: user.companyId }
      }),
      prisma.company.count({
        where: { id: user.companyId }
      }),
      prisma.owner.count({
        where: { companyId: user.companyId }
      }),
      prisma.property.count({
        where: { companyId: user.companyId }
      }),
      prisma.bankAccounts.count({
        where: { 
          owner: { companyId: user.companyId }
        }
      }),
      // Tabelas opcionais
      prisma.lead ? prisma.lead.count({
        where: { companyId: user.companyId }
      }).catch(() => 0) : 0,
      prisma.contract ? prisma.contract.count({
        where: { property: { companyId: user.companyId } }
      }).catch(() => 0) : 0,
      prisma.payment ? prisma.payment.count({
        where: { contract: { property: { companyId: user.companyId } } }
      }).catch(() => 0) : 0,
      prisma.tenant ? prisma.tenant.count({
        where: { companyId: user.companyId }
      }).catch(() => 0) : 0,
      prisma.maintenance ? prisma.maintenance.count({
        where: { property: { companyId: user.companyId } }
      }).catch(() => 0) : 0
    ])
    
    const totalRecords = userCount + companyCount + ownerCount + propertyCount + bankAccountCount
    
    // Informações adicionais
    const company = await prisma.company.findUnique({
      where: { id: user.companyId }
    })
    
    const lastUser = await prisma.user.findFirst({
      where: { companyId: user.companyId },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true, name: true }
    })
    
    const lastOwner = await prisma.owner.findFirst({
      where: { companyId: user.companyId },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true, name: true }
    })
    
    const backupStatus = {
      timestamp: new Date().toISOString(),
      companyInfo: {
        id: user.companyId,
        name: company?.name || 'N/A',
        totalRecords
      },
      counts: {
        users: userCount,
        companies: companyCount,
        owners: ownerCount,
        properties: propertyCount,
        bankAccounts: bankAccountCount,
        leads: leadCount,
        contracts: contractCount,
        payments: paymentCount,
        tenants: tenantCount,
        maintenances: maintenanceCount
      },
      lastActivity: {
        lastUserUpdate: lastUser ? {
          date: lastUser.updatedAt,
          user: lastUser.name
        } : null,
        lastOwnerUpdate: lastOwner ? {
          date: lastOwner.updatedAt,
          owner: lastOwner.name
        } : null
      },
      backup: {
        available: true,
        downloadUrl: '/api/backup/download',
        recommendedFrequency: 'daily',
        estimatedSize: `${Math.ceil(totalRecords * 0.001)}MB`
      }
    }
    
    return NextResponse.json(backupStatus)
    
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Erro ao verificar status dos dados', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}