
import { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useBibleData } from "@/hooks/useBibleData";
import { getDefaultVersionId, fetchBiblePassage } from "@/services/bibleService";
import { ReferenceSelector } from "./ReferenceSelector";
import { PassageDisplay } from "./PassageDisplay";
import { SearchDialog } from "./SearchDialog";
import { BiblePassageVerse } from "@/services/types";

interface BibleReaderProps {
  initialReference?: string;
  isDarkTheme?: boolean;
  isImmersiveMode?: boolean;
  showSettings?: boolean;
}

export function BibleReader({
  initialReference = "Genesis 1:1",
  isDarkTheme = false,
  isImmersiveMode = false,
  showSettings = true
}: BibleReaderProps) {
  const [version, setVersion] = useState(getDefaultVersionId());
  const [currentReference, setCurrentReference] = useState(initialReference);
  const [verses, setVerses] = useState<BiblePassageVerse[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  
  const { data: bibleData, isLoading: isBibleDataLoading, error: bibleDataError } = useBibleData(version);
  
  const handleVersionChange = (newVersion: string) => {
    setVersion(newVersion);
    // Reload current reference with new version
    loadPassage(currentReference, newVersion);
  };

  const handleReferenceSelect = (reference: string) => {
    setCurrentReference(reference);
    loadPassage(reference, version);
  };

  const loadPassage = async (reference: string, bibleVersion: string = version) => {
    if (!reference?.trim()) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetchBiblePassage(reference, bibleVersion);
      
      if (response.error) {
        setError(response.error);
        toast.error(response.error);
        return;
      }
      
      setVerses(response.passage);
      setCurrentReference(response.reference);
      
      // Save to localStorage
      localStorage.setItem('lastViewedPassage', response.reference);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load passage';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateChapter = (direction: 'prev' | 'next') => {
    if (!currentReference || !bibleData) return;
    
    const parts = currentReference.split(' ');
    if (parts.length < 2) return;
    
    const bookName = parts[0];
    const chapterNum = parseInt(parts[1].split(':')[0]);
    
    const book = bibleData.books.find(b => b.name === bookName);
    if (!book) return;
    
    const chapters = book.chapters.map(c => c.chapter).sort((a, b) => a - b);
    const currentIndex = chapters.indexOf(chapterNum);
    
    if (direction === 'prev' && currentIndex > 0) {
      const newChapter = chapters[currentIndex - 1];
      handleReferenceSelect(`${bookName} ${newChapter}`);
    } else if (direction === 'next' && currentIndex < chapters.length - 1) {
      const newChapter = chapters[currentIndex + 1];
      handleReferenceSelect(`${bookName} ${newChapter}`);
    }
  };

  // Load initial passage
  useEffect(() => {
    if (currentReference) {
      loadPassage(currentReference, version);
    }
  }, []);

  // Load last viewed passage from localStorage
  useEffect(() => {
    const lastPassage = localStorage.getItem('lastViewedPassage');
    if (lastPassage && !initialReference) {
      setCurrentReference(lastPassage);
      loadPassage(lastPassage, version);
    }
  }, []);

  if (isBibleDataLoading) {
    return (
      <Card className="p-4 space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </Card>
    );
  }

  if (bibleDataError || !bibleData) {
    toast.error("Failed to load Bible data. Please try again later.");
    return (
      <Card className="p-4">
        <div className="text-center text-red-500">
          Failed to load Bible data. Please refresh the page.
        </div>
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-4xl mx-auto ${isDarkTheme ? "bg-gray-900 text-white" : ""}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateChapter('prev')}
              disabled={isLoading}
              className={isDarkTheme ? "hover:bg-gray-800" : "hover:bg-gray-100"}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <ReferenceSelector 
              version={version}
              onVersionChange={handleVersionChange}
              initialReference={currentReference}
              onReferenceChange={handleReferenceSelect}
              isDarkTheme={isDarkTheme}
              showSettings={showSettings}
            />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateChapter('next')}
              disabled={isLoading}
              className={isDarkTheme ? "hover:bg-gray-800" : "hover:bg-gray-100"}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSearchOpen(true)}
            className={isDarkTheme ? "hover:bg-gray-800" : "hover:bg-gray-100"}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="mt-4">
          {error ? (
            <div className="text-center text-red-500 p-8">
              {error}
              <Button 
                variant="outline" 
                onClick={() => loadPassage(currentReference, version)}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <PassageDisplay 
              verses={verses}
              reference={currentReference}
              bibleData={bibleData}
              isDarkTheme={isDarkTheme}
              isImmersiveMode={isImmersiveMode}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>

      <SearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectReference={handleReferenceSelect}
        version={version}
        isDarkTheme={isDarkTheme}
      />
    </Card>
  );
}
