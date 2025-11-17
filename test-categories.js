// Test all book categories
const BASE_URL = 'http://localhost:3000';

const categories = [
  { id: 'bestsellers', label: '🏆 Bestsellers' },
  { id: 'new-releases', label: '🆕 New Releases' },
  { id: 'fiction', label: '📚 Fiction' },
  { id: 'non-fiction', label: '📖 Non-Fiction' },
  { id: 'mystery', label: '🔍 Mystery & Thriller' },
  { id: 'romance', label: '💕 Romance' },
  { id: 'science-fiction', label: '🚀 Science Fiction' },
  { id: 'fantasy', label: '🧙 Fantasy' },
  { id: 'horror', label: '👻 Horror' },
  { id: 'biography', label: '👤 Biography' },
  { id: 'history', label: '🏛️ History' },
  { id: 'self-help', label: '💪 Self-Help' },
  { id: 'business', label: '💼 Business' },
  { id: 'technology', label: '💻 Technology' },
  { id: 'science', label: '🔬 Science' },
  { id: 'cooking', label: '🍳 Cooking' },
  { id: 'travel', label: '✈️ Travel' },
  { id: 'poetry', label: '📝 Poetry' },
  { id: 'young-adult', label: '🎓 Young Adult' },
  { id: 'children', label: '👶 Children' },
  { id: 'graphic-novels', label: '🎨 Graphic Novels' },
  { id: 'health', label: '🏥 Health & Wellness' },
  { id: 'philosophy', label: '🤔 Philosophy' },
  { id: 'religion', label: '🕊️ Religion & Spirituality' },
  { id: 'true-crime', label: '🔪 True Crime' },
];

async function testCategory(category) {
  try {
    const url = `${BASE_URL}/api/books/search?category=${category.id}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log(`❌ ${category.label} - HTTP ${response.status}`);
      return { success: false, count: 0 };
    }
    
    const data = await response.json();
    const bookCount = data.books?.length || 0;
    
    if (bookCount === 0) {
      console.log(`⚠️  ${category.label} - No books returned`);
      return { success: false, count: 0 };
    }
    
    // Check if books have images
    const booksWithImages = data.books.filter(book => 
      book.imageLinks && (
        book.imageLinks.thumbnail || 
        book.imageLinks.small || 
        book.imageLinks.medium
      )
    );
    
    const imagePercentage = Math.round((booksWithImages.length / bookCount) * 100);
    
    console.log(`✅ ${category.label} - ${bookCount} books (${imagePercentage}% with images)`);
    
    // Show first book as example
    if (data.books.length > 0) {
      const firstBook = data.books[0];
      console.log(`   Example: "${firstBook.title}" by ${firstBook.authors?.join(', ') || 'Unknown'}`);
    }
    
    return { success: true, count: bookCount };
  } catch (error) {
    console.log(`❌ ${category.label} - Error: ${error.message}`);
    return { success: false, count: 0 };
  }
}

async function testAllCategories() {
  console.log('🧪 Testing All Book Categories\n');
  console.log('=' .repeat(60));
  console.log(`Testing ${categories.length} categories...\n`);
  
  const results = [];
  
  for (const category of categories) {
    const result = await testCategory(category);
    results.push({ ...category, ...result });
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary\n');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const totalBooks = results.reduce((sum, r) => sum + r.count, 0);
  
  console.log(`✅ Successful: ${successful.length}/${categories.length}`);
  console.log(`❌ Failed: ${failed.length}/${categories.length}`);
  console.log(`📚 Total books fetched: ${totalBooks}`);
  
  if (failed.length > 0) {
    console.log('\n⚠️  Failed categories:');
    failed.forEach(cat => console.log(`   - ${cat.label}`));
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (successful.length === categories.length) {
    console.log('\n🎉 All categories working perfectly!\n');
  } else {
    console.log(`\n⚠️  ${failed.length} categories need attention\n`);
  }
}

// Run the test
console.log('Make sure the dev server is running on http://localhost:3000\n');
testAllCategories();



