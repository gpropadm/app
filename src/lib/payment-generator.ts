import { prisma } from '@/lib/db'
import { addOneMonth } from './date-utils'

export async function generatePaymentsForContract(contractId: string) {
  console.log('🔄 Gerando pagamentos automaticamente para contrato:', contractId)
  
  try {
    // Buscar o contrato
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { tenant: true }
    })
    
    if (!contract || contract.status !== 'ACTIVE') {
      console.log('❌ Contrato não encontrado ou não ativo')
      return
    }
    
    // Deletar pagamentos existentes deste contrato
    await prisma.payment.deleteMany({
      where: { contractId }
    })
    
    const startDate = new Date(contract.startDate)
    const endDate = new Date(contract.endDate)
    const dayOfMonth = startDate.getDate()
    
    console.log(`📝 ${contract.tenant.name}: Gerando pagamentos dia ${dayOfMonth}`)
    
    // Gerar pagamentos para todo o período do contrato
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    
    // Primeiro pagamento: usar o dia do mês de início, mas no mês de início ou no próximo
    let paymentDate = new Date(startDate)
    paymentDate.setDate(dayOfMonth)
    
    // Se o dia do pagamento já passou no mês de início, usar o próximo mês
    if (paymentDate < startDate) {
      paymentDate = addOneMonth(paymentDate)
    }
    
    const payments = []
    
    while (paymentDate <= endDate) {
      const paymentMonth = paymentDate.getMonth()
      const paymentYear = paymentDate.getFullYear()
      
      // 🎯 LÓGICA CONFORME SOLICITADO:
      // - Meses anteriores ao atual = EM ABERTO (OVERDUE)
      // - Mês atual e futuros = A VENCER (PENDING)
      let status: 'PENDING' | 'PAID' | 'OVERDUE' = 'PENDING'
      let paidDate = null
      
      if (paymentYear < currentYear || (paymentYear === currentYear && paymentMonth < currentMonth)) {
        // Meses anteriores ao atual = EM ABERTO (OVERDUE)
        status = 'OVERDUE'
        console.log(`  🔴 ${paymentDate.toLocaleDateString('pt-BR')} - EM ABERTO (mês anterior ao atual)`)
      } else {
        // Mês atual e futuros = A VENCER (PENDING)
        status = 'PENDING'
        console.log(`  🟡 ${paymentDate.toLocaleDateString('pt-BR')} - A VENCER (mês atual ou futuro)`)
      }
      
      // Try to create payment with gateway field, fallback if field doesn't exist
      let payment
      try {
        payment = await prisma.payment.create({
          data: {
            contractId,
            amount: contract.rentAmount,
            dueDate: paymentDate,
            status,
            ...(paidDate && { paidDate }),
            gateway: 'MANUAL' // Default gateway
          }
        })
      } catch (error) {
        // If gateway field doesn't exist, create without it
        console.log('⚠️ Gateway field not available, creating payment without gateway')
        payment = await prisma.payment.create({
          data: {
            contractId,
            amount: contract.rentAmount,
            dueDate: paymentDate,
            status,
            ...(paidDate && { paidDate })
          }
        })
      }
      
      payments.push(payment)
      
      // Próximo mês - usar função segura para evitar overflow de datas
      paymentDate = addOneMonth(paymentDate)
    }
    
    console.log(`🎉 ${payments.length} pagamentos gerados automaticamente!`)
    return payments
    
  } catch (error) {
    console.error('❌ Erro ao gerar pagamentos:', error)
    throw error
  }
}

export async function regenerateAllActiveContractPayments() {
  console.log('🔄 Regenerando pagamentos para todos os contratos ativos')
  
  const activeContracts = await prisma.contract.findMany({
    where: { status: 'ACTIVE' }
  })
  
  for (const contract of activeContracts) {
    await generatePaymentsForContract(contract.id)
  }
  
  console.log('🎉 Todos os pagamentos regenerados!')
}