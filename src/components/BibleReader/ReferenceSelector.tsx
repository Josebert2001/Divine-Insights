
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { availableVersions } from "@/services/bibleDataLoader";
import { getAvailableBooks, getAvailableChapters } from "@/services/bibleService";

interface ReferenceSelectorProps {
  version: string;
  onVersionChange: (version: string) => void;
  initialReference: string;
  onReferenceChange: (reference: string) => void;
  isDarkTheme?: boolean;
  showSettings?: boolean;
}

export function ReferenceSelector({
  version,
  onVersionChange,
  initialReference,
  onReferenceChange,
  isDarkTheme = false,
  showSettings = true
}: ReferenceSelectorProps) {
  const [reference, setReference] = useState(initialReference);
  const [selectedBook, setSelectedBook] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [selectedVerse, setSelectedVerse] = useState("");
  const [availableBooks, setAvailableBooks] = useState<string[]>([]);
  const [availableChapters, setAvailableChapters] = useState<number[]>([]);

  useEffect(() => {
    const loadBooks = async () => {
      try {
        const books = await getAvailableBooks(version);
        setAvailableBooks(books);
      } catch (error) {
        console.error("Failed to load books:", error);
      }
    };
    
    if (version) {
      loadBooks();
    }
  }, [version]);

  useEffect(() => {
    const loadChapters = async () => {
      if (!selectedBook) return;
      
      try {
        const chapters = await getAvailableChapters(selectedBook, version);
        setAvailableChapters(chapters);
      } catch (error) {
        console.error("Failed to load chapters:", error);
      }
    };
    
    loadChapters();
  }, [selectedBook, version]);

  useEffect(() => {
    // Parse initial reference
    const parts = initialReference.split(' ');
    if (parts.length >= 2) {
      const book = parts[0];
      const chapterVerse = parts[1];
      const [chapter, verse] = chapterVerse.split(':');
      
      setSelectedBook(book);
      setSelectedChapter(chapter);
      setSelectedVerse(verse || "");
    }
    setReference(initialReference);
  }, [initialReference]);

  const handleBookChange = (book: string) => {
    setSelectedBook(book);
    setSelectedChapter("1");
    setSelectedVerse("");
    
    const newRef = `${book} 1`;
    setReference(newRef);
    onReferenceChange(newRef);
  };

  const handleChapterChange = (chapter: string) => {
    setSelectedChapter(chapter);
    setSelectedVerse("");
    
    const newRef = `${selectedBook} ${chapter}`;
    setReference(newRef);
    onReferenceChange(newRef);
  };

  const handleVerseChange = (verse: string) => {
    setSelectedVerse(verse);
    
    const newRef = verse ? `${selectedBook} ${selectedChapter}:${verse}` : `${selectedBook} ${selectedChapter}`;
    setReference(newRef);
  };

  const handleDirectReferenceSubmit = () => {
    if (reference.trim()) {
      onReferenceChange(reference.trim());
    }
  };

  const handleGranularSubmit = () => {
    if (!selectedBook || !selectedChapter) return;
    
    const newRef = selectedVerse 
      ? `${selectedBook} ${selectedChapter}:${selectedVerse}`
      : `${selectedBook} ${selectedChapter}`;
    
    setReference(newRef);
    onReferenceChange(newRef);
  };

  return (
    <div className="flex flex-col space-y-4">
      {showSettings && (
        <div className="flex items-center space-x-4">
          <Select value={version} onValueChange={onVersionChange}>
            <SelectTrigger className={`w-[160px] ${isDarkTheme ? "bg-gray-800 text-white" : ""}`}>
              <SelectValue placeholder="Version" />
            </SelectTrigger>
            <SelectContent>
              {availableVersions.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.abbreviation}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Enter reference (e.g. John 3:16)"
              className={`flex-1 ${isDarkTheme ? "bg-gray-800 text-white" : ""}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleDirectReferenceSubmit();
                }
              }}
            />
            
            <Button
              onClick={handleDirectReferenceSubmit}
              variant={isDarkTheme ? "secondary" : "default"}
              size="sm"
            >
              Go
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <Select value={selectedBook} onValueChange={handleBookChange}>
          <SelectTrigger className={isDarkTheme ? "bg-gray-800 text-white" : ""}>
            <SelectValue placeholder="Book" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] overflow-y-auto">
            {availableBooks.map((book) => (
              <SelectItem key={book} value={book}>
                {book}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedChapter} onValueChange={handleChapterChange} disabled={!selectedBook}>
          <SelectTrigger className={isDarkTheme ? "bg-gray-800 text-white" : ""}>
            <SelectValue placeholder="Chapter" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px] overflow-y-auto">
            {availableChapters.map((chapter) => (
              <SelectItem key={chapter} value={chapter.toString()}>
                {chapter}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="text"
          value={selectedVerse}
          onChange={(e) => handleVerseChange(e.target.value)}
          placeholder="Verse (optional)"
          className={isDarkTheme ? "bg-gray-800 text-white" : ""}
          disabled={!selectedBook || !selectedChapter}
        />

        <Button
          onClick={handleGranularSubmit}
          disabled={!selectedBook || !selectedChapter}
          variant={isDarkTheme ? "secondary" : "default"}
          size="sm"
        >
          Go
        </Button>
      </div>
    </div>
  );
}
