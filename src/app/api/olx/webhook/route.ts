import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * Webhook para receber leads automáticos da OLX
 * URL: https://app.gprop.com.br/api/olx/webhook
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

    // Extrair dados do lead baseado no formato da OLX
    const leadData = extractLeadData(data, company.id, user.id)
    
    if (!leadData) {
      console.log('❌ Dados de lead inválidos:', data)
      return NextResponse.json(
        { error: 'Dados de lead inválidos' },
        { status: 400 }
      )
    }

    // Verificar se lead já existe pelo telefone ou email (apenas se fornecidos)
    const existingLead = await prisma.lead.findFirst({
      where: {
        OR: [
          ...(leadData.phone ? [{ phone: leadData.phone }] : []),
          ...(leadData.email ? [{ email: leadData.email }] : [])
        ]
      }
    })

    if (existingLead) {
      console.log('🔄 Lead já existe, atualizando:', existingLead.id)
      
      // Atualizar lead existente
      const updatedLead = await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          ...leadData,
          updatedAt: new Date(),
          // Adicionar informação da fonte
          notes: `${existingLead.notes || ''}\n\n🔗 Novo interesse via OLX em ${new Date().toLocaleString('pt-BR')}\nImóvel: ${leadData.preferredCities}`
        }
      })

      return NextResponse.json({
        success: true,
        action: 'updated',
        leadId: updatedLead.id,
        message: 'Lead atualizado com sucesso'
      })
    }

    // Criar novo lead
    const newLead = await prisma.lead.create({
      data: {
        ...leadData,
        status: 'ACTIVE',
        notes: `🔗 Lead recebido via integração OLX em ${new Date().toLocaleString('pt-BR')}\nImóvel de interesse: ${leadData.preferredCities}`
      }
    })

    console.log('✅ Novo lead criado:', newLead.id)

    return NextResponse.json({
      success: true,
      action: 'created',
      leadId: newLead.id,
      message: 'Lead criado com sucesso'
    })

  } catch (error) {
    console.error('💥 Erro no webhook OLX:', error)
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
    service: 'OLX Webhook',
    endpoint: '/api/olx/webhook',
    methods: ['POST'],
    description: 'Endpoint para receber leads automáticos da OLX',
    timestamp: new Date().toISOString(),
    instructions: {
      url: 'https://app.gprop.com.br/api/olx/webhook',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  })
}

/**
 * Extrai dados do lead do payload da OLX
 */
function extractLeadData(data: any, companyId: string, userId: string) {
  try {
    // Adaptar baseado no formato real da OLX
    // Esta estrutura pode precisar ser ajustada baseado no payload real
    
    const leadData = {
      name: data.customer?.name || data.lead?.name || data.name || 'Lead OLX',
      email: data.customer?.email || data.lead?.email || data.email || '',
      phone: data.customer?.phone || data.lead?.phone || data.phone || '',
      interest: 'RENT' as const, // Padrão para aluguel, pode ser ajustado
      propertyType: mapPropertyType(data.property?.type || data.ad?.category),
      maxPrice: parseFloat(data.property?.price || data.ad?.price || '0') || 1000000,
      preferredCities: JSON.stringify([
        data.property?.location?.city || 
        data.ad?.location?.city || 
        data.city || 
        'Cidade não informada'
      ]),
      preferredStates: JSON.stringify([
        data.property?.location?.state || 
        data.ad?.location?.state || 
        data.state || 
        'DF'
      ]),
      amenities: JSON.stringify([]),
      // Campos obrigatórios do Prisma
      companyId: companyId,
      userId: userId
    }

    // Validar dados mínimos necessários
    if (!leadData.name && !leadData.phone && !leadData.email) {
      return null
    }

    return leadData

  } catch (error) {
    console.error('Erro ao extrair dados do lead:', error)
    return null
  }
}

/**
 * Mapeia tipos de propriedade da OLX para o sistema
 */
function mapPropertyType(olxType: string): string {
  if (!olxType) return 'APARTMENT'
  
  const type = olxType.toLowerCase()
  
  if (type.includes('apartamento') || type.includes('apartment')) return 'APARTMENT'
  if (type.includes('casa') || type.includes('house')) return 'HOUSE'
  if (type.includes('comercial') || type.includes('commercial')) return 'COMMERCIAL'
  if (type.includes('terreno') || type.includes('land')) return 'LAND'
  if (type.includes('studio')) return 'STUDIO'
  
  return 'APARTMENT' // Padrão
}