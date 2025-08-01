'use client'

import { useState, useEffect } from 'react'
import { 
  Home, 
  History, 
  Phone, 
  Lock,
  Eye,
  EyeOff,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  MapPin,
  Menu,
  X,
  User,
  Bell,
  Wallet,
  Settings,
  MessageCircle,
  LogOut,
  Zap,
  Calendar,
  TrendingUp
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
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')

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
            status: "PENDING" as const,
            boletoUrl: "https://exemplo.com/boleto1.pdf"
          },
          {
            id: "payment-002", 
            amount: 1400,
            dueDate: "2025-07-10T00:00:00Z",
            status: "PAID" as const,
            paidDate: "2025-07-08T00:00:00Z"
          },
          {
            id: "payment-003",
            amount: 1400,
            dueDate: "2025-06-10T00:00:00Z", 
            status: "PAID" as const,
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  const nextPayment = contract.payments
    .filter(p => p.status === 'PENDING')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]

  const recentPayments = contract.payments
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
    .slice(0, 6)

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'boletos', label: 'Meus Boletos', icon: Wallet },
    { id: 'historico', label: 'Histórico', icon: History },
    { id: 'perfil', label: 'Meu Perfil', icon: User },
    { id: 'manutencoes', label: 'Manutenções', icon: Settings },
    { id: 'contato', label: 'Contato', icon: MessageCircle },
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardContent contract={contract} nextPayment={nextPayment} setActiveSection={setActiveSection} />
      case 'boletos':
        return <BoletosContent contract={contract} />
      case 'historico':
        return <HistoricoContent payments={recentPayments} />
      case 'perfil':
        return <PerfilContent contract={contract} />
      case 'manutencoes':
        return <ManutencoesContent />
      case 'contato':
        return <ContatoContent />
      default:
        return <DashboardContent contract={contract} nextPayment={nextPayment} setActiveSection={setActiveSection} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Modern Header */}
      <header className="bg-white/95 backdrop-blur-xl shadow-lg border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Portal Cliente
              </h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors group">
                <Bell className="w-5 h-5 text-slate-600 group-hover:text-slate-700" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              </button>
              <button 
                onClick={() => setActiveSection('perfil')}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:scale-105 transition-all duration-200"
              >
                <User className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modern Sidebar Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-2xl">
            {/* Profile Header */}
            <div className="p-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                    <User className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">{contract.tenant.name}</h2>
                    <p className="text-indigo-100 text-sm opacity-90">Cliente Premium</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-xl hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Navigation Menu */}
            <div className="p-4 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id)
                      setIsMenuOpen(false)
                      // Smooth scroll to top
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-[0.98]'
                        : 'hover:bg-slate-50 text-slate-700 hover:scale-[0.99]'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${
                      isActive ? 'bg-white/20' : 'bg-slate-100'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-semibold">{item.label}</span>
                  </button>
                )
              })}
              
              <div className="border-t border-slate-200 pt-4 mt-6">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-4 p-4 rounded-2xl hover:bg-red-50 text-red-600 transition-all duration-200 hover:scale-[0.99]"
                >
                  <div className="p-2 rounded-xl bg-red-100">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <span className="font-semibold">Sair</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6 transition-all duration-500 ease-in-out">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}

// Componentes das seções
function DashboardContent({ contract, nextPayment, setActiveSection }: { contract: ClientContract, nextPayment: any, setActiveSection: (section: string) => void }) {
  return (
    <div className="space-y-8">
      {/* Modern Welcome Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 rounded-3xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/5 rounded-full"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-white/5 rounded-full"></div>
        
        <div className="relative flex items-center space-x-6">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-xl">
            <Home className="w-10 h-10" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">Olá, {contract.tenant.name.split(' ')[0]}! 👋</h2>
            <p className="text-indigo-100 text-lg font-medium mb-2">{contract.property.title}</p>
            <div className="flex items-center text-indigo-200">
              <MapPin className="w-5 h-5 mr-2" />
              <span className="text-sm">{contract.property.address}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/50 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-slate-900">2</p>
              <p className="text-sm font-medium text-slate-600 mt-1">Pagos</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 w-full bg-green-100 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{width: '66%'}}></div>
          </div>
        </div>
        
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/50 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-slate-900">1</p>
              <p className="text-sm font-medium text-slate-600 mt-1">Pendente</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-yellow-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 w-full bg-yellow-100 rounded-full h-2">
            <div className="bg-yellow-500 h-2 rounded-full" style={{width: '33%'}}></div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/50 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-slate-900">R$ 1,4k</p>
              <p className="text-sm font-medium text-slate-600 mt-1">Aluguel</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-green-600 text-sm">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>Em dia</span>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/50 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-slate-900">10</p>
              <p className="text-sm font-medium text-slate-600 mt-1">Dias</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-slate-600">
            Próximo vencimento
          </div>
        </div>
      </div>

      {/* Enhanced Next Payment Card */}
      {nextPayment && (
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-slate-200/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full -mr-16 -mt-16"></div>
          
          <div className="relative">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Próximo Vencimento</h3>
                </div>
                
                <p className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  R$ {nextPayment.amount.toLocaleString('pt-BR')}
                </p>
                <p className="text-slate-600 text-lg font-medium">
                  {new Date(nextPayment.dueDate).toLocaleDateString('pt-BR', { 
                    day: 'numeric', 
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-2xl font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2">
                <Download className="w-5 h-5" />
                <span>Ver Boleto</span>
              </button>
              <button className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2">
                <Zap className="w-5 h-5" />
                <span>Pagar PIX</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <button 
          onClick={() => setActiveSection('boletos')}
          className="group bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-slate-200/50 hover:shadow-2xl hover:scale-105 transition-all duration-300 text-left"
        >
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-lg">Meus Boletos</p>
              <p className="text-sm text-slate-600">Ver todos os pagamentos</p>
            </div>
          </div>
        </button>
        
        <button 
          onClick={() => setActiveSection('contato')}
          className="group bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-slate-200/50 hover:shadow-2xl hover:scale-105 transition-all duration-300 text-left"
        >
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <MessageCircle className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-lg">Suporte</p>
              <p className="text-sm text-slate-600">Fale conosco</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => setActiveSection('manutencoes')}
          className="group bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-slate-200/50 hover:shadow-2xl hover:scale-105 transition-all duration-300 text-left sm:col-span-2 lg:col-span-1"
        >
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Settings className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-lg">Manutenções</p>
              <p className="text-sm text-slate-600">Solicitar reparo</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}

function BoletosContent({ contract }: { contract: ClientContract }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800 border-green-200'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'OVERDUE': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Meus Boletos</h2>
        <div className="flex items-center space-x-2 text-sm text-slate-600">
          <Wallet className="w-4 h-4" />
          <span>{contract.payments.length} boletos</span>
        </div>
      </div>
      
      <div className="grid gap-4">
        {contract.payments.map((payment) => (
          <div key={payment.id} className="group bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-slate-200/50 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  payment.status === 'PAID' ? 'bg-green-100' : payment.status === 'OVERDUE' ? 'bg-red-100' : 'bg-yellow-100'
                }`}>
                  {payment.status === 'PAID' ? 
                    <CheckCircle className="w-7 h-7 text-green-600" /> :
                    payment.status === 'OVERDUE' ? 
                    <AlertCircle className="w-7 h-7 text-red-600" /> :
                    <Clock className="w-7 h-7 text-yellow-600" />
                  }
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">R$ {payment.amount.toLocaleString('pt-BR')}</p>
                  <p className="text-slate-600 font-medium">
                    Vencimento: {new Date(payment.dueDate).toLocaleDateString('pt-BR', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                  {payment.paidDate && (
                    <p className="text-green-600 text-sm font-medium">
                      Pago em: {new Date(payment.paidDate).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`px-4 py-2 rounded-2xl text-sm font-semibold border ${getStatusColor(payment.status)}`}>
                  {payment.status === 'PAID' ? 'Pago' : payment.status === 'OVERDUE' ? 'Vencido' : 'Pendente'}
                </span>
                <button className="p-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-xl hover:scale-110 transition-all duration-200 group-hover:scale-110">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {contract.payments.length === 0 && (
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-12 text-center shadow-xl border border-slate-200/50">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhum boleto encontrado</h3>
          <p className="text-slate-600">Os boletos aparecerão aqui quando forem gerados.</p>
        </div>
      )}
    </div>
  )
}

function HistoricoContent({ payments }: { payments: any[] }) {
  const sortedPayments = payments.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Histórico</h2>
        <div className="flex items-center space-x-2 text-sm text-slate-600">
          <History className="w-4 h-4" />
          <span>{payments.length} registros</span>
        </div>
      </div>
      
      <div className="space-y-4">
        {sortedPayments.map((payment, index) => (
          <div key={payment.id} className="group bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200/50 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className={`w-4 h-4 rounded-full ${
                    payment.status === 'PAID' ? 'bg-green-500' : 
                    payment.status === 'OVERDUE' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                  {index < sortedPayments.length - 1 && (
                    <div className="absolute top-4 left-1/2 w-px h-6 bg-slate-200 transform -translate-x-1/2" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <p className="text-xl font-bold text-slate-900">R$ {payment.amount.toLocaleString('pt-BR')}</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      payment.status === 'PAID' ? 'bg-green-100 text-green-800' : 
                      payment.status === 'OVERDUE' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {payment.status === 'PAID' ? 'Pago' : payment.status === 'OVERDUE' ? 'Vencido' : 'Pendente'}
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium">
                    Vencimento: {new Date(payment.dueDate).toLocaleDateString('pt-BR', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                  {payment.paidDate && (
                    <p className="text-green-600 text-sm font-medium mt-1">
                      ✓ Pago em: {new Date(payment.paidDate).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-slate-500 mb-1">
                  {new Date(payment.dueDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).toUpperCase()}
                </p>
                {payment.boletoUrl && (
                  <button className="p-2 rounded-xl bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-600 transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {payments.length === 0 && (
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-12 text-center shadow-xl border border-slate-200/50">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <History className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhum histórico</h3>
          <p className="text-slate-600">O histórico de pagamentos aparecerá aqui.</p>
        </div>
      )}
    </div>
  )
}

function PerfilContent({ contract }: { contract: ClientContract }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Meu Perfil</h2>
        <button className="flex items-center space-x-2 px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
          <Settings className="w-4 h-4" />
          <span className="text-sm font-medium">Editar</span>
        </button>
      </div>
      
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <div className="relative flex items-center space-x-6">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <User className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-1">{contract.tenant.name}</h3>
            <p className="text-indigo-100 font-medium">{contract.tenant.phone}</p>
            <p className="text-indigo-200 text-sm">{contract.tenant.document}</p>
          </div>
        </div>
      </div>
      
      {/* Personal Information */}
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-slate-200/50">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Dados Pessoais</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Nome Completo</label>
            <p className="text-lg font-medium text-slate-900 bg-slate-50 p-3 rounded-xl">{contract.tenant.name}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Telefone</label>
            <p className="text-lg font-medium text-slate-900 bg-slate-50 p-3 rounded-xl">{contract.tenant.phone}</p>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">CPF</label>
            <p className="text-lg font-medium text-slate-900 bg-slate-50 p-3 rounded-xl">{contract.tenant.document}</p>
          </div>
        </div>
      </div>

      {/* Property Information */}
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-slate-200/50">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-green-100 flex items-center justify-center">
            <Home className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Imóvel</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Endereço</label>
            <p className="text-lg font-medium text-slate-900 bg-slate-50 p-3 rounded-xl flex items-center">
              <MapPin className="w-4 h-4 text-slate-500 mr-2" />
              {contract.property.address}
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Valor do Aluguel</label>
            <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent bg-slate-50 p-3 rounded-xl">
              R$ {contract.rentAmount.toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Início do Contrato</label>
            <p className="text-lg font-medium text-slate-900 bg-slate-50 p-3 rounded-xl">
              {new Date(contract.startDate).toLocaleDateString('pt-BR', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Término do Contrato</label>
            <p className="text-lg font-medium text-slate-900 bg-slate-50 p-3 rounded-xl">
              {new Date(contract.endDate).toLocaleDateString('pt-BR', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ManutencoesContent() {
  const [showForm, setShowForm] = useState(false)
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Manutenções</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
        >
          <Settings className="w-5 h-5" />
          <span>Nova Solicitação</span>
        </button>
      </div>
      
      {/* Request Form */}
      {showForm && (
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-slate-200/50">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Solicitar Manutenção</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Tipo de Problema</label>
              <select className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                <option>Elétrica</option>
                <option>Hidráulica</option>
                <option>Pintura</option>
                <option>Estrutural</option>
                <option>Outros</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Descrição</label>
              <textarea 
                rows={4} 
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
                placeholder="Descreva o problema em detalhes..."
              />
            </div>
            <div className="flex space-x-3">
              <button className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-xl transition-all">
                Enviar Solicitação
              </button>
              <button 
                onClick={() => setShowForm(false)}
                className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Empty State */}
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-12 text-center shadow-xl border border-slate-200/50">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-emerald-100 to-green-100 flex items-center justify-center mx-auto mb-6">
          <Settings className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-3">Nenhuma manutenção ativa</h3>
        <p className="text-slate-600 text-lg mb-6 max-w-md mx-auto">
          Você não possui solicitações de manutenção no momento. 
          Quando precisar, use o botão acima para criar uma nova solicitação.
        </p>
        <div className="flex items-center justify-center space-x-8 text-sm text-slate-500">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Resposta rápida</span>
          </div>
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4 text-blue-500" />
            <span>Suporte 24/7</span>
          </div>
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-4 h-4 text-purple-500" />
            <span>Acompanhamento</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ContatoContent() {
  const contactMethods = [
    {
      id: 'whatsapp',
      title: 'WhatsApp',
      description: 'Converse conosco pelo WhatsApp',
      phone: '(61) 99999-0000',
      icon: MessageCircle,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
      textColor: 'text-green-600',
      action: () => window.open('https://wa.me/5561999990000', '_blank')
    },
    {
      id: 'phone',
      title: 'Telefone',
      description: 'Ligue para nosso atendimento',
      phone: '(61) 3333-4444',
      icon: Phone,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      textColor: 'text-blue-600',
      action: () => window.open('tel:+556133334444', '_self')
    }
  ]

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">Fale Conosco</h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Estamos aqui para ajudar! Entre em contato conosco pelos canais abaixo.
        </p>
      </div>
      
      {/* Contact Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contactMethods.map((method) => {
          const Icon = method.icon
          return (
            <button
              key={method.id}
              onClick={method.action}
              className={`group w-full p-8 rounded-3xl ${method.bgColor} border-2 border-transparent hover:border-slate-200 transition-all duration-300 hover:scale-105 hover:shadow-xl text-left`}
            >
              <div className="flex items-center space-x-6">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${method.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{method.title}</h3>
                  <p className="text-slate-600 mb-2">{method.description}</p>
                  <p className={`text-lg font-bold ${method.textColor}`}>{method.phone}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
      
      {/* Business Hours */}
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-slate-200/50">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Horário de Atendimento</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50">
              <span className="font-semibold text-slate-700">Segunda - Sexta</span>
              <span className="font-bold text-slate-900">8h às 18h</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50">
              <span className="font-semibold text-slate-700">Sábados</span>
              <span className="font-bold text-slate-900">9h às 13h</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50">
              <span className="font-semibold text-slate-700">Domingos</span>
              <span className="font-medium text-slate-500">Fechado</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-green-50">
              <span className="font-semibold text-green-700">WhatsApp</span>
              <span className="font-bold text-green-600">24h</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Emergency Contact */}
      <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <div className="relative">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Emergência</h3>
          </div>
          <p className="mb-4 text-red-100">
            Para emergências (vazamentos, falta de energia, etc.), entre em contato imediatamente:
          </p>
          <button 
            onClick={() => window.open('tel:+556199999000', '_self')}
            className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-2xl hover:bg-white/30 transition-colors"
          >
            <Phone className="w-5 h-5" />
            <span className="font-bold">(61) 99999-0000</span>
          </button>
        </div>
      </div>
    </div>
  )
}