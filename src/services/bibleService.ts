
import { getPassage } from './localBibleService';
import { availableVersions } from './bibleDataLoader';
import { BibleVerse, BiblePassageResponse, BibleVersion } from './types';

export const getDefaultVersionId = () => 'kjv';

export const getAvailableVersions = (): BibleVersion[] => {
  return availableVersions;
};

export const fetchBiblePassage = async (
  reference: string,
  version: string = 'kjv'
): Promise<BiblePassageResponse> => {
  try {
    // Handle empty or invalid references
    if (!reference?.trim()) {
      return {
        passage: [],
        reference: '',
        error: 'Please enter a Bible reference'
      };
    }

    // Use local service exclusively to avoid CORS issues
    const response = await getPassage(reference, version);
    
    // Add more detailed error messages
    if (response.error) {
      return {
        passage: [],
        reference,
        error: response.error
      };
    }

    // Validate the response
    if (!response.passage || response.passage.length === 0) {
      return {
        passage: [],
        reference,
        error: 'No verses found for this reference'
      };
    }

    return response;
  } catch (error) {
    console.error('Error fetching Bible passage:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch Bible passage';
    return {
      passage: [],
      reference,
      error: errorMessage
    };
  }
};

export const getAvailableBooks = async (version: string = 'kjv'): Promise<string[]> => {
  try {
    const data = await import(`../../bible_data/${version}.json`);
    return data.books.map(book => book.name);
  } catch (error) {
    console.error('Error loading Bible books:', error);
    return [];
  }
};

export const getAvailableChapters = async (
  bookName: string,
  version: string = 'kjv'
): Promise<number[]> => {
  try {
    const data = await import(`../../bible_data/${version}.json`);
    
    // Find book with exact match or normalized match
    let book = data.books.find(b => b.name === bookName);
    
    // If not found, try normalized matching
    if (!book) {
      const normalizedBookName = bookName.toLowerCase().replace(/\s+/g, '');
      book = data.books.find(b => 
        b.name.toLowerCase().replace(/\s+/g, '') === normalizedBookName ||
        b.name.toLowerCase().replace(/\s+/g, '').includes(normalizedBookName) ||
        normalizedBookName.includes(b.name.toLowerCase().replace(/\s+/g, ''))
      );
    }
    
    if (!book) {
      throw new Error(`Book ${bookName} not found`);
    }
    
    const chapters = book.chapters.map(ch => ch.chapter);
    return chapters.sort((a, b) => a - b);
  } catch (error) {
    console.error('Error loading chapters:', error);
    return [];
  }
};

// Search functionality
export const searchBible = async (
  query: string,
  version: string = 'kjv',
  limit: number = 50
): Promise<any[]> => {
  try {
    const data = await import(`../../bible_data/${version}.json`);
    const results: any[] = [];
    
    const searchTerm = query.toLowerCase();
    
    for (const book of data.books) {
      for (const chapter of book.chapters) {
        for (const verse of chapter.verses) {
          if (verse.text.toLowerCase().includes(searchTerm)) {
            results.push({
              reference: `${book.name} ${chapter.chapter}:${verse.verse}`,
              book: book.name,
              chapter: chapter.chapter,
              verse: verse.verse,
              text: verse.text,
              score: 1 // Simple relevance score
            });
            
            if (results.length >= limit) {
              return results;
            }
          }
        }
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error searching Bible:', error);
    return [];
  }
};
