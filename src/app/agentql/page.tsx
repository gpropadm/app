'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';

export default function AgentQLDashboard() {
  const [activeTab, setActiveTab] = useState('leads');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  // Estados para cada funcionalidade
  const [leadCapture, setLeadCapture] = useState({
    portal: 'olx',
    searchUrl: '',
    filters: {}
  });

  const [registryExtract, setRegistryExtract] = useState({
    registryNumber: '',
    city: 'São Paulo'
  });

  const [iptuExtract, setIptuExtract] = useState({
    propertyCode: '',
    city: 'São Paulo'
  });

  const [marketMonitor, setMarketMonitor] = useState({
    propertyType: 'APARTMENT',
    location: '',
    priceRange: { min: 0, max: 0 }
  });

  const [syncConfig, setSyncConfig] = useState({
    enabled: false,
    portals: ['olx'],
    interval: 60
  });

  const [publishData, setPublishData] = useState({
    title: '',
    description: '',
    price: 0,
    type: 'APARTMENT',
    location: '',
    portals: ['olx']
  });

  const handleLeadCapture = async () => {
    if (!leadCapture.searchUrl) {
      alert('Digite a URL de busca do portal');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/agentql/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadCapture)
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao capturar leads');
    }
    setLoading(false);
  };

  const handleRegistryExtract = async () => {
    if (!registryExtract.registryNumber) {
      alert('Digite o número da matrícula');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/agentql/registry/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registryExtract)
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao extrair dados do cartório');
    }
    setLoading(false);
  };

  const handleIPTUExtract = async () => {
    if (!iptuExtract.propertyCode) {
      alert('Digite o código do imóvel');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/agentql/iptu/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(iptuExtract)
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao extrair dados do IPTU');
    }
    setLoading(false);
  };

  const handleMarketMonitor = async () => {
    if (!marketMonitor.location) {
      alert('Digite a localização para análise');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/agentql/market/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(marketMonitor)
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro no monitoramento de mercado');
    }
    setLoading(false);
  };

  const handleSyncSetup = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/agentql/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setup', config: syncConfig })
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao configurar sincronização');
    }
    setLoading(false);
  };

  const handleStartSync = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/agentql/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao iniciar sincronização');
    }
    setLoading(false);
  };

  const handlePublish = async () => {
    if (!publishData.title || !publishData.price) {
      alert('Título e preço são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/agentql/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          propertyData: publishData, 
          portals: publishData.portals 
        })
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao publicar propriedade');
    }
    setLoading(false);
  };

  const tabs = [
    { id: 'leads', name: 'Captura de Leads', icon: '🎯' },
    { id: 'registry', name: 'Dados Cartório', icon: '📋' },
    { id: 'iptu', name: 'Consulta IPTU', icon: '🏠' },
    { id: 'market', name: 'Monitor Mercado', icon: '📊' },
    { id: 'sync', name: 'Sincronização', icon: '🔄' },
    { id: 'publish', name: 'Publicar', icon: '📢' }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold">AgentQL Dashboard</h1>
          <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            IA Powered
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setResults(null);
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulários */}
          <div className="bg-white p-6 rounded-lg shadow">
            {activeTab === 'leads' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Capturar Leads de Portais</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Portal
                  </label>
                  <select
                    value={leadCapture.portal}
                    onChange={(e) => setLeadCapture({...leadCapture, portal: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="olx">OLX</option>
                    <option value="zapimoveis">ZAP Imóveis</option>
                    <option value="vivareal">Viva Real</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL de Busca
                  </label>
                  <input
                    type="url"
                    value={leadCapture.searchUrl}
                    onChange={(e) => setLeadCapture({...leadCapture, searchUrl: e.target.value})}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Cole a URL de busca do portal com os filtros aplicados
                  </p>
                </div>

                <button
                  onClick={handleLeadCapture}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Capturando...' : 'Capturar Leads'}
                </button>
              </div>
            )}

            {activeTab === 'registry' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Extrair Dados do Cartório</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número da Matrícula
                  </label>
                  <input
                    type="text"
                    value={registryExtract.registryNumber}
                    onChange={(e) => setRegistryExtract({...registryExtract, registryNumber: e.target.value})}
                    placeholder="Ex: 123456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cidade
                  </label>
                  <select
                    value={registryExtract.city}
                    onChange={(e) => setRegistryExtract({...registryExtract, city: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="São Paulo">São Paulo</option>
                    <option value="Rio de Janeiro">Rio de Janeiro</option>
                    <option value="Belo Horizonte">Belo Horizonte</option>
                  </select>
                </div>

                <button
                  onClick={handleRegistryExtract}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Extraindo...' : 'Extrair Dados'}
                </button>
              </div>
            )}

            {activeTab === 'iptu' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Consultar IPTU</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código do Imóvel
                  </label>
                  <input
                    type="text"
                    value={iptuExtract.propertyCode}
                    onChange={(e) => setIptuExtract({...iptuExtract, propertyCode: e.target.value})}
                    placeholder="Ex: 12345-6789"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={iptuExtract.city}
                    onChange={(e) => setIptuExtract({...iptuExtract, city: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <optgroup label="Região Norte">
                      <option value="Acre">Acre (AC)</option>
                      <option value="Amapá">Amapá (AP)</option>
                      <option value="Amazonas">Amazonas (AM)</option>
                      <option value="Pará">Pará (PA)</option>
                      <option value="Rondônia">Rondônia (RO)</option>
                      <option value="Roraima">Roraima (RR)</option>
                      <option value="Tocantins">Tocantins (TO)</option>
                    </optgroup>
                    
                    <optgroup label="Região Nordeste">
                      <option value="Alagoas">Alagoas (AL)</option>
                      <option value="Bahia">Bahia (BA)</option>
                      <option value="Ceará">Ceará (CE)</option>
                      <option value="Maranhão">Maranhão (MA)</option>
                      <option value="Paraíba">Paraíba (PB)</option>
                      <option value="Pernambuco">Pernambuco (PE)</option>
                      <option value="Piauí">Piauí (PI)</option>
                      <option value="Rio Grande do Norte">Rio Grande do Norte (RN)</option>
                      <option value="Sergipe">Sergipe (SE)</option>
                    </optgroup>
                    
                    <optgroup label="Região Centro-Oeste">
                      <option value="Distrito Federal">Distrito Federal (DF)</option>
                      <option value="Goiás">Goiás (GO)</option>
                      <option value="Mato Grosso">Mato Grosso (MT)</option>
                      <option value="Mato Grosso do Sul">Mato Grosso do Sul (MS)</option>
                    </optgroup>
                    
                    <optgroup label="Região Sudeste">
                      <option value="Espírito Santo">Espírito Santo (ES)</option>
                      <option value="Minas Gerais">Minas Gerais (MG)</option>
                      <option value="Rio de Janeiro">Rio de Janeiro (RJ)</option>
                      <option value="São Paulo">São Paulo (SP)</option>
                    </optgroup>
                    
                    <optgroup label="Região Sul">
                      <option value="Paraná">Paraná (PR)</option>
                      <option value="Rio Grande do Sul">Rio Grande do Sul (RS)</option>
                      <option value="Santa Catarina">Santa Catarina (SC)</option>
                    </optgroup>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Cobertura nacional - todos os 26 estados + DF
                  </p>
                </div>

                <button
                  onClick={handleIPTUExtract}
                  disabled={loading}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Consultando...' : 'Consultar IPTU'}
                </button>
              </div>
            )}

            {activeTab === 'market' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Monitor de Mercado</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Imóvel
                  </label>
                  <select
                    value={marketMonitor.propertyType}
                    onChange={(e) => setMarketMonitor({...marketMonitor, propertyType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="APARTMENT">Apartamento</option>
                    <option value="HOUSE">Casa</option>
                    <option value="COMMERCIAL">Comercial</option>
                    <option value="LAND">Terreno</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Localização
                  </label>
                  <input
                    type="text"
                    value={marketMonitor.location}
                    onChange={(e) => setMarketMonitor({...marketMonitor, location: e.target.value})}
                    placeholder="Ex: Vila Madalena, SP"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço Mín (R$)
                    </label>
                    <input
                      type="number"
                      value={marketMonitor.priceRange.min}
                      onChange={(e) => setMarketMonitor({
                        ...marketMonitor, 
                        priceRange: {...marketMonitor.priceRange, min: Number(e.target.value)}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço Máx (R$)
                    </label>
                    <input
                      type="number"
                      value={marketMonitor.priceRange.max}
                      onChange={(e) => setMarketMonitor({
                        ...marketMonitor, 
                        priceRange: {...marketMonitor.priceRange, max: Number(e.target.value)}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <button
                  onClick={handleMarketMonitor}
                  disabled={loading}
                  className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50"
                >
                  {loading ? 'Analisando...' : 'Analisar Mercado'}
                </button>
              </div>
            )}

            {activeTab === 'sync' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Configurar Sincronização Automática</h3>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Sincronização Inteligente</h4>
                  <p className="text-blue-700 text-sm">
                    Configure a captura automática de leads e monitoramento de mercado em tempo real.
                  </p>
                </div>

                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={syncConfig.enabled}
                      onChange={(e) => setSyncConfig({...syncConfig, enabled: e.target.checked})}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Ativar sincronização automática
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Portais para Monitorar
                  </label>
                  <div className="space-y-2">
                    {['olx', 'zapimoveis', 'vivareal'].map(portal => (
                      <label key={portal} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={syncConfig.portals.includes(portal)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSyncConfig({
                                ...syncConfig, 
                                portals: [...syncConfig.portals, portal]
                              });
                            } else {
                              setSyncConfig({
                                ...syncConfig, 
                                portals: syncConfig.portals.filter(p => p !== portal)
                              });
                            }
                          }}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700 capitalize">
                          {portal === 'zapimoveis' ? 'ZAP Imóveis' : portal === 'vivareal' ? 'Viva Real' : 'OLX'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Intervalo de Sincronização
                  </label>
                  <select
                    value={syncConfig.interval}
                    onChange={(e) => setSyncConfig({...syncConfig, interval: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value={30}>30 minutos</option>
                    <option value={60}>1 hora</option>
                    <option value={180}>3 horas</option>
                    <option value={360}>6 horas</option>
                    <option value={720}>12 horas</option>
                    <option value={1440}>24 horas</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleSyncSetup}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Configurando...' : 'Configurar Sync'}
                  </button>
                  <button
                    onClick={handleStartSync}
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Executando...' : 'Executar Agora'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'publish' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Publicar em Múltiplos Portais</h3>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">Publicação Cruzada</h4>
                  <p className="text-purple-700 text-sm">
                    Publique sua propriedade simultaneamente em vários portais imobiliários.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título do Anúncio
                  </label>
                  <input
                    type="text"
                    value={publishData.title}
                    onChange={(e) => setPublishData({...publishData, title: e.target.value})}
                    placeholder="Ex: Apartamento 2 quartos Vila Madalena"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={publishData.description}
                    onChange={(e) => setPublishData({...publishData, description: e.target.value})}
                    placeholder="Descreva as características do imóvel..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço (R$)
                    </label>
                    <input
                      type="number"
                      value={publishData.price}
                      onChange={(e) => setPublishData({...publishData, price: Number(e.target.value)})}
                      placeholder="2500"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo
                    </label>
                    <select
                      value={publishData.type}
                      onChange={(e) => setPublishData({...publishData, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="APARTMENT">Apartamento</option>
                      <option value="HOUSE">Casa</option>
                      <option value="COMMERCIAL">Comercial</option>
                      <option value="LAND">Terreno</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Localização
                  </label>
                  <input
                    type="text"
                    value={publishData.location}
                    onChange={(e) => setPublishData({...publishData, location: e.target.value})}
                    placeholder="Vila Madalena, São Paulo, SP"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Portais de Destino
                  </label>
                  <div className="space-y-2">
                    {['olx', 'zapimoveis', 'vivareal'].map(portal => (
                      <label key={portal} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={publishData.portals.includes(portal)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPublishData({
                                ...publishData, 
                                portals: [...publishData.portals, portal]
                              });
                            } else {
                              setPublishData({
                                ...publishData, 
                                portals: publishData.portals.filter(p => p !== portal)
                              });
                            }
                          }}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm text-gray-700 capitalize">
                          {portal === 'zapimoveis' ? 'ZAP Imóveis' : portal === 'vivareal' ? 'Viva Real' : 'OLX'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handlePublish}
                  disabled={loading}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Publicando...' : `Publicar em ${publishData.portals.length} Portal(is)`}
                </button>
              </div>
            )}
          </div>

          {/* Resultados */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Resultados</h3>
            
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3">Processando...</span>
              </div>
            )}

            {results && !loading && (
              <div className="space-y-4">
                {results.error ? (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="text-red-800">
                      <strong>Erro:</strong> {results.error}
                    </div>
                    {results.details && (
                      <div className="text-red-600 text-sm mt-2">
                        {results.details}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="text-green-800">
                      <strong>Sucesso!</strong> Dados extraídos com AgentQL
                    </div>
                    <pre className="bg-gray-100 p-3 rounded mt-3 text-xs overflow-auto max-h-96">
                      {JSON.stringify(results, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {!results && !loading && (
              <div className="text-gray-500 text-center py-8">
                Selecione uma função e execute para ver os resultados
              </div>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🎯</span>
              <div>
                <h4 className="font-semibold text-blue-900">Leads Automáticos</h4>
                <p className="text-blue-700 text-sm">Capture leads de múltiplos portais</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">📋</span>
              <div>
                <h4 className="font-semibold text-green-900">Dados Cartório</h4>
                <p className="text-green-700 text-sm">Extraia matrículas automaticamente</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🏠</span>
              <div>
                <h4 className="font-semibold text-purple-900">IPTU Automático</h4>
                <p className="text-purple-700 text-sm">Consulte IPTU sem manual</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">📊</span>
              <div>
                <h4 className="font-semibold text-orange-900">Intel. Mercado</h4>
                <p className="text-orange-700 text-sm">Monitore concorrência em tempo real</p>
              </div>
            </div>
          </div>

          <div className="bg-cyan-50 p-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🔄</span>
              <div>
                <h4 className="font-semibold text-cyan-900">Sync Automático</h4>
                <p className="text-cyan-700 text-sm">Sincronização inteligente 24/7</p>
              </div>
            </div>
          </div>

          <div className="bg-pink-50 p-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">📢</span>
              <div>
                <h4 className="font-semibold text-pink-900">Multi Publicação</h4>
                <p className="text-pink-700 text-sm">Publique em todos os portais</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}