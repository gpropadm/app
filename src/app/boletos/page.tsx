'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/dashboard-layout'

interface Payment {
  id: string
  amount: number
  dueDate: string
  paidDate?: string
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  gateway: 'ASAAS' | 'PJBANK'
  boletoUrl?: string
  pixQrCode?: string
  ownerAmount?: number
  companyAmount?: number
  gatewayFee?: number
  contract: {
    id: string
    tenant: {
      name: string
      email: string
    }
    property: {
      title: string
      owner: {
        name: string
      }
    }
  }
}

interface FinancialSummary {
  totalReceived: number
  totalPending: number
  totalOverdue: number
  gatewayBreakdown: {
    asaas: { count: number; amount: number; fees: number }
    pjbank: { count: number; amount: number; fees: number }
  }
  ownerBreakdown: Array<{
    ownerId: string
    ownerName: string
    totalAmount: number
    totalFees: number
    paymentsCount: number
  }>
}

export default function BoletosPage() {
  const { data: session } = useSession()
  const [payments, setPayments] = useState<Payment[]>([])
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all')
  const [gatewayFilter, setGatewayFilter] = useState<'all' | 'ASAAS' | 'PJBANK'>('all')

  useEffect(() => {
    if (session?.user?.companyId) {
      loadData()
    }
  }, [session])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Carregar pagamentos
      const paymentsResponse = await fetch('/api/payments/route')
      const paymentsData = await paymentsResponse.json()
      
      if (paymentsData.success) {
        setPayments(paymentsData.data)
      }

      // Carregar resumo financeiro
      const summaryResponse = await fetch(`/api/payments/financial-summary?companyId=${session?.user?.companyId}`)
      const summaryData = await summaryResponse.json()
      
      if (summaryData.success) {
        setSummary(summaryData.data)
      }

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'text-green-600 bg-green-100'
      case 'PENDING': return 'text-yellow-600 bg-yellow-100'
      case 'OVERDUE': return 'text-red-600 bg-red-100'
      case 'CANCELLED': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAID': return 'Pago'
      case 'PENDING': return 'Pendente'
      case 'OVERDUE': return 'Vencido'
      case 'CANCELLED': return 'Cancelado'
      default: return status
    }
  }

  const getGatewayColor = (gateway: string) => {
    switch (gateway) {
      case 'ASAAS': return 'text-blue-600 bg-blue-100'
      case 'PJBANK': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const filteredPayments = payments.filter(payment => {
    const statusMatch = filter === 'all' || payment.status.toLowerCase() === filter.toLowerCase()
    const gatewayMatch = gatewayFilter === 'all' || payment.gateway === gatewayFilter
    return statusMatch && gatewayMatch
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className=\"flex items-center justify-center h-64\">
          <div className=\"animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600\"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className=\"space-y-6\">
        {/* Cabeçalho */}
        <div className=\"flex justify-between items-center\">
          <h1 className=\"text-2xl font-bold text-gray-900\">Boletos com Split</h1>
          <button
            onClick={loadData}
            className=\"px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700\"
          >
            Atualizar
          </button>
        </div>

        {/* Resumo Financeiro */}
        {summary && (
          <div className=\"grid grid-cols-1 md:grid-cols-4 gap-4\">
            <div className=\"bg-white p-6 rounded-lg shadow border\">
              <h3 className=\"text-sm font-medium text-gray-500\">Total Recebido</h3>
              <p className=\"text-2xl font-bold text-green-600\">{formatCurrency(summary.totalReceived)}</p>
            </div>
            <div className=\"bg-white p-6 rounded-lg shadow border\">
              <h3 className=\"text-sm font-medium text-gray-500\">Pendente</h3>
              <p className=\"text-2xl font-bold text-yellow-600\">{formatCurrency(summary.totalPending)}</p>
            </div>
            <div className=\"bg-white p-6 rounded-lg shadow border\">
              <h3 className=\"text-sm font-medium text-gray-500\">Vencido</h3>
              <p className=\"text-2xl font-bold text-red-600\">{formatCurrency(summary.totalOverdue)}</p>
            </div>
            <div className=\"bg-white p-6 rounded-lg shadow border\">
              <h3 className=\"text-sm font-medium text-gray-500\">Total Taxas</h3>
              <p className=\"text-2xl font-bold text-gray-600\">
                {formatCurrency(summary.gatewayBreakdown.asaas.fees + summary.gatewayBreakdown.pjbank.fees)}
              </p>
            </div>
          </div>
        )}

        {/* Breakdown por Gateway */}
        {summary && (
          <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
            <div className=\"bg-white p-6 rounded-lg shadow border\">
              <h3 className=\"text-lg font-semibold mb-4\">Asaas</h3>
              <div className=\"space-y-2\">
                <div className=\"flex justify-between\">
                  <span>Boletos:</span>
                  <span className=\"font-medium\">{summary.gatewayBreakdown.asaas.count}</span>
                </div>
                <div className=\"flex justify-between\">
                  <span>Volume:</span>
                  <span className=\"font-medium\">{formatCurrency(summary.gatewayBreakdown.asaas.amount)}</span>
                </div>
                <div className=\"flex justify-between\">
                  <span>Taxas:</span>
                  <span className=\"font-medium\">{formatCurrency(summary.gatewayBreakdown.asaas.fees)}</span>
                </div>
              </div>
            </div>
            <div className=\"bg-white p-6 rounded-lg shadow border\">
              <h3 className=\"text-lg font-semibold mb-4\">PJBank</h3>
              <div className=\"space-y-2\">
                <div className=\"flex justify-between\">
                  <span>Boletos:</span>
                  <span className=\"font-medium\">{summary.gatewayBreakdown.pjbank.count}</span>
                </div>
                <div className=\"flex justify-between\">
                  <span>Volume:</span>
                  <span className=\"font-medium\">{formatCurrency(summary.gatewayBreakdown.pjbank.amount)}</span>
                </div>
                <div className=\"flex justify-between\">
                  <span>Taxas:</span>
                  <span className=\"font-medium\">{formatCurrency(summary.gatewayBreakdown.pjbank.fees)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className=\"bg-white p-4 rounded-lg shadow border\">
          <div className=\"flex flex-wrap gap-4\">
            <div>
              <label className=\"block text-sm font-medium text-gray-700 mb-1\">Status</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className=\"border border-gray-300 rounded-md px-3 py-2\"
              >
                <option value=\"all\">Todos</option>
                <option value=\"pending\">Pendente</option>
                <option value=\"paid\">Pago</option>
                <option value=\"overdue\">Vencido</option>
              </select>
            </div>
            <div>
              <label className=\"block text-sm font-medium text-gray-700 mb-1\">Gateway</label>
              <select
                value={gatewayFilter}
                onChange={(e) => setGatewayFilter(e.target.value as any)}
                className=\"border border-gray-300 rounded-md px-3 py-2\"
              >
                <option value=\"all\">Todos</option>
                <option value=\"ASAAS\">Asaas</option>
                <option value=\"PJBANK\">PJBank</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Boletos */}
        <div className=\"bg-white rounded-lg shadow border overflow-hidden\">
          <div className=\"overflow-x-auto\">
            <table className=\"min-w-full divide-y divide-gray-200\">
              <thead className=\"bg-gray-50\">
                <tr>
                  <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                    Inquilino
                  </th>
                  <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                    Propriedade
                  </th>
                  <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                    Valor
                  </th>
                  <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                    Vencimento
                  </th>
                  <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                    Status
                  </th>
                  <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                    Gateway
                  </th>
                  <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                    Split
                  </th>
                  <th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider\">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className=\"bg-white divide-y divide-gray-200\">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className=\"hover:bg-gray-50\">
                    <td className=\"px-6 py-4 whitespace-nowrap\">
                      <div>
                        <div className=\"text-sm font-medium text-gray-900\">
                          {payment.contract.tenant.name}
                        </div>
                        <div className=\"text-sm text-gray-500\">
                          {payment.contract.tenant.email}
                        </div>
                      </div>
                    </td>
                    <td className=\"px-6 py-4 whitespace-nowrap\">
                      <div>
                        <div className=\"text-sm font-medium text-gray-900\">
                          {payment.contract.property.title}
                        </div>
                        <div className=\"text-sm text-gray-500\">
                          {payment.contract.property.owner.name}
                        </div>
                      </div>
                    </td>
                    <td className=\"px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900\">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className=\"px-6 py-4 whitespace-nowrap text-sm text-gray-900\">
                      {formatDate(payment.dueDate)}
                    </td>
                    <td className=\"px-6 py-4 whitespace-nowrap\">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                        {getStatusText(payment.status)}
                      </span>
                    </td>
                    <td className=\"px-6 py-4 whitespace-nowrap\">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGatewayColor(payment.gateway)}`}>
                        {payment.gateway}
                      </span>
                    </td>
                    <td className=\"px-6 py-4 whitespace-nowrap text-sm text-gray-900\">
                      <div className=\"space-y-1\">
                        {payment.ownerAmount && (
                          <div>Proprietário: {formatCurrency(payment.ownerAmount)}</div>
                        )}
                        {payment.companyAmount && (
                          <div>Imobiliária: {formatCurrency(payment.companyAmount)}</div>
                        )}
                        {payment.gatewayFee && (
                          <div className=\"text-gray-500\">Taxa: {formatCurrency(payment.gatewayFee)}</div>
                        )}
                      </div>
                    </td>
                    <td className=\"px-6 py-4 whitespace-nowrap text-sm font-medium\">
                      <div className=\"flex space-x-2\">
                        {payment.boletoUrl && (
                          <a
                            href={payment.boletoUrl}
                            target=\"_blank\"
                            rel=\"noopener noreferrer\"
                            className=\"text-blue-600 hover:text-blue-900\"
                          >
                            Boleto
                          </a>
                        )}
                        {payment.pixQrCode && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(payment.pixQrCode!)
                              alert('Código PIX copiado!')
                            }}
                            className=\"text-green-600 hover:text-green-900\"
                          >
                            PIX
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredPayments.length === 0 && (
            <div className=\"text-center py-8 text-gray-500\">
              Nenhum boleto encontrado com os filtros selecionados.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}