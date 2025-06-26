import { NextRequest, NextResponse } from 'next/server'
import { UnifiedPaymentService } from '@/lib/unified-payment-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log do webhook para debug
    console.log('PJBank Webhook received:', JSON.stringify(body, null, 2))

    const paymentService = new UnifiedPaymentService()
    
    const success = await paymentService.processWebhook({
      gateway: 'PJBANK',
      data: body
    })

    await paymentService.disconnect()

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'Erro ao processar webhook' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error processing PJBank webhook:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}

// Endpoint para validação do webhook
export async function GET() {
  return NextResponse.json({ 
    status: 'webhook_endpoint_active',
    gateway: 'pjbank',
    timestamp: new Date().toISOString()
  })
}