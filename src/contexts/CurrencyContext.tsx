"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { currencyConversionService } from '../lib/currency-conversion-service'

interface CurrencyContextType {
  selectedCurrency: string
  selectedTimezone: string
  setCurrency: (currency: string) => void
  setSelectedCurrency: (currency: string) => void
  setTimezone: (timezone: string) => void
  formatCurrency: (amount: number, originalCurrency?: string) => string
  convertCurrency: (amount: number, fromCurrency: string, toCurrency?: string) => number
  getCurrencySymbol: () => string
  getTimezoneName: () => string
  isIndianUser: boolean
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

interface CurrencyProviderProps {
  children: ReactNode
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [selectedCurrency, setSelectedCurrency] = useState('USD')
  const [selectedTimezone, setSelectedTimezone] = useState('America/New_York')
  const [isIndianUser, setIsIndianUser] = useState(false)

  // Initialize currency and timezone based on user's location
  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    setSelectedTimezone(timezone)
    
    // Detect user's preferred currency based on timezone
    const currencyMap: { [key: string]: string } = {
      'Asia/Kolkata': 'INR',
      'Asia/Calcutta': 'INR',
      'America/New_York': 'USD',
      'America/Los_Angeles': 'USD',
      'Europe/London': 'GBP',
      'Asia/Tokyo': 'JPY',
      'Australia/Sydney': 'AUD',
      'America/Toronto': 'CAD',
      'Europe/Berlin': 'EUR',
      'Europe/Paris': 'EUR'
    }
    
    const detectedCurrency = currencyMap[timezone] || 'USD'
    setSelectedCurrency(detectedCurrency)
    setIsIndianUser(detectedCurrency === 'INR')
    
    // Update currency conversion rates
    currencyConversionService.updateRates()
  }, [])

  const setCurrency = (currency: string) => {
    setSelectedCurrency(currency)
    localStorage.setItem('oryn_selected_currency', currency)
  }

  const setTimezone = (timezone: string) => {
    setSelectedTimezone(timezone)
    localStorage.setItem('oryn_selected_timezone', timezone)
  }

  const formatCurrency = (amount: number, originalCurrency?: string) => {
    // If we have an original currency and it's different from selected currency, convert it
    if (originalCurrency && originalCurrency !== selectedCurrency) {
      return currencyConversionService.formatConvertedAmount(amount, originalCurrency, selectedCurrency)
    }
    
    // If no original currency specified, assume it's USD and convert if needed
    if (!originalCurrency && selectedCurrency !== 'USD') {
      return currencyConversionService.formatConvertedAmount(amount, 'USD', selectedCurrency)
    }
    
    // If same currency or USD, just format normally
    const formatters: { [key: string]: Intl.NumberFormat } = {
      'USD': new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 6 }),
      'INR': new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 6 }),
      'GBP': new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2, maximumFractionDigits: 6 }),
      'JPY': new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', minimumFractionDigits: 0, maximumFractionDigits: 6 }),
      'AUD': new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 2, maximumFractionDigits: 6 }),
      'CAD': new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 2, maximumFractionDigits: 6 }),
      'EUR': new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 6 })
    }

    const formatter = formatters[selectedCurrency] || formatters['USD']
    return formatter.format(amount)
  }

  const convertCurrency = (amount: number, fromCurrency: string, toCurrency?: string) => {
    const targetCurrency = toCurrency || selectedCurrency
    return currencyConversionService.convertCurrency(amount, fromCurrency, targetCurrency)
  }

  const getCurrencySymbol = () => {
    const symbols: { [key: string]: string } = {
      'USD': '$',
      'INR': '₹',
      'GBP': '£',
      'JPY': '¥',
      'AUD': 'A$',
      'CAD': 'C$',
      'EUR': '€'
    }
    return symbols[selectedCurrency] || selectedCurrency
  }

  const getTimezoneName = () => {
    const timezoneNames: { [key: string]: string } = {
      'America/New_York': 'EST',
      'America/Los_Angeles': 'PST',
      'Asia/Kolkata': 'IST',
      'Europe/London': 'GMT',
      'Asia/Tokyo': 'JST',
      'Australia/Sydney': 'AEST',
      'America/Toronto': 'EST',
      'Europe/Berlin': 'CET',
      'Europe/Paris': 'CET'
    }
    return timezoneNames[selectedTimezone] || selectedTimezone
  }

  // Load saved preferences
  useEffect(() => {
    const savedCurrency = localStorage.getItem('oryn_selected_currency')
    const savedTimezone = localStorage.getItem('oryn_selected_timezone')
    
    if (savedCurrency) {
      setSelectedCurrency(savedCurrency)
    }
    if (savedTimezone) {
      setSelectedTimezone(savedTimezone)
    }
  }, [])

  const value: CurrencyContextType = {
    selectedCurrency,
    selectedTimezone,
    setCurrency,
    setSelectedCurrency,
    setTimezone,
    formatCurrency,
    convertCurrency,
    getCurrencySymbol,
    getTimezoneName,
    isIndianUser
  }

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}
