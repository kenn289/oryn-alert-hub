"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { 
  Globe, 
  DollarSign, 
  Clock, 
  ChevronDown,
  Check
} from "lucide-react"
import { useCurrency } from "@/contexts/CurrencyContext"

const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' }
]

const timezones = [
  { code: 'America/New_York', name: 'Eastern Time (EST)', flag: '🇺🇸' },
  { code: 'America/Los_Angeles', name: 'Pacific Time (PST)', flag: '🇺🇸' },
  { code: 'Asia/Kolkata', name: 'Indian Standard Time (IST)', flag: '🇮🇳' },
  { code: 'Europe/London', name: 'Greenwich Mean Time (GMT)', flag: '🇬🇧' },
  { code: 'Asia/Tokyo', name: 'Japan Standard Time (JST)', flag: '🇯🇵' },
  { code: 'Australia/Sydney', name: 'Australian Eastern Time (AEST)', flag: '🇦🇺' },
  { code: 'America/Toronto', name: 'Eastern Time (EST)', flag: '🇨🇦' },
  { code: 'Europe/Berlin', name: 'Central European Time (CET)', flag: '🇩🇪' },
  { code: 'Europe/Paris', name: 'Central European Time (CET)', flag: '🇫🇷' }
]

export function CurrencySelector() {
  const { 
    selectedCurrency, 
    selectedTimezone, 
    setCurrency, 
    setTimezone,
    getCurrencySymbol,
    getTimezoneName
  } = useCurrency()

  const [isOpen, setIsOpen] = useState(false)

  const selectedCurrencyData = currencies.find(c => c.code === selectedCurrency)
  const selectedTimezoneData = timezones.find(t => t.code === selectedTimezone)

  return (
    <div className="flex items-center gap-2">
      {/* Currency Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <DollarSign className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{selectedCurrencyData?.flag} {selectedCurrency}</span>
            <span className="sm:hidden">{selectedCurrencyData?.symbol}</span>
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Select Currency</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {currencies.map((currency) => (
            <DropdownMenuItem
              key={currency.code}
              onClick={() => setCurrency(currency.code)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span>{currency.flag}</span>
                <span>{currency.name}</span>
                <Badge variant="outline" className="text-xs">
                  {currency.symbol}
                </Badge>
              </div>
              {selectedCurrency === currency.code && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Timezone Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <Clock className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{selectedTimezoneData?.flag} {getTimezoneName()}</span>
            <span className="sm:hidden">{selectedTimezoneData?.flag}</span>
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Select Timezone</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {timezones.map((timezone) => (
            <DropdownMenuItem
              key={timezone.code}
              onClick={() => setTimezone(timezone.code)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span>{timezone.flag}</span>
                <span>{timezone.name}</span>
              </div>
              {selectedTimezone === timezone.code && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
