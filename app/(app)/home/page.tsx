import { HeroSection, HomeChangelogSection } from "@/components/hero-section"
import { DailyGamesSection } from "@/components/daily-games-section"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <DailyGamesSection />
      <HomeChangelogSection />
    </div>
  )
}
