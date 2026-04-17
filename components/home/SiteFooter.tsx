'use client';

/**
 * SiteFooter — full editorial footer.
 *
 * Five-column desktop layout:
 *   1. Brand block — logo, tagline, social links
 *   2. Product
 *   3. Resources
 *   4. Authors / Community
 *   5. Newsletter signup
 *
 * Plus:
 *   - Status indicator (●  All systems normal) wired to a /status link
 *   - Theme picker (re-using `ThemeToggle`) and a language picker
 *     (UI only — no i18n routing yet, but the affordance is in place)
 *   - Giant translucent display-serif "PowerWrite" wordmark behind
 *     everything as the editorial "punch" of the closer
 *
 * Newsletter form is intentionally a no-op stub — wiring to a real
 * provider (Resend / Loops / ConvertKit) is a separate concern. The
 * UX, validation, and success state work fully.
 */

import { type FormEvent, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Github,
  Globe,
  Mail,
  Twitter,
  Youtube,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface LinkItem {
  label: string;
  href: string;
}

const PRODUCT_LINKS: LinkItem[] = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Audio narration', href: '#features' },
  { label: 'Browse books', href: '/browse' },
  { label: 'My library', href: '/library' },
];

const RESOURCE_LINKS: LinkItem[] = [
  { label: 'Studio', href: '/studio' },
  { label: 'Showcase', href: '/showcase' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Changelog', href: '/changelog' },
  { label: 'Documentation', href: '/docs' },
];

const COMMUNITY_LINKS: LinkItem[] = [
  { label: 'Author stories', href: '/stories' },
  { label: 'Writing tips', href: '/blog' },
  { label: 'Community Discord', href: 'https://discord.gg/powerwrite' },
  { label: 'Affiliate program', href: '/affiliates' },
  { label: 'Contact support', href: 'mailto:support@powerwrite.ai' },
];

const COMPANY_LINKS: LinkItem[] = [
  { label: 'About', href: '/about' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Status', href: '/status' },
];

const SOCIAL_LINKS = [
  { label: 'Twitter', href: 'https://twitter.com/powerwrite', Icon: Twitter },
  { label: 'GitHub', href: 'https://github.com/powerwrite', Icon: Github },
  { label: 'YouTube', href: 'https://youtube.com/@powerwrite', Icon: Youtube },
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ja', label: '日本語' },
];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-[var(--border)] bg-[var(--background)] overflow-hidden">
      {/* Giant translucent wordmark sitting behind the footer.
          aria-hidden because it's purely decorative and would otherwise
          read as duplicated brand to assistive tech. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -bottom-8 md:-bottom-16 pointer-events-none flex items-end justify-center select-none px-4"
      >
        <span
          className="font-display text-[18vw] md:text-[15vw] leading-[0.85] tracking-tight text-[var(--text-primary)]/[0.04] dark:text-[var(--text-primary)]/[0.06] whitespace-nowrap"
          style={{ fontWeight: 600 }}
        >
          PowerWrite
        </span>
      </div>

      <div className="container relative mx-auto px-4 pt-16 md:pt-20 pb-8">
        {/* Top: 5-column grid — collapses to 2 on tablet, 1 on mobile */}
        <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-12 gap-8 lg:gap-10 pb-12 md:pb-16">
          {/* Brand block (spans wider for breathing room) */}
          <div className="col-span-2 md:col-span-6 lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group" aria-label="PowerWrite home">
              <Logo size="md" />
              <span className="font-display text-2xl text-[var(--text-primary)] tracking-tight">
                PowerWrite
              </span>
            </Link>
            <p className="mt-4 text-sm text-[var(--text-secondary)] leading-relaxed max-w-xs">
              The AI book studio for serious authors. Outline, draft, narrate, and export — all in
              one place.
            </p>

            <div className="mt-6 flex items-center gap-2">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-colors focus-ring"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title="Product" links={PRODUCT_LINKS} className="md:col-span-2 lg:col-span-2" />
          <FooterColumn title="Resources" links={RESOURCE_LINKS} className="md:col-span-2 lg:col-span-2" />
          <FooterColumn title="Authors" links={COMMUNITY_LINKS} className="md:col-span-2 lg:col-span-2" />

          {/* Newsletter */}
          <div className="col-span-2 md:col-span-6 lg:col-span-2">
            <h3 className="font-semibold text-[var(--text-primary)] mb-1 text-sm uppercase tracking-wide">
              Newsletter
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-3 leading-relaxed">
              One writing tip a week. No spam, ever.
            </p>
            <NewsletterForm />
          </div>
        </div>

        {/* Bottom strip: status + theme + lang + copyright */}
        <div className="border-t border-[var(--border)] pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <Link
              href="/status"
              className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors group focus-ring rounded-md"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 rounded-full bg-[var(--success)] opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--success)]" />
              </span>
              <span className="font-medium">All systems normal</span>
            </Link>
            <span className="hidden md:inline text-[var(--border-strong)]" aria-hidden="true">·</span>
            <span className="text-[var(--text-muted)]">
              &copy; {new Date().getFullYear()} PowerWrite. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <LanguagePicker />
            <ThemeToggle />
          </div>

          {/* Bottom legal links (mobile keeps them visible without
              the bottom-strip squeeze). */}
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[var(--text-muted)] md:hidden">
            {COMPANY_LINKS.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="hover:text-[var(--text-primary)] transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                             */
/* -------------------------------------------------------------------------- */

function FooterColumn({
  title,
  links,
  className = '',
}: {
  title: string;
  links: LinkItem[];
  className?: string;
}) {
  return (
    <div className={className}>
      <h3 className="font-semibold text-[var(--text-primary)] mb-4 text-sm uppercase tracking-wide">
        {title}
      </h3>
      <ul className="space-y-2.5 text-sm">
        {links.map((link) => (
          // Use label as the key — multiple labels can intentionally
          // share an href (e.g. "Features" and "Audio narration" both
          // jump to #features), and labels are unique per column.
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || status === 'submitting') return;
    setStatus('submitting');
    try {
      // Stub: wire to /api/newsletter when the backend exists.
      await new Promise((resolve) => setTimeout(resolve, 500));
      setStatus('done');
      setEmail('');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <div className="rounded-lg border border-[var(--success)]/30 bg-[var(--success-light)] px-3 py-2.5 text-xs text-[var(--success)] flex items-center gap-2">
        <Check className="w-3.5 h-3.5" strokeWidth={3} />
        <span>You&apos;re in. Check your inbox.</span>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="relative">
      <Mail
        aria-hidden="true"
        className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none"
      />
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        aria-label="Email address for newsletter"
        className="w-full pl-9 pr-12 py-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
      />
      <button
        type="submit"
        disabled={status === 'submitting'}
        aria-label="Subscribe to newsletter"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md bg-[var(--accent)] text-white flex items-center justify-center hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors focus-ring"
      >
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
      {status === 'error' && (
        <p role="alert" className="mt-1.5 text-[10px] text-[var(--error)]">
          Something went wrong. Try again?
        </p>
      )}
    </form>
  );
}

function LanguagePicker() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState(LANGUAGES[0]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Change language"
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[var(--text-secondary)] bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] transition-colors focus-ring"
      >
        <Globe className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{lang.label}</span>
        <span className="sm:hidden uppercase">{lang.code}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 bottom-full mb-2 min-w-[160px] py-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] shadow-lg z-20"
        >
          {LANGUAGES.map((option) => {
            const active = option.code === lang.code;
            return (
              <li key={option.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    setLang(option);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between gap-2 transition-colors ${
                    active
                      ? 'bg-[var(--accent-surface)] text-[var(--accent-text)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span>{option.label}</span>
                  {active && <Check className="w-3 h-3" strokeWidth={3} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
