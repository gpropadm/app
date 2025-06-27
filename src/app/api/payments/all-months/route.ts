import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    console.log('=== API PAYMENTS ALL MONTHS GET CALLED ===')
    const user = await requireAuth(request)
    console.log('👤 Usuário autenticado:', { id: user.id, email: user.email })
    
    // First get user's contracts
    const userContracts = await prisma.contract.findMany({
      where: { userId: user.id },
      select: { id: true }
    })
    
    const contractIds = userContracts.map(c => c.id)
    
    if (contractIds.length === 0) {
      return NextResponse.json([])
    }
    
    // Get ALL payments for those contracts (no date filter)
    const payments = await prisma.payment.findMany({
      where: {
        contractId: {
          in: contractIds
        }
      },
      orderBy: {
        dueDate: 'desc'
      }
    })

    // Manually enrich payments with contract data
    const enrichedPayments = await Promise.all(
      payments.map(async (payment) => {
        try {
          const contract = await prisma.contract.findUnique({
            where: { id: payment.contractId },
            select: {
              id: true,
              propertyId: true,
              tenantId: true,
              rentAmount: true
            }
          })
          
          if (!contract) {
            return {
              ...payment,
              maintenanceDeductions: 0,
              maintenances: [],
              contract: { 
                property: { title: 'Contrato não encontrado' },
                tenant: { name: 'Inquilino não encontrado' }
              }
            }
          }

          const property = await prisma.property.findUnique({
            where: { id: contract.propertyId },
            select: { title: true, address: true }
          })
          
          const tenant = await prisma.tenant.findUnique({
            where: { id: contract.tenantId },
            select: { name: true, email: true, phone: true }
          })

          // Calculate maintenance deductions for this contract
          const maintenances = await prisma.maintenance.findMany({
            where: {
              contractId: contract.id,
              deductFromOwner: true,
              status: 'COMPLETED',
              completedDate: {
                gte: new Date(payment.dueDate.getFullYear(), payment.dueDate.getMonth() - 1, 1),
                lt: new Date(payment.dueDate.getFullYear(), payment.dueDate.getMonth(), 1)
              }
            },
            select: {
              id: true,
              amount: true,
              title: true,
              completedDate: true
            }
          })

          const maintenanceDeductions = maintenances.reduce((total, maintenance) => total + maintenance.amount, 0)
          
          return {
            ...payment,
            maintenanceDeductions,
            maintenances,
            contract: {
              ...contract,
              property: property || { title: 'Propriedade não encontrada', address: '' },
              tenant: tenant || { name: 'Inquilino não encontrado', email: '', phone: '' }
            }
          }
        } catch (error) {
          console.error('Error enriching payment:', payment.id, error)
          return {
            ...payment,
            maintenanceDeductions: 0,
            maintenances: [],
            contract: { 
              property: { title: 'Erro ao carregar' },
              tenant: { name: 'Erro ao carregar' }
            }
          }
        }
      })
    )

    console.log(`📊 Encontrados ${enrichedPayments.length} pagamentos (todos os meses) para o usuário ${user.email}`)

    return NextResponse.json(enrichedPayments)
  } catch (error) {
    console.error('Error fetching all payments:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao buscar todos os pagamentos', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}