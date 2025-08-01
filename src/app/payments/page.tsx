'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { 
  DollarSign, 
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  Eye,
  X,
  FileText,
  Download,
  Filter,
  Receipt,
  CreditCard,
  TrendingUp,
  Users,
  Home,
  ChevronRight,
  Star,
  MapPin,
  Phone,
  Mail,
  Building,
  Wallet,
  BadgeCheck,
  Timer,
  ExternalLink,
  Paperclip,
  ImageIcon,
  FileImage,
  Zap,
  RefreshCw,
  Bell,
  Plus
} from 'lucide-react'

interface Payment {
  id: string
  amount: number
  dueDate: string
  status: string
  receiptUrl?: string
  receipts?: string | any[]
  paidDate?: string
  paymentMethod?: string
  notes?: string
  tenant?: {
    name: string
  }
  property?: {
    title: string
    address: string
  }
  contract?: {
    id: string
  }
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [includeInterest, setIncludeInterest] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState('dinheiro')
  const [notes, setNotes] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedFileUrl, setUploadedFileUrl] = useState('')
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [viewingReceipt, setViewingReceipt] = useState<Payment | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'info', message: string, title?: string} | null>(null)

  // Notificação em tempo real
  const showNotification = (type: 'success' | 'error' | 'info', message: string, title?: string) => {
    setNotification({ type, message, title })
    setTimeout(() => setNotification(null), 5000)
  }

  // Auto-refresh a cada 30 segundos se habilitado
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchPayments(true) // true = silent refresh
    }, 30000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async (silent = false) => {
    if (!silent) setLoading(true)
    
    try {
      const response = await fetch('/api/payments')
      if (response.ok) {
        const data = await response.json()
        
        // Verifica se há novos pagamentos pagos
        if (silent && payments.length > 0) {
          const newPaidPayments = data.filter((payment: Payment) => 
            payment.status === 'PAID' && 
            !payments.find(p => p.id === payment.id && p.status === 'PAID')
          )
          
          if (newPaidPayments.length > 0) {
            newPaidPayments.forEach((payment: Payment) => {
              showNotification('success', 
                `Pagamento de R$ ${payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} foi confirmado!`,
                `🎉 Boleto Pago - ${payment.tenant?.name}`
              )
            })
          }
        }
        
        setPayments(data)
        setLastRefresh(new Date())
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
      if (!silent) {
        showNotification('error', 'Erro ao carregar pagamentos. Tente novamente.')
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const isPaidStatus = (status: string) => {
    return status?.toUpperCase() === 'PAID'
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'OVERDUE':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return 'Pago'
      case 'OVERDUE':
        return 'Em Atraso'
      case 'PENDING':
        return 'Pendente'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'OVERDUE':
        return 'bg-red-100 text-red-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data não informada'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('pt-BR')
    } catch {
      return 'Data inválida'
    }
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.tenant?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.property?.title.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || payment.status?.toUpperCase() === filterStatus.toUpperCase()

    return matchesSearch && matchesStatus
  })

  const stats = {
    total: payments.length,
    paid: payments.filter(p => isPaidStatus(p.status)).length,
    overdue: payments.filter(p => p.status?.toUpperCase() === 'OVERDUE').length,
    totalValue: payments
      .filter(p => isPaidStatus(p.status))
      .reduce((sum, p) => sum + p.amount, 0)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{borderColor: '#f63c6a'}}></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Notificação */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl border max-w-sm transform transition-all duration-300 ${
            notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
            notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {notification.type === 'success' && <CheckCircle className="w-6 h-6 text-green-600" />}
                {notification.type === 'error' && <AlertTriangle className="w-6 h-6 text-red-600" />}
                {notification.type === 'info' && <Bell className="w-6 h-6 text-blue-600" />}
              </div>
              <div className="flex-1">
                {notification.title && (
                  <h4 className="font-semibold mb-1">{notification.title}</h4>
                )}
                <p className="text-sm">{notification.message}</p>
              </div>
              <button 
                onClick={() => setNotification(null)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pagamentos</h1>
              <p className="text-gray-600 mt-1">
                Gerencie todos os pagamentos de aluguéis
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <RefreshCw className="w-4 h-4" />
                <span>Última atualização: {lastRefresh.toLocaleTimeString('pt-BR')}</span>
              </div>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  autoRefresh 
                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {autoRefresh ? 'Auto ON' : 'Auto OFF'}
              </button>
              <button
                onClick={() => fetchPayments()}
                className="px-4 py-2 text-white rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                style={{backgroundColor: '#f63c6a'}}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Pagamentos</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pagamentos Confirmados</p>
                <p className="text-2xl font-bold text-green-900 mt-2">{stats.paid}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Em Atraso</p>
                <p className="text-2xl font-bold text-red-900 mt-2">{stats.overdue}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Recebido</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  R$ {stats.totalValue.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por inquilino ou propriedade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos os Status</option>
                <option value="PAID">Pago</option>
                <option value="PENDING">Pendente</option>
                <option value="OVERDUE">Em Atraso</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payments List */}
        <div className="space-y-4">
          {filteredPayments.map((payment) => (
            <div key={payment.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{backgroundColor: '#fef2f2'}}>
                    <Receipt className="w-6 h-6" style={{color: '#f63c6a'}} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {payment.tenant?.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(payment.status)}
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(payment.status)}`}>
                          {getStatusText(payment.status)}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Propriedade:</div>
                        <div className="flex items-center text-gray-900">
                          <Home className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="truncate font-medium">{payment.property?.title}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Vencimento:</div>
                        <div className="flex items-center text-gray-900">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="font-medium">{formatDate(payment.dueDate)}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Valor:</div>
                        <div className="flex items-center text-gray-900">
                          <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="font-bold text-lg">R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                    {payment.paidDate && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center text-green-800 text-sm">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          <span>Pago em {formatDate(payment.paidDate)}</span>
                          {payment.paymentMethod && (
                            <span className="ml-2 px-2 py-1 bg-green-100 rounded text-xs">
                              {payment.paymentMethod.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPayments.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Receipt className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum pagamento encontrado
            </h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all'
                ? 'Tente ajustar os filtros de busca.'
                : 'Aguardando pagamentos...'}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}