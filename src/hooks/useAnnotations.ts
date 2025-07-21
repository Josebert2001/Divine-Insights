import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface VerseAnnotation {
  id: string;
  book_name: string;
  chapter: number;
  verse: number;
  bible_version: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export function useAnnotations() {
  const [annotations, setAnnotations] = useState<VerseAnnotation[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAnnotations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('verse_annotations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setAnnotations(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch annotations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addAnnotation = async (
    bookName: string,
    chapter: number,
    verse: number,
    note: string,
    bibleVersion: string = 'kjv'
  ) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('verse_annotations')
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

      setAnnotations(prev => [data, ...prev]);
      toast({
        title: "Note added",
        description: `Note added to ${bookName} ${chapter}:${verse}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive",
      });
    }
  };

  const updateAnnotation = async (id: string, note: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('verse_annotations')
        .update({ note })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setAnnotations(prev => 
        prev.map(annotation => 
          annotation.id === id ? data : annotation
        )
      );
      toast({
        title: "Note updated",
        description: "Your note has been saved",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive",
      });
    }
  };

  const removeAnnotation = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('verse_annotations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setAnnotations(prev => prev.filter(annotation => annotation.id !== id));
      toast({
        title: "Note deleted",
        description: "Your note has been removed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    }
  };

  const getAnnotation = (bookName: string, chapter: number, verse: number, bibleVersion: string = 'kjv') => {
    return annotations.find(
      annotation => 
        annotation.book_name === bookName &&
        annotation.chapter === chapter &&
        annotation.verse === verse &&
        annotation.bible_version === bibleVersion
    );
  };

  const hasAnnotation = (bookName: string, chapter: number, verse: number, bibleVersion: string = 'kjv') => {
    return !!getAnnotation(bookName, chapter, verse, bibleVersion);
  };

  useEffect(() => {
    if (user) {
      fetchAnnotations();
    } else {
      setAnnotations([]);
    }
  }, [user]);

  return {
    annotations,
    loading,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    getAnnotation,
    hasAnnotation,
    refetch: fetchAnnotations,
  };
}