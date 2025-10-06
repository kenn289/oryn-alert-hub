import { Navigation } from "../components/Navigation"
import { Hero } from "../components/Hero"
import { Features } from "../components/Features"
import { Pricing } from "../components/Pricing"
import { Footer } from "../components/Footer"

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
