// Serviço ASAAS com Split de Pagamentos Completo
// Sistema de repasse automático entre proprietário e imobiliária

interface AsaasCustomer {
  id?: string
  name: string
  email: string
  phone: string
  mobilePhone?: string
  cpfCnpj: string
  postalCode?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
  city?: string
  state?: string
}

interface AsaasSubAccount {
  name: string
  email: string
  cpfCnpj: string
  loginEmail: string
  phone?: string
  mobilePhone?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
  city?: string
  state?: string
  postalCode: string
  incomeValue: number    // Obrigatório desde 30/05/2024
  monthlyBilling: number // Obrigatório desde 30/05/2024
}

interface AsaasPaymentWithSplit {
  customer: string
  billingType: 'BOLETO' | 'PIX' | 'CREDIT_CARD'
  value: number
  dueDate: string
  description: string
  externalReference: string
  split: Array<{
    walletId: string
    fixedValue?: number
    percentualValue?: number
  }>
}

interface SplitResult {
  payment: any
  boletoUrl: string
  pixQrCode?: string
  splits: {
    ownerWalletId: string
    ownerAmount: number
    companyAmount: number
    asaasFee: number
    administrationFeePercentage: number
  }
  asaasPaymentId: string
  asaasCustomerId: string
}

export class AsaasSplitService {
  private apiKey: string
  private baseUrl: string
  private isSandbox: boolean

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ASAAS_API_KEY || ''
    this.isSandbox = process.env.NODE_ENV !== 'production'
    this.baseUrl = this.isSandbox 
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://www.asaas.com/api/v3'
    
    if (!this.apiKey) {
      throw new Error('ASAAS API Key é obrigatória')
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'G-PROP-CRM/1.0',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('ASAAS API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      throw new Error(`ASAAS API Error: ${response.status} - ${JSON.stringify(errorData)}`)
    }

    return response.json()
  }

  /**
   * Cria uma subconta (wallet) para um proprietário no ASAAS
   * Esta subconta receberá os valores do aluguel automaticamente
   */
  async createOwnerSubAccount(ownerData: {
    name: string
    email: string
    document: string
    phone: string
    address?: string
    city?: string
    state?: string
    zipCode?: string
    estimatedIncome?: number
  }): Promise<{
    walletId: string
    apiKey: string
    accountId: string
  }> {
    try {
      // Estimar renda e faturamento baseado no mercado imobiliário
      const estimatedIncome = ownerData.estimatedIncome || 5000 // R$ 5.000 padrão
      const monthlyBilling = estimatedIncome * 0.6 // 60% da renda estimada

      const subAccountData: AsaasSubAccount = {
        name: ownerData.name,
        email: `${ownerData.email}`, // Email do proprietário
        loginEmail: `${ownerData.email}`, // Email para login
        cpfCnpj: ownerData.document.replace(/\D/g, ''),
        phone: ownerData.phone,
        address: ownerData.address || 'Não informado',
        city: ownerData.city || 'São Paulo',
        state: ownerData.state || 'SP',
        postalCode: ownerData.zipCode?.replace(/\D/g, '') || '01310100',
        incomeValue: estimatedIncome,
        monthlyBilling: monthlyBilling
      }

      console.log('Criando subconta ASAAS para proprietário:', {
        name: subAccountData.name,
        email: subAccountData.email,
        document: subAccountData.cpfCnpj
      })

      const response = await this.makeRequest('/subAccounts', {
        method: 'POST',
        body: JSON.stringify(subAccountData),
      })

      return {
        walletId: response.walletId,
        apiKey: response.apiKey, // IMPORTANTE: Salvar imediatamente
        accountId: response.id
      }
    } catch (error) {
      console.error('Erro ao criar subconta do proprietário:', error)
      throw new Error(`Erro ao criar subconta no ASAAS: ${error.message}`)
    }
  }

  /**
   * Cria ou atualiza um cliente (inquilino) no ASAAS
   */
  async createOrUpdateCustomer(customerData: AsaasCustomer): Promise<AsaasCustomer> {
    try {
      // Tentar criar cliente
      try {
        const response = await this.makeRequest('/customers', {
          method: 'POST',
          body: JSON.stringify({
            ...customerData,
            cpfCnpj: customerData.cpfCnpj.replace(/\D/g, ''),
            postalCode: customerData.postalCode?.replace(/\D/g, '')
          }),
        })
        return response
      } catch (error) {
        // Se cliente já existe, buscar pelo email ou documento
        console.log('Cliente pode já existir, tentando buscar...')
        
        const customers = await this.makeRequest(`/customers?email=${customerData.email}`)
        if (customers.data && customers.data.length > 0) {
          console.log('Cliente encontrado, usando existente')
          return customers.data[0]
        }
        
        // Tentar buscar por CPF/CNPJ
        const customersByCpf = await this.makeRequest(`/customers?cpfCnpj=${customerData.cpfCnpj.replace(/\D/g, '')}`)
        if (customersByCpf.data && customersByCpf.data.length > 0) {
          console.log('Cliente encontrado por documento, usando existente')
          return customersByCpf.data[0]
        }
        
        throw error
      }
    } catch (error) {
      console.error('Erro ao criar/buscar cliente:', error)
      throw new Error(`Erro ao criar cliente no ASAAS: ${error.message}`)
    }
  }

  /**
   * Cria boleto com split automático entre proprietário e imobiliária
   * O valor é dividido conforme a porcentagem de administração do contrato
   */
  async createBoletoWithAutomaticSplit(params: {
    contractId: string
    tenantData: AsaasCustomer
    amount: number
    dueDate: string
    description: string
    ownerWalletId: string
    administrationFeePercentage: number
    managementFeePercentage?: number
  }): Promise<SplitResult> {
    try {
      const {
        contractId,
        tenantData,
        amount,
        dueDate,
        description,
        ownerWalletId,
        administrationFeePercentage,
        managementFeePercentage = 0
      } = params

      // Criar/buscar cliente
      const customer = await this.createOrUpdateCustomer(tenantData)

      // Calcular valores do split
      const totalFeePercentage = administrationFeePercentage + managementFeePercentage
      const companyAmount = amount * (totalFeePercentage / 100)
      const ownerAmount = amount - companyAmount
      const estimatedAsaasFee = amount * 0.018 // Taxa estimada ASAAS (1,8% para boleto)

      console.log('Calculando split:', {
        amount,
        administrationFeePercentage,
        managementFeePercentage,
        totalFeePercentage,
        companyAmount,
        ownerAmount,
        estimatedAsaasFee
      })

      // Criar cobrança com split
      const paymentData: AsaasPaymentWithSplit = {
        customer: customer.id!,
        billingType: 'BOLETO',
        value: amount,
        dueDate,
        description,
        externalReference: contractId,
        split: [
          {
            walletId: ownerWalletId,
            fixedValue: Math.round(ownerAmount * 100) / 100 // Arredondar para 2 casas decimais
          }
        ]
      }

      console.log('Criando pagamento com split:', {
        customer: customer.id,
        value: amount,
        split: paymentData.split
      })

      const payment = await this.makeRequest('/payments', {
        method: 'POST',
        body: JSON.stringify(paymentData),
      })

      console.log('Pagamento criado com sucesso:', {
        id: payment.id,
        status: payment.status,
        bankSlipUrl: payment.bankSlipUrl
      })

      return {
        payment,
        boletoUrl: payment.bankSlipUrl || payment.invoiceUrl,
        pixQrCode: payment.encodedImage, // QR Code PIX
        asaasPaymentId: payment.id,
        asaasCustomerId: customer.id!,
        splits: {
          ownerWalletId,
          ownerAmount,
          companyAmount,
          asaasFee: estimatedAsaasFee,
          administrationFeePercentage: totalFeePercentage
        }
      }
    } catch (error) {
      console.error('Erro ao criar boleto com split:', error)
      throw new Error(`Erro ao gerar boleto com split: ${error.message}`)
    }
  }

  /**
   * Processa webhook do ASAAS para atualizar status de pagamentos
   */
  async processPaymentWebhook(webhookData: any): Promise<{
    paymentId: string
    externalReference: string
    status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
    paidDate?: string
    paidAmount?: number
    splitProcessed?: boolean
  }> {
    try {
      const { event, payment } = webhookData

      console.log('Processando webhook ASAAS:', {
        event,
        paymentId: payment.id,
        externalReference: payment.externalReference,
        status: payment.status
      })

      let status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' = 'PENDING'
      let splitProcessed = false

      switch (event) {
        case 'PAYMENT_RECEIVED':
        case 'PAYMENT_CONFIRMED':
          status = 'PAID'
          splitProcessed = true // Split é processado automaticamente pelo ASAAS
          break
        case 'PAYMENT_OVERDUE':
          status = 'OVERDUE'
          break
        case 'PAYMENT_DELETED':
        case 'PAYMENT_REFUNDED':
          status = 'CANCELLED'
          break
        default:
          status = 'PENDING'
      }

      return {
        paymentId: payment.id,
        externalReference: payment.externalReference || payment.id,
        status,
        paidDate: payment.paymentDate || payment.clientPaymentDate,
        paidAmount: payment.value,
        splitProcessed
      }
    } catch (error) {
      console.error('Erro ao processar webhook:', error)
      throw new Error(`Erro ao processar webhook do ASAAS: ${error.message}`)
    }
  }

  /**
   * Consulta status de um pagamento
   */
  async getPaymentStatus(paymentId: string): Promise<{
    status: string
    value: number
    paidDate?: string
    splits?: Array<{
      walletId: string
      status: string
      value: number
    }>
  }> {
    try {
      const payment = await this.makeRequest(`/payments/${paymentId}`)
      
      // Buscar informações de split se existirem
      let splits
      if (payment.split && payment.split.length > 0) {
        splits = payment.split.map((split: any) => ({
          walletId: split.walletId,
          status: split.status || 'PENDING',
          value: split.value || 0
        }))
      }

      return {
        status: payment.status,
        value: payment.value,
        paidDate: payment.paymentDate,
        splits
      }
    } catch (error) {
      console.error('Erro ao consultar status do pagamento:', error)
      throw new Error(`Erro ao consultar pagamento: ${error.message}`)
    }
  }

  /**
   * Lista pagamentos por período para relatórios
   */
  async getPaymentsByPeriod(startDate: string, endDate: string, limit = 100): Promise<Array<{
    id: string
    customer: any
    value: number
    status: string
    dueDate: string
    paymentDate?: string
    externalReference?: string
    splits?: any[]
  }>> {
    try {
      const response = await this.makeRequest(
        `/payments?dateCreated[ge]=${startDate}&dateCreated[le]=${endDate}&limit=${limit}`
      )
      
      return (response.data || []).map((payment: any) => ({
        id: payment.id,
        customer: payment.customer,
        value: payment.value,
        status: payment.status,
        dueDate: payment.dueDate,
        paymentDate: payment.paymentDate,
        externalReference: payment.externalReference,
        splits: payment.split || []
      }))
    } catch (error) {
      console.error('Erro ao buscar pagamentos por período:', error)
      throw new Error(`Erro ao buscar pagamentos: ${error.message}`)
    }
  }

  /**
   * Valida se uma wallet existe e está ativa
   */
  async validateWallet(walletId: string): Promise<boolean> {
    try {
      await this.makeRequest(`/subAccounts/${walletId}`)
      return true
    } catch (error) {
      console.error('Erro ao validar wallet:', error)
      return false
    }
  }

  /**
   * Testa conectividade com ASAAS
   */
  async testConnection(): Promise<{
    success: boolean
    accountInfo?: any
    error?: string
  }> {
    try {
      const response = await this.makeRequest('/myAccount')
      return {
        success: true,
        accountInfo: {
          name: response.name,
          email: response.email,
          walletId: response.walletId
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}