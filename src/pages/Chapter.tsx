import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, orderBy, getDocs, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Chapter as ChapterType, Novel } from '../types';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ChapterPage() {
  const { novelId, chapterId } = useParams();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState<ChapterType | null>(null);
  const [novel, setNovel] = useState<Novel | null>(null);
  const [hasReachedBottom, setHasReachedBottom] = useState(false);
  const [nextChapter, setNextChapter] = useState<ChapterType | null>(null);
  const [prevChapter, setPrevChapter] = useState<ChapterType | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChapterData = async () => {
      if (!novelId || !chapterId || !userProfile) {
        navigate('/auth');
        return;
      }

      try {
        const novelDoc = await getDoc(doc(db, 'novels', novelId));
        if (novelDoc.exists()) {
          setNovel({ id: novelDoc.id, ...novelDoc.data() } as Novel);
        }

        const chaptersQuery = query(
          collection(db, 'novels', novelId, 'chapters'),
          orderBy('chapterNumber', 'asc')
        );
        const chaptersSnapshot = await getDocs(chaptersQuery);
        const chapters = chaptersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ChapterType[];

        const currentIndex = chapters.findIndex(ch => ch.id === chapterId);
        if (currentIndex > 0) {
          setPrevChapter(chapters[currentIndex - 1]);
        }
        if (currentIndex < chapters.length - 1) {
          setNextChapter(chapters[currentIndex + 1]);
        }

        const currentChapter = chapters[currentIndex];
        if (currentChapter) {
          setChapter(currentChapter);

          await updateDoc(doc(db, 'users', userProfile.id, 'library', novelId), {
            lastReadChapter: currentChapter.chapterNumber,
            lastReadAt: new Date()
          });
        }
      } catch (error) {
        console.error('Error fetching chapter:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChapterData();
  }, [novelId, chapterId, userProfile, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current || hasReachedBottom) return;

      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      const isBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight;

      if (isBottom && !hasReachedBottom) {
        setHasReachedBottom(true);
        if (novelId && chapterId) {
          updateDoc(doc(db, 'novels', novelId, 'chapters', chapterId), {
            views: increment(1)
          });
        }
      }
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (contentElement) {
        contentElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [hasReachedBottom, novelId, chapterId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!chapter || !novel) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600">Chapter not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <Link 
            to={`/novel/${novelId}`} 
            className="flex items-center gap-2 text-orange-500 hover:text-orange-600"
          >
            <BookOpen className="h-5 w-5" />
            <span>{novel.title}</span>
          </Link>
        </div>
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Chapter {chapter.chapterNumber}</h1>
          <h2 className="text-xl text-gray-600 mt-2">{chapter.title}</h2>
        </div>
        
        <div 
          ref={contentRef} 
          className="prose max-w-none overflow-y-auto max-h-[70vh] mb-8"
        >
          {chapter.content.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-4">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="flex justify-between items-center mt-8">
          {prevChapter ? (
            <Link
              to={`/novel/${novelId}/chapter/${prevChapter.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              <ChevronLeft className="h-5 w-5" />
              Previous Chapter
            </Link>
          ) : (
            <div />
          )}
          
          {nextChapter && (
            <Link
              to={`/novel/${novelId}/chapter/${nextChapter.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Next Chapter
              <ChevronRight className="h-5 w-5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}