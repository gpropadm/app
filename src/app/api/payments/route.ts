import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, isUserAdmin } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    console.log('=== API PAYMENTS GET CALLED ===')
    const user = await requireAuth(request)
    console.log('👤 Usuário autenticado:', { id: user.id, email: user.email })
    
    // Check if user is admin
    const userIsAdmin = await isUserAdmin(user.id)
    console.log('🔐 Usuário é admin:', userIsAdmin)
    
    // Both admin and regular users see only their own contracts
    const userContracts = await prisma.contract.findMany({
      where: { userId: user.id },
      select: { id: true }
    })
    
    const contractIds = userContracts.map(c => c.id)
    console.log(`👤 ${userIsAdmin ? 'Admin' : 'Usuário'}: ${contractIds.length} contratos próprios`)
    
    if (contractIds.length === 0) {
      console.log('📭 Nenhum contrato encontrado, retornando array vazio')
      return NextResponse.json([])
    }

    // Check if payments table exists and has data
    try {
      const paymentCount = await prisma.payment.count()
      console.log(`📊 Total de pagamentos no sistema: ${paymentCount}`)
    } catch (countError) {
      console.error('❌ Erro ao contar pagamentos:', countError)
      return NextResponse.json([])
    }
    
    // Get current month date range + next 2 months to show recent contracts
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1
    
    // Get payments for current month + next 2 months (to catch new contracts)
    const startDate = new Date(currentYear, currentMonth - 1, 1) // First day of current month
    const endDate = new Date(currentYear, currentMonth + 2, 1) // First day of month +3
    
    console.log('🗓️ Searching payments between:', startDate.toISOString(), 'and', endDate.toISOString())
    
    const allPayments = await prisma.payment.findMany({
      where: {
        contractId: {
          in: contractIds
        },
        dueDate: {
          gte: startDate,
          lt: endDate
        }
      },
      select: {
        id: true,
        contractId: true,
        amount: true,
        dueDate: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        dueDate: 'desc'
      }
    })

    console.log(`📊 Encontrados ${allPayments.length} pagamentos do mês ${currentMonth}/${currentYear} para o usuário ${user.email} (Admin: ${userIsAdmin})`)

    // Now enrich with basic contract info
    const enrichedPayments = await Promise.all(
      allPayments.map(async (payment) => {
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
              status: 'COMPLETED', // Only completed maintenances
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
            // Mapear receipts para receiptUrl para compatibilidade
            receiptUrl: payment.receipts ? (() => {
              try {
                if (typeof payment.receipts === 'string') {
                  const parsed = JSON.parse(payment.receipts)
                  return parsed?.[0]?.url || null
                } else {
                  return payment.receipts?.[0]?.url || null
                }
              } catch (error) {
                console.warn('Erro ao parsear receipts:', error)
                return null
              }
            })() : null,
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
            // Mapear receipts para receiptUrl mesmo em caso de erro
            receiptUrl: payment.receipts ? (() => {
              try {
                if (typeof payment.receipts === 'string') {
                  const parsed = JSON.parse(payment.receipts)
                  return parsed?.[0]?.url || null
                } else {
                  return payment.receipts?.[0]?.url || null
                }
              } catch (error) {
                return null
              }
            })() : null,
            contract: { 
              property: { title: 'Erro ao carregar' },
              tenant: { name: 'Erro ao carregar' }
            }
          }
        }
      })
    )

    console.log(`✅ Dados enriquecidos para ${enrichedPayments.length} pagamentos`)

    return NextResponse.json(enrichedPayments)
  } catch (error) {
    console.error('Error fetching payments:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao buscar pagamentos', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { id, ...data } = await request.json()
    
    // Verificar se o pagamento pertence ao usuário
    const payment = await prisma.payment.findFirst({
      where: {
        id,
        contract: {
          userId: user.id
        }
      }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 })
    }

    // Atualizar o pagamento
    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        status: 'PAID',
        paidDate: new Date(),
        paymentMethod: data.paymentMethod,
        receipts: JSON.stringify(data.receipts || []),
        notes: data.notes
      },
      include: {
        contract: {
          include: {
            property: true,
            tenant: true
          }
        }
      }
    })

    return NextResponse.json(updatedPayment)
  } catch (error) {
    console.error('Error updating payment:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao atualizar pagamento', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}