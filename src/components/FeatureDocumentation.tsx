"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Check, 
  X, 
  Star, 
  Zap, 
  TrendingUp, 
  AlertCircle, 
  Bot, 
  Database,
  Shield,
  Users,
  Settings,
  BarChart3,
  MessageSquare,
  Webhook
} from "lucide-react"

interface Feature {
  name: string
  description: string
  free: boolean
  pro: boolean
  team: boolean
  icon: React.ComponentType<{ className?: string }>
  category: string
  details: string
}

const features: Feature[] = [
  // Core Features
  {
    name: "Stock Watchlist",
    description: "Track your favorite stocks with real-time updates",
    free: true,
    pro: true,
    team: true,
    icon: TrendingUp,
    category: "Core",
    details: "Add up to 15 stocks on Free plan, unlimited on Pro/Team. Get real-time price updates, change notifications, and performance tracking."
  },
  {
    name: "Price Alerts",
    description: "Get notified when stocks hit your target prices",
    free: true,
    pro: true,
    team: true,
    icon: AlertCircle,
    category: "Core",
    details: "Set price alerts for any stock in your watchlist. Free plan includes basic price alerts, Pro/Team includes advanced alert types."
  },
  {
    name: "Discord Integration",
    description: "Receive alerts directly in your Discord server",
    free: true,
    pro: true,
    team: true,
    icon: Bot,
    category: "Core",
    details: "Full Discord bot integration with slash commands, rich embeds, and real-time notifications. Works on all plans."
  },

  // Pro Features
  {
    name: "Options Flow Analysis",
    description: "Track unusual options activity and big money moves",
    free: false,
    pro: true,
    team: true,
    icon: BarChart3,
    category: "Pro",
    details: "Real-time options flow data, unusual activity detection, premium flow analysis, and call/put ratio tracking."
  },
  {
    name: "AI Earnings Summaries",
    description: "Get AI-powered summaries of earnings reports",
    free: false,
    pro: true,
    team: true,
    icon: MessageSquare,
    category: "Pro",
    details: "Automated earnings call summaries, key metrics extraction, sentiment analysis, and actionable insights."
  },
  {
    name: "Insider Trading Alerts",
    description: "Monitor insider trading activity and SEC filings",
    free: false,
    pro: true,
    team: true,
    icon: Shield,
    category: "Pro",
    details: "Real-time insider trading notifications, SEC filing alerts, and institutional ownership changes."
  },
  {
    name: "Portfolio Analytics",
    description: "Advanced portfolio tracking and performance metrics",
    free: false,
    pro: true,
    team: true,
    icon: Database,
    category: "Pro",
    details: "Portfolio performance tracking, risk analysis, sector allocation, and historical performance metrics."
  },

  // Team Features
  {
    name: "Team Collaboration",
    description: "Share insights and collaborate with your trading team",
    free: false,
    pro: false,
    team: true,
    icon: Users,
    category: "Team",
    details: "Team workspaces, shared watchlists, collaborative alerts, and team performance dashboards."
  },
  {
    name: "Custom Webhooks",
    description: "Integrate with your existing trading infrastructure",
    free: false,
    pro: false,
    team: true,
    icon: Webhook,
    category: "Team",
    details: "Custom webhook endpoints, API access, and integration with trading platforms and tools."
  },
  {
    name: "Advanced Analytics",
    description: "Deep dive into market data with advanced analytics",
    free: false,
    pro: false,
    team: true,
    icon: BarChart3,
    category: "Team",
    details: "Advanced charting, technical indicators, backtesting tools, and custom analytics dashboards."
  },
  {
    name: "White-label Options",
    description: "Customize the bot with your brand and colors",
    free: false,
    pro: false,
    team: true,
    icon: Settings,
    category: "Team",
    details: "Custom bot branding, personalized commands, and white-label Discord integration."
  }
]

const planFeatures = {
  free: {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Perfect for getting started",
    features: [
      "Up to 15 watchlist items",
      "Basic price alerts",
      "Discord notifications",
      "Community support"
    ],
    limitations: [
      "Limited to 15 stocks",
      "Basic alert types only",
      "No options flow data",
      "No AI summaries"
    ]
  },
  pro: {
    name: "Pro",
    price: "₹999",
    period: "month",
    description: "For serious traders",
    features: [
      "Unlimited watchlist items",
      "Real-time options flow",
      "AI earnings summaries",
      "Insider trading alerts",
      "Portfolio analytics",
      "Priority support"
    ],
    limitations: [
      "No team collaboration",
      "No custom webhooks",
      "No white-label options"
    ]
  },
  team: {
    name: "Team",
    price: "₹2,999",
    period: "month",
    description: "For trading teams",
    features: [
      "Everything in Pro",
      "Team collaboration",
      "Custom webhooks",
      "Advanced analytics",
      "White-label options",
      "Dedicated support"
    ],
    limitations: []
  }
}

export function FeatureDocumentation() {
  const categories = ["Core", "Pro", "Team"]
  
  return (
    <div className="space-y-8">
      {/* Plan Comparison */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Star className="h-6 w-6" />
            Plan Comparison
          </CardTitle>
          <CardDescription>
            Compare features across all plans to find the right fit for your needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(planFeatures).map(([key, plan]) => (
              <Card key={key} className={`${key === 'pro' ? 'border-primary/50 bg-gradient-to-b from-primary/5 to-transparent' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    {key === 'pro' && (
                      <Badge className="bg-primary text-primary-foreground">
                        <Zap className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    )}
                  </div>
                  <div className="text-3xl font-bold">{plan.price}</div>
                  <p className="text-sm text-muted-foreground">/{plan.period}</p>
                  <p className="text-sm">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2 text-success">✅ Included Features</h4>
                      <ul className="space-y-1 text-sm">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-success" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {plan.limitations.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 text-destructive">❌ Limitations</h4>
                        <ul className="space-y-1 text-sm">
                          {plan.limitations.map((limitation, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <X className="h-3 w-3 text-destructive" />
                              {limitation}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Detailed Feature Breakdown
          </CardTitle>
          <CardDescription>
            Comprehensive overview of all features and their availability across plans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="Core" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="Core">Core Features</TabsTrigger>
              <TabsTrigger value="Pro">Pro Features</TabsTrigger>
              <TabsTrigger value="Team">Team Features</TabsTrigger>
            </TabsList>

            {categories.map((category) => (
              <TabsContent key={category} value={category}>
                <div className="grid gap-4">
                  {features
                    .filter(feature => feature.category === category)
                    .map((feature, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <feature.icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{feature.name}</h3>
                              <div className="flex gap-1">
                                {feature.free && (
                                  <Badge variant="outline" className="text-xs">Free</Badge>
                                )}
                                {feature.pro && (
                                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary">Pro</Badge>
                                )}
                                {feature.team && (
                                  <Badge variant="outline" className="text-xs bg-secondary/10 text-secondary">Team</Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{feature.description}</p>
                            <p className="text-sm">{feature.details}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Discord Bot Commands */}
      <Card className="bg-gradient-to-r from-success/5 to-accent/5 border-success/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-success" />
            Discord Bot Commands
          </CardTitle>
          <CardDescription>
            Complete list of Discord bot commands and their functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3 text-success">📊 Stock Commands</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-background/50 rounded">
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">/watch AAPL</code>
                  <span className="text-sm">Add Apple to watchlist</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-background/50 rounded">
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">/price TSLA</code>
                  <span className="text-sm">Get Tesla current price</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-background/50 rounded">
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">/unwatch NVDA</code>
                  <span className="text-sm">Remove NVIDIA from watchlist</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-warning">🔔 Alert Commands</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-background/50 rounded">
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">/alert price AAPL 180</code>
                  <span className="text-sm">Set price alert</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-background/50 rounded">
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">/alerts</code>
                  <span className="text-sm">View all alerts</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-secondary">📈 Options Flow (Pro+)</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-background/50 rounded">
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">/flow TSLA</code>
                  <span className="text-sm">Get options flow for Tesla</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-background/50 rounded">
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">/flow</code>
                  <span className="text-sm">Top options flow today</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-accent">⚙️ Utility Commands</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-background/50 rounded">
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">/help</code>
                  <span className="text-sm">Show all commands</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-background/50 rounded">
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">/status</code>
                  <span className="text-sm">Check bot status</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-background/50 rounded">
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">/ping</code>
                  <span className="text-sm">Test bot connection</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
