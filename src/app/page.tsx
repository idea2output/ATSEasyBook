'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { HeroSection } from '@/components/public/HeroSection';
import { ProductDemoSection } from '@/components/public/ProductDemoSection';
import { ProductsSection } from '@/components/public/ProductsSection';
import { ComingSoonSection } from '@/components/public/ComingSoonSection';
import { HowItWorksSection } from '@/components/public/HowItWorksSection';
import { PricingSection } from '@/components/public/PricingSection';
import { PublicFooter } from '@/components/public/PublicFooter';
import { bookRepository } from '@/services/storage/bookRepository';

export default function AtsTechHomePage() {
  const router = useRouter();
  const [isCreatingBook, setIsCreatingBook] = useState(false);

  const handleLoadSampleBook = async () => {
    try {
      setIsCreatingBook(true);
      const newBook = await bookRepository.getOrCreateSampleBook();
      router.push(`/books/${newBook.id}`);
    } catch (err) {
      console.error('Failed to load sample novel:', err);
      setIsCreatingBook(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white selection:bg-rose-600 selection:text-white">
      {/* Public Marketing Navigation */}
      <PublicNavbar onSampleBookLaunch={handleLoadSampleBook} />

      <main className="flex-1">
        {/* 1. Hero Section */}
        <HeroSection
          onLoadSampleBook={handleLoadSampleBook}
          isCreatingBook={isCreatingBook}
        />

        {/* 2. Interactive Product Demonstration */}
        <ProductDemoSection />

        {/* 3. Available Products (EasyBook & Imposition) */}
        <ProductsSection />

        {/* 4. Coming Soon (12 Modules) */}
        <ComingSoonSection />

        {/* 5. How It Works Workflow Pipeline */}
        <HowItWorksSection />

        {/* 6. Planned Credit Model Pricing */}
        <PricingSection />
      </main>

      {/* Public Footer */}
      <PublicFooter />
    </div>
  );
}
