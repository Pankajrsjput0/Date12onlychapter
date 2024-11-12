import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, query, where, getDocs, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GENRES, Novel, Chapter } from '../types';
import { PlusCircle, Edit, BookPlus, Trash2 } from 'lucide-react';
import EditNovelModal from '../components/EditNovelModal';
import AddChapterModal from '../components/AddChapterModal';
import EditChapterModal from '../components/EditChapterModal';
import { useNavigate } from 'react-router-dom';
import NovelCard from '../components/NovelCard';

export default function Write() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [myNovels, setMyNovels] = useState<Novel[]>([]);
  const [showNewNovelForm, setShowNewNovelForm] = useState(false);
  const [editingNovel, setEditingNovel] = useState<Novel | null>(null);
  const [editingChapter, setEditingChapter] = useState<{novel: Novel, chapter: Chapter} | null>(null);
  const [addingChapterToNovel, setAddingChapterToNovel] = useState<Novel | null>(null);
  const [lastChapterNumbers, setLastChapterNumbers] = useState<Record<string, number>>({});
  const [expandedNovel, setExpandedNovel] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Record<string, Chapter[]>>({});

  useEffect(() => {
    if (!userProfile) {
      navigate('/auth');
      return;
    }

    const fetchMyNovels = async () => {
      const q = query(collection(db, 'novels'), where('uploadBy', '==', userProfile.id));
      const snapshot = await getDocs(q);
      const novels = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Novel));
      setMyNovels(novels);

      const chapterData: Record<string, Chapter[]> = {};
      const chapterNumbers: Record<string, number> = {};
      
      for (const novel of novels) {
        const chaptersQuery = query(
          collection(db, 'novels', novel.id, 'chapters'),
          orderBy('chapterNumber', 'desc')
        );
        const chaptersSnapshot = await getDocs(chaptersQuery);
        const novelChapters = chaptersSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Chapter));
        
        chapterData[novel.id] = novelChapters;
        chapterNumbers[novel.id] = novelChapters.length > 0 
          ? Math.max(...novelChapters.map(c => c.chapterNumber))
          : 0;
      }
      
      setChapters(chapterData);
      setLastChapterNumbers(chapterNumbers);
    };

    fetchMyNovels();
  }, [userProfile, navigate]);

  const handleDeleteNovel = async (novelId: string) => {
    if (!confirm('Are you sure you want to delete this novel? This action cannot be undone.')) {
      return;
    }

    try {
      const chaptersQuery = query(collection(db, 'novels', novelId, 'chapters'));
      const chaptersSnapshot = await getDocs(chaptersQuery);
      const deleteChapters = chaptersSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      await Promise.all(deleteChapters);

      await deleteDoc(doc(db, 'novels', novelId));
      setMyNovels(prev => prev.filter(novel => novel.id !== novelId));
    } catch (error) {
      console.error('Error deleting novel:', error);
    }
  };

  const handleDeleteChapter = async (novelId: string, chapterId: string) => {
    if (!confirm('Are you sure you want to delete this chapter? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'novels', novelId, 'chapters', chapterId));
      setChapters(prev => ({
        ...prev,
        [novelId]: prev[novelId].filter(chapter => chapter.id !== chapterId)
      }));
    } catch (error) {
      console.error('Error deleting chapter:', error);
    }
  };

  if (!userProfile) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Novels</h1>
        <button
          onClick={() => setShowNewNovelForm(true)}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
        >
          <PlusCircle className="h-5 w-5" />
          Create New Novel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {myNovels.map(novel => (
          <div key={novel.id} className="bg-white p-6 rounded-lg shadow-lg">
            <NovelCard novel={novel} />
            <div className="mt-4 flex justify-between">
              <button 
                onClick={() => setAddingChapterToNovel(novel)}
                className="flex items-center gap-1 text-orange-500 hover:text-orange-600"
              >
                <BookPlus className="h-4 w-4" />
                Add Chapter
              </button>
              <button 
                onClick={() => setEditingNovel(novel)}
                className="flex items-center gap-1 text-orange-500 hover:text-orange-600"
              >
                <Edit className="h-4 w-4" />
                Edit Novel
              </button>
              <button 
                onClick={() => handleDeleteNovel(novel.id)}
                className="flex items-center gap-1 text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
                Delete Novel
              </button>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold mb-2">Chapters</h4>
              <div className="space-y-2">
                {chapters[novel.id]?.map(chapter => (
                  <div key={chapter.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">Chapter {chapter.chapterNumber}:</span>
                      <span className="ml-2">{chapter.title}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingChapter({ novel, chapter })}
                        className="text-orange-500 hover:text-orange-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteChapter(novel.id, chapter.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingNovel && (
        <EditNovelModal
          novel={editingNovel}
          isOpen={!!editingNovel}
          onClose={() => setEditingNovel(null)}
          onUpdate={() => {
            if (userProfile) {
              const fetchMyNovels = async () => {
                const q = query(collection(db, 'novels'), where('uploadBy', '==', userProfile.id));
                const snapshot = await getDocs(q);
                setMyNovels(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Novel)));
              };
              fetchMyNovels();
            }
          }}
        />
      )}

      {addingChapterToNovel && (
        <AddChapterModal
          novelId={addingChapterToNovel.id}
          isOpen={!!addingChapterToNovel}
          onClose={() => setAddingChapterToNovel(null)}
          lastChapterNumber={lastChapterNumbers[addingChapterToNovel.id] || 0}
          onAdd={() => {
            setLastChapterNumbers(prev => ({
              ...prev,
              [addingChapterToNovel.id]: (prev[addingChapterToNovel.id] || 0) + 1
            }));
          }}
        />
      )}

      {editingChapter && (
        <EditChapterModal
          novelId={editingChapter.novel.id}
          chapter={editingChapter.chapter}
          isOpen={!!editingChapter}
          onClose={() => setEditingChapter(null)}
          onUpdate={() => {
            const fetchChapters = async () => {
              const chaptersQuery = query(
                collection(db, 'novels', editingChapter.novel.id, 'chapters'),
                orderBy('chapterNumber', 'desc')
              );
              const chaptersSnapshot = await getDocs(chaptersQuery);
              const novelChapters = chaptersSnapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
              } as Chapter));
              
              setChapters(prev => ({
                ...prev,
                [editingChapter.novel.id]: novelChapters
              }));
            };
            fetchChapters();
          }}
        />
      )}
    </div>
  );
}