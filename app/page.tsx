import Header from '@/components/layout/Header'
import Hero from '@/components/hero/Hero'
import Services from '@/components/services/Services'
import Portfolio from '@/components/portfolio/Portfolio'
import Team from '@/components/team/Team'
import Pricing from '@/components/pricing/Pricing'
import Testimonials from '@/components/testimonials/Testimonials'
import BookingWizard from '@/components/booking/BookingWizard'
import Contact from '@/components/contact/Contact'
import Footer from '@/components/layout/Footer'
import ScrollIndicator from '@/components/ui/ScrollIndicator'

export default function Home() {
  return (
    <main className="public-main">
      {/* Scroll progress indicator */}
      <ScrollIndicator />

      {/* Header/Navigation */}
      <Header />

      {/* Hero Section */}
      <Hero />

      {/* Services Section */}
      <Services />

      {/* Portfolio Gallery */}
      <Portfolio />

      {/* Team Section */}
      <Team />

      {/* Pricing Tables */}
      <Pricing />

      {/* Testimonials */}
      <Testimonials />

      {/* Booking Wizard */}
      <BookingWizard />

      {/* Contact & Location */}
      <Contact />

      {/* Footer */}
      <Footer />
    </main>
  )
}
