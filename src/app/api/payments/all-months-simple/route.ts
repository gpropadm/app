import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    console.log('=== SIMPLE ALL MONTHS API ===')
    const user = await requireAuth(request)
    console.log('User:', user.email)
    
    // Get user's contracts
    const userContracts = await prisma.contract.findMany({
      where: { userId: user.id },
      select: { id: true }
    })
    
    const contractIds = userContracts.map(c => c.id)
    
    if (contractIds.length === 0) {
      return NextResponse.json([])
    }
    
    // Get payments with minimal data - NO INCLUDES
    const payments = await prisma.payment.findMany({
      where: {
        contractId: { in: contractIds }
      },
      select: {
        id: true,
        contractId: true,
        amount: true,
        dueDate: true,
        status: true,
        paidDate: true,
        paymentMethod: true,
        receipts: true,
        notes: true
      },
      orderBy: { dueDate: 'desc' }
    })
    
    console.log('Found payments:', payments.length)
    
    // Simple enrichment - one by one to catch errors
    const enrichedPayments = []
    
    for (const payment of payments) {
      try {
        // Get contract data
        const contract = await prisma.contract.findUnique({
          where: { id: payment.contractId },
          select: {
            id: true,
            propertyId: true,
            tenantId: true
          }
        })
        
        if (!contract) continue
        
        // Get property and tenant separately
        const [property, tenant] = await Promise.all([
          prisma.property.findUnique({
            where: { id: contract.propertyId },
            select: { title: true, address: true }
          }),
          prisma.tenant.findUnique({
            where: { id: contract.tenantId },
            select: { name: true, email: true, phone: true }
          })
        ])
        
        enrichedPayments.push({
          ...payment,
          maintenanceDeductions: 0, // Temporarily disable maintenance
          maintenances: [],
          contract: {
            ...contract,
            property: property || { title: 'Propriedade não encontrada', address: '' },
            tenant: tenant || { name: 'Inquilino não encontrado', email: '', phone: '' }
          }
        })
        
      } catch (enrichError) {
        console.error('Error enriching payment:', payment.id, enrichError)
        // Add payment with minimal data
        enrichedPayments.push({
          ...payment,
          maintenanceDeductions: 0,
          maintenances: [],
          contract: {
            property: { title: 'Erro ao carregar', address: '' },
            tenant: { name: 'Erro ao carregar', email: '', phone: '' }
          }
        })
      }
    }
    
    console.log('Enriched payments:', enrichedPayments.length)
    return NextResponse.json(enrichedPayments)
    
  } catch (error) {
    console.error('SIMPLE ALL MONTHS ERROR:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao buscar pagamentos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}