import { wrap, configure } from 'agentql';
import { chromium } from 'playwright';

// Configuração do AgentQL
export class AgentQLService {
  private page: any;
  private browser: any;

  async init() {
    try {
      // Configure AgentQL (adicione sua API key nas variáveis de ambiente)
      if (process.env.AGENTQL_API_KEY) {
        configure({ apiKey: process.env.AGENTQL_API_KEY });
      }

      this.browser = await chromium.launch({ headless: true });
      const context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });
      
      this.page = await wrap(await context.newPage());
      
      return this.page;
    } catch (error) {
      console.error('Erro ao inicializar AgentQL:', error);
      throw error;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  // Captura leads de portais imobiliários
  async captureLeadsFromPortal(portalName: string, searchUrl: string, filters: any = {}) {
    try {
      await this.page.goto(searchUrl);
      
      let queryConfig: any = {};
      
      switch (portalName.toLowerCase()) {
        case 'olx':
          queryConfig = {
            properties: {
              title: 'listing title or property title',
              price: 'price or valor',
              location: 'location or address or cidade',
              description: 'description or details',
              contact: 'phone number or contact',
              link: 'property link or listing url',
              images: 'property images'
            }
          };
          break;
          
        case 'zapimoveis':
        case 'zap':
          queryConfig = {
            properties: {
              title: 'property title or listing title',
              price: 'price or preço',
              location: 'neighborhood or bairro or location',
              area: 'area in square meters or m²',
              bedrooms: 'bedrooms or quartos',
              contact: 'contact or telefone',
              link: 'listing link or property url'
            }
          };
          break;
          
        case 'vivareal':
          queryConfig = {
            properties: {
              title: 'property title',
              price: 'rental price or sale price',
              location: 'address or location',
              area: 'area or size',
              type: 'property type',
              contact: 'contact information',
              link: 'property link'
            }
          };
          break;
      }

      const results = await this.page.queryElements(queryConfig);
      
      return results.map((result: any) => ({
        source: portalName,
        title: result.title || '',
        price: this.extractPrice(result.price || ''),
        location: result.location || '',
        description: result.description || '',
        contact: this.extractContact(result.contact || ''),
        link: result.link || '',
        images: result.images || [],
        capturedAt: new Date(),
        ...filters
      }));
      
    } catch (error) {
      console.error(`Erro ao capturar leads do ${portalName}:`, error);
      return [];
    }
  }

  // Extração de dados de cartórios e IPTU
  async extractRegistryData(registryNumber: string, city: string) {
    try {
      // URLs comuns de cartórios (adapte conforme necessário)
      const registryUrls = {
        'sp': 'https://www.registroimoveis.sp.gov.br',
        'rj': 'https://www.registroimoveis.rj.gov.br',
        'mg': 'https://www.registroimoveis.mg.gov.br'
      };
      
      const cityCode = city.toLowerCase().substring(0, 2);
      const baseUrl = registryUrls[cityCode as keyof typeof registryUrls];
      
      if (!baseUrl) {
        throw new Error(`Cartório não suportado para a cidade: ${city}`);
      }

      await this.page.goto(baseUrl);
      
      // Query para buscar dados do registro
      const searchQuery = {
        searchInput: 'registry number input or matrícula input',
        searchButton: 'search button or consultar button'
      };
      
      await this.page.queryElements(searchQuery);
      await this.page.fill(searchQuery.searchInput, registryNumber);
      await this.page.click(searchQuery.searchButton);
      
      // Aguarda resultados
      await this.page.waitForTimeout(3000);
      
      const dataQuery = {
        ownerName: 'owner name or proprietário',
        propertyAddress: 'property address or endereço',
        area: 'total area or área total',
        registrationDate: 'registration date or data de registro',
        liens: 'liens or ônus or gravames',
        description: 'property description or descrição'
      };
      
      const registryData = await this.page.queryElements(dataQuery);
      
      return {
        registryNumber,
        city,
        ownerName: registryData.ownerName || '',
        propertyAddress: registryData.propertyAddress || '',
        area: registryData.area || '',
        registrationDate: registryData.registrationDate || '',
        liens: registryData.liens || '',
        description: registryData.description || '',
        extractedAt: new Date()
      };
      
    } catch (error) {
      console.error('Erro ao extrair dados do cartório:', error);
      return null;
    }
  }

  // Consulta IPTU automática
  async extractIPTUData(propertyCode: string, state: string) {
    try {
      const iptuUrls = {
        // Região Norte
        'acre': 'https://www.ac.gov.br/iptu',
        'amapá': 'https://www.ap.gov.br/iptu',
        'amazonas': 'https://www.amazonas.am.gov.br/iptu',
        'pará': 'https://www.pa.gov.br/iptu',
        'rondônia': 'https://www.rondonia.ro.gov.br/iptu',
        'roraima': 'https://www.roraima.rr.gov.br/iptu',
        'tocantins': 'https://www.to.gov.br/iptu',
        
        // Região Nordeste
        'alagoas': 'https://www.alagoas.al.gov.br/iptu',
        'bahia': 'https://www.bahia.ba.gov.br/iptu',
        'ceará': 'https://www.ceara.ce.gov.br/iptu',
        'maranhão': 'https://www.ma.gov.br/iptu',
        'paraíba': 'https://www.paraiba.pb.gov.br/iptu',
        'pernambuco': 'https://www.pe.gov.br/iptu',
        'piauí': 'https://www.pi.gov.br/iptu',
        'rio grande do norte': 'https://www.rn.gov.br/iptu',
        'sergipe': 'https://www.sergipe.se.gov.br/iptu',
        
        // Região Centro-Oeste
        'distrito federal': 'https://www.fazenda.df.gov.br/iptu',
        'goiás': 'https://www.goias.go.gov.br/iptu',
        'mato grosso': 'https://www.mt.gov.br/iptu',
        'mato grosso do sul': 'https://www.ms.gov.br/iptu',
        
        // Região Sudeste
        'espírito santo': 'https://www.es.gov.br/iptu',
        'minas gerais': 'https://www.mg.gov.br/iptu',
        'rio de janeiro': 'https://www.rj.gov.br/iptu',
        'são paulo': 'https://www.fazenda.sp.gov.br/iptu',
        
        // Região Sul
        'paraná': 'https://www.pr.gov.br/iptu',
        'rio grande do sul': 'https://www.rs.gov.br/iptu',
        'santa catarina': 'https://www.sc.gov.br/iptu'
      };
      
      const baseUrl = iptuUrls[state.toLowerCase() as keyof typeof iptuUrls];
      
      if (!baseUrl) {
        throw new Error(`IPTU não suportado para o estado: ${state}. Estados disponíveis: ${Object.keys(iptuUrls).join(', ')}`);
      }

      await this.page.goto(baseUrl);
      
      const searchQuery = {
        propertyCodeInput: 'property code input or código do imóvel',
        searchButton: 'search button or consultar'
      };
      
      await this.page.queryElements(searchQuery);
      await this.page.fill(searchQuery.propertyCodeInput, propertyCode);
      await this.page.click(searchQuery.searchButton);
      
      await this.page.waitForTimeout(3000);
      
      const iptuQuery = {
        annualValue: 'annual IPTU value or valor anual',
        installments: 'installment values or parcelas',
        dueDate: 'due date or vencimento',
        propertyValue: 'property assessed value or valor venal',
        area: 'built area or área construída',
        status: 'payment status or situação'
      };
      
      const iptuData = await this.page.queryElements(iptuQuery);
      
      return {
        propertyCode,
        city,
        annualValue: this.extractPrice(iptuData.annualValue || ''),
        installments: iptuData.installments || '',
        dueDate: iptuData.dueDate || '',
        propertyValue: this.extractPrice(iptuData.propertyValue || ''),
        area: iptuData.area || '',
        status: iptuData.status || '',
        extractedAt: new Date()
      };
      
    } catch (error) {
      console.error('Erro ao extrair dados do IPTU:', error);
      return null;
    }
  }

  // Monitor de concorrência
  async monitorCompetition(propertyType: string, location: string, priceRange: { min: number, max: number }) {
    try {
      const portals = ['olx', 'zapimoveis', 'vivareal'];
      const competitionData = [];
      
      for (const portal of portals) {
        const searchUrl = this.buildSearchUrl(portal, propertyType, location, priceRange);
        const properties = await this.captureLeadsFromPortal(portal, searchUrl);
        
        competitionData.push({
          portal,
          propertyCount: properties.length,
          averagePrice: this.calculateAveragePrice(properties),
          properties: properties.slice(0, 5) // Primeiros 5 para análise
        });
      }
      
      return {
        location,
        propertyType,
        priceRange,
        analysisDate: new Date(),
        marketData: competitionData,
        insights: this.generateMarketInsights(competitionData)
      };
      
    } catch (error) {
      console.error('Erro no monitoramento de concorrência:', error);
      return null;
    }
  }

  // Utilitários privados
  private extractPrice(priceText: string): number {
    const cleanPrice = priceText.replace(/[^\d,\.]/g, '');
    const price = parseFloat(cleanPrice.replace(',', '.'));
    return isNaN(price) ? 0 : price;
  }

  private extractContact(contactText: string): string {
    const phoneRegex = /(\(?\d{2}\)?\s?\d{4,5}-?\d{4})/;
    const match = contactText.match(phoneRegex);
    return match ? match[0] : contactText;
  }

  private buildSearchUrl(portal: string, propertyType: string, location: string, priceRange: any): string {
    const baseUrls = {
      olx: 'https://www.olx.com.br/imoveis',
      zapimoveis: 'https://www.zapimoveis.com.br',
      vivareal: 'https://www.vivareal.com.br'
    };
    
    // Implementar lógica específica de cada portal
    return baseUrls[portal as keyof typeof baseUrls] || '';
  }

  private calculateAveragePrice(properties: any[]): number {
    if (properties.length === 0) return 0;
    const total = properties.reduce((sum, prop) => sum + prop.price, 0);
    return total / properties.length;
  }

  private generateMarketInsights(marketData: any[]): string[] {
    const insights = [];
    
    const totalProperties = marketData.reduce((sum, data) => sum + data.propertyCount, 0);
    insights.push(`Total de ${totalProperties} propriedades encontradas no mercado`);
    
    const avgPrices = marketData.map(data => data.averagePrice).filter(price => price > 0);
    if (avgPrices.length > 0) {
      const overallAvg = avgPrices.reduce((sum, price) => sum + price, 0) / avgPrices.length;
      insights.push(`Preço médio do mercado: R$ ${overallAvg.toLocaleString('pt-BR')}`);
    }
    
    return insights;
  }
}

export default AgentQLService;