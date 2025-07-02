import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AgentQLService from '@/lib/agentql-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { portal, searchUrl, filters } = await request.json();

    if (!portal || !searchUrl) {
      return NextResponse.json({ 
        error: 'Portal e URL de busca são obrigatórios' 
      }, { status: 400 });
    }

    const agentQL = new AgentQLService();
    await agentQL.init();

    const leads = await agentQL.captureLeadsFromPortal(portal, searchUrl, filters);
    
    await agentQL.close();

    // Por enquanto só retorna os dados, sem salvar no banco
    return NextResponse.json({ 
      success: true, 
      leads,
      count: leads.length,
      portal,
      capturedAt: new Date()
    });

  } catch (error) {
    console.error('Erro na captura de leads:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Retorna configurações dos portais disponíveis
    const portals = [
      {
        name: 'OLX',
        id: 'olx',
        baseUrl: 'https://www.olx.com.br/imoveis',
        description: 'Captura leads do OLX Imóveis',
        searchParams: ['location', 'propertyType', 'priceRange']
      },
      {
        name: 'ZAP Imóveis',
        id: 'zapimoveis',
        baseUrl: 'https://www.zapimoveis.com.br',
        description: 'Captura leads do ZAP Imóveis',
        searchParams: ['location', 'propertyType', 'priceRange', 'bedrooms']
      },
      {
        name: 'Viva Real',
        id: 'vivareal',
        baseUrl: 'https://www.vivareal.com.br',
        description: 'Captura leads do Viva Real',
        searchParams: ['location', 'propertyType', 'priceRange', 'area']
      }
    ];

    return NextResponse.json({ portals });

  } catch (error) {
    console.error('Erro ao buscar portais:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}