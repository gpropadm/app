import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { phone, document } = await request.json();

    if (!phone || !document) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Telefone e CPF são obrigatórios' 
        },
        { status: 400 }
      );
    }

    console.log('🔍 Tentativa de login cliente:', { phone, document: document.substring(0, 3) + '***' });

    // Limpar dados (remover formatação)
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanDocument = document.replace(/\D/g, '');

    console.log('📞 Buscando inquilino com:', { 
      cleanPhone: cleanPhone.substring(0, 4) + '***',
      cleanDocument: cleanDocument.substring(0, 3) + '***'
    });

    // Buscar inquilino por telefone e documento
    const tenant = await prisma.tenant.findFirst({
      where: {
        AND: [
          {
            OR: [
              { phone: cleanPhone },
              { phone: `+55${cleanPhone}` },
              { phone: phone }, // Com formatação original
            ]
          },
          { document: cleanDocument }
        ]
      },
      include: {
        contracts: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            property: {
              include: {
                owner: {
                  select: {
                    name: true,
                    email: true,
                    phone: true
                  }
                }
              }
            },
            payments: {
              orderBy: {
                dueDate: 'desc'
              }
            }
          }
        }
      }
    });

    if (!tenant) {
      console.log('❌ Inquilino não encontrado');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Dados não encontrados. Verifique seu telefone e CPF.' 
        },
        { status: 404 }
      );
    }

    // Verificar se tem contratos ativos
    if (!tenant.contracts || tenant.contracts.length === 0) {
      console.log('❌ Nenhum contrato ativo encontrado');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Nenhum contrato ativo encontrado para este inquilino.' 
        },
        { status: 404 }
      );
    }

    // Pegar o primeiro contrato ativo (assumindo 1 por inquilino)
    const activeContract = tenant.contracts[0];

    console.log('✅ Login bem-sucedido:', {
      tenant: tenant.name,
      contractId: activeContract.id,
      property: activeContract.property.title,
      paymentsCount: activeContract.payments.length
    });

    // Retornar dados do contrato para o cliente
    const clientData = {
      id: activeContract.id,
      property: {
        title: activeContract.property.title,
        address: activeContract.property.address,
        propertyType: activeContract.property.propertyType,
        owner: activeContract.property.owner
      },
      rentAmount: activeContract.rentAmount,
      startDate: activeContract.startDate.toISOString(),
      endDate: activeContract.endDate.toISOString(),
      tenant: {
        name: tenant.name,
        phone: tenant.phone,
        document: tenant.document
      },
      payments: activeContract.payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        dueDate: payment.dueDate.toISOString(),
        status: payment.status,
        boletoUrl: payment.boletoUrl,
        paidDate: payment.paidDate ? payment.paidDate.toISOString() : null,
        paymentMethod: payment.paymentMethod
      }))
    };

    return NextResponse.json({
      success: true,
      message: 'Login realizado com sucesso',
      contract: clientData
    });

  } catch (error) {
    console.error('❌ Erro na autenticação do cliente:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}