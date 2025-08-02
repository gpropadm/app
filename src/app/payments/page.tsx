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
    property?: {
      title: string
      address: string
    }
    tenant?: {
      name: string
      email: string
      phone: string
    }
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
        
        // Debug: mostrar estrutura dos dados
        if (!silent && data.length > 0) {
          console.log('📊 Dados de pagamentos recebidos:', {
            total: data.length,
            sample: data[0],
            statuses: data.map((p: any) => p.status)
          })
        }
        
        // Verifica se há novos pagamentos pagos
        if (silent && payments.length > 0) {
          const newPaidPayments = data.filter((payment: Payment) => 
            payment.status === 'PAID' && 
            !payments.find(p => p.id === payment.id && p.status === 'PAID')
          )
          
          if (newPaidPayments.length > 0) {
            newPaidPayments.forEach((payment: Payment) => {
              const tenantName = payment.tenant?.name || payment.contract?.tenant?.name || 'Inquilino'
              showNotification('success', 
                `Pagamento de R$ ${payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} foi confirmado!`,
                `🎉 Boleto Pago - ${tenantName}`
              )
            })
          }
        }
        
        setPayments(data)
        setLastRefresh(new Date())
      } else {
        console.error('❌ Erro na API:', response.status)
        if (!silent) {
          showNotification('error', 'Erro ao carregar pagamentos. Tente novamente.')
        }
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
    const tenantName = payment.tenant?.name || payment.contract?.tenant?.name || ''
    const propertyTitle = payment.property?.title || payment.contract?.property?.title || ''
    
    const matchesSearch = 
      tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      propertyTitle.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Verificar se está vencido (para filtro especial)
    const dueDate = new Date(payment.dueDate)
    const today = new Date()
    const isOverdue = dueDate < today && payment.status !== 'PAID'
    
    let matchesStatus = true
    if (filterStatus === 'VENCIDOS') {
      matchesStatus = isOverdue
    } else if (filterStatus !== 'all') {
      matchesStatus = payment.status?.toUpperCase() === filterStatus.toUpperCase()
    }

    return matchesSearch && matchesStatus
  })

  const stats = {
    total: payments.length,
    paid: payments.filter(p => isPaidStatus(p.status)).length,
    overdue: payments.filter(p => {
      const dueDate = new Date(p.dueDate)
      const today = new Date()
      return dueDate < today && p.status !== 'PAID'
    }).length,
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
              {/* Botão de teste - remover depois */}
              <button
                onClick={() => showNotification('success', 
                  'Pagamento de R$ 1.500,00 foi confirmado!', 
                  '🎉 Boleto Pago - João Silva'
                )}
                className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
              >
                Teste
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
                <option value="VENCIDOS">Vencidos (precisam cobrança)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inquilino
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Propriedade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => {
                  const dueDate = new Date(payment.dueDate)
                  const today = new Date()
                  const isOverdue = dueDate < today && payment.status !== 'PAID'
                  const daysPastDue = isOverdue ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0
                  
                  return (
                    <tr key={payment.id} className={`hover:bg-gray-50 ${isOverdue ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {(payment.tenant?.name || payment.contract?.tenant?.name || 'Inquilino')
                                  .split(' ')
                                  .map(n => n[0])
                                  .slice(0, 2)
                                  .join('')}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {payment.tenant?.name || payment.contract?.tenant?.name || 'Inquilino não informado'}
                            </div>
                            {payment.contract?.tenant?.phone && (
                              <div className="text-sm text-gray-500">
                                📞 {payment.contract.tenant.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.property?.title || payment.contract?.property?.title || 'Não informada'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className={isOverdue ? 'text-red-600 font-semibold' : ''}>
                          {formatDate(payment.dueDate)}
                          {isOverdue && (
                            <div className="text-xs text-red-500">
                              {daysPastDue} dias em atraso
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(payment.status)}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                            {getStatusText(payment.status)}
                          </span>
                        </div>
                        {payment.paidDate && (
                          <div className="text-xs text-green-600 mt-1">
                            Pago em {formatDate(payment.paidDate)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {isOverdue && payment.contract?.tenant?.phone && (
                            <button
                              onClick={() => {
                                const phone = payment.contract?.tenant?.phone?.replace(/\D/g, '')
                                const message = `Olá ${payment.tenant?.name || payment.contract?.tenant?.name}, seu pagamento do aluguel de R$ ${payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} venceu em ${formatDate(payment.dueDate)} (${daysPastDue} dias atrás). Por favor, regularize sua situação.`
                                const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`
                                window.open(whatsappUrl, '_blank')
                              }}
                              className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 flex items-center space-x-1"
                              title="Cobrar via WhatsApp"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Cobrar</span>
                            </button>
                          )}
                          {payment.status !== 'PAID' && (
                            <button
                              onClick={() => {
                                // Aqui você pode implementar marcar como pago
                                showNotification('info', 'Funcionalidade de marcar como pago em desenvolvimento')
                              }}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                            >
                              Marcar Pago
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
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