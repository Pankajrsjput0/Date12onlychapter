import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, orderBy, getDocs, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Novel, Chapter } from '../types';
import { BookOpen, Heart, Share2, Eye, Lock } from 'lucide-react';

export default function NovelDetail() {
  const { id } = useParams();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInLibrary, setIsInLibrary] = useState(false);

  useEffect(() => {
    const fetchNovel = async () => {
      if (!id) return;

      try {
        const novelDoc = await getDoc(doc(db, 'novels', id));
        if (novelDoc.exists()) {
          setNovel({ id: novelDoc.id, ...novelDoc.data() } as Novel);

          await updateDoc(doc(db, 'novels', id), {
            views: increment(1)
          });

          const chaptersRef = collection(db, 'novels', id, 'chapters');
          const chaptersQuery = query(chaptersRef, orderBy('chapterNumber', 'asc'));
          const chaptersSnapshot = await getDocs(chaptersQuery);

          const chaptersData = chaptersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            uploadDate: doc.data().uploadDate?.toDate() || new Date(),
          })) as Chapter[];

          setChapters(chaptersData);

          if (userProfile) {
            const libraryDoc = await getDoc(doc(db, 'users', userProfile.id, 'library', id));
            setIsInLibrary(libraryDoc.exists());
          }
        }
      } catch (error) {
        console.error('Error fetching novel:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNovel();
  }, [id, userProfile]);

  // ... (rest of the component remains the same)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* ... (novel details remain the same) */}

      {/* Chapters List */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Chapters ({chapters.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chapters.map((chapter) => (
            <Link
              key={chapter.id}
              to={userProfile ? `/novel/${novel?.id}/chapter/${chapter.id}` : '/auth'}
              className="p-4 border rounded-lg hover:border-orange-500 transition-colors"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">Chapter {chapter.chapterNumber}</h3>
                  <p className="text-gray-600">{chapter.title}</p>
                </div>
                {!userProfile && <Lock className="h-4 w-4 text-gray-400" />}
              </div>
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                <Eye className="h-4 w-4" />
                <span>{chapter.views || 0}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}