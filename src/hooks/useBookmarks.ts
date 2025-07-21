import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Bookmark {
  id: string;
  book_name: string;
  chapter: number;
  verse: number;
  bible_version: string;
  note?: string;
  created_at: string;
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchBookmarks = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookmarks(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch bookmarks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addBookmark = async (
    bookName: string,
    chapter: number,
    verse: number,
    bibleVersion: string = 'kjv',
    note?: string
  ) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .insert({
          user_id: user.id,
          book_name: bookName,
          chapter,
          verse,
          bible_version: bibleVersion,
          note,
        })
        .select()
        .single();

      if (error) throw error;

      setBookmarks(prev => [data, ...prev]);
      toast({
        title: "Bookmark added",
        description: `${bookName} ${chapter}:${verse} has been bookmarked`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add bookmark",
        variant: "destructive",
      });
    }
  };

  const removeBookmark = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setBookmarks(prev => prev.filter(bookmark => bookmark.id !== id));
      toast({
        title: "Bookmark removed",
        description: "Bookmark has been deleted",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to remove bookmark",
        variant: "destructive",
      });
    }
  };

  const updateBookmark = async (id: string, note: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('bookmarks')
        .update({ note })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setBookmarks(prev => 
        prev.map(bookmark => 
          bookmark.id === id ? { ...bookmark, note } : bookmark
        )
      );
      toast({
        title: "Bookmark updated",
        description: "Your note has been saved",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive",
      });
    }
  };

  const isBookmarked = (bookName: string, chapter: number, verse: number, bibleVersion: string = 'kjv') => {
    return bookmarks.some(
      bookmark => 
        bookmark.book_name === bookName &&
        bookmark.chapter === chapter &&
        bookmark.verse === verse &&
        bookmark.bible_version === bibleVersion
    );
  };

  useEffect(() => {
    if (user) {
      fetchBookmarks();
    } else {
      setBookmarks([]);
    }
  }, [user]);

  return {
    bookmarks,
    loading,
    addBookmark,
    removeBookmark,
    updateBookmark,
    isBookmarked,
    refetch: fetchBookmarks,
  };
}