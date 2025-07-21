import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ReadingProgress {
  id: string;
  book_name: string;
  chapter: number;
  last_verse?: number;
  bible_version: string;
  last_read_at: string;
}

export function useReadingProgress() {
  const [progress, setProgress] = useState<ReadingProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProgress = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('last_read_at', { ascending: false });

      if (error) throw error;
      setProgress(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch reading progress",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (
    bookName: string,
    chapter: number,
    lastVerse?: number,
    bibleVersion: string = 'kjv'
  ) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('reading_progress')
        .upsert({
          user_id: user.id,
          book_name: bookName,
          chapter,
          last_verse: lastVerse,
          bible_version: bibleVersion,
          last_read_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setProgress(prev => {
        const existing = prev.find(
          p => p.book_name === bookName && 
               p.chapter === chapter && 
               p.bible_version === bibleVersion
        );
        
        if (existing) {
          return prev.map(p => p.id === existing.id ? data : p);
        } else {
          return [data, ...prev];
        }
      });
    } catch (error: any) {
      console.error('Failed to update reading progress:', error);
    }
  };

  const getProgress = (bookName: string, chapter: number, bibleVersion: string = 'kjv') => {
    return progress.find(
      p => p.book_name === bookName && 
           p.chapter === chapter && 
           p.bible_version === bibleVersion
    );
  };

  const getBookProgress = (bookName: string, bibleVersion: string = 'kjv') => {
    return progress
      .filter(p => p.book_name === bookName && p.bible_version === bibleVersion)
      .sort((a, b) => b.chapter - a.chapter);
  };

  const getRecentProgress = (limit: number = 10) => {
    return progress.slice(0, limit);
  };

  useEffect(() => {
    if (user) {
      fetchProgress();
    } else {
      setProgress([]);
    }
  }, [user]);

  return {
    progress,
    loading,
    updateProgress,
    getProgress,
    getBookProgress,
    getRecentProgress,
    refetch: fetchProgress,
  };
}