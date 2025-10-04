"use client"

export interface UserLocation {
  country: string
  currency: string
  timezone: string
  locale: string
  market: string
  exchange: string
}

export class LocalizationService {
  private static instance: LocalizationService
  private userLocation: UserLocation | null = null

  static getInstance(): LocalizationService {
    if (!LocalizationService.instance) {
      LocalizationService.instance = new LocalizationService()
    }
    return LocalizationService.instance
  }

  constructor() {
    this.detectUserLocation()
  }

  private detectUserLocation(): void {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const locale = Intl.DateTimeFormat().resolvedOptions().locale

    // Detect country and currency based on timezone
    const locationMap: { [key: string]: UserLocation } = {
      'Asia/Kolkata': { country: 'IN', currency: 'INR', timezone: 'Asia/Kolkata', locale: 'en-IN', market: 'IN', exchange: 'NSE' },
      'Asia/Calcutta': { country: 'IN', currency: 'INR', timezone: 'Asia/Kolkata', locale: 'en-IN', market: 'IN', exchange: 'NSE' },
      'America/New_York': { country: 'US', currency: 'USD', timezone: 'America/New_York', locale: 'en-US', market: 'US', exchange: 'NASDAQ' },
      'America/Los_Angeles': { country: 'US', currency: 'USD', timezone: 'America/Los_Angeles', locale: 'en-US', market: 'US', exchange: 'NASDAQ' },
      'Europe/London': { country: 'UK', currency: 'GBP', timezone: 'Europe/London', locale: 'en-GB', market: 'UK', exchange: 'LSE' },
      'Asia/Tokyo': { country: 'JP', currency: 'JPY', timezone: 'Asia/Tokyo', locale: 'ja-JP', market: 'JP', exchange: 'TSE' },
      'Australia/Sydney': { country: 'AU', currency: 'AUD', timezone: 'Australia/Sydney', locale: 'en-AU', market: 'AU', exchange: 'ASX' },
      'America/Toronto': { country: 'CA', currency: 'CAD', timezone: 'America/Toronto', locale: 'en-CA', market: 'CA', exchange: 'TSX' },
      'Europe/Berlin': { country: 'DE', currency: 'EUR', timezone: 'Europe/Berlin', locale: 'de-DE', market: 'DE', exchange: 'FSE' },
      'Europe/Paris': { country: 'FR', currency: 'EUR', timezone: 'Europe/Paris', locale: 'fr-FR', market: 'FR', exchange: 'EPA' }
    }

    this.userLocation = locationMap[timezone] || {
      country: 'US',
      currency: 'USD',
      timezone: 'America/New_York',
      locale: 'en-US',
      market: 'US',
      exchange: 'NASDAQ'
    }
  }

  getUserLocation(): UserLocation {
    if (!this.userLocation) {
      this.detectUserLocation()
    }
    return this.userLocation!
  }

  getCurrency(): string {
    return this.getUserLocation().currency
  }

  getCountry(): string {
    return this.getUserLocation().country
  }

  getTimezone(): string {
    return this.getUserLocation().timezone
  }

  getLocale(): string {
    return this.getUserLocation().locale
  }

  getMarket(): string {
    return this.getUserLocation().market
  }

  getExchange(): string {
    return this.getUserLocation().exchange
  }

  formatCurrency(amount: number, currency?: string): string {
    const actualCurrency = currency || this.getCurrency()
    const locale = this.getUserLocation().locale

    const formatters: { [key: string]: Intl.NumberFormat } = {
      'USD': new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
      'INR': new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }),
      'GBP': new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }),
      'JPY': new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }),
      'AUD': new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }),
      'CAD': new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }),
      'EUR': new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
    }

    const formatter = formatters[actualCurrency] || formatters['USD']
    return formatter.format(amount)
  }

  formatTime(date: Date): string {
    const timezone = this.getTimezone()
    return date.toLocaleTimeString(this.getLocale(), { 
      hour12: true,
      timeZone: timezone
    })
  }

  formatDate(date: Date): string {
    const timezone = this.getTimezone()
    return date.toLocaleDateString(this.getLocale(), { 
      timeZone: timezone
    })
  }

  formatDateTime(date: Date): string {
    const timezone = this.getTimezone()
    return date.toLocaleString(this.getLocale(), { 
      timeZone: timezone
    })
  }

  getCurrencySymbol(): string {
    const currency = this.getCurrency()
    const symbols: { [key: string]: string } = {
      'USD': '$',
      'INR': '₹',
      'GBP': '£',
      'JPY': '¥',
      'AUD': 'A$',
      'CAD': 'C$',
      'EUR': '€'
    }
    return symbols[currency] || currency
  }

  getCountryFlag(): string {
    const country = this.getCountry()
    const flags: { [key: string]: string } = {
      'US': '🇺🇸',
      'IN': '🇮🇳',
      'UK': '🇬🇧',
      'JP': '🇯🇵',
      'AU': '🇦🇺',
      'CA': '🇨🇦',
      'DE': '🇩🇪',
      'FR': '🇫🇷'
    }
    return flags[country] || '🌍'
  }

  getCountryName(): string {
    const country = this.getCountry()
    const names: { [key: string]: string } = {
      'US': 'United States',
      'IN': 'India',
      'UK': 'United Kingdom',
      'JP': 'Japan',
      'AU': 'Australia',
      'CA': 'Canada',
      'DE': 'Germany',
      'FR': 'France'
    }
    return names[country] || country
  }

  isIndianUser(): boolean {
    return this.getCountry() === 'IN'
  }

  isUSUser(): boolean {
    return this.getCountry() === 'US'
  }

  getDefaultMarket(): string {
    return this.getMarket()
  }

  getDefaultCurrency(): string {
    return this.getCurrency()
  }
}

export const localizationService = LocalizationService.getInstance()
