'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { SignUpButton, SignedIn, SignedOut } from '@clerk/nextjs';
import { Button } from '@/components/ui/Button';
import { 
  BookOpen, 
  Headphones, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  Play,
  ChevronRight,
  Download,
  Feather,
  Wand2
} from 'lucide-react';

// Animated typing effect words - short single-line words only
const typingWords = [
  'Novel',
  'Memoir',
  'Cookbook',
  'Thriller',
  'Guide',
  'Epic',
  'Story',
];

export function HeroSection() {
  const router = useRouter();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayedWord, setDisplayedWord] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  // Typing animation effect - slower, smoother typing
  useEffect(() => {
    const word = typingWords[currentWordIndex];
    
    if (isTyping) {
      if (displayedWord.length < word.length) {
        // Slower typing speed: 150ms per character
        const timeout = setTimeout(() => {
          setDisplayedWord(word.slice(0, displayedWord.length + 1));
        }, 150);
        return () => clearTimeout(timeout);
      } else {
        // Pause after word is complete: 2.5 seconds
        const timeout = setTimeout(() => {
          setIsTyping(false);
        }, 2500);
        return () => clearTimeout(timeout);
      }
    } else {
      if (displayedWord.length > 0) {
        // Slower deletion speed: 80ms per character
        const timeout = setTimeout(() => {
          setDisplayedWord(displayedWord.slice(0, -1));
        }, 80);
        return () => clearTimeout(timeout);
      } else {
        setCurrentWordIndex((prev) => (prev + 1) % typingWords.length);
        setIsTyping(true);
      }
    }
  }, [displayedWord, isTyping, currentWordIndex]);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-black via-gray-900 to-black">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(250, 204, 21, 0.15) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(250, 204, 21, 0.1) 0%, transparent 50%)`
        }} />
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(250, 204, 21, 0.1) 50px, rgba(250, 204, 21, 0.1) 51px)`
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-yellow-400/10 border border-yellow-400/30">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 text-sm font-medium">AI-Powered Book Creation</span>
            </div>

            {/* Main Heading with Typing Effect */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-white" style={{ fontFamily: 'var(--font-header)' }}>
              Create Your
              <span className="block text-yellow-400 mt-2 min-h-[1.3em]">
                {displayedWord}
                <span className="animate-pulse text-yellow-300">|</span>
              </span>
            </h1>

            {/* Value Proposition */}
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-xl mx-auto lg:mx-0">
              Transform ideas into complete books with AI. Generate chapters, create audio narration, 
              and export in any format — all in minutes, not months.
            </p>

            {/* How It Works - 3 Steps */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-6 h-6 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center justify-center text-xs font-bold">1</div>
                <span>Describe your book</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 hidden sm:block" />
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-6 h-6 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center justify-center text-xs font-bold">2</div>
                <span>AI writes chapters</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 hidden sm:block" />
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-6 h-6 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center justify-center text-xs font-bold">3</div>
                <span>Export & publish</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
              <SignedOut>
                <SignUpButton mode="modal">
                  <button className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-xl transition-all shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 hover:scale-105">
                    <Sparkles className="w-5 h-5" />
                    Start Creating for Free
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => router.push('/studio')}
                  className="w-full sm:w-auto px-8 py-4 text-lg font-bold"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Create New Book
                </Button>
              </SignedIn>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/showcase')}
                className="w-full sm:w-auto px-6 py-4 text-lg border-gray-700 text-white hover:bg-white/10"
              >
                <Play className="w-5 h-5 mr-2" />
                Browse Sample Books
              </Button>
            </div>

            {/* Trust Signals - Export Formats */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-gray-500">
              <span className="font-medium text-gray-400">Export to:</span>
              <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded border border-white/10">
                <FileText className="w-3 h-3" />
                PDF
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded border border-white/10">
                <BookOpen className="w-3 h-3" />
                EPUB
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded border border-white/10">
                <FileText className="w-3 h-3" />
                DOCX
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded border border-white/10">
                <Headphones className="w-3 h-3" />
                MP3 Audio
              </div>
            </div>
          </div>

          {/* Right Column - Interactive Book Visualization */}
          <div className="relative">
            <div className="relative max-w-md mx-auto">
              {/* Glowing background */}
              <div className="absolute -inset-8 bg-gradient-to-r from-yellow-400/30 via-amber-500/20 to-orange-500/30 rounded-3xl blur-3xl animate-pulse" />
              
              {/* 3D Book Visualization */}
              <div className="relative" style={{ perspective: '1200px' }}>
                {/* Animated writing particles */}
                <div className="absolute -top-6 -left-6 w-full h-full pointer-events-none overflow-visible">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute animate-float"
                      style={{
                        left: `${15 + i * 15}%`,
                        top: `${10 + (i % 3) * 25}%`,
                        animationDelay: `${i * 0.5}s`,
                        animationDuration: `${3 + i * 0.5}s`,
                      }}
                    >
                      <Sparkles className="w-4 h-4 text-yellow-400/60" />
                    </div>
                  ))}
                </div>

                {/* Open Book with Pages */}
                <div 
                  className="relative bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 rounded-2xl p-8 border border-gray-700/80 shadow-2xl"
                  style={{ 
                    transform: 'rotateY(-5deg) rotateX(3deg)',
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {/* Book Spine Decoration */}
                  <div className="absolute left-0 top-4 bottom-4 w-2 bg-gradient-to-b from-yellow-500 via-amber-500 to-yellow-600 rounded-l-lg" />
                  
                  {/* Open Book Visual */}
                  <div className="flex gap-4">
                    {/* Left Page */}
                    <div className="flex-1 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 shadow-inner relative overflow-hidden min-h-[280px]">
                      {/* Page texture */}
                      <div className="absolute inset-0 opacity-30" style={{
                        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(0,0,0,0.03) 24px, rgba(0,0,0,0.03) 25px)`
                      }} />
                      
                      {/* Chapter heading */}
                      <div className="relative">
                        <div className="text-gray-400 text-[10px] uppercase tracking-widest mb-2">Chapter 1</div>
                        <div className="text-gray-800 font-serif font-bold text-lg mb-3 leading-tight">The Beginning</div>
                        
                        {/* Animated text lines */}
                        <div className="space-y-2">
                          {[...Array(7)].map((_, i) => (
                            <div 
                              key={i}
                              className="h-2 bg-gradient-to-r from-gray-300 to-gray-200 rounded animate-shimmer"
                              style={{ 
                                width: `${85 - (i % 3) * 10}%`,
                                animationDelay: `${i * 0.15}s`
                              }}
                            />
                          ))}
                        </div>
                        
                        {/* Page number */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-gray-400 text-xs">1</div>
                      </div>
                    </div>
                    
                    {/* Right Page - Active Writing */}
                    <div className="flex-1 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 shadow-inner relative overflow-hidden min-h-[280px]">
                      {/* Page texture */}
                      <div className="absolute inset-0 opacity-30" style={{
                        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(0,0,0,0.03) 24px, rgba(0,0,0,0.03) 25px)`
                      }} />
                      
                      {/* Writing indicator */}
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-400/30 rounded-full">
                            <Wand2 className="w-3 h-3 text-yellow-700 animate-pulse" />
                            <span className="text-[10px] text-yellow-800 font-medium">AI Writing...</span>
                          </div>
                        </div>
                        
                        {/* Typed content simulation */}
                        <div className="space-y-2">
                          {[...Array(5)].map((_, i) => (
                            <div 
                              key={i}
                              className="h-2 bg-gradient-to-r from-gray-400 to-gray-300 rounded animate-typewriter"
                              style={{ 
                                width: i < 4 ? `${90 - (i % 2) * 15}%` : '45%',
                                animationDelay: `${i * 0.3}s`
                              }}
                            />
                          ))}
                        </div>
                        
                        {/* Floating pen/feather */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 animate-write">
                          <Feather className="w-6 h-6 text-amber-600 drop-shadow-lg" />
                        </div>
                        
                        {/* Page number */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-gray-400 text-xs">2</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Book stats bar */}
                  <div className="mt-5 pt-4 border-t border-gray-700/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-sm">
                          <BookOpen className="w-4 h-4 text-yellow-400" />
                          <span className="text-gray-400">12 Chapters</span>
                        </div>
                        <div className="w-px h-4 bg-gray-700" />
                        <div className="flex items-center gap-1.5 text-sm">
                          <FileText className="w-4 h-4 text-green-400" />
                          <span className="text-gray-400">45K Words</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Headphones className="w-4 h-4 text-blue-400" />
                        <span className="text-gray-400">3h Audio</span>
                      </div>
                    </div>
                  </div>

                  {/* Feature badges */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-green-500/20 text-green-400 rounded-full text-xs border border-green-500/30">
                      <BookOpen className="w-3 h-3" />
                      AI Written
                    </div>
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs border border-blue-500/30">
                      <Headphones className="w-3 h-3" />
                      Audio Ready
                    </div>
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs border border-purple-500/30">
                      <Download className="w-3 h-3" />
                      Export All
                    </div>
                  </div>
                </div>

                {/* Floating elements */}
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg shadow-green-500/30 animate-bounce">
                  ✨ 10 min to publish
                </div>
                
                {/* Stacked book pages effect behind */}
                <div className="absolute -bottom-2 -right-2 w-full h-full bg-gray-800 rounded-2xl border border-gray-700/50 -z-10" style={{ transform: 'rotateY(-5deg) rotateX(3deg)' }} />
                <div className="absolute -bottom-4 -right-4 w-full h-full bg-gray-850 rounded-2xl border border-gray-700/30 -z-20" style={{ transform: 'rotateY(-5deg) rotateX(3deg)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 pt-12 border-t border-gray-800">
          <div className="text-center p-4">
            <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-1">10K+</div>
            <div className="text-sm text-gray-400">Books Created</div>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-1">500M+</div>
            <div className="text-sm text-gray-400">Words Generated</div>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-1">50K+</div>
            <div className="text-sm text-gray-400">Hours of Audio</div>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-1">95%</div>
            <div className="text-sm text-gray-400">Satisfaction</div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-yellow-400 rounded-full blur-[100px] opacity-20 animate-pulse" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-amber-500 rounded-full blur-[100px] opacity-15 animate-pulse" style={{ animationDelay: '1s' }} />
    </section>
  );
}
