import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';
import { generateRoomId, extractRoomIdFromInput } from '../utils/roomUtils';
import htmlImg from '../assets/html.png';
import cssImg from '../assets/css.png';
import jsImg from '../assets/js.png';
import Modal from '../components/ui/Modal';
import { API_URL } from '../config';

function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();
  const [roomId, setRoomId] = useState('');
  const [showQuickCreateModal, setShowQuickCreateModal] = useState(false);
  const [quickRoomName, setQuickRoomName] = useState('');
  const [creatingQuick, setCreatingQuick] = useState(false);

  const quickCreateRoom = async () => {
    if (isAuthenticated && token) {
      // Show modal for authenticated users
      setShowQuickCreateModal(true);
    } else {
      // Anonymous room for non-logged-in users
      const newRoomId = generateRoomId();
      navigate(`/app?room=${newRoomId}`);
    }
  };

  const handleQuickCreate = async (e) => {
    e.preventDefault();
    setCreatingQuick(true);

    try {
      const response = await fetch(`${API_URL}/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: quickRoomName || ''
        })
      });

      if (response.ok) {
        const data = await response.json();
        navigate(`/app?room=${data.room.roomId}`);
      }
    } catch (error) {
      console.error('Quick create error:', error);
      alert('Failed to create room');
    } finally {
      setCreatingQuick(false);
    }
  };

  const joinRoom = () => {
    if (roomId.trim()) {
      const extractedRoomId = extractRoomIdFromInput(roomId.trim());
      navigate(`/app?room=${extractedRoomId}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <Header transparent />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16 max-w-4xl animate-fade-in">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Code Together,
            <br />
            Create Together
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-8">
            Real-time collaborative code editor for HTML, CSS, and JavaScript
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium border border-blue-300 shadow-sm">
              ⚡ Real-time Sync
            </span>
            <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium border border-purple-300 shadow-sm">
              👁️ Live Preview
            </span>
            <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium border border-green-300 shadow-sm">
              🔗 Easy Sharing
            </span>
          </div>
        </section>

        {/* Room Actions */}
        <section className="bg-gradient-to-br from-white via-blue-50 to-purple-50 backdrop-blur-sm rounded-2xl shadow-2xl border border-blue-200 p-8 md:p-12 max-w-lg w-full mb-16 transform hover:scale-105 transition-all duration-300">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
            Get Started
          </h2>

          <div className="space-y-6">
            {isAuthenticated ? (
              <>
                {/* Go to Dashboard */}
                <div>
                  <Button
                    onClick={() => navigate('/dashboard')}
                    variant="success"
                    size="lg"
                    className="w-full text-lg shadow-lg hover:shadow-xl"
                  >
                    📊 Go to Dashboard
                  </Button>
                  <p className="text-sm text-gray-600 text-center mt-2">
                    Manage your rooms and projects
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">or</span>
                  </div>
                </div>

                {/* Quick Start New Room */}
                <div>
                  <Button
                    onClick={quickCreateRoom}
                    variant="primary"
                    size="lg"
                    className="w-full text-lg shadow-lg hover:shadow-xl"
                  >
                    🚀 Quick Start - New Room
                  </Button>
                  <p className="text-sm text-gray-600 text-center mt-2">
                    Start coding immediately
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Create New Room for Non-authenticated */}
                <div>
                  <Button
                    onClick={quickCreateRoom}
                    variant="success"
                    size="lg"
                    className="w-full text-lg shadow-lg hover:shadow-xl"
                  >
                    ✨ Create New Room
                  </Button>
                  <p className="text-sm text-gray-600 text-center mt-2">
                    Start a quick anonymous session
                  </p>
                </div>
              </>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  or
                </span>
              </div>
            </div>

            {/* Join Existing Room */}
            <div>
              <p className="text-lg font-semibold text-center mb-4 text-gray-900">
                Join Existing Room
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Room ID or URL"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
                  className="flex-1 px-4 py-3 border-2 border-blue-200 bg-white text-gray-900 placeholder-gray-500 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                />
                <Button onClick={joinRoom} variant="primary" size="lg" className="shadow-lg">
                  Join
                </Button>
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                Paste room ID or full URL
              </p>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="grid md:grid-cols-3 gap-8 max-w-6xl w-full mb-16">
          {[
            {
              icon: '⚡',
              title: 'Real-time Sync',
              description: 'See changes instantly as your team codes together',
              bgColor: 'bg-blue-50',
              borderColor: 'border-blue-200',
              titleColor: 'text-blue-900'
            },
            {
              icon: '👁️',
              title: 'Live Preview',
              description: 'View HTML, CSS, and JavaScript output in real-time',
              bgColor: 'bg-purple-50',
              borderColor: 'border-purple-200',
              titleColor: 'text-purple-900'
            },
            {
              icon: '🔗',
              title: 'Easy Sharing',
              description: 'Share a link - no installation or signup required',
              bgColor: 'bg-green-50',
              borderColor: 'border-green-200',
              titleColor: 'text-green-900'
            }
          ].map((feature, index) => (
            <div
              key={index}
              className={`${feature.bgColor} border ${feature.borderColor} rounded-xl p-6 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300`}
            >
              <div className="text-5xl mb-4">
                {feature.icon}
              </div>
              <h3 className={`text-xl font-bold mb-2 ${feature.titleColor}`}>
                {feature.title}
              </h3>
              <p className="text-gray-700">
                {feature.description}
              </p>
            </div>
          ))}
        </section>

        {/* Languages Section */}
        <section className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-200 rounded-2xl p-8 md:p-12 max-w-4xl w-full shadow-2xl">
          <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Supported Languages
          </h2>
          <div className="flex justify-around items-center flex-wrap gap-8">
            {[
              { img: htmlImg, name: 'HTML', color: 'text-orange-600' },
              { img: cssImg, name: 'CSS', color: 'text-blue-600' },
              { img: jsImg, name: 'JavaScript', color: 'text-yellow-600' }
            ].map((lang, index) => (
              <div key={index} className="text-center transform hover:scale-110 transition-transform duration-300">
                <div className="bg-white p-6 rounded-xl shadow-lg mb-3 border-2 border-blue-200 hover:border-blue-400 transition-colors">
                  <img
                    src={lang.img}
                    alt={lang.name}
                    className="h-20 w-20 mx-auto object-contain"
                  />
                </div>
                <p className={`text-lg font-semibold ${lang.color}`}>{lang.name}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />

      {/* Quick Create Room Modal */}
<Modal
  isOpen={showQuickCreateModal}
  onClose={() => {
    setShowQuickCreateModal(false);
    setQuickRoomName('');
  }}
  title="Quick Start - New Room"
>
  <form onSubmit={handleQuickCreate} className="space-y-4">
    <div>
      <label className="block text-gray-700 font-semibold mb-2">
        Room Name (Optional)
      </label>
      <input
        type="text"
        value={quickRoomName}
        onChange={(e) => setQuickRoomName(e.target.value)}
        placeholder="Leave empty for auto-numbering"
        maxLength={50}
        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
        autoFocus
      />
      <p className="text-xs text-gray-500 mt-1">Leave empty for "Untitled Project N"</p>
    </div>

    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => {
          setShowQuickCreateModal(false);
          setQuickRoomName('');
        }}
        className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors cursor-pointer"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={creatingQuick}
        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
      >
        {creatingQuick ? 'Creating...' : 'Create'}
      </button>
    </div>
  </form>
</Modal>
    </div>
  );
}

export default Home;