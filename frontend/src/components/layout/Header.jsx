import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import img from '../../assets/img.svg';

const Header = ({ transparent = false }) => {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/');
    }
  };

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md ${
      transparent 
        ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 border-b border-blue-400' 
        : 'bg-gradient-to-r from-blue-500 to-purple-600 border-b border-blue-600'
    } shadow-md transition-all duration-300`}>
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* LEFT: Logo + Project Name */}
        <Link to="/" className="flex items-center gap-3 group">
          <img 
            src={img} 
            className="h-10 w-10 rounded-lg shadow-[0_4px_15px_rgba(0,0,0,0.3)] group-hover:shadow-[0_6px_20px_rgba(0,0,0,0.4)] group-hover:scale-110 transition-all duration-300" 
            alt="PeerScript Logo" 
          />
          <span className="text-2xl font-bold text-white">
            PeerScript
          </span>
        </Link>
        
        {/* RIGHT: Navigation Links */}
        <nav className="flex items-center gap-8">
          <Link 
            to="/" 
            className="text-white hover:text-blue-100 transition-colors font-medium"
          >
            Home
          </Link>
          <Link 
            to="/about" 
            className="text-white hover:text-blue-100 transition-colors font-medium"
          >
            About
          </Link>
          
          {!loading && (
            isAuthenticated ? (
              <>
                <span className="text-white font-medium">
                  👋 {user?.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors font-medium cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-white hover:text-blue-100 transition-colors font-medium"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors font-semibold"
                >
                  Sign Up
                </Link>
              </>
            )
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;