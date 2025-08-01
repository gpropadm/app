// API DE TESTE - rota única para debug
export async function POST() {
  console.log('🎯 TESTE: API test-boletos-debug funcionando!')
  
  return Response.json({
    message: 'API DE TESTE FUNCIONANDO!',
    timestamp: new Date().toISOString(),
    success: true
  })
}