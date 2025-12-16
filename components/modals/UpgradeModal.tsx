'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X, Crown, Sparkles, Check, Loader2, AlertCircle, BookOpen, Headphones, Palette, FileText, Edit3, Copy, Play, BookMarked, Settings } from 'lucide-react';
import { ProFeature, FEATURE_DESCRIPTIONS } from '@/contexts/UserTierContext';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  feature?: ProFeature | null;
}

// Icon mapping for features
const FEATURE_ICONS: Record<ProFeature, React.ElementType> = {
  'generate-book': BookOpen,
  'generate-outline': FileText,
  'generate-audio': Headphones,
  'regenerate-audio': Headphones,
  'generate-cover': Palette,
  'export-book': FileText,
  'edit-book': Edit3,
  'duplicate-book': Copy,
  'continue-generation': Play,
  'bibliography': BookMarked,
  'publishing-settings': Settings,
};

export function UpgradeModal({ isOpen, onClose, onSuccess, feature }: UpgradeModalProps) {
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setPromoCode('');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!promoCode.trim()) {
      setError('Please enter a promo code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setError(data.error || 'Invalid promo code');
      }
    } catch (err) {
      setError('Failed to apply promo code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPromoCode('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  const featureInfo = feature ? FEATURE_DESCRIPTIONS[feature] : null;
  const FeatureIcon = feature ? FEATURE_ICONS[feature] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-8 text-white relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl transform -translate-x-1/2 translate-y-1/2" />
          
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Crown className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Upgrade to Pro</h2>
                <p className="text-white/80 text-sm">Unlock all premium features</p>
              </div>
            </div>

            {/* Feature-specific message */}
            {featureInfo && FeatureIcon && (
              <div className="mt-4 p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <FeatureIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {featureInfo.icon} {featureInfo.title}
                    </p>
                    <p className="text-white/80 text-xs mt-0.5">
                      This feature requires Pro access
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome to Pro!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                You now have unlimited access to all features.
              </p>
            </div>
          ) : (
            <>
              {/* Free tier limitations */}
              <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Free Tier Limitations
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Free users can only <strong>read books</strong> and <strong>listen to existing audio</strong>. 
                  All other features require Pro access.
                </p>
              </div>

              {/* Pro benefits */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Pro Benefits:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-purple-500" />
                    </div>
                    <span>Unlimited book generation</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-purple-500" />
                    </div>
                    <span>AI cover generation</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-purple-500" />
                    </div>
                    <span>Audiobook creation with AI voices</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-purple-500" />
                    </div>
                    <span>Export to PDF, EPUB, DOCX & more</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-purple-500" />
                    </div>
                    <span>Edit and customize your books</span>
                  </li>
                </ul>
              </div>

              {/* Promo code form */}
              <form onSubmit={handleSubmit}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter Promo Code
                </label>
                <Input
                  type="text"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter your promo code"
                  className="mb-2"
                  disabled={loading}
                />
                
                {error && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm mb-4">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Applying...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      Upgrade Now
                    </span>
                  )}
                </Button>
              </form>

              <p className="text-xs text-center text-gray-500 dark:text-gray-500 mt-4">
                Contact support if you need a promo code
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

