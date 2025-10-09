"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../src/components/ui/card"
import { Badge } from "../../src/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../src/components/ui/tabs"
import { 
  BookOpen, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  Activity,
  DollarSign,
  BarChart3,
  Users,
  Headphones,
  Brain,
  Zap,
  Shield,
  Clock,
  Globe
} from "lucide-react"

export default function DocsPage() {
  return (
    <div className="page-background">
      {/* Floating elements */}
      <div className="floating-element-1"></div>
      <div className="floating-element-2"></div>
      <div className="floating-element-3"></div>
      
      <div className="container mx-auto px-4 py-8 max-w-6xl pt-20 relative z-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold flex items-center gap-3 mb-4">
          <BookOpen className="h-10 w-10 text-primary" />
          Oryn Alert Hub Documentation
        </h1>
        <p className="text-xl text-muted-foreground">
          Complete guide to understanding all features and terms in simple, beginner-friendly language
        </p>
      </div>

      <Tabs defaultValue="basics" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="basics">Basics</TabsTrigger>
          <TabsTrigger value="market">Market</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="options">Options</TabsTrigger>
          <TabsTrigger value="pro">Pro Features</TabsTrigger>
        </TabsList>

        {/* Basics Tab */}
        <TabsContent value="basics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Basic Trading Terms
              </CardTitle>
              <CardDescription>
                Essential terms every beginner needs to know
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <h3 className="font-semibold text-green-600">Bullish</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it means:</strong> Positive market sentiment. When investors expect stock prices to go up.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Example:</strong> If AAPL stock is at $150 and you think it will reach $160, you're bullish on AAPL.
                    </p>
                    <Badge variant="outline" className="mt-2">Positive Outlook</Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      <h3 className="font-semibold text-red-600">Bearish</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it means:</strong> Negative market sentiment. When investors expect stock prices to go down.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Example:</strong> If you think TSLA stock will drop from $200 to $180, you're bearish on TSLA.
                    </p>
                    <Badge variant="outline" className="mt-2">Negative Outlook</Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-blue-500" />
                      <h3 className="font-semibold text-blue-600">Neutral</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it means:</strong> No strong opinion on market direction. Expecting prices to stay roughly the same.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Example:</strong> If you think a stock will stay around $100 without major moves, you're neutral.
                    </p>
                    <Badge variant="outline" className="mt-2">Stable Outlook</Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <h3 className="font-semibold">Stock Price</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it means:</strong> The current cost to buy one share of a company's stock.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Example:</strong> If AAPL stock is $150, you need $150 to buy one share of Apple.
                    </p>
                    <Badge variant="outline" className="mt-2">Current Value</Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-blue-500" />
                      <h3 className="font-semibold">Volume</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it means:</strong> How many shares of a stock were traded in a given time period.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Example:</strong> If 1 million AAPL shares were traded today, the volume is 1 million.
                    </p>
                    <Badge variant="outline" className="mt-2">Trading Activity</Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-purple-500" />
                      <h3 className="font-semibold">Ticker Symbol</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it means:</strong> Short code used to identify a stock on the market.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Example:</strong> AAPL for Apple, MSFT for Microsoft, GOOGL for Google.
                    </p>
                    <Badge variant="outline" className="mt-2">Stock Code</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Tab */}
        <TabsContent value="market" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Market Status & Trading Hours
              </CardTitle>
              <CardDescription>
                Understanding when markets are open and how it affects your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-green-500" />
                      <h3 className="font-semibold text-green-600">Market Open</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it means:</strong> When stock markets are actively trading. This is when you get real-time prices.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>US Market Hours:</strong> Monday-Friday, 9:30 AM - 4:00 PM EST
                    </p>
                    <Badge variant="outline" className="mt-2">Live Trading</Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-red-500" />
                      <h3 className="font-semibold text-red-600">Market Closed</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it means:</strong> When stock markets are not trading. Prices don't change, but you can still set up alerts.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>When:</strong> Evenings, weekends, and holidays
                    </p>
                    <Badge variant="outline" className="mt-2">No Trading</Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <h3 className="font-semibold text-yellow-600">Pre-Market</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it means:</strong> Limited trading before regular market hours. Fewer traders, less activity.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Hours:</strong> 4:00 AM - 9:30 AM EST
                    </p>
                    <Badge variant="outline" className="mt-2">Limited Trading</Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <h3 className="font-semibold text-orange-600">After Hours</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it means:</strong> Limited trading after regular market hours. Often reacts to news and earnings.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Hours:</strong> 4:00 PM - 8:00 PM EST
                    </p>
                    <Badge variant="outline" className="mt-2">News Reactions</Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      <h3 className="font-semibold">Real-time Data</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it means:</strong> Live, up-to-the-minute stock prices and market information.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Best during:</strong> Market hours when trading is active
                    </p>
                    <Badge variant="outline" className="mt-2">Live Updates</Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <h3 className="font-semibold text-yellow-600">Delayed Data</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it means:</strong> Stock prices that are 15-20 minutes old. Common when markets are closed.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>When:</strong> Outside market hours or with free data sources
                    </p>
                    <Badge variant="outline" className="mt-2">Not Live</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alert System
              </CardTitle>
              <CardDescription>
                How alerts work and what they monitor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <h3 className="font-semibold text-green-600">Price Alerts</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it does:</strong> Notifies you when a stock reaches a specific price.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Example:</strong> "Alert me when AAPL hits $160" or "Alert me if TSLA drops below $200"
                    </p>
                    <Badge variant="outline" className="mt-2">Price Targets</Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-blue-500" />
                      <h3 className="font-semibold text-blue-600">Volume Alerts</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it does:</strong> Alerts you when trading volume is unusually high.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Example:</strong> "Alert me if AAPL volume is 3x normal" - indicates big news or interest
                    </p>
                    <Badge variant="outline" className="mt-2">Trading Activity</Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-purple-500" />
                      <h3 className="font-semibold text-purple-600">Options Alerts</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it does:</strong> Monitors unusual options trading activity (Pro feature).
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Example:</strong> "Alert me if someone buys 10,000 call options on AAPL" - indicates big money interest
                    </p>
                    <Badge variant="outline" className="mt-2">Big Money Moves</Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-orange-500" />
                      <h3 className="font-semibold text-orange-600">Active Alerts</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it means:</strong> Alerts that are currently monitoring your stocks and will notify you.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Example:</strong> If you have 5 alerts set up, you have 5 active alerts monitoring your stocks.
                    </p>
                    <Badge variant="outline" className="mt-2">Currently Monitoring</Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <h3 className="font-semibold text-yellow-600">Triggered Alerts</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it means:</strong> Alerts that have fired because their conditions were met.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Example:</strong> If AAPL hits your $160 target, the alert "triggers" and notifies you.
                    </p>
                    <Badge variant="outline" className="mt-2">Alert Fired</Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-green-500" />
                      <h3 className="font-semibold text-green-600">Success Rate</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it means:</strong> Percentage of alerts that correctly predicted price movements.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Example:</strong> 85% success rate means 85 out of 100 alerts were accurate.
                    </p>
                    <Badge variant="outline" className="mt-2">Accuracy</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Portfolio Tab */}
        <TabsContent value="portfolio" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Portfolio & Performance
              </CardTitle>
              <CardDescription>
                Understanding your investment performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <h3 className="font-semibold text-green-600">Total Value</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it means:</strong> Current market value of all your investments combined.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Example:</strong> If you own $5,000 worth of AAPL and $3,000 worth of MSFT, your total value is $8,000.
                    </p>
                    <Badge variant="outline" className="mt-2">Current Worth</Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <h3 className="font-semibold text-green-600">Total Gain/Loss</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it means:</strong> How much money you've made or lost on your investments.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Example:</strong> If you invested $7,000 and your portfolio is now worth $8,000, you have a $1,000 gain.
                    </p>
                    <Badge variant="outline" className="mt-2">Profit/Loss</Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-blue-500" />
                      <h3 className="font-semibold text-blue-600">Day Change</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it means:</strong> How much your portfolio value changed today.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Example:</strong> If your portfolio was $8,000 yesterday and $8,200 today, your day change is +$200.
                    </p>
                    <Badge variant="outline" className="mt-2">Today's Performance</Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-purple-500" />
                      <h3 className="font-semibold text-purple-600">Sharpe Ratio</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it means:</strong> Measures how much extra return you get for the risk you take.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Good ratio:</strong> Above 1.0 means good risk-adjusted returns. Above 2.0 is excellent.
                    </p>
                    <Badge variant="outline" className="mt-2">Risk-Adjusted Return</Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      <h3 className="font-semibold text-red-600">Max Drawdown</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it means:</strong> The biggest loss your portfolio has experienced from its highest point.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Example:</strong> If your portfolio peaked at $10,000 and dropped to $8,000, your max drawdown is 20%.
                    </p>
                    <Badge variant="outline" className="mt-2">Worst Loss</Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-orange-500" />
                      <h3 className="font-semibold text-orange-600">Holdings</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it means:</strong> The individual stocks and investments you own.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Example:</strong> Your holdings might be 10 shares of AAPL, 5 shares of MSFT, and 2 shares of GOOGL.
                    </p>
                    <Badge variant="outline" className="mt-2">Your Stocks</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Options Tab */}
        <TabsContent value="options" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Options Flow Analysis
              </CardTitle>
              <CardDescription>
                Understanding options trading and institutional activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <h3 className="font-semibold text-green-600">Call Options</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it means:</strong> A bet that a stock price will go up. Gives you the right to buy at a set price.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Example:</strong> Buying AAPL call options means you think AAPL will go up.
                    </p>
                    <Badge variant="outline" className="mt-2">Bullish Bet</Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      <h3 className="font-semibold text-red-600">Put Options</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it means:</strong> A bet that a stock price will go down. Gives you the right to sell at a set price.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Example:</strong> Buying TSLA put options means you think TSLA will go down.
                    </p>
                    <Badge variant="outline" className="mt-2">Bearish Bet</Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-blue-500" />
                      <h3 className="font-semibold text-blue-600">Call/Put Ratio</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it means:</strong> Compares how many call options vs put options are being traded.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>High ratio:</strong> More calls than puts = bullish sentiment. Low ratio = bearish sentiment.
                    </p>
                    <Badge variant="outline" className="mt-2">Market Sentiment</Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <h3 className="font-semibold text-yellow-600">Unusual Activity</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it means:</strong> Options trading that's much larger or different than normal.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Example:</strong> Someone buying 10,000 call options when normal is 100 - this is unusual activity.
                    </p>
                    <Badge variant="outline" className="mt-2">Big Money Moves</Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-purple-500" />
                      <h3 className="font-semibold text-purple-600">Large Trades</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it means:</strong> Options trades with big money involved, often from institutions.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Example:</strong> A $1 million options trade on AAPL - this is a large trade that might move the stock.
                    </p>
                    <Badge variant="outline" className="mt-2">Institutional Activity</Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-orange-500" />
                      <h3 className="font-semibold text-orange-600">Volume Spikes</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it means:</strong> Sudden increase in options trading volume, often indicating news or interest.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Example:</strong> If normal options volume is 1,000 and suddenly it's 10,000 - this is a volume spike.
                    </p>
                    <Badge variant="outline" className="mt-2">Trading Surge</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pro Features Tab */}
        <TabsContent value="pro" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Pro Features
              </CardTitle>
              <CardDescription>
                Advanced features available with Pro subscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-4 w-4 text-purple-500" />
                      <h3 className="font-semibold text-purple-600">AI Insights</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it does:</strong> Uses artificial intelligence to analyze market data and make predictions.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Example:</strong> AI might predict that tech stocks will go up 5% in the next week with 85% confidence.
                    </p>
                    <Badge variant="outline" className="mt-2">AI Predictions</Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <h3 className="font-semibold text-blue-600">Insider Trading</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it does:</strong> Tracks when company executives buy or sell their own company's stock.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Example:</strong> If Apple's CEO buys $10 million worth of AAPL stock, this is insider buying.
                    </p>
                    <Badge variant="outline" className="mt-2">Executive Activity</Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-green-500" />
                      <h3 className="font-semibold text-green-600">Portfolio Analytics</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it does:</strong> Advanced analysis of your portfolio performance and risk.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Example:</strong> Shows how your portfolio compares to the market and identifies risks.
                    </p>
                    <Badge variant="outline" className="mt-2">Advanced Analysis</Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <h3 className="font-semibold text-yellow-600">Custom Webhooks</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it does:</strong> Sends real-time data to your own applications and systems.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Example:</strong> Automatically send stock alerts to your trading bot or mobile app.
                    </p>
                    <Badge variant="outline" className="mt-2">API Integration</Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-orange-500" />
                      <h3 className="font-semibold text-orange-600">Team Collaboration</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it does:</strong> Share watchlists and analytics with your team members.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Example:</strong> Share your stock analysis with colleagues or family members.
                    </p>
                    <Badge variant="outline" className="mt-2">Team Sharing</Badge>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Headphones className="h-4 w-4 text-red-500" />
                      <h3 className="font-semibold text-red-600">Priority Support</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>What it does:</strong> 24/7 priority customer support with fast response times.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Example:</strong> Get help within 2 minutes instead of waiting hours for support.
                    </p>
                    <Badge variant="outline" className="mt-2">VIP Support</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Reference */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Quick Reference
          </CardTitle>
          <CardDescription>
            Common terms and their meanings at a glance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-600">Bullish Terms</h4>
              <div className="text-sm space-y-1">
                <div><strong>Bullish:</strong> Expecting prices to go up</div>
                <div><strong>Call Options:</strong> Betting on price increases</div>
                <div><strong>Gainers:</strong> Stocks that went up today</div>
                <div><strong>Volume Spike:</strong> Unusually high trading activity</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-red-600">Bearish Terms</h4>
              <div className="text-sm space-y-1">
                <div><strong>Bearish:</strong> Expecting prices to go down</div>
                <div><strong>Put Options:</strong> Betting on price decreases</div>
                <div><strong>Losers:</strong> Stocks that went down today</div>
                <div><strong>Drawdown:</strong> How much you've lost from peak</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-600">Neutral Terms</h4>
              <div className="text-sm space-y-1">
                <div><strong>Neutral:</strong> No strong opinion on direction</div>
                <div><strong>Holdings:</strong> Stocks you own</div>
                <div><strong>Watchlist:</strong> Stocks you're monitoring</div>
                <div><strong>Alerts:</strong> Notifications when conditions are met</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </div>
  )
}

