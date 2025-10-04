"use client"

export interface CurrencyRates {
  USD: number
  INR: number
  GBP: number
  JPY: number
  AUD: number
  CAD: number
  EUR: number
}

export class CurrencyConversionService {
  private static instance: CurrencyConversionService
  private rates: CurrencyRates = {
    USD: 1,
    INR: 83.5, // 1 USD = 83.5 INR (approximate)
    GBP: 0.79, // 1 USD = 0.79 GBP
    JPY: 150,  // 1 USD = 150 JPY
    AUD: 1.52, // 1 USD = 1.52 AUD
    CAD: 1.36, // 1 USD = 1.36 CAD
    EUR: 0.92  // 1 USD = 0.92 EUR
  }
  private lastUpdated: number = 0
  private readonly CACHE_DURATION = 60 * 60 * 1000 // 1 hour

  static getInstance(): CurrencyConversionService {
    if (!CurrencyConversionService.instance) {
      CurrencyConversionService.instance = new CurrencyConversionService()
    }
    return CurrencyConversionService.instance
  }

  async updateRates(): Promise<void> {
    const now = Date.now()
    if (now - this.lastUpdated < this.CACHE_DURATION) {
      return // Use cached rates
    }

    try {
      // Try to fetch real-time rates from a free API
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
      if (response.ok) {
        const data = await response.json()
        this.rates = {
          USD: 1,
          INR: data.rates.INR || 83.5,
          GBP: data.rates.GBP || 0.79,
          JPY: data.rates.JPY || 150,
          AUD: data.rates.AUD || 1.52,
          CAD: data.rates.CAD || 1.36,
          EUR: data.rates.EUR || 0.92
        }
        this.lastUpdated = now
      }
    } catch (error) {
      console.warn('Failed to fetch currency rates, using cached values:', error)
    }
  }

  convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) {
      return amount
    }

    // Convert to USD first
    let usdAmount = amount
    if (fromCurrency !== 'USD') {
      usdAmount = amount / this.rates[fromCurrency as keyof CurrencyRates]
    }

    // Convert from USD to target currency
    if (toCurrency === 'USD') {
      return usdAmount
    }

    return usdAmount * this.rates[toCurrency as keyof CurrencyRates]
  }

  getRate(fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) {
      return 1
    }

    // Convert to USD first
    let usdRate = 1
    if (fromCurrency !== 'USD') {
      usdRate = 1 / this.rates[fromCurrency as keyof CurrencyRates]
    }

    // Convert from USD to target currency
    if (toCurrency === 'USD') {
      return usdRate
    }

    return usdRate * this.rates[toCurrency as keyof CurrencyRates]
  }

  formatConvertedAmount(amount: number, fromCurrency: string, toCurrency: string): string {
    const convertedAmount = this.convertCurrency(amount, fromCurrency, toCurrency)
    
    const formatters: { [key: string]: Intl.NumberFormat } = {
      'USD': new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
      'INR': new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }),
      'GBP': new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }),
      'JPY': new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }),
      'AUD': new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }),
      'CAD': new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }),
      'EUR': new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
    }

    const formatter = formatters[toCurrency] || formatters['USD']
    return formatter.format(convertedAmount)
  }

  // Get current rates for display
  getRates(): CurrencyRates {
    return { ...this.rates }
  }

  // Update rates manually (for testing)
  setRates(rates: Partial<CurrencyRates>): void {
    this.rates = { ...this.rates, ...rates }
    this.lastUpdated = Date.now()
  }
}

export const currencyConversionService = CurrencyConversionService.getInstance()
