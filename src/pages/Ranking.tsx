import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GENRES } from '../types';
import { Trophy, TrendingUp } from 'lucide-react';
import NovelCard from '../components/NovelCard';

export default function Ranking() {
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [novels, setNovels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        let q = query(collection(db, 'novels'), orderBy('views', 'desc'), limit(50));
        
        if (selectedGenre !== 'All') {
          q = query(q, where('genre', 'array-contains', selectedGenre));
        }

        const snapshot = await getDocs(q);
        setNovels(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Error fetching rankings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, [selectedGenre]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Novel Rankings</h1>

      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setSelectedGenre('All')}
          className={`genre-button ${selectedGenre === 'All' ? 'active' : 'bg-white'}`}
        >
          All
        </button>
        {GENRES.map(genre => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            className={`genre-button ${selectedGenre === genre ? 'active' : 'bg-white'}`}
          >
            {genre}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {novels.map((novel, index) => (
            <div
              key={novel.id}
              className="bg-white p-6 rounded-lg shadow-lg flex items-center gap-6"
            >
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                {index < 3 ? (
                  <Trophy className={`h-8 w-8 ${
                    index === 0 ? 'text-yellow-500' :
                    index === 1 ? 'text-gray-400' :
                    'text-orange-600'
                  }`} />
                ) : (
                  <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                )}
              </div>

              <NovelCard novel={novel} />

              <div className="flex items-center gap-2 ml-auto">
                <TrendingUp className="h-5 w-5 text-gray-500" />
                <span className="text-lg font-semibold">{novel.views}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}