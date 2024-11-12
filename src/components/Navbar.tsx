import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, Library, User, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { userProfile } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center">
            <BookOpen className="h-8 w-8 text-orange-500" />
            <span className="ml-2 text-2xl font-bold text-orange-500">Mantra Novels</span>
          </Link>
          
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search novels..."
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/explore" className="nav-link">Explore</Link>
            <Link to="/ranking" className="nav-link">Ranking</Link>
            <Link to="/write" className="nav-link">Write</Link>
            <Link to={userProfile ? "/library" : "/auth"} className="flex items-center nav-link">
              <Library className="h-5 w-5 mr-1" />
              <span>Library</span>
            </Link>
            {userProfile ? (
              <Link to="/profile" className="flex items-center nav-link">
                <User className="h-5 w-5 mr-1" />
                <span>Profile</span>
              </Link>
            ) : (
              <Link to="/auth" className="nav-link">Login/Signup</Link>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500"
            >
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search novels..."
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <Link to="/" className="mobile-nav-link">Home</Link>
            <Link to="/explore" className="mobile-nav-link">Explore</Link>
            <Link to="/ranking" className="mobile-nav-link">Ranking</Link>
            <Link to="/write" className="mobile-nav-link">Write</Link>
            <Link to={userProfile ? "/library" : "/auth"} className="mobile-nav-link">
              <Library className="h-5 w-5 mr-2" />
              <span>Library</span>
            </Link>
            {userProfile ? (
              <Link to="/profile" className="mobile-nav-link">
                <User className="h-5 w-5 mr-2" />
                <span>Profile</span>
              </Link>
            ) : (
              <Link to="/auth" className="mobile-nav-link">Login/Signup</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}