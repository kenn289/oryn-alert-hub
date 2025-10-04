"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Activity, TrendingUp, AlertCircle, Zap } from "lucide-react"
import Link from "next/link"
import { OrynLogo } from "@/components/OrynLogo"

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated gradient blob */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-transparent animate-pulse-glow" />
      
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00d4aa08_1px,transparent_1px),linear-gradient(to_bottom,#00d4aa08_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      
      {/* Floating elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-primary/10 rounded-full blur-xl animate-float" />
      <div className="absolute bottom-20 right-20 w-24 h-24 bg-secondary/10 rounded-full blur-xl animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-accent/10 rounded-full blur-lg animate-float" style={{ animationDelay: '2s' }} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-slide-in">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Stock Intelligence
                <span className="block gradient-text animate-gradient-shift">Platform</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
                Get smarter alerts for earnings calls, options flow, insider trades, 
                and market movements. One platform, endless possibilities.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <Link href="/auth">
                <Button size="lg" variant="gradient" className="w-full sm:w-auto micro-interaction hover-lift">
                  <OrynLogo size={20} className="mr-2 h-5 w-5" />
                  Get Started
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="w-full sm:w-auto micro-interaction hover-lift">
                  View Dashboard
                </Button>
              </Link>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 gap-4 pt-8 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <div className="flex items-center space-x-2 micro-interaction">
                <TrendingUp className="h-5 w-5 text-primary animate-bounce-subtle" />
                <span className="text-sm">Real-time Alerts</span>
              </div>
              <div className="flex items-center space-x-2 micro-interaction">
                <AlertCircle className="h-5 w-5 text-primary animate-bounce-subtle" style={{ animationDelay: '0.5s' }} />
                <span className="text-sm">Options Flow</span>
              </div>
              <div className="flex items-center space-x-2 micro-interaction">
                <Zap className="h-5 w-5 text-primary animate-bounce-subtle" style={{ animationDelay: '1s' }} />
                <span className="text-sm">AI Summaries</span>
              </div>
              <div className="flex items-center space-x-2 micro-interaction">
                <Activity className="h-5 w-5 text-primary animate-bounce-subtle" style={{ animationDelay: '1.5s' }} />
                <span className="text-sm">Multi-Channel</span>
              </div>
            </div>

            {/* Call to action */}
            <div className="pt-4">
              <div className="inline-flex items-center space-x-2 bg-muted/50 px-4 py-2 rounded-full">
                <Activity className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Join the community of traders</span>
              </div>
            </div>
          </div>

          {/* Right Content - Dashboard Preview */}
          <div className="relative">
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Dashboard Preview</h3>
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-destructive"></div>
                    <div className="w-3 h-3 rounded-full bg-warning"></div>
                    <div className="w-3 h-3 rounded-full bg-success"></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">Live</div>
                    <div className="text-sm text-muted-foreground">Active Alerts</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-secondary">Real-time</div>
                    <div className="text-sm text-muted-foreground">Options Flow</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">Your Watchlist</span>
                    <span className="text-sm text-success">Live Data</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">Market Alerts</span>
                    <span className="text-sm text-primary">Active</span>
                  </div>
                  {/* Discord Bot removed - not needed */}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
