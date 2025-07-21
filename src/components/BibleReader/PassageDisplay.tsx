
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bookmark, Highlighter, MessageSquare, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useHighlights, HIGHLIGHT_COLORS } from "@/hooks/useHighlights";
import { useAnnotations } from "@/hooks/useAnnotations";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
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
  const { user } = useAuth();
  const { bookmarks, addBookmark, removeBookmark, isBookmarked } = useBookmarks();
  const { addHighlight, removeHighlight, getHighlight, updateHighlightColor } = useHighlights();
  const { addAnnotation, updateAnnotation, getAnnotation } = useAnnotations();
  const { updateProgress } = useReadingProgress();
  
  const [annotationDialog, setAnnotationDialog] = useState<{
    open: boolean;
    verse?: BiblePassageVerse;
    note: string;
  }>({ open: false, note: '' });

  // Update reading progress when verses change
  useEffect(() => {
    if (user && verses.length > 0) {
      const firstVerse = verses[0];
      const lastVerse = verses[verses.length - 1];
      updateProgress(
        firstVerse.book_name,
        firstVerse.chapter,
        lastVerse.verse,
        bibleData.translation || 'kjv'
      );
    }
  }, [verses, user, bibleData.translation, updateProgress]);

  const handleBookmark = async (verse: BiblePassageVerse) => {
    if (!user) return;
    
    const bookmarked = isBookmarked(verse.book_name, verse.chapter, verse.verse, bibleData.translation || 'kjv');
    if (bookmarked) {
      const bookmark = bookmarks.find(b => 
        b.book_name === verse.book_name &&
        b.chapter === verse.chapter &&
        b.verse === verse.verse &&
        b.bible_version === (bibleData.translation || 'kjv')
      );
      if (bookmark) {
        await removeBookmark(bookmark.id);
      }
    } else {
      await addBookmark(verse.book_name, verse.chapter, verse.verse, bibleData.translation || 'kjv');
    }
  };

  const handleHighlight = async (verse: BiblePassageVerse, color: string = 'yellow') => {
    if (!user) return;
    
    const highlight = getHighlight(verse.book_name, verse.chapter, verse.verse, bibleData.translation || 'kjv');
    if (highlight) {
      if (highlight.color === color) {
        await removeHighlight(highlight.id);
      } else {
        await updateHighlightColor(highlight.id, color);
      }
    } else {
      await addHighlight(verse.book_name, verse.chapter, verse.verse, color, bibleData.translation || 'kjv');
    }
  };

  const handleAnnotation = (verse: BiblePassageVerse) => {
    if (!user) return;
    
    const existingAnnotation = getAnnotation(verse.book_name, verse.chapter, verse.verse, bibleData.translation || 'kjv');
    setAnnotationDialog({
      open: true,
      verse,
      note: existingAnnotation?.note || ''
    });
  };

  const saveAnnotation = async () => {
    if (!user || !annotationDialog.verse) return;
    
    const existingAnnotation = getAnnotation(
      annotationDialog.verse.book_name,
      annotationDialog.verse.chapter,
      annotationDialog.verse.verse,
      bibleData.translation || 'kjv'
    );

    if (existingAnnotation) {
      if (annotationDialog.note.trim()) {
        await updateAnnotation(existingAnnotation.id, annotationDialog.note);
      }
    } else if (annotationDialog.note.trim()) {
      await addAnnotation(
        annotationDialog.verse.book_name,
        annotationDialog.verse.chapter,
        annotationDialog.verse.verse,
        annotationDialog.note,
        bibleData.translation || 'kjv'
      );
    }

    setAnnotationDialog({ open: false, note: '' });
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
          {verses.map((verse) => {
            const highlight = getHighlight(verse.book_name, verse.chapter, verse.verse, bibleData.translation || 'kjv');
            const annotation = getAnnotation(verse.book_name, verse.chapter, verse.verse, bibleData.translation || 'kjv');
            const bookmarked = isBookmarked(verse.book_name, verse.chapter, verse.verse, bibleData.translation || 'kjv');
            
            const highlightColor = HIGHLIGHT_COLORS.find(c => c.value === highlight?.color);
            
            return (
              <div 
                key={`${verse.book_name}-${verse.chapter}-${verse.verse}`}
                className={cn(
                  "group flex items-start gap-3 p-3 rounded-lg transition-colors relative",
                  highlight ? highlightColor?.class : "hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
              >
                <span className={`text-sm font-medium mt-1 w-8 text-right flex-shrink-0 ${
                  isDarkTheme ? "text-gray-400" : "text-gray-500"
                }`}>
                  {verse.verse}
                </span>
                
                <div className="flex-1">
                  <p className={`leading-relaxed ${
                    isImmersiveMode ? "text-lg" : "text-base"
                  }`}>
                    {verse.text}
                  </p>
                  
                  {annotation && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border-l-2 border-blue-500">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        <MessageSquare className="h-3 w-3 inline mr-1" />
                        {annotation.note}
                      </p>
                    </div>
                  )}
                </div>
                
                {user && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBookmark(verse)}
                      className={cn(
                        "h-8 w-8 p-0",
                        bookmarked && "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/50"
                      )}
                    >
                      <Bookmark className={cn("h-4 w-4", bookmarked && "fill-current")} />
                    </Button>
                    
                    <Select onValueChange={(color) => handleHighlight(verse, color)}>
                      <SelectTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-8 w-8 p-0",
                            highlight && "bg-gray-200 dark:bg-gray-700"
                          )}
                        >
                          <Highlighter className="h-4 w-4" />
                        </Button>
                      </SelectTrigger>
                      <SelectContent>
                        {HIGHLIGHT_COLORS.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded ${color.class}`} />
                              {color.name}
                            </div>
                          </SelectItem>
                        ))}
                        {highlight && (
                          <SelectItem value="remove">
                            <div className="flex items-center gap-2">
                              <X className="w-4 h-4" />
                              Remove Highlight
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAnnotation(verse)}
                      className={cn(
                        "h-8 w-8 p-0",
                        annotation && "text-blue-600 bg-blue-100 dark:bg-blue-900/50"
                      )}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <Dialog open={annotationDialog.open} onOpenChange={(open) => setAnnotationDialog(prev => ({ ...prev, open }))}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Add Note to {annotationDialog.verse?.book_name} {annotationDialog.verse?.chapter}:{annotationDialog.verse?.verse}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Enter your note..."
                value={annotationDialog.note}
                onChange={(e) => setAnnotationDialog(prev => ({ ...prev, note: e.target.value }))}
                rows={4}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAnnotationDialog({ open: false, note: '' })}>
                  Cancel
                </Button>
                <Button onClick={saveAnnotation}>
                  Save Note
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </ScrollArea>
    </div>
  );
}
