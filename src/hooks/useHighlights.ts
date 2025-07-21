import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface VerseHighlight {
  id: string;
  book_name: string;
  chapter: number;
  verse: number;
  bible_version: string;
  color: string;
  created_at: string;
}

export const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: 'yellow', class: 'bg-yellow-200 dark:bg-yellow-800' },
  { name: 'Green', value: 'green', class: 'bg-green-200 dark:bg-green-800' },
  { name: 'Blue', value: 'blue', class: 'bg-blue-200 dark:bg-blue-800' },
  { name: 'Pink', value: 'pink', class: 'bg-pink-200 dark:bg-pink-800' },
  { name: 'Orange', value: 'orange', class: 'bg-orange-200 dark:bg-orange-800' },
];

export function useHighlights() {
  const [highlights, setHighlights] = useState<VerseHighlight[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchHighlights = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('verse_highlights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHighlights(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch highlights",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addHighlight = async (
    bookName: string,
    chapter: number,
    verse: number,
    color: string = 'yellow',
    bibleVersion: string = 'kjv'
  ) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('verse_highlights')
        .insert({
          user_id: user.id,
          book_name: bookName,
          chapter,
          verse,
          bible_version: bibleVersion,
          color,
        })
        .select()
        .single();

      if (error) throw error;

      setHighlights(prev => [data, ...prev]);
      toast({
        title: "Verse highlighted",
        description: `${bookName} ${chapter}:${verse} highlighted in ${color}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add highlight",
        variant: "destructive",
      });
    }
  };

  const removeHighlight = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('verse_highlights')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setHighlights(prev => prev.filter(highlight => highlight.id !== id));
      toast({
        title: "Highlight removed",
        description: "Highlight has been deleted",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to remove highlight",
        variant: "destructive",
      });
    }
  };

  const updateHighlightColor = async (id: string, color: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('verse_highlights')
        .update({ color })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setHighlights(prev => 
        prev.map(highlight => 
          highlight.id === id ? { ...highlight, color } : highlight
        )
      );
      toast({
        title: "Highlight updated",
        description: `Color changed to ${color}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update highlight",
        variant: "destructive",
      });
    }
  };

  const getHighlight = (bookName: string, chapter: number, verse: number, bibleVersion: string = 'kjv') => {
    return highlights.find(
      highlight => 
        highlight.book_name === bookName &&
        highlight.chapter === chapter &&
        highlight.verse === verse &&
        highlight.bible_version === bibleVersion
    );
  };

  const isHighlighted = (bookName: string, chapter: number, verse: number, bibleVersion: string = 'kjv') => {
    return !!getHighlight(bookName, chapter, verse, bibleVersion);
  };

  useEffect(() => {
    if (user) {
      fetchHighlights();
    } else {
      setHighlights([]);
    }
  }, [user]);

  return {
    highlights,
    loading,
    addHighlight,
    removeHighlight,
    updateHighlightColor,
    getHighlight,
    isHighlighted,
    refetch: fetchHighlights,
  };
}