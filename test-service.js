// Simulate the exact GoogleBooksService.searchBestsellers logic

async function searchBooks(query, maxResults = 40, startIndex = 0) {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&langRestrict=en&maxResults=${maxResults}&startIndex=${startIndex}&orderBy=relevance`;
    
    console.log('Google Books API query:', query, 'startIndex:', startIndex);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.items) {
      console.log('No Google Books results found for:', query);
      return [];
    }

    console.log(`Found ${data.items.length} Google Books results for:`, query);

    return data.items.map((item) => {
      const volumeInfo = item.volumeInfo || {};
      let imageLinks = volumeInfo.imageLinks;
      
      // Generate high-quality image URLs from Google Books thumbnail
      if (imageLinks?.thumbnail) {
        // Force HTTPS, remove edge=curl, and create zoom levels
        let baseUrl = imageLinks.thumbnail
          .replace(/^http:/, 'https:')  // Force HTTPS
          .replace('&edge=curl', '')     // Remove curl effect
          .split('&zoom=')[0];           // Remove existing zoom parameter
        
        // Ensure we have the gbs_api source parameter
        if (!baseUrl.includes('source=gbs_api')) {
          baseUrl += '&source=gbs_api';
        }
        
        imageLinks = {
          thumbnail: `${baseUrl}&zoom=1`,
          small: `${baseUrl}&zoom=2`,
          medium: `${baseUrl}&zoom=3`,
          large: `${baseUrl}&zoom=4`,
          extraLarge: `${baseUrl}&zoom=5`,
        };
      }
      
      return {
        id: item.id,
        title: volumeInfo.title || 'Unknown Title',
        authors: volumeInfo.authors || [],
        imageLinks: imageLinks,
        averageRating: volumeInfo.averageRating,
        ratingsCount: volumeInfo.ratingsCount,
        source: 'google_books',
      };
    });
  } catch (error) {
    console.error('Error searching Google Books:', error);
    return [];
  }
}

async function searchBestsellers(genre) {
  console.log(`\\nSearching bestseller books for genre: ${genre || 'all'}\\n`);
  
  const queries = genre
    ? [
        { query: `subject:"${genre}" bestseller`, maxResults: 20, startIndex: 0 },
        { query: `subject:"${genre}" popular`, maxResults: 20, startIndex: 0 },
      ]
    : [
        { query: `bestseller`, maxResults: 20, startIndex: 0 },
        { query: `"New York Times bestseller"`, maxResults: 20, startIndex: 0 },
      ];
  
  try {
    let allResults = [];
    
    const queryPromises = queries.map(({ query, maxResults, startIndex }) => 
      searchBooks(query, maxResults, startIndex)
    );
    
    const results = await Promise.all(queryPromises);
    results.forEach(result => allResults.push(...result));
    
    console.log(`\\nTotal results before filtering: ${allResults.length}`);
    
    const booksWithImages = allResults.filter(book => book.imageLinks?.thumbnail);
    console.log(`Books with images: ${booksWithImages.length}`);
    
    const uniqueBooks = booksWithImages.filter((book, index, self) => 
      index === self.findIndex(b => b.id === book.id)
    );
    console.log(`Unique books: ${uniqueBooks.length}`);
    
    const sortedBooks = uniqueBooks.sort((a, b) => {
      const aScore = (a.ratingsCount || 0) * (a.averageRating || 0);
      const bScore = (b.ratingsCount || 0) * (b.averageRating || 0);
      return bScore - aScore;
    });
    
    console.log(`\\nFinal result: ${sortedBooks.length} unique bestseller books`);
    
    if (sortedBooks.length > 0) {
      console.log('\\nFirst 3 books:');
      sortedBooks.slice(0, 3).forEach((book, i) => {
        console.log(`${i + 1}. ${book.title} by ${book.authors.join(', ')}`);
        console.log(`   Rating: ${book.averageRating || 'N/A'} (${book.ratingsCount || 0} ratings)`);
        console.log(`   Has image: ${!!book.imageLinks?.thumbnail}`);
      });
    }
    
    return sortedBooks.slice(0, 40);
  } catch (error) {
    console.error('Error searching bestsellers:', error);
    return [];
  }
}

// Test
searchBestsellers().then(results => {
  console.log(`\\n=== FINAL: Returning ${results.length} books ===`);
});
