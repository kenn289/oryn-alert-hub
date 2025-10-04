"use client"

import { currencyConversionService } from './currency-conversion-service'

export function convertStockPrice(price: number, fromCurrency: string = 'USD', toCurrency: string): number {
  return currencyConversionService.convertCurrency(price, fromCurrency, toCurrency)
}

export function formatStockPrice(price: number, fromCurrency: string = 'USD', toCurrency: string): string {
  const convertedPrice = convertStockPrice(price, fromCurrency, toCurrency)
  
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
  return formatter.format(convertedPrice)
}

export function convertPortfolioValue(value: number, fromCurrency: string = 'USD', toCurrency: string): number {
  return currencyConversionService.convertCurrency(value, fromCurrency, toCurrency)
}

export function formatPortfolioValue(value: number, fromCurrency: string = 'USD', toCurrency: string): string {
  const convertedValue = convertPortfolioValue(value, fromCurrency, toCurrency)
  
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
  return formatter.format(convertedValue)
}
