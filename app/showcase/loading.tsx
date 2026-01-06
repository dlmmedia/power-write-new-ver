export default function ShowcaseLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
      {/* Header Skeleton */}
      <header className="border-b border-yellow-600/20 bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-9 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
              <div className="w-8 h-8 bg-yellow-400/20 rounded-lg animate-pulse" />
              <div className="w-32 h-8 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 h-9 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
              <div className="w-9 h-9 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section Skeleton */}
        <div className="text-center mb-12">
          <div className="w-64 h-10 bg-gray-200 dark:bg-gray-800 rounded mx-auto mb-4 animate-pulse" />
          <div className="w-96 h-6 bg-gray-200 dark:bg-gray-800 rounded mx-auto animate-pulse" />
        </div>

        {/* Search & Filters Skeleton */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4 mb-8">
          <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          <div className="w-32 h-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-center gap-8 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-yellow-400/30 rounded animate-pulse" />
            <div className="w-20 h-5 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-400/30 rounded animate-pulse" />
            <div className="w-24 h-5 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-green-400/30 rounded animate-pulse" />
            <div className="w-28 h-5 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
        </div>

        {/* Books Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i} 
              className="bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-800"
            >
              {/* Cover Skeleton */}
              <div className="w-full aspect-[2/3] bg-gray-300 dark:bg-gray-800 animate-pulse" />
              {/* Info Skeleton */}
              <div className="p-4">
                <div className="w-3/4 h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
                <div className="w-1/2 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1 animate-pulse" />
                <div className="w-1/4 h-3 bg-gray-200 dark:bg-gray-700 rounded mb-3 animate-pulse" />
                
                {/* Description */}
                <div className="space-y-1 mb-3">
                  <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="w-2/3 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>

                <div className="flex gap-3">
                  <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
