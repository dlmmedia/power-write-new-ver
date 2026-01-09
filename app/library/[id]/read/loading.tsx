import { Loader2, BookOpen } from 'lucide-react';

export default function ReadLoading() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-100 via-gray-50 to-slate-100 dark:from-gray-950 dark:via-black dark:to-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-6">
          <div className="w-20 h-28 bg-gradient-to-br from-amber-400 to-amber-600 rounded-sm shadow-2xl mx-auto flex items-center justify-center animate-pulse">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-2 bg-black/10 dark:bg-white/10 rounded-full blur-sm" />
        </div>
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400 font-medium">Opening your book...</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Preparing immersive reading experience</p>
      </div>
    </div>
  );
}
