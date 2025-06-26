import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * Webhook simples para receber leads da OLX
 * URL: https://app.gprop.com.br/api/olx/webhook-simple
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    console.log('📨 Webhook OLX recebido:', JSON.stringify(data, null, 2))

    // Buscar primeira empresa e usuário disponíveis
    const company = await prisma.company.findFirst()
    const user = await prisma.user.findFirst()

    if (!company || !user) {
      console.log('❌ Empresa ou usuário não encontrados')
      return NextResponse.json(
        { error: 'Sistema não configurado corretamente' },
        { status: 500 }
      )
    }

    // Extrair dados básicos
    const name = data.customer?.name || data.lead?.name || data.name || 'Lead OLX'
    const email = data.customer?.email || data.lead?.email || data.email || ''
    const phone = data.customer?.phone || data.lead?.phone || data.phone || ''
    
    // Criar lead com campos mínimos
    const newLead = await prisma.lead.create({
      data: {
        name: name,
        email: email,
        phone: phone,
        interest: 'RENT',
        propertyType: 'APARTMENT',
        maxPrice: 2000,
        preferredCities: '["Brasília"]',
        preferredStates: '["DF"]',
        companyId: company.id,
        userId: user.id,
        notes: `🔗 Lead recebido via integração OLX em ${new Date().toLocaleString('pt-BR')}`,
        status: 'ACTIVE'
      }
    })

    console.log('✅ Lead OLX criado:', newLead.id)

    return NextResponse.json({
      success: true,
      leadId: newLead.id,
      message: 'Lead OLX criado com sucesso'
    })

  } catch (error) {
    console.error('💥 Erro no webhook OLX simples:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

/**
 * GET para testar se o endpoint está funcionando
 */
export async function GET() {
  return NextResponse.json({
    status: 'active',
    service: 'OLX Webhook Simple',
    endpoint: '/api/olx/webhook-simple',
    url: 'https://app.gprop.com.br/api/olx/webhook-simple'
  })
}