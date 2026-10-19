'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { HeroSection } from '@/components/public/HeroSection';
import { AudienceSection } from '@/components/public/AudienceSection';
import { ProductsSection } from '@/components/public/ProductsSection';
import { HowItWorksSection } from '@/components/public/HowItWorksSection';
import { ComingSoonSection } from '@/components/public/ComingSoonSection';
import { PricingSection } from '@/components/public/PricingSection';
import { FinalCtaSection } from '@/components/public/FinalCtaSection';
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
    <div className="min-h-screen flex flex-col bg-black text-white selection:bg-rose-600 selection:text-white">
      {/* A. Header */}
      <PublicNavbar onSampleBookLaunch={handleLoadSampleBook} />

      <main className="flex-1">
        {/* B. Hero Section with Customer-Focused Messaging & Real Product Demo */}
        <HeroSection
          onLoadSampleBook={handleLoadSampleBook}
          isCreatingBook={isCreatingBook}
        />

        {/* C. Two Audience Paths (Authors & Publishers / Print Professionals) */}
        <AudienceSection />

        {/* D. Featured Products (ATS EasyBook & ATS Imposition) */}
        <ProductsSection />

        {/* E. How ATS Tech Works (Create -> Design -> Preflight -> Export -> Print) */}
        <HowItWorksSection />

        {/* F. Coming Soon (12 Modules with Category Filtering & Early Access Form) */}
        <ComingSoonSection />

        {/* G. Credits / Pricing Preview (Free Proof vs Print-Ready Export) */}
        <PricingSection />

        {/* H. Final CTA */}
        <FinalCtaSection />
      </main>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}
