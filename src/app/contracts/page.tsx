'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { ContractForm } from '@/components/contract-form'
import { AIContractForm } from '@/components/ai-contract-form'
import { ContractMaintenances } from '@/components/contract-maintenances'
import { DeleteConfirmationModal } from '@/components/delete-confirmation-modal'
import { ToastContainer, useToast } from '@/components/toast'
import { 
  FileText, 
  Plus, 
  Search, 
  Calendar,
  User,
  Building2,
  Edit,
  Eye,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  Trash2,
  DollarSign,
  CalendarDays
} from 'lucide-react'

interface Contract {
  id: string
  startDate: string
  endDate: string
  rentAmount: number
  depositAmount: number
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'RENEWED'
  terms?: string
  property: {
    id: string
    title: string
    address: string
    propertyType: string
    owner: {
      id: string
      name: string
      email: string
    }
  }
  tenant: {
    id: string
    name: string
    email: string
    phone: string
  }
  payments: Array<{
    id: string
    amount: number
    dueDate: string
    status: string
  }>
}

export default function Contracts() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingContract, setEditingContract] = useState<Contract | null>(null)
  const [showContractDetails, setShowContractDetails] = useState(false)
  const [viewingContract, setViewingContract] = useState<Contract | null>(null)
  const [deletingContractId, setDeletingContractId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null)
  
  const { toasts, removeToast, showSuccess, showError } = useToast()

  useEffect(() => {
    fetchContracts()
    
    // Listen for payment updates from other components
    const handlePaymentUpdate = () => {
      fetchContracts()
    }
    
    window.addEventListener('paymentUpdated', handlePaymentUpdate)
    
    return () => {
      window.removeEventListener('paymentUpdated', handlePaymentUpdate)
    }
  }, [])

  const fetchContracts = async () => {
    try {
      const response = await fetch('/api/contracts')
      if (response.ok) {
        const data = await response.json()
        setContracts(data)
      }
    } catch (error) {
      console.error('Error fetching contracts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateContract = async (data: any) => {
    try {
      console.log('📋 Creating contract with data:', data)
      
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      console.log('📡 Contract creation response status:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Contract created successfully:', result)
        await fetchContracts()
        setShowForm(false)
        showSuccess('Contrato criado!', 'O contrato foi cadastrado com sucesso.')
      } else {
        const errorData = await response.json()
        console.error('❌ Contract creation failed:', errorData)
        showError('Erro ao criar contrato', errorData.error || errorData.details || 'Tente novamente.')
      }
    } catch (error) {
      console.error('❌ Network error creating contract:', error)
      showError('Erro ao criar contrato', 'Verifique sua conexão e tente novamente.')
    }
  }

  const handleEditContract = async (data: any) => {
    if (!editingContract) return

    try {
      const response = await fetch(`/api/contracts/${editingContract.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        await fetchContracts()
        setShowForm(false)
        setEditingContract(null)
        showSuccess('Contrato atualizado!', 'As informações foram atualizadas com sucesso.')
      } else {
        const errorData = await response.json()
        showError('Erro ao atualizar contrato', errorData.error || 'Tente novamente.')
      }
    } catch (error) {
      console.error('Error updating contract:', error)
      showError('Erro ao atualizar contrato', 'Verifique sua conexão e tente novamente.')
    }
  }

  const handleDeleteContract = async (contract: Contract) => {
    setContractToDelete(contract)
    setShowDeleteModal(true)
  }

  const confirmDeleteContract = async () => {
    if (!contractToDelete) return

    try {
      setDeletingContractId(contractToDelete.id)
      const response = await fetch(`/api/contracts/${contractToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchContracts()
        showSuccess('Contrato excluído!', 'O contrato foi removido com sucesso.')
      } else {
        const errorData = await response.json()
        showError('Erro ao excluir contrato', errorData.error || 'Tente novamente.')
      }
    } catch (error) {
      console.error('Error deleting contract:', error)
      showError('Erro ao excluir contrato', 'Verifique sua conexão e tente novamente.')
    } finally {
      setDeletingContractId(null)
      setContractToDelete(null)
    }
  }

  const openEditForm = (contract: Contract) => {
    setEditingContract(contract)
    setShowForm(true)
  }


  const closeForm = () => {
    setShowForm(false)
    setEditingContract(null)
  }

  const downloadContract = (contract: Contract) => {
    if (!contract.terms) {
      alert('Este contrato não possui termos disponíveis para download.')
      return
    }

    // Format contract content
    const contractContent = `
CONTRATO DE LOCAÇÃO

Contrato: ${contract.id}
Imóvel: ${contract.property.title}
Endereço: ${contract.property.address}
Inquilino: ${contract.tenant.name}
Proprietário: ${contract.property.owner.name}
Período: ${formatDate(contract.startDate)} até ${formatDate(contract.endDate)}
Valor do Aluguel: R$ ${contract.rentAmount.toLocaleString('pt-BR')}
Valor do Depósito: R$ ${contract.depositAmount.toLocaleString('pt-BR')}

=====================================

${contract.terms}

=====================================

Documento gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
Sistema: CRM Imobiliário
    `.trim()

    // Create and download file
    const blob = new Blob([contractContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `contrato-${contract.property.title.replace(/[^a-zA-Z0-9]/g, '-')}-${contract.tenant.name.replace(/[^a-zA-Z0-9]/g, '-')}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const viewContractDetails = (contract: Contract) => {
    setViewingContract(contract)
    setShowContractDetails(true)
  }

  const closeContractDetails = () => {
    setShowContractDetails(false)
    setViewingContract(null)
  }

  const generateBoleto = async (contract: Contract) => {
    try {
      const dueDate = new Date()
      dueDate.setMonth(dueDate.getMonth() + 1)
      dueDate.setDate(10) // Vencimento dia 10 do próximo mês
      
      showSuccess('Gerando boleto...', 'Criando boleto com split automático')
      
      const response = await fetch('/api/asaas/generate-boleto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId: contract.id,
          amount: contract.rentAmount,
          dueDate: dueDate.toISOString(),
          description: `Aluguel - ${contract.property.title} - ${dueDate.toLocaleDateString('pt-BR')}`
        }),
      })

      const result = await response.json()

      if (result.success) {
        showSuccess('Boleto Gerado!', `Boleto criado com split automático`)
        
        // Mostrar detalhes do split
        console.log('Detalhes do split:', result.splitDetails)
        
        // Abrir boleto em nova aba se disponível
        if (result.boletoUrl) {
          window.open(result.boletoUrl, '_blank')
        }
        
        fetchContracts() // Recarregar contratos
      } else {
        showError('Erro', result.message || 'Falha ao gerar boleto')
      }
    } catch (error) {
      console.error('Error generating boleto:', error)
      showError('Erro', 'Falha ao gerar boleto com split')
    }
  }

  const generateMonthlyBoletos = async (contract: Contract) => {
    const months = prompt('Quantos meses de boletos deseja gerar?', '12')
    
    if (!months || isNaN(Number(months)) || Number(months) < 1) {
      showError('Erro', 'Digite um número válido de meses')
      return
    }

    try {
      showSuccess('Gerando boletos mensais...', `Criando ${months} boletos com split automático`)
      
      const response = await fetch('/api/asaas/generate-monthly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId: contract.id,
          months: Number(months),
          startFromNextMonth: true
        }),
      })

      console.log('Response status:', response.status)
      const result = await response.json()
      console.log('Full result:', result)

      if (result.success) {
        showSuccess(
          'Boletos Gerados!', 
          `${result.paymentsGenerated} boletos criados para ${result.contractInfo?.tenant}`
        )
        
        if (result.errors && result.errors.length > 0) {
          console.warn('Alguns erros ocorreram:', result.errors)
          showError('Atenção', `${result.paymentsGenerated} boletos criados, mas alguns falharam`)
        }
        
        fetchContracts() // Recarregar contratos
      } else {
        console.error('API Error:', result)
        showError('Erro detalhado', result.error || result.message || 'Falha ao gerar boletos mensais')
      }
    } catch (error) {
      console.error('Network/Parse error:', error)
      showError('Erro de rede', `Falha na comunicação: ${error.message}`)
    }
  }

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = 
      contract.tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.property.owner.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || contract.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'EXPIRED':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'CANCELLED':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'RENEWED':
        return <Clock className="w-5 h-5 text-blue-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Ativo'
      case 'EXPIRED':
        return 'Expirado'
      case 'CANCELLED':
        return 'Cancelado'
      case 'RENEWED':
        return 'Renovado'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'EXPIRED':
        return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'RENEWED':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPropertyTypeText = (type: string) => {
    switch (type) {
      case 'APARTMENT':
        return 'Apartamento'
      case 'HOUSE':
        return 'Casa'
      case 'COMMERCIAL':
        return 'Comercial'
      case 'LAND':
        return 'Terreno'
      case 'STUDIO':
        return 'Studio'
      default:
        return type
    }
  }

  // Função helper para formatar datas de forma segura
  const formatDate = (dateInput: string | Date | null | undefined) => {
    if (!dateInput) return 'Data não informada'
    
    console.log('📅 Formatando data:', dateInput, 'Type:', typeof dateInput)
    
    try {
      let date: Date
      
      // Se já é um objeto Date
      if (dateInput instanceof Date) {
        date = dateInput
      }
      // Se é string
      else if (typeof dateInput === 'string') {
        // Se já tem horário, usar como está
        if (dateInput.includes('T')) {
          date = new Date(dateInput)
        } else {
          // Se é só data (YYYY-MM-DD), adicionar horário
          date = new Date(dateInput + 'T00:00:00')
        }
      }
      // Tentar converter qualquer outro tipo
      else {
        date = new Date(dateInput as string)
      }
      
      // Verificar se é uma data válida
      if (isNaN(date.getTime())) {
        console.warn('Data inválida:', dateInput)
        return 'Data inválida'
      }
      
      return date.toLocaleDateString('pt-BR')
    } catch (error) {
      console.error('Erro ao formatar data:', dateInput, error)
      return 'Data inválida'
    }
  }

  const getDaysUntilExpiration = (endDate: string | Date) => {
    if (!endDate) return 0
    
    try {
      const today = new Date()
      let expiration: Date
      
      if (endDate instanceof Date) {
        expiration = endDate
      } else if (typeof endDate === 'string') {
        expiration = endDate.includes('T') ? new Date(endDate) : new Date(endDate + 'T00:00:00')
      } else {
        expiration = new Date(endDate as string)
      }
      
      if (isNaN(expiration.getTime())) return 0
      
      const diffTime = expiration.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    } catch (error) {
      console.error('Erro ao calcular dias até expiração:', endDate, error)
      return 0
    }
  }

  const stats = {
    total: contracts.length,
    active: contracts.filter(c => c.status === 'ACTIVE').length,
    expiring: contracts.filter(c => {
      const days = getDaysUntilExpiration(c.endDate)
      return days <= 30 && days > 0 && c.status === 'ACTIVE'
    }).length,
    totalValue: contracts
      .filter(c => c.status === 'ACTIVE')
      .reduce((sum, c) => sum + c.rentAmount, 0)
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contratos</h1>
            <p className="text-gray-600 mt-1">
              Gerencie todos os contratos de locação
            </p>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 text-white rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
            style={{backgroundColor: '#f63c6a'}}
            onMouseEnter={(e) => {
              const target = e.target as HTMLButtonElement
              target.style.backgroundColor = '#e03659'
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement
              target.style.backgroundColor = '#f63c6a'
            }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Contrato
          </button>
        </div>


        {/* Stats - Hidden on mobile */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Contratos</p>
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
                <p className="text-sm font-medium text-gray-600">Contratos Ativos</p>
                <p className="text-2xl font-bold text-green-900 mt-2">{stats.active}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vencendo em 30 dias</p>
                <p className="text-2xl font-bold text-yellow-900 mt-2">{stats.expiring}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Total Mensal</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  R$ {stats.totalValue.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
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
                placeholder="Buscar por inquilino, imóvel ou proprietário..."
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
                <option value="ACTIVE">Ativo</option>
                <option value="EXPIRED">Expirado</option>
                <option value="CANCELLED">Cancelado</option>
                <option value="RENEWED">Renovado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contracts List */}
        <div className="space-y-4">
          {filteredContracts.map((contract) => {
            const daysUntilExpiration = getDaysUntilExpiration(contract.endDate)
            const isExpiringSoon = daysUntilExpiration <= 30 && daysUntilExpiration > 0
            
            return (
              <div key={contract.id} className={`bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow ${
                deletingContractId === contract.id ? 'opacity-60 bg-red-50' : ''
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{backgroundColor: '#fef2f2'}}>
                      <FileText className="w-5 h-5" style={{color: '#f63c6a'}} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {contract.property.title}
                        </h3>
                        <div className="flex items-center space-x-2 ml-4">
                          {getStatusIcon(contract.status)}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(contract.status)}`}>
                            {getStatusText(contract.status)}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Inquilino:</div>
                          <div className="flex items-center text-gray-900">
                            <User className="w-4 h-4 mr-2" />
                            <span className="truncate font-medium">{contract.tenant.name}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Tipo:</div>
                          <div className="flex items-center text-gray-900">
                            <Building2 className="w-4 h-4 mr-2" />
                            <span className="truncate font-medium">{getPropertyTypeText(contract.property.propertyType)}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Tempo Contrato:</div>
                          <div className="flex items-center text-gray-900">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span className="truncate font-medium">{formatDate(contract.startDate)} até {formatDate(contract.endDate)}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Valor:</div>
                          <div className="flex items-center text-gray-900">
                            <span className="font-bold">R$ {contract.rentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mês</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {isExpiringSoon && (
                  <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                    <div className="flex items-center">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
                      <span className="text-xs text-yellow-800">
                        Vence em {daysUntilExpiration} dias
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end mt-3">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => viewContractDetails(contract)}
                      className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => generateBoleto(contract)}
                      className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Gerar Boleto com Split"
                      disabled={contract.status !== 'ACTIVE'}
                    >
                      <DollarSign className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => generateMonthlyBoletos(contract)}
                      className="p-2 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Gerar Boletos Mensais"
                      disabled={contract.status !== 'ACTIVE'}
                    >
                      <CalendarDays className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => downloadContract(contract)}
                      className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors"
                      title="Baixar contrato"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => openEditForm(contract)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      style={{color: '#f63c6a'}}
                      title="Editar contrato"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteContract(contract)}
                      disabled={deletingContractId === contract.id}
                      className={`p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors ${
                        deletingContractId === contract.id ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      title="Excluir contrato"
                    >
                      {deletingContractId === contract.id ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <button 
                    onClick={() => viewContractDetails(contract)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Ver Detalhes
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {filteredContracts.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum contrato encontrado
            </h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all'
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece criando um novo contrato ou use a IA para gerar automaticamente.'}
            </p>
          </div>
        )}

        {/* AI Contract Generator Modal */}
        <AIContractForm
          isOpen={showAIGenerator}
          onClose={() => setShowAIGenerator(false)}
          onSuccess={() => {
            fetchContracts()
            setShowAIGenerator(false)
          }}
        />

        {/* Contract Form Modal */}
        <ContractForm
          isOpen={showForm}
          onClose={closeForm}
          onSubmit={editingContract ? handleEditContract : handleCreateContract}
          contract={editingContract || undefined}
        />

        {/* Contract Details Modal */}
        {showContractDetails && viewingContract && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  Detalhes do Contrato
                </h2>
                <button
                  onClick={closeContractDetails}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Contract Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Informações do Contrato</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">ID:</span> {viewingContract.id}</p>
                      <p><span className="font-medium">Status:</span> 
                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(viewingContract.status)}`}>
                          {getStatusText(viewingContract.status)}
                        </span>
                      </p>
                      <p><span className="font-medium">Período:</span> {new Date(viewingContract.startDate).toLocaleDateString('pt-BR')} até {new Date(viewingContract.endDate).toLocaleDateString('pt-BR')}</p>
                      <p><span className="font-medium">Valor do Aluguel:</span> R$ {viewingContract.rentAmount.toLocaleString('pt-BR')}</p>
                      <p><span className="font-medium">Depósito:</span> R$ {viewingContract.depositAmount.toLocaleString('pt-BR')}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Partes Envolvidas</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium text-sm text-gray-600">Proprietário</p>
                        <p>{viewingContract.property.owner.name}</p>
                        <p className="text-sm text-gray-500">{viewingContract.property.owner.email}</p>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-600">Inquilino</p>
                        <p>{viewingContract.tenant.name}</p>
                        <p className="text-sm text-gray-500">{viewingContract.tenant.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Property Info */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Imóvel</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium">{viewingContract.property.title}</h4>
                    <p className="text-gray-600">{viewingContract.property.address}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {getPropertyTypeText(viewingContract.property.propertyType)}
                    </p>
                  </div>
                </div>

                {/* Contract Terms */}
                {viewingContract.terms && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Termos do Contrato</h3>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                        {viewingContract.terms}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Maintenances Section */}
                <ContractMaintenances 
                  contractId={viewingContract.id}
                  propertyId={viewingContract.property.id}
                />

                {/* Actions */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => downloadContract(viewingContract)}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Baixar Contrato
                  </button>
                  <button
                    onClick={() => {
                      closeContractDetails()
                      openEditForm(viewingContract)
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Editar Contrato
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false)
            setContractToDelete(null)
          }}
          onConfirm={confirmDeleteContract}
          title="Excluir Contrato"
          message="Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita."
          itemName={contractToDelete ? `${contractToDelete.property?.title} - ${contractToDelete.tenant?.name}` : undefined}
          confirmText="Sim, excluir"
          cancelText="Cancelar"
        />
      </div>
    </DashboardLayout>
  )
}