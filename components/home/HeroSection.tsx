'use client';

import { useState, useEffect } from 'react';
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

const typingWords = ['Novel', 'Memoir', 'Cookbook', 'Thriller', 'Guide', 'Epic', 'Story'];

export function HeroSection() {
  const router = useRouter();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayedWord, setDisplayedWord] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    const word = typingWords[currentWordIndex];
    if (isTyping) {
      if (displayedWord.length < word.length) {
        const timeout = setTimeout(() => setDisplayedWord(word.slice(0, displayedWord.length + 1)), 150);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => setIsTyping(false), 2500);
        return () => clearTimeout(timeout);
      }
    } else {
      if (displayedWord.length > 0) {
        const timeout = setTimeout(() => setDisplayedWord(displayedWord.slice(0, -1)), 80);
        return () => clearTimeout(timeout);
      } else {
        setCurrentWordIndex((prev) => (prev + 1) % typingWords.length);
        setIsTyping(true);
      }
    }
  }, [displayedWord, isTyping, currentWordIndex]);

  return (
    <section className="relative overflow-hidden bg-[var(--background)]">
      {/* Subtle gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(245, 158, 11, 0.08) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(245, 158, 11, 0.05) 0%, transparent 50%)`
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10 py-16 md:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-[var(--accent-surface)] border border-[var(--accent)]/20">
              <Sparkles className="w-4 h-4 text-[var(--accent)]" />
              <span className="text-[var(--accent-text)] text-sm font-medium">AI-Powered Book Creation</span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight text-[var(--text-primary)]">
              Create Your
              <span className="block text-[var(--accent)] mt-2 min-h-[1.3em]">
                {displayedWord}
                <span className="animate-pulse text-[var(--accent)]/60">|</span>
              </span>
            </h1>

            <p className="text-lg md:text-xl text-[var(--text-muted)] mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Transform ideas into complete books with AI. Generate chapters, create audio narration, 
              and export in any format.
            </p>

            {/* Steps */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 text-sm">
              {[
                { num: '1', text: 'Describe your book' },
                { num: '2', text: 'AI writes chapters' },
                { num: '3', text: 'Export & publish' },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  {i > 0 && <ChevronRight className="w-4 h-4 text-[var(--text-muted)] hidden sm:block" />}
                  <div className="flex items-center gap-2 text-[var(--text-muted)]">
                    <div className="w-6 h-6 rounded-full bg-[var(--accent-surface)] text-[var(--accent)] flex items-center justify-center text-xs font-bold">
                      {step.num}
                    </div>
                    <span>{step.text}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-8">
              <SignedOut>
                <SignUpButton mode="modal">
                  <button className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--text-inverse)] font-semibold rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98]">
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
                  leftIcon={<Sparkles className="w-5 h-5" />}
                  className="w-full sm:w-auto"
                >
                  Create New Book
                </Button>
              </SignedIn>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => router.push('/showcase')}
                leftIcon={<Play className="w-5 h-5" />}
                className="w-full sm:w-auto"
              >
                Browse Sample Books
              </Button>
            </div>

            {/* Export formats */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 text-xs text-[var(--text-muted)]">
              <span className="font-medium">Export to:</span>
              {[
                { icon: <FileText className="w-3 h-3" />, label: 'PDF' },
                { icon: <BookOpen className="w-3 h-3" />, label: 'EPUB' },
                { icon: <FileText className="w-3 h-3" />, label: 'DOCX' },
                { icon: <Headphones className="w-3 h-3" />, label: 'MP3' },
              ].map((fmt) => (
                <div key={fmt.label} className="flex items-center gap-1 px-2 py-1 bg-[var(--surface-hover)] rounded-md border border-[var(--border)]">
                  {fmt.icon}
                  {fmt.label}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Book Visual */}
          <div className="relative">
            <div className="relative max-w-md mx-auto">
              <div className="absolute -inset-8 bg-gradient-to-r from-amber-400/20 via-amber-500/10 to-orange-500/20 rounded-3xl blur-3xl animate-pulse" />
              
              <div className="relative" style={{ perspective: '1200px' }}>
                <div className="absolute -top-6 -left-6 w-full h-full pointer-events-none overflow-visible">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="absolute animate-float"
                      style={{ left: `${15 + i * 15}%`, top: `${10 + (i % 3) * 25}%`, animationDelay: `${i * 0.5}s`, animationDuration: `${3 + i * 0.5}s` }}>
                      <Sparkles className="w-4 h-4 text-[var(--accent)]/40" />
                    </div>
                  ))}
                </div>

                <div className="relative bg-[var(--background-secondary)] rounded-2xl p-8 border border-[var(--border)] shadow-[var(--shadow-elevated)]"
                  style={{ transform: 'rotateY(-5deg) rotateX(3deg)', transformStyle: 'preserve-3d' }}>
                  <div className="absolute left-0 top-4 bottom-4 w-1.5 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 rounded-l-lg" />
                  
                  <div className="flex gap-4">
                    {/* Left Page */}
                    <div className="flex-1 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 rounded-lg p-4 shadow-inner relative overflow-hidden min-h-[260px]">
                      <div className="relative">
                        <div className="text-[var(--text-muted)] text-[10px] uppercase tracking-widest mb-2">Chapter 1</div>
                        <div className="text-[var(--text-primary)] font-serif font-bold text-lg mb-3 leading-tight">The Beginning</div>
                        <div className="space-y-2">
                          {[...Array(7)].map((_, i) => (
                            <div key={i} className="h-2 bg-[var(--border)] rounded animate-shimmer"
                              style={{ width: `${85 - (i % 3) * 10}%`, animationDelay: `${i * 0.15}s` }} />
                          ))}
                        </div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[var(--text-muted)] text-xs">1</div>
                      </div>
                    </div>
                    
                    {/* Right Page */}
                    <div className="flex-1 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 rounded-lg p-4 shadow-inner relative overflow-hidden min-h-[260px]">
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--accent-surface)] rounded-full">
                            <Wand2 className="w-3 h-3 text-[var(--accent)] animate-pulse" />
                            <span className="text-[10px] text-[var(--accent-text)] font-medium">AI Writing...</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-2 bg-[var(--border-strong)] rounded animate-shimmer"
                              style={{ width: i < 4 ? `${90 - (i % 2) * 15}%` : '45%', animationDelay: `${i * 0.3}s` }} />
                          ))}
                        </div>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <Feather className="w-6 h-6 text-amber-600 drop-shadow-lg" />
                        </div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[var(--text-muted)] text-xs">2</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Stats bar */}
                  <div className="mt-5 pt-4 border-t border-[var(--border)]">
                    <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-[var(--accent)]" /> 12 Ch</span>
                        <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-[var(--success)]" /> 45K Words</span>
                      </div>
                      <span className="flex items-center gap-1.5"><Headphones className="w-4 h-4 text-[var(--info)]" /> 3h Audio</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {[
                      { icon: <BookOpen className="w-3 h-3" />, label: 'AI Written', color: 'text-[var(--success)] bg-[var(--success-light)] border-[var(--success)]/20' },
                      { icon: <Headphones className="w-3 h-3" />, label: 'Audio Ready', color: 'text-[var(--info)] bg-[var(--info-light)] border-[var(--info)]/20' },
                      { icon: <Download className="w-3 h-3" />, label: 'Export All', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
                    ].map((badge) => (
                      <div key={badge.label} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border ${badge.color}`}>
                        {badge.icon}
                        {badge.label}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="absolute -top-3 -right-3 bg-[var(--success)] text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-md animate-bounce">
                  10 min to publish
                </div>
                
                <div className="absolute -bottom-2 -right-2 w-full h-full bg-[var(--background-tertiary)] rounded-2xl border border-[var(--border)] -z-10" style={{ transform: 'rotateY(-5deg) rotateX(3deg)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 pt-12 border-t border-[var(--border)]">
          {[
            { value: '10K+', label: 'Books Created' },
            { value: '500M+', label: 'Words Generated' },
            { value: '50K+', label: 'Hours of Audio' },
            { value: '95%', label: 'Satisfaction' },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-4">
              <div className="text-3xl md:text-4xl font-bold text-[var(--accent)] mb-1">{stat.value}</div>
              <div className="text-sm text-[var(--text-muted)]">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-[var(--accent)] rounded-full blur-[100px] opacity-10 animate-pulse" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-amber-500 rounded-full blur-[100px] opacity-5 animate-pulse" style={{ animationDelay: '1s' }} />
    </section>
  );
}
