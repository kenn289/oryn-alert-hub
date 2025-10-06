"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { 
  Lock, 
  Check, 
  Zap, 
  Brain, 
  TrendingUp, 
  BarChart3, 
  Webhook, 
  Users, 
  Activity,
  Crown,
  Star
} from "lucide-react"
import { UserPlan, hasFeatureAccess, getFeatureDescription } from "../lib/watchlist"
import { toast } from "sonner"

interface FeatureManagerProps {
  userPlan: UserPlan
  onUpgrade?: () => void
}

const featureIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  watchlist: Activity,
  priceAlerts: Zap,
  emailNotifications: Activity,
  basicOptionsFlow: TrendingUp,
  earningsSummaries: BarChart3,
  communitySupport: Users,
  advancedOptionsFlow: TrendingUp,
  aiInsights: Brain,
  insiderTrading: TrendingUp,
  portfolioAnalytics: BarChart3,
  customWebhooks: Webhook,
  teamCollaboration: Users,
  advancedAnalytics: BarChart3,
  whiteLabel: Crown,
  prioritySupport: Star
}

const featureCategories = {
  free: [
    'watchlist',
    'priceAlerts', 
    'emailNotifications',
    'basicOptionsFlow',
    'earningsSummaries',
    'communitySupport'
  ],
  pro: [
    'advancedOptionsFlow',
    'aiInsights',
    'insiderTrading',
    'portfolioAnalytics',
    'customWebhooks',
    'teamCollaboration',
    'advancedAnalytics',
    'whiteLabel',
    'prioritySupport'
  ]
}

export function FeatureManager({ userPlan, onUpgrade }: FeatureManagerProps) {

  const handleFeatureClick = (feature: string) => {
    const hasAccess = hasFeatureAccess(userPlan, feature as keyof UserPlan['features'])
    
    if (!hasAccess) {
      toast.error('This feature requires a Pro plan')
      if (onUpgrade) {
        onUpgrade()
      }
      return
    }
    
    toast.success('Feature activated!')
  }

  const renderFeature = (featureKey: string) => {
    const feature = featureKey as keyof UserPlan['features']
    const hasAccess = hasFeatureAccess(userPlan, feature)
    const description = getFeatureDescription(userPlan, feature)
    const Icon = featureIcons[featureKey] || Activity

    return (
      <Card 
        key={featureKey}
        className={`cursor-pointer transition-all duration-200 ${
          hasAccess 
            ? 'hover:shadow-md hover:scale-[1.02] border-primary/20' 
            : 'opacity-60 hover:opacity-80 border-muted'
        }`}
        onClick={() => handleFeatureClick(featureKey)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${hasAccess ? 'bg-primary/10' : 'bg-muted'}`}>
                <Icon className={`h-5 w-5 ${hasAccess ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <CardTitle className="text-base capitalize">
                  {featureKey.replace(/([A-Z])/g, ' $1').trim()}
                </CardTitle>
                <CardDescription className="text-sm">
                  {description}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasAccess ? (
                <Badge variant="default" className="bg-success text-success-foreground">
                  <Check className="h-3 w-3 mr-1" />
                  Available
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-muted text-muted-foreground">
                  <Lock className="h-3 w-3 mr-1" />
                  Pro Only
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        {!hasAccess && (
          <CardContent className="pt-0">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">
                Upgrade to Pro to unlock this feature
              </span>
              <Button size="sm" variant="outline" onClick={(e) => {
                e.stopPropagation()
                if (onUpgrade) onUpgrade()
              }}>
                Upgrade
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Free Features */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold">Available Features</h3>
          <Badge variant="outline" className="text-success border-success">
            Free Plan
          </Badge>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {featureCategories.free.map(renderFeature)}
        </div>
      </div>

      {/* Pro Features */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold">Pro Features</h3>
          <Badge variant="outline" className="text-primary border-primary">
            Pro Plan
          </Badge>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {featureCategories.pro.map(renderFeature)}
        </div>
      </div>

      {/* Upgrade CTA */}
      {userPlan.name === 'free' && (
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Unlock All Features
            </CardTitle>
            <CardDescription>
              Upgrade to Pro to access advanced features and unlimited usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={onUpgrade}
              className="w-full"
              size="lg"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Pro - ₹999/month
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
