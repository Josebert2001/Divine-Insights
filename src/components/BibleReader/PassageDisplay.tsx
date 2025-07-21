
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Bookmark, Highlight } from "lucide-react";
import type { BibleData, BiblePassageVerse } from "@/services/types";

interface PassageDisplayProps {
  verses: BiblePassageVerse[];
  reference: string;
  bibleData: BibleData;
  isDarkTheme?: boolean;
  isImmersiveMode?: boolean;
  isLoading?: boolean;
}

export function PassageDisplay({
  verses,
  reference,
  bibleData,
  isDarkTheme = false,
  isImmersiveMode = false,
  isLoading = false
}: PassageDisplayProps) {
  const handleBookmark = (verse: BiblePassageVerse) => {
    // TODO: Implement bookmark functionality with Supabase
    console.log('Bookmarking verse:', verse);
  };

  const handleHighlight = (verse: BiblePassageVerse) => {
    // TODO: Implement highlight functionality with Supabase
    console.log('Highlighting verse:', verse);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    );
  }

  if (verses.length === 0) {
    return (
      <div className={`text-center p-8 ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>
        No verses found for this reference.
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${isDarkTheme ? "text-gray-100" : "text-gray-900"}`}>
      <h2 className={`text-2xl font-semibold ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
        {reference}
      </h2>
      
      <ScrollArea className={`h-[500px] ${isImmersiveMode ? "px-8" : "px-4"}`}>
        <div className="space-y-3">
          {verses.map((verse) => (
            <div 
              key={`${verse.book_name}-${verse.chapter}-${verse.verse}`}
              className="group flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className={`text-sm font-medium mt-1 w-8 text-right flex-shrink-0 ${
                isDarkTheme ? "text-gray-400" : "text-gray-500"
              }`}>
                {verse.verse}
              </span>
              
              <p className={`flex-1 leading-relaxed ${
                isImmersiveMode ? "text-lg" : "text-base"
              }`}>
                {verse.text}
              </p>
              
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBookmark(verse)}
                  className="h-8 w-8 p-0"
                >
                  <Bookmark className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleHighlight(verse)}
                  className="h-8 w-8 p-0"
                >
                  <Highlight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
