// Test Google Books API
async function testGoogleBooksAPI() {
  console.log('Testing Google Books API...\n');
  
  const query = 'bestseller';
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&langRestrict=en&maxResults=20&startIndex=0&orderBy=relevance`;
  
  console.log('URL:', url);
  console.log('\nFetching...');
  
  try {
    const response = await fetch(url);
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (!response.ok) {
      const text = await response.text();
      console.log('Error response:', text);
      return;
    }
    
    const data = await response.json();
    console.log('\nTotal items available:', data.totalItems);
    console.log('Items in this response:', data.items?.length || 0);
    
    if (!data.items || data.items.length === 0) {
      console.log('\n❌ No items returned!');
      return;
    }
    
    console.log('\n✓ Items returned successfully');
    
    // Check first few books for images
    console.log('\nChecking first 5 books for images:');
    for (let i = 0; i < Math.min(5, data.items.length); i++) {
      const item = data.items[i];
      const volumeInfo = item.volumeInfo || {};
      const hasImage = !!volumeInfo.imageLinks?.thumbnail;
      console.log(`${i + 1}. "${volumeInfo.title}" - Has image: ${hasImage}`);
      if (hasImage) {
        console.log(`   Image URL: ${volumeInfo.imageLinks.thumbnail}`);
      }
    }
    
    // Filter to books with images (like the service does)
    const booksWithImages = data.items.filter(item => 
      item.volumeInfo?.imageLinks?.thumbnail
    );
    
    console.log(`\n✓ Books with images: ${booksWithImages.length} / ${data.items.length}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testGoogleBooksAPI();
