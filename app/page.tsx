import { Navigation } from "../src/components/Navigation"
import { Hero } from "../src/components/Hero"
import { Features } from "../src/components/Features"
import { Pricing } from "../src/components/Pricing"
import { Footer } from "../src/components/Footer"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <Features />
      <Pricing />
      <Footer />
    </div>
  )
}

