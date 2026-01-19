import React from 'react'
import FeatureCard from '../components/FeatureCard'
import FeaturedCarousel from '../components/FeaturedCarousel'
import cars from '../data/cars.json'
import Hero from '../components/Hero'
import TestDriveCTA from '../components/TestDriveCTA'
import WhyBlackline from '../components/WhyBlackline'
import FinancingCalculator from '../components/FinancingCalculator'
import NewsletterCTA from '../components/NewsletterCTA'
import FAQSection from '../components/FAQSection'
import { useScrollAnimation } from '../hooks/useScrollAnimation'

export default function Home(){
  const featuredRef = useScrollAnimation()
  
  return (
    <section className="space-y-12">
      <Hero />

      <div ref={featuredRef} className="opacity-0-init mx-auto px-4 md:px-8 lg:px-20">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-center">Featured vehicles</h2>
        <FeaturedCarousel cars={cars} />
      </div>

      <TestDriveCTA />
      <WhyBlackline />
      <FinancingCalculator />
      <NewsletterCTA />
      <FAQSection />
    </section>
  )
}
