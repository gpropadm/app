import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    console.log('=== API PAYMENTS GET CALLED ===')
    const user = await requireAuth(request)
    console.log('👤 Usuário autenticado:', { id: user.id, email: user.email })
    
    // Buscar pagamentos do mês atual relacionados aos contratos do usuário
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1
    
    // First get user's contracts
    const userContracts = await prisma.contract.findMany({
      where: { userId: user.id },
      select: { id: true }
    })
    
    const contractIds = userContracts.map(c => c.id)
    
    if (contractIds.length === 0) {
      return NextResponse.json([])
    }
    
    // Then get payments for those contracts
    const payments = await prisma.payment.findMany({
      where: {
        contractId: {
          in: contractIds
        },
        dueDate: {
          gte: new Date(currentYear, currentMonth - 1, 1), // Primeiro dia do mês atual
          lt: new Date(currentYear, currentMonth, 1) // Primeiro dia do próximo mês
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
            where: { id: payment.contractId }
          })
          
          const property = contract ? await prisma.property.findUnique({
            where: { id: contract.propertyId }
          }) : null
          
          const tenant = contract ? await prisma.tenant.findUnique({
            where: { id: contract.tenantId }
          }) : null
          
          return {
            ...payment,
            contract: contract ? {
              ...contract,
              property: property || { id: '', title: 'Propriedade não encontrada', address: '' },
              tenant: tenant || { id: '', name: 'Inquilino não encontrado', email: '', phone: '' }
            } : { id: '', propertyId: '', tenantId: '', property: { id: '', title: 'Erro', address: '' }, tenant: { id: '', name: 'Erro', email: '', phone: '' } }
          }
        } catch (error) {
          console.error('Error enriching payment:', error)
          return {
            ...payment,
            contract: { id: '', propertyId: '', tenantId: '', property: { id: '', title: 'Erro', address: '' }, tenant: { id: '', name: 'Erro', email: '', phone: '' } }
          }
        }
      })
    )

    console.log(`📊 Encontrados ${enrichedPayments.length} pagamentos para o usuário ${user.email}`)
    enrichedPayments.forEach(p => {
      const today = new Date()
      const dueDate = new Date(p.dueDate)
      const isOverdue = today > dueDate
      console.log(`- ${p.id}: ${p.contract.tenant.name} - R$ ${p.amount} - Status: "${p.status}" - Due: ${p.dueDate} - Overdue: ${isOverdue} - Penalty: R$ ${p.penalty || 0} - Interest: R$ ${p.interest || 0}`)
    })

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