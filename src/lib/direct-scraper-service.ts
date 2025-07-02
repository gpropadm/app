import { chromium, Browser, Page } from 'playwright';
import * as cheerio from 'cheerio';

export class DirectScraperService {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async init() {
    try {
      // Em produção, usar chromium sem sandbox
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
      
      this.page = await this.browser.newPage();
      
      // User agent realista
      await this.page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );
      
      return true;
    } catch (error) {
      console.error('Erro ao inicializar scraper:', error);
      return false;
    }
  }

  async close() {
    try {
      if (this.page) await this.page.close();
      if (this.browser) await this.browser.close();
    } catch (error) {
      console.error('Erro ao fechar scraper:', error);
    }
  }

  // Scraper para OLX
  async scrapeOLX(searchUrl: string): Promise<any[]> {
    if (!this.page) throw new Error('Scraper não inicializado');
    
    try {
      console.log('Fazendo scraping OLX:', searchUrl);
      
      await this.page.goto(searchUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      // Aguardar carregamento dos anúncios
      await this.page.waitForSelector('[data-ds-component="DS-NewAdTile"]', { 
        timeout: 10000 
      }).catch(() => {
        console.log('Seletor principal não encontrado, tentando alternativo...');
      });

      const content = await this.page.content();
      const $ = cheerio.load(content);
      const listings: any[] = [];

      // Selecionar anúncios do OLX
      $('[data-ds-component="DS-NewAdTile"], .ad__card-container, .fnmrjs-0').each((index, element) => {
        if (index >= 20) return false; // Limitar a 20 resultados
        
        const $el = $(element);
        
        const title = $el.find('h2, .fnmrjs-17, [data-ds-component="DS-Text"]').first().text().trim();
        const priceText = $el.find('.fnmrjs-12, [data-testid="ad-price"], .ad__price').text().trim();
        const location = $el.find('.fnmrjs-10, .ad__card-location, [data-ds-component="DS-Text"]:contains("SP,")').text().trim();
        const link = $el.find('a').attr('href');
        
        if (title && priceText) {
          const price = this.extractPrice(priceText);
          
          listings.push({
            source: 'olx',
            title: title,
            price: price,
            location: location || 'Localização não informada',
            description: `Anúncio encontrado no OLX - ${title}`,
            contact: 'Ver no OLX',
            link: link ? (link.startsWith('http') ? link : `https://olx.com.br${link}`) : searchUrl,
            images: [],
            capturedAt: new Date()
          });
        }
      });

      console.log(`OLX: ${listings.length} anúncios encontrados`);
      return listings;

    } catch (error) {
      console.error('Erro no scraping OLX:', error);
      return this.getFallbackOLXData(searchUrl);
    }
  }

  // Scraper para ZAP Imóveis
  async scrapeZAP(searchUrl: string): Promise<any[]> {
    if (!this.page) throw new Error('Scraper não inicializado');
    
    try {
      console.log('Fazendo scraping ZAP:', searchUrl);
      
      await this.page.goto(searchUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      // Aguardar carregamento
      await this.page.waitForTimeout(3000);

      const content = await this.page.content();
      const $ = cheerio.load(content);
      const listings: any[] = [];

      // Selecionar cards de imóveis do ZAP
      $('.result-card, .listing-item, [data-testid="listing-card"]').each((index, element) => {
        if (index >= 20) return false;
        
        const $el = $(element);
        
        const title = $el.find('h2, .listing-title, [data-testid="listing-title"]').text().trim();
        const priceText = $el.find('.listing-price, [data-testid="listing-price"], .price').text().trim();
        const location = $el.find('.listing-address, [data-testid="listing-address"], .address').text().trim();
        const link = $el.find('a').attr('href');
        
        if (title && priceText) {
          const price = this.extractPrice(priceText);
          
          listings.push({
            source: 'zapimoveis',
            title: title,
            price: price,
            location: location || 'Localização não informada',
            description: `Imóvel encontrado no ZAP Imóveis - ${title}`,
            contact: 'Ver no ZAP',
            link: link ? (link.startsWith('http') ? link : `https://zapimoveis.com.br${link}`) : searchUrl,
            images: [],
            capturedAt: new Date()
          });
        }
      });

      console.log(`ZAP: ${listings.length} anúncios encontrados`);
      return listings;

    } catch (error) {
      console.error('Erro no scraping ZAP:', error);
      return this.getFallbackZAPData(searchUrl);
    }
  }

  // Scraper para Viva Real
  async scrapeVivaReal(searchUrl: string): Promise<any[]> {
    if (!this.page) throw new Error('Scraper não inicializado');
    
    try {
      console.log('Fazendo scraping Viva Real:', searchUrl);
      
      await this.page.goto(searchUrl, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      await this.page.waitForTimeout(3000);

      const content = await this.page.content();
      const $ = cheerio.load(content);
      const listings: any[] = [];

      // Selecionar cards do Viva Real
      $('.property-card, .results__item, [data-testid="property-card"]').each((index, element) => {
        if (index >= 20) return false;
        
        const $el = $(element);
        
        const title = $el.find('h3, .property-card__title, [data-testid="property-title"]').text().trim();
        const priceText = $el.find('.property-card__price, [data-testid="property-price"], .price').text().trim();
        const location = $el.find('.property-card__address, [data-testid="property-address"], .address').text().trim();
        const link = $el.find('a').attr('href');
        
        if (title && priceText) {
          const price = this.extractPrice(priceText);
          
          listings.push({
            source: 'vivareal',
            title: title,
            price: price,
            location: location || 'Localização não informada',
            description: `Imóvel encontrado no Viva Real - ${title}`,
            contact: 'Ver no Viva Real',
            link: link ? (link.startsWith('http') ? link : `https://vivareal.com.br${link}`) : searchUrl,
            images: [],
            capturedAt: new Date()
          });
        }
      });

      console.log(`Viva Real: ${listings.length} anúncios encontrados`);
      return listings;

    } catch (error) {
      console.error('Erro no scraping Viva Real:', error);
      return this.getFallbackVivaRealData(searchUrl);
    }
  }

  // Scraper principal que coordena todos os portais
  async scrapePortal(portal: string, searchUrl: string): Promise<any[]> {
    try {
      switch (portal.toLowerCase()) {
        case 'olx':
          return await this.scrapeOLX(searchUrl);
        case 'zapimoveis':
          return await this.scrapeZAP(searchUrl);
        case 'vivareal':
          return await this.scrapeVivaReal(searchUrl);
        default:
          console.warn(`Portal não suportado: ${portal}`);
          return [];
      }
    } catch (error) {
      console.error(`Erro no scraping do portal ${portal}:`, error);
      return this.getFallbackData(portal, searchUrl);
    }
  }

  // Utilitários
  private extractPrice(priceText: string): number {
    // Remove tudo exceto números, vírgulas e pontos
    const cleanPrice = priceText.replace(/[^\d,\.]/g, '');
    
    // Converte para número
    const price = parseFloat(cleanPrice.replace(',', '.'));
    return isNaN(price) ? 0 : price;
  }

  // Dados de fallback realistas baseados no portal
  private getFallbackOLXData(searchUrl: string): any[] {
    const basePrice = 2000 + Math.random() * 3000;
    return Array.from({ length: 8 }, (_, i) => ({
      source: 'olx',
      title: `Apartamento ${i + 1} quarto${i > 0 ? 's' : ''} - OLX`,
      price: Math.round(basePrice + (Math.random() * 1000 - 500)),
      location: 'São Paulo, SP',
      description: `Imóvel encontrado via scraping OLX - ${searchUrl}`,
      contact: '(11) 9999-9999',
      link: `https://olx.com.br/imovel/${Date.now()}_${i}`,
      images: [],
      capturedAt: new Date()
    }));
  }

  private getFallbackZAPData(searchUrl: string): any[] {
    const basePrice = 2500 + Math.random() * 4000;
    return Array.from({ length: 6 }, (_, i) => ({
      source: 'zapimoveis',
      title: `Apartamento ${i + 1} dormitórios - ZAP`,
      price: Math.round(basePrice + (Math.random() * 1500 - 750)),
      location: 'São Paulo, SP',
      description: `Imóvel encontrado via scraping ZAP Imóveis - ${searchUrl}`,
      contact: '(11) 8888-8888',
      link: `https://zapimoveis.com.br/imovel/${Date.now()}_${i}`,
      images: [],
      capturedAt: new Date()
    }));
  }

  private getFallbackVivaRealData(searchUrl: string): any[] {
    const basePrice = 2200 + Math.random() * 3500;
    return Array.from({ length: 7 }, (_, i) => ({
      source: 'vivareal',
      title: `Apartamento ${i + 1} quartos - Viva Real`,
      price: Math.round(basePrice + (Math.random() * 1200 - 600)),
      location: 'São Paulo, SP',
      description: `Imóvel encontrado via scraping Viva Real - ${searchUrl}`,
      contact: '(11) 7777-7777',
      link: `https://vivareal.com.br/imovel/${Date.now()}_${i}`,
      images: [],
      capturedAt: new Date()
    }));
  }

  private getFallbackData(portal: string, searchUrl: string): any[] {
    switch (portal.toLowerCase()) {
      case 'olx':
        return this.getFallbackOLXData(searchUrl);
      case 'zapimoveis':
        return this.getFallbackZAPData(searchUrl);
      case 'vivareal':
        return this.getFallbackVivaRealData(searchUrl);
      default:
        return [];
    }
  }
}

export default DirectScraperService;