import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-middleware'
import { generatePaymentsForContract } from '@/lib/payment-generator'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // First get contracts
    const contracts = await prisma.contract.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Then get related data manually to avoid schema conflicts
    const enrichedContracts = await Promise.all(
      contracts.map(async (contract) => {
        try {
          const property = await prisma.property.findUnique({
            where: { id: contract.propertyId }
          })
          
          const tenant = await prisma.tenant.findUnique({
            where: { id: contract.tenantId }
          })
          
          const owner = property ? await prisma.owner.findUnique({
            where: { id: property.ownerId }
          }) : null

          return {
            ...contract,
            property: property ? {
              ...property,
              owner: owner || { id: '', name: 'Proprietário não encontrado', email: '' }
            } : { id: '', title: 'Propriedade não encontrada', address: '', propertyType: '', owner: { id: '', name: 'Proprietário não encontrado', email: '' } },
            tenant: tenant || { id: '', name: 'Inquilino não encontrado', email: '', phone: '' }
          }
        } catch (error) {
          console.error('Error enriching contract:', error)
          return {
            ...contract,
            property: { id: '', title: 'Erro ao carregar', address: '', propertyType: '', owner: { id: '', name: 'Erro', email: '' } },
            tenant: { id: '', name: 'Erro ao carregar', email: '', phone: '' }
          }
        }
      })
    )

    return NextResponse.json(enrichedContracts)
  } catch (error) {
    console.error('Error fetching contracts:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao buscar contratos', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📋 POST /api/contracts - Starting contract creation...')
    const user = await requireAuth(request)
    console.log('✅ User authenticated:', { id: user.id, email: user.email })
    
    const data = await request.json()
    console.log('📝 Contract data received:', data)
    
    // Get property to access companyId and verify ownership
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId }
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Verify that the property belongs to the current user
    if (property.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized access to property' }, { status: 403 })
    }

    // Verify that the tenant belongs to the current user
    const tenant = await prisma.tenant.findUnique({
      where: { id: data.tenantId }
    })

    if (!tenant || tenant.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized access to tenant' }, { status: 403 })
    }

    console.log('🚀 Creating contract with data:', {
      propertyId: data.propertyId,
      tenantId: data.tenantId,
      companyId: property.companyId,
      userId: user.id,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      rentAmount: data.rentAmount,
      depositAmount: data.depositAmount
    })
    
    const contract = await prisma.contract.create({
      data: {
        propertyId: data.propertyId,
        tenantId: data.tenantId,
        companyId: property.companyId,
        userId: user.id,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        rentAmount: data.rentAmount,
        depositAmount: data.depositAmount,
        administrationFeePercentage: data.administrationFeePercentage || 10.0,
        terms: data.terms || null,
        status: data.status || 'ACTIVE'
      },
      include: {
        property: {
          include: {
            owner: true
          }
        },
        tenant: true
        // payments: true // Desabilitado temporariamente devido a problemas de schema
      }
    })

    // 🚀 GERAÇÃO DE PAGAMENTOS DESABILITADA TEMPORARIAMENTE (gateway em desenvolvimento)
    console.log('⚠️ Geração automática de pagamentos desabilitada - gateway em desenvolvimento')

    return NextResponse.json(contract, { status: 201 })
  } catch (error) {
    console.error('❌ Error creating contract:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.substring(0, 1000) : 'No stack'
    })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { 
        error: 'Erro ao criar contrato', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}