'use client';

const testimonials = [
  {
    name: 'Sarah Mitchell',
    role: 'First-Time Author',
    image: '👩‍💼',
    rating: 5,
    text: "I've always wanted to write a novel but never had the time. PowerWrite helped me create a 90,000-word fantasy epic in just two days. The quality is incredible!"
  },
  {
    name: 'James Chen',
    role: 'Indie Publisher',
    image: '👨‍💻',
    rating: 5,
    text: "As someone who publishes multiple books a month, PowerWrite has been a game-changer. The AI understands genre conventions perfectly."
  },
  {
    name: 'Maria Rodriguez',
    role: 'Writing Teacher',
    image: '👩‍🏫',
    rating: 5,
    text: "I use PowerWrite to help my students understand story structure. Being able to generate outlines and see them executed is invaluable for teaching."
  },
  {
    name: 'David Thompson',
    role: 'Self-Published Author',
    image: '👨‍🎨',
    rating: 5,
    text: "The level of customization is amazing. I can control everything from POV to dialogue style. My AI-generated mystery novel just hit #1 in its category!"
  },
  {
    name: 'Emily Parker',
    role: 'Content Creator',
    image: '👩‍💻',
    rating: 5,
    text: "PowerWrite doesn't just generate words—it creates compelling narratives with character development and emotional depth. Highly recommend!"
  },
  {
    name: 'Michael Lee',
    role: 'Business Author',
    image: '👨‍💼',
    rating: 5,
    text: "I needed to publish a business book quickly. PowerWrite helped me create a professional, well-structured manuscript in record time."
  }
];

export function Testimonials() {
  return (
    <section className="py-20 bg-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'var(--font-header)', letterSpacing: 'var(--letter-spacing-header)' }}>
            Loved by <span className="text-yellow-400">Authors</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-nav)' }}>
            See what writers are saying about PowerWrite
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-yellow-400 transition-all hover:shadow-lg hover:shadow-yellow-400/5"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xl">★</span>
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-gray-300 mb-6 leading-relaxed">
                "{testimonial.text}"
              </p>

              {/* Author Info */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
                <div className="text-4xl">
                  {testimonial.image}
                </div>
                <div>
                  <div className="font-bold text-white" style={{ fontFamily: 'var(--font-nav)' }}>
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-400">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
