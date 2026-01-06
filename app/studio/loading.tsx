export default function StudioLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
      {/* Header Skeleton */}
      <header className="border-b border-yellow-600/20 bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-24 h-9 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
              <div className="w-8 h-8 bg-yellow-400/20 rounded-lg animate-pulse" />
              <div className="w-32 h-8 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
              <div className="w-28 h-9 bg-yellow-400/50 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          {/* Sidebar Skeleton */}
          <div className="space-y-4">
            {/* Smart Prompt Card */}
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 bg-yellow-400/50 rounded animate-pulse" />
                <div className="w-28 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="w-full h-24 bg-white dark:bg-gray-800 rounded-lg animate-pulse mb-3" />
              <div className="w-full h-10 bg-yellow-400/50 rounded-lg animate-pulse" />
            </div>

            {/* Config Tabs */}
            <div className="bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                    <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Panel Skeleton */}
          <div className="bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            {/* Panel Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-yellow-400/20 rounded-lg animate-pulse" />
              <div>
                <div className="w-32 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
                <div className="w-48 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {/* Title Field */}
              <div>
                <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                <div className="w-full h-10 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse" />
              </div>

              {/* Author Field */}
              <div>
                <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                <div className="w-full h-10 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse" />
              </div>

              {/* Genre & Subgenre */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                  <div className="w-full h-10 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse" />
                </div>
                <div>
                  <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                  <div className="w-full h-10 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse" />
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                <div className="w-full h-32 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
