import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Modal from '../components/ui/Modal';
import { API_URL } from '../config';

function Dashboard() {
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();
  
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
const [renamingRoom, setRenamingRoom] = useState(null);
const [renaming, setRenaming] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Fetch user's rooms
  useEffect(() => {
    const fetchRooms = async () => {
      if (!token) return;

      try {
        const response = await fetch(`${API_URL}/api/rooms/my-rooms`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setRooms(data.rooms);
        }
      } catch (error) {
        console.error('Fetch rooms error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [token]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await fetch(`${API_URL}/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newRoomName || 'Untitled Project'
        })
      });

      if (response.ok) {
        const data = await response.json();
        navigate(`/app?room=${data.room.roomId}`);
      }
    } catch (error) {
      console.error('Create room error:', error);
      alert('Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/rooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setRooms(rooms.filter(room => room.roomId !== roomId));
      } else {
        alert('Failed to delete room');
      }
    } catch (error) {
      console.error('Delete room error:', error);
      alert('Failed to delete room');
    }
  };

  const handleRenameRoom = async (e) => {
  e.preventDefault();
  if (!newRoomName.trim() || !renamingRoom) return;

  setRenaming(true);

  try {
    const response = await fetch(`${API_URL}/api/rooms/${renamingRoom.roomId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name: newRoomName.trim() })
    });

    if (response.ok) {
      const data = await response.json();
      // Update rooms list
      setRooms(rooms.map(room => 
        room.roomId === renamingRoom.roomId 
          ? { ...room, name: data.room.name }
          : room
      ));
      setShowRenameModal(false);
      setRenamingRoom(null);
      setNewRoomName('');
    } else {
      alert('Failed to rename room');
    }
  } catch (error) {
    console.error('Rename error:', error);
    alert('Failed to rename room');
  } finally {
    setRenaming(false);
  }
};

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <Header />

      <main className="flex-1 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                My Dashboard
              </h1>
              <p className="text-gray-600 mt-2">Welcome back, {user?.username}!</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg cursor-pointer"
            >
              + Create New Room
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your rooms...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-blue-200">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">No rooms yet</h2>
              <p className="text-gray-600 mb-6">Create your first room to start coding!</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg cursor-pointer"
              >
                Create Room
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => (
                <div
                  key={room._id}
                  className="bg-white rounded-xl shadow-lg p-6 border border-blue-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800 truncate flex-1">
                      {room.name}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      room.isPublic 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {room.isPublic ? 'Public' : 'Private'}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    Last modified: {formatDate(room.lastModified)}
                  </p>

                  <div className="flex gap-2">
  <button
    onClick={() => navigate(`/app?room=${room.roomId}`)}
    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium cursor-pointer"
  >
    Open
  </button>
  <button
    onClick={() => {
      setRenamingRoom(room);
      setNewRoomName(room.name);
      setShowRenameModal(true);
    }}
    className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors cursor-pointer"
    title="Rename"
  >
    ✏️
  </button>
  <button
    onClick={() => handleDeleteRoom(room.roomId)}
    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
    title="Delete"
  >
    🗑️
  </button>
</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Create Room Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setNewRoomName('');
        }}
        title="Create New Room"
      >
        <form onSubmit={handleCreateRoom} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Room Name
            </label>
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="My Awesome Project"
              maxLength={50}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty for "Untitled Project"</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setNewRoomName('');
              }}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
      {/* Rename Room Modal */}
<Modal
  isOpen={showRenameModal}
  onClose={() => {
    setShowRenameModal(false);
    setRenamingRoom(null);
    setNewRoomName('');
  }}
  title="Rename Room"
>
  <form onSubmit={handleRenameRoom} className="space-y-4">
    <div>
      <label className="block text-gray-700 font-semibold mb-2">
        Room Name
      </label>
      <input
        type="text"
        value={newRoomName}
        onChange={(e) => setNewRoomName(e.target.value)}
        placeholder="Enter new name"
        maxLength={50}
        required
        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
        autoFocus
      />
    </div>

    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => {
          setShowRenameModal(false);
          setRenamingRoom(null);
          setNewRoomName('');
        }}
        className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors cursor-pointer"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={renaming || !newRoomName.trim()}
        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
      >
        {renaming ? 'Renaming...' : 'Rename'}
      </button>
    </div>
  </form>
</Modal>
    </div>
  );
}

export default Dashboard;