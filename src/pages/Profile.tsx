import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Edit, BookOpen } from 'lucide-react';
import EditProfileModal from '../components/EditProfileModal';
import NovelCard from '../components/NovelCard';
import type { Novel } from '../types';

export default function Profile() {
  const { userProfile, logout } = useAuth();
  const [readingStats, setReadingStats] = useState([]);
  const [currentReading, setCurrentReading] = useState<Novel[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userProfile) return;

      try {
        // Fetch reading stats
        const now = new Date();
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          return date.toISOString().split('T')[0];
        }).reverse();

        const readingsQuery = query(
          collection(db, 'readings'),
          where('userId', '==', userProfile.id),
          where('date', '>=', last7Days[0])
        );

        const snapshot = await getDocs(readingsQuery);
        const readings = snapshot.docs.map(doc => ({
          date: doc.data().date,
          count: doc.data().chaptersRead
        }));

        const stats = last7Days.map(date => ({
          name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          reads: readings.find(r => r.date === date)?.count || 0
        }));

        setReadingStats(stats);

        // Fetch current reading novels
        const libraryQuery = query(
          collection(db, 'users', userProfile.id, 'library'),
          orderBy('lastReadAt', 'desc'),
          limit(5)
        );
        
        const librarySnapshot = await getDocs(libraryQuery);
        const novelIds = librarySnapshot.docs.map(doc => doc.data().novelId);
        
        const novels: Novel[] = [];
        for (const novelId of novelIds) {
          const novelDoc = await getDocs(doc(db, 'novels', novelId));
          if (novelDoc.exists()) {
            novels.push({ id: novelDoc.id, ...novelDoc.data() } as Novel);
          }
        }
        
        setCurrentReading(novels);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userProfile]);

  if (!userProfile) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-center">Please login to view your profile.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header/Banner */}
        <div className="h-48 bg-gradient-to-r from-orange-400 to-pink-500"></div>
        
        {/* Profile Info */}
        <div className="px-8 py-6 -mt-20">
          <div className="flex justify-between items-start">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h1 className="text-3xl font-bold">{userProfile.username}</h1>
              <p className="text-gray-600 mt-1">Member since {new Date(userProfile.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
          {/* Reading Stats */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Reading Stats</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={readingStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="reads" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Favorite Genres */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Favorite Genres</h2>
            <div className="flex flex-wrap gap-2">
              {userProfile.interestedGenres.map(genre => (
                <span
                  key={genre}
                  className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Currently Reading */}
        <div className="p-8">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="h-6 w-6 text-orange-500" />
            <h2 className="text-2xl font-bold">Currently Reading</h2>
          </div>
          {currentReading.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {currentReading.map(novel => (
                <NovelCard key={novel.id} novel={novel} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">No novels in your reading list yet.</p>
          )}
        </div>
      </div>

      {showEditModal && (
        <EditProfileModal
          userProfile={userProfile}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdate={() => {
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
}