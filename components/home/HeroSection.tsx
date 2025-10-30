'use client';

import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export function HeroSection() {
  const router = useRouter();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-black via-gray-900 to-black py-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(250, 204, 21, 0.1) 2px,
            rgba(250, 204, 21, 0.1) 4px
          )`
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-block mb-6">
            <span className="bg-yellow-400/20 border border-yellow-400 text-yellow-400 px-4 py-2 rounded-full text-sm font-semibold">
              🚀 AI-Powered Book Generation
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Write Your
            <span className="block text-yellow-400">Complete Book</span>
            in Minutes
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Transform your ideas into professionally written books using advanced AI technology. 
            No writing experience needed.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push('/studio')}
              className="text-lg px-8 py-4 w-full sm:w-auto"
            >
              Start Writing Now
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push('/library')}
              className="text-lg px-8 py-4 w-full sm:w-auto"
            >
              View Library
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-yellow-400">10K+</div>
              <div className="text-sm text-gray-400 mt-1">Books Generated</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-yellow-400">500M+</div>
              <div className="text-sm text-gray-400 mt-1">Words Written</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-yellow-400">95%</div>
              <div className="text-sm text-gray-400 mt-1">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-yellow-400 rounded-full blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-yellow-400 rounded-full blur-3xl opacity-20 animate-pulse delay-1000" />
    </section>
  );
}
