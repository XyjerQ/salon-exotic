import React from 'react'
import FeatureCard from '../components/FeatureCard'
import FeaturedCarousel from '../components/FeaturedCarousel'
import cars from '../data/cars.json'
import Hero from '../components/Hero'

export default function Home(){
  return (
    <section className="space-y-12">
      <Hero
        title="Blackline Salon"
        subtitleLines={[
          'Premium and exotic cars',
          '— Porsche, BMW M, and other rare models.'
        ]}
        ctaText="See our inventory"
        ctaHref="/inventory"
        image="/img/gt3rs.png"
      />

      <div id="inventory" className="mx-auto px-20">
  <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-center">Featured vehicles</h2>
        <FeaturedCarousel cars={cars} />
      </div>
    </section>
  )
}
