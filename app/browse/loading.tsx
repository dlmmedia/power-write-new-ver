export default function BrowseLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
      {/* Header Skeleton */}
      <header className="border-b border-yellow-600/20 bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-yellow-400/20 rounded-lg animate-pulse" />
              <div className="w-40 h-8 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 h-9 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
              <div className="w-28 h-9 bg-yellow-400/50 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Search Bar Skeleton */}
        <div className="mb-8">
          <div className="max-w-2xl mx-auto h-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        </div>

        {/* Categories Skeleton */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className="w-24 h-9 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"
              style={{ width: `${60 + Math.random() * 60}px` }}
            />
          ))}
        </div>

        {/* Section Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-6 h-6 bg-yellow-400/30 rounded animate-pulse" />
          <div className="w-32 h-7 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        </div>

        {/* Books Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className="bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-800"
            >
              {/* Cover Skeleton */}
              <div className="w-full aspect-[2/3] bg-gray-300 dark:bg-gray-800 animate-pulse" />
              {/* Info Skeleton */}
              <div className="p-3">
                <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1 animate-pulse" />
                <div className="w-2/3 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
