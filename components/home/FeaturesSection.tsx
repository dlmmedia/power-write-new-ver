'use client';

const features = [
  {
    icon: '🤖',
    title: 'AI-Powered Writing',
    description: 'Advanced AI generates compelling narratives, realistic dialogue, and engaging content tailored to your specifications.'
  },
  {
    icon: '⚡',
    title: 'Lightning Fast',
    description: 'Generate a complete 80,000-word novel in minutes, not months. Focus on creativity while AI handles the heavy lifting.'
  },
  {
    icon: '🎨',
    title: 'Complete Customization',
    description: 'Control every aspect: genre, style, characters, plot, tone, and more. Make it truly yours.'
  },
  {
    icon: '📚',
    title: 'Multi-Genre Support',
    description: 'From sci-fi to romance, mystery to fantasy. AI adapts to any genre with appropriate conventions and tropes.'
  },
  {
    icon: '✍️',
    title: 'Style Flexibility',
    description: 'Choose POV, tense, pacing, dialogue density, and descriptive richness. Match any writing style you envision.'
  },
  {
    icon: '🌍',
    title: 'World Building',
    description: 'Create rich, consistent worlds with detailed settings, cultures, and characters that feel alive.'
  },
  {
    icon: '📖',
    title: 'Chapter-by-Chapter',
    description: 'Generate outlines first, then produce chapters individually or all at once. Full control over the process.'
  },
  {
    icon: '💾',
    title: 'Export Anywhere',
    description: 'Export your finished book as PDF, DOCX, or EPUB. Publish to Amazon, share with beta readers, or keep private.'
  },
  {
    icon: '🔄',
    title: 'Iterative Refinement',
    description: 'Not happy with a chapter? Regenerate it with different parameters. Refine until perfect.'
  }
];

export function FeaturesSection() {
  return (
    <section className="py-20 bg-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to Write
            <span className="text-yellow-400"> Amazing Books</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Powerful features designed to help you create professional-quality books with ease
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-yellow-400 transition-colors group"
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">
                {feature.title}
              </h3>
              <p className="text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
