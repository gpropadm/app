import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, isUserAdmin } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const userIsAdmin = await isUserAdmin(user.id)
    
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    const { contractId } = await request.json()
    
    if (!contractId) {
      return NextResponse.json({ error: 'Contract ID required' }, { status: 400 })
    }
    
    console.log('🔧 Generating payments for contract:', contractId)
    
    // Get contract details
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        property: true,
        tenant: true
      }
    })
    
    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }
    
    // Check if payments already exist
    const existingPayments = await prisma.payment.findMany({
      where: { contractId: contractId }
    })
    
    if (existingPayments.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Payments already exist for this contract',
        existingPayments: existingPayments.length
      })
    }
    
    // Generate payments for the contract duration
    const startDate = new Date(contract.startDate)
    const endDate = new Date(contract.endDate)
    const payments = []
    
    let currentDate = new Date(startDate)
    currentDate.setDate(10) // Set due date to 10th of each month
    
    while (currentDate <= endDate) {
      const payment = await prisma.payment.create({
        data: {
          contractId: contract.id,
          amount: contract.rentAmount,
          dueDate: new Date(currentDate),
          status: 'PENDING',
          gateway: 'MANUAL' // Default gateway
        }
      })
      
      payments.push(payment)
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1)
    }
    
    return NextResponse.json({
      success: true,
      message: `Generated ${payments.length} payments for contract`,
      contract: {
        id: contract.id,
        property: contract.property.title,
        tenant: contract.tenant.name,
        rentAmount: contract.rentAmount
      },
      paymentsGenerated: payments.length,
      payments: payments.map(p => ({
        id: p.id,
        amount: p.amount,
        dueDate: p.dueDate,
        status: p.status
      }))
    })
    
  } catch (error) {
    console.error('Generate payments error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}