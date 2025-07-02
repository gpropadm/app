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

    const { propertyCode, city } = await request.json();

    if (!propertyCode || !city) {
      return NextResponse.json({ 
        error: 'Código do imóvel e cidade são obrigatórios' 
      }, { status: 400 });
    }

    const agentQL = new AgentQLService();
    await agentQL.init();

    const iptuData = await agentQL.extractIPTUData(propertyCode, city);
    
    await agentQL.close();

    if (!iptuData) {
      return NextResponse.json({ 
        error: 'Não foi possível extrair dados do IPTU',
        propertyCode,
        city
      }, { status: 404 });
    }

    // Por enquanto só retorna os dados, sem salvar no banco
    return NextResponse.json({ 
      success: true, 
      data: iptuData
    });

  } catch (error) {
    console.error('Erro na extração de dados do IPTU:', error);
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

    // Retorna sistemas de IPTU disponíveis
    const iptuSystems = [
      {
        city: 'São Paulo',
        state: 'SP',
        url: 'https://www.prefeitura.sp.gov.br/iptu',
        status: 'available',
        description: 'Sistema de IPTU da Prefeitura de São Paulo',
        codeFormat: 'XXXXX-XXXX'
      },
      {
        city: 'Rio de Janeiro',
        state: 'RJ',
        url: 'https://www.rio.rj.gov.br/iptu',
        status: 'available',
        description: 'Sistema de IPTU da Prefeitura do Rio de Janeiro',
        codeFormat: 'XXXXXXXXX'
      },
      {
        city: 'Belo Horizonte',
        state: 'MG',
        url: 'https://www.pbh.gov.br/iptu',
        status: 'available',
        description: 'Sistema de IPTU da Prefeitura de Belo Horizonte',
        codeFormat: 'XXXXXX-XX'
      }
    ];

    return NextResponse.json({ iptuSystems });

  } catch (error) {
    console.error('Erro ao buscar sistemas de IPTU:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}