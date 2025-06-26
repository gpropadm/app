import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    console.log('=== API PAYMENTS GET CALLED ===')
    const user = await requireAuth(request)
    console.log('👤 Usuário autenticado:', { id: user.id, email: user.email })
    
    // First check if user has contracts
    const userContracts = await prisma.contract.findMany({
      where: { userId: user.id },
      select: { id: true }
    })
    
    console.log(`📊 Usuário tem ${userContracts.length} contratos`)
    
    if (userContracts.length === 0) {
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
    
    // Get a simple list of payments without date filtering first
    const contractIds = userContracts.map(c => c.id)
    
    const allPayments = await prisma.payment.findMany({
      where: {
        contractId: {
          in: contractIds
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
        createdAt: 'desc'
      },
      take: 50 // Limit to 50 payments
    })

    console.log(`📊 Encontrados ${allPayments.length} pagamentos para os contratos do usuário`)

    return NextResponse.json(allPayments)
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