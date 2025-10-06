"use client"

import Link from "next/link"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Activity, Home, ArrowLeft, Search } from "lucide-react"
import { OrynLogo } from "../components/OrynLogo"

export default function NotFound() {
  return (
    <div className="page-background flex items-center justify-center p-4">
      {/* Floating elements */}
      <div className="floating-element-1"></div>
      <div className="floating-element-2"></div>
      <div className="floating-element-3"></div>
      
      <div className="max-w-md w-full relative z-10">
        <Card className="text-center">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <OrynLogo size={64} className="h-16 w-16" />
            </div>
            <CardTitle className="text-2xl">Page Not Found</CardTitle>
            <CardDescription>
              The page you're looking for doesn't exist or has been moved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Here are some helpful links:
              </p>
              <div className="grid grid-cols-1 gap-2">
                <Link href="/">
                  <Button variant="outline" className="w-full justify-start">
                    <Home className="h-4 w-4 mr-2" />
                    Home
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full justify-start">
                    <Activity className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/docs">
                  <Button variant="outline" className="w-full justify-start">
                    <Search className="h-4 w-4 mr-2" />
                    Documentation
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="pt-4">
              <Button 
                variant="ghost" 
                onClick={() => window.history.back()}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
