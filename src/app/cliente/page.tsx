'use client'

import { useState, useEffect } from 'react'
import { 
  Home, 
  CreditCard, 
  History, 
  Phone, 
  Lock,
  Eye,
  EyeOff,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  MapPin
} from 'lucide-react'

interface ClientContract {
  id: string
  property: {
    title: string
    address: string
    propertyType: string
  }
  rentAmount: number
  startDate: string
  endDate: string
  tenant: {
    name: string
    phone: string
    document: string
  }
  payments: Array<{
    id: string
    amount: number
    dueDate: string
    status: 'PENDING' | 'PAID' | 'OVERDUE'
    boletoUrl?: string
    paidDate?: string
  }>
}

export default function ClientPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginData, setLoginData] = useState({
    phone: '',
    document: ''
  })
  const [contract, setContract] = useState<ClientContract | null>(null)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Por enquanto, simular login bem-sucedido para demonstração
      // TODO: Implementar API real quando resolver problema de deploy
      
      console.log('🧪 Simulando login para demo:', loginData.phone);
      
      // Simular dados de contrato para demonstração
      const mockContract = {
        id: "demo-contract-001",
        property: {
          title: "Casa Demo - 3 quartos",
          address: "Rua das Flores, 123 - Centro",
          propertyType: "HOUSE",
          owner: {
            name: "Proprietário Demo",
            email: "proprietario@demo.com",
            phone: "(61) 99999-0000"
          }
        },
        rentAmount: 1400,
        startDate: "2025-01-01T00:00:00Z",
        endDate: "2025-12-31T23:59:59Z",
        tenant: {
          name: "Cliente Demo",
          phone: loginData.phone,
          document: loginData.document
        },
        payments: [
          {
            id: "payment-001",
            amount: 1400,
            dueDate: "2025-08-10T00:00:00Z",
            status: "PENDING",
            boletoUrl: "https://exemplo.com/boleto1.pdf"
          },
          {
            id: "payment-002", 
            amount: 1400,
            dueDate: "2025-07-10T00:00:00Z",
            status: "PAID",
            paidDate: "2025-07-08T00:00:00Z"
          },
          {
            id: "payment-003",
            amount: 1400,
            dueDate: "2025-06-10T00:00:00Z", 
            status: "PAID",
            paidDate: "2025-06-05T00:00:00Z"
          }
        ]
      };

      // Simular resposta da API
      const result = {
        success: true,
        message: 'Login demo realizado com sucesso',
        contract: mockContract
      };

      if (result.success) {
        setContract(result.contract)
        setIsLoggedIn(true)
        localStorage.setItem('clientAuth', JSON.stringify(result.contract))
      } else {
        setError(result.message || 'Dados não encontrados')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setContract(null)
    localStorage.removeItem('clientAuth')
    setLoginData({ phone: '', document: '' })
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  const formatDocument = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const getPaymentStatus = (payment: any) => {
    if (payment.status === 'PAID') {
      return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', text: 'Pago' }
    }
    
    const dueDate = new Date(payment.dueDate)
    const today = new Date()
    
    if (dueDate < today && payment.status === 'PENDING') {
      return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', text: 'Vencido' }
    }
    
    return { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', text: 'Pendente' }
  }

  const downloadBoleto = (payment: any) => {
    if (payment.boletoUrl) {
      window.open(payment.boletoUrl, '_blank')
    } else {
      alert('Boleto não disponível para download')
    }
  }

  // Verificar se já está logado ao carregar
  useEffect(() => {
    const savedAuth = localStorage.getItem('clientAuth')
    if (savedAuth) {
      try {
        const contractData = JSON.parse(savedAuth)
        setContract(contractData)
        setIsLoggedIn(true)
      } catch (error) {
        localStorage.removeItem('clientAuth')
      }
    }
  }, [])

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Portal do Cliente</h1>
            <p className="text-gray-600">Acesse seus boletos e informações</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  required
                  placeholder="(11) 99999-9999"
                  value={loginData.phone}
                  onChange={(e) => setLoginData({...loginData, phone: formatPhone(e.target.value)})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={15}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CPF
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="000.000.000-00"
                  value={loginData.document}
                  onChange={(e) => setLoginData({...loginData, document: formatDocument(e.target.value)})}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={14}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !loginData.phone || !loginData.document}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Problemas para acessar? Entre em contato com a imobiliária.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const nextPayment = contract.payments
    .filter(p => p.status === 'PENDING')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]

  const recentPayments = contract.payments
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
    .slice(0, 6)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center">
              <Home className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Portal do Cliente</h1>
              <p className="text-sm text-gray-600">{contract.tenant.name}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Informações do Imóvel */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-start space-x-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <Home className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {contract.property.title}
              </h2>
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{contract.property.address}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Valor do Aluguel:</span>
                  <p className="font-semibold text-lg text-gray-900">
                    R$ {contract.rentAmount.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Início do Contrato:</span>
                  <p className="font-medium text-gray-900">
                    {new Date(contract.startDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Término do Contrato:</span>
                  <p className="font-medium text-gray-900">
                    {new Date(contract.endDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Próximo Vencimento */}
        {nextPayment && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Próximo Vencimento</h3>
                <p className="text-3xl font-bold mb-1">
                  R$ {nextPayment.amount.toLocaleString('pt-BR')}
                </p>
                <p className="text-blue-100">
                  Vence em {new Date(nextPayment.dueDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="text-right">
                <button
                  onClick={() => downloadBoleto(nextPayment)}
                  className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Ver Boleto</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Histórico de Pagamentos */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <History className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Histórico de Pagamentos</h3>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {recentPayments.map((payment) => {
              const status = getPaymentStatus(payment)
              const StatusIcon = status.icon
              
              return (
                <div key={payment.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${status.bg}`}>
                        <StatusIcon className={`w-4 h-4 ${status.color}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          R$ {payment.amount.toLocaleString('pt-BR')}
                        </p>
                        <p className="text-sm text-gray-600">
                          Vencimento: {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                        </p>
                        {payment.paidDate && (
                          <p className="text-sm text-green-600">
                            Pago em: {new Date(payment.paidDate).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                        {status.text}
                      </span>
                      {payment.boletoUrl && (
                        <button
                          onClick={() => downloadBoleto(payment)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Baixar boleto"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {contract.payments.length === 0 && (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhum pagamento encontrado</h4>
              <p className="text-gray-600">Os boletos aparecerão aqui quando forem gerados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}