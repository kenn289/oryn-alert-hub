'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Layout, 
  Grid, 
  List, 
  Maximize2, 
  Minimize2, 
  Settings,
  Monitor,
  Tablet,
  Smartphone,
  Laptop
} from 'lucide-react'

interface LayoutOptimizerProps {
  children: React.ReactNode
  title?: string
  description?: string
  showLayoutControls?: boolean
  defaultLayout?: 'grid' | 'list' | 'compact'
  defaultView?: 'desktop' | 'tablet' | 'mobile'
}

export function LayoutOptimizer({
  children,
  title = 'Dashboard',
  description = 'Optimized layout for different screen sizes',
  showLayoutControls = true,
  defaultLayout = 'grid',
  defaultView = 'desktop'
}: LayoutOptimizerProps) {
  const [layout, setLayout] = useState<'grid' | 'list' | 'compact'>(defaultLayout)
  const [view, setView] = useState<'desktop' | 'tablet' | 'mobile'>(defaultView)
  const [isExpanded, setIsExpanded] = useState(false)
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop' | 'wide'>('desktop')

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth
      if (width < 640) setScreenSize('mobile')
      else if (width < 768) setScreenSize('tablet')
      else if (width < 1024) setScreenSize('desktop')
      else setScreenSize('wide')
    }

    updateScreenSize()
    window.addEventListener('resize', updateScreenSize)
    return () => window.removeEventListener('resize', updateScreenSize)
  }, [])

  const getLayoutClasses = () => {
    switch (layout) {
      case 'grid':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6'
      case 'list':
        return 'space-y-4'
      case 'compact':
        return 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 md:gap-4'
      default:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6'
    }
  }

  const getViewClasses = () => {
    switch (view) {
      case 'mobile':
        return 'max-w-sm mx-auto'
      case 'tablet':
        return 'max-w-4xl mx-auto'
      case 'desktop':
        return 'max-w-7xl mx-auto'
      default:
        return 'max-w-7xl mx-auto'
    }
  }

  const getCardClasses = () => {
    switch (layout) {
      case 'grid':
        return 'h-32 md:h-40 lg:h-48 xl:h-56'
      case 'list':
        return 'h-24 md:h-32'
      case 'compact':
        return 'h-16 md:h-20'
      default:
        return 'h-32 md:h-40 lg:h-48 xl:h-56'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                {title}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            {showLayoutControls && (
              <div className="flex gap-2">
                <Tabs value={layout} onValueChange={(value) => setLayout(value as any)}>
                  <TabsList>
                    <TabsTrigger value="grid">
                      <Grid className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="list">
                      <List className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="compact">
                      <Settings className="h-4 w-4" />
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <Tabs value={view} onValueChange={(value) => setView(value as any)}>
                  <TabsList>
                    <TabsTrigger value="mobile">
                      <Smartphone className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="tablet">
                      <Tablet className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="desktop">
                      <Monitor className="h-4 w-4" />
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Layout Info */}
      {showLayoutControls && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="outline">
                  Layout: {layout}
                </Badge>
                <Badge variant="outline">
                  View: {view}
                </Badge>
                <Badge variant="outline">
                  Screen: {screenSize}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {getLayoutClasses()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      <div className={getViewClasses()}>
        <div className={getLayoutClasses()}>
          {children}
        </div>
      </div>
    </div>
  )
}
