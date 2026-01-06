export default function BookDetailLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
      {/* Header Skeleton */}
      <header className="border-b border-yellow-600/20 bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-24 h-9 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
              <div className="w-8 h-8 bg-yellow-400/20 rounded-lg animate-pulse" />
              <div className="w-48 h-8 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
              <div className="w-28 h-9 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
              <div className="w-28 h-9 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
              <div className="w-24 h-9 bg-yellow-400/50 rounded-lg animate-pulse" />
              <div className="w-24 h-9 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Tabs Skeleton */}
        <div className="flex gap-2 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-24 h-10 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>

        {/* Hero Section Skeleton */}
        <div className="bg-gradient-to-br from-yellow-400/10 to-yellow-600/5 dark:from-yellow-400/5 dark:to-yellow-600/10 rounded-xl border border-yellow-400/20 dark:border-yellow-600/30 p-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Book Cover Skeleton */}
            <div className="w-64 h-96 bg-gray-300 dark:bg-gray-800 rounded-lg animate-pulse flex-shrink-0" />

            {/* Book Details Skeleton */}
            <div className="flex-1 space-y-4">
              <div className="w-3/4 h-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="w-1/3 h-6 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="w-1/4 h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mt-3" />

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white/50 dark:bg-black/20 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
                    <div className="w-12 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                ))}
              </div>

              {/* Description Skeleton */}
              <div className="mt-6 p-4 bg-white/30 dark:bg-black/10 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                <div className="space-y-2">
                  <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="w-2/3 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>

              {/* Action Buttons Skeleton */}
              <div className="flex flex-wrap gap-3 mt-6">
                <div className="flex-1 h-12 bg-yellow-400/50 rounded-lg animate-pulse" />
                <div className="w-32 h-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Progress Section Skeleton */}
        <div className="mt-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-yellow-400/20 rounded-lg animate-pulse" />
            <div className="w-40 h-7 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
          
          {/* Progress Bar */}
          <div className="bg-white/50 dark:bg-black/20 rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 mb-8">
            <div className="flex justify-between mb-4">
              <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="w-40 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="w-full h-5 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            <div className="flex justify-between mt-3">
              <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                  <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="w-12 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
                <div className="w-20 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Chapters Preview Skeleton */}
        <div className="mt-8 bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-800 p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-400/30 rounded animate-pulse" />
              <div className="w-36 h-7 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>
            <div className="w-24 h-8 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          </div>
          
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-16 h-5 bg-yellow-400/30 rounded animate-pulse" />
                  <div className="w-48 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="w-40 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                <div className="space-y-1">
                  <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="w-3/4 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
