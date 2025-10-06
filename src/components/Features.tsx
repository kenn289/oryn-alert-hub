"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { TrendingUp, AlertCircle, Brain, Users, BarChart, Zap } from "lucide-react"

const features = [
  {
    icon: TrendingUp,
    title: "Real-time Price Alerts",
    description: "Get instant notifications for price movements, volume spikes, and technical breakouts.",
    color: "text-primary"
  },
  {
    icon: AlertCircle,
    title: "Options Flow Intelligence",
    description: "Track unusual options activity, dark pool trades, and institutional flow patterns.",
    color: "text-secondary"
  },
  {
    icon: Brain,
    title: "AI-Powered Summaries",
    description: "Automated earnings call summaries, news sentiment analysis, and market insights.",
    color: "text-success"
  },
  {
    icon: Users,
    title: "Insider & Institutional Tracking",
    description: "Monitor insider trades, institutional holdings, and smart money movements.",
    color: "text-warning"
  },
  {
    icon: BarChart,
    title: "Portfolio Analytics",
    description: "Track performance, dividend dates, tax-loss harvesting opportunities, and risk metrics.",
    color: "text-primary"
  },
  {
    icon: Zap,
    title: "Multi-Channel Notifications",
    description: "Email, webhook, and API integrations for seamless alert delivery.",
    color: "text-secondary"
  }
]

export function Features() {
  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need for
            <span className="block gradient-text">smart trading</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            One powerful bot that combines real-time market data, AI analysis, 
            and intelligent alerts to give you the edge you need.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover-lift border-border/50 bg-card/50 backdrop-blur-sm"
            >
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`p-2 rounded-lg bg-muted ${feature.color}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
                <CardDescription className="text-muted-foreground">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <Card className="p-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <h3 className="text-2xl font-bold mb-4">Ready to get started?</h3>
            <p className="text-muted-foreground mb-6">
              Start using Oryn today and get smarter alerts delivered to your email.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/auth"
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-glow-primary transition-all duration-200"
              >
                <TrendingUp className="mr-2 h-5 w-5" />
                Get Started
              </a>
              <a 
                href="/dashboard"
                className="inline-flex items-center justify-center px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                Open Dashboard
              </a>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
