import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Each page loads as its own chunk, so the editor (CodeMirror + Yjs) is
// only downloaded when a room is actually opened
const Home = lazy(() => import('./pages/Home'));
const EditorPage = lazy(() => import('./pages/EditorPage'));
const About = lazy(() => import('./pages/About'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

const Loader = () => (
  <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-700 text-lg font-medium">Loading...</p>
    </div>
  </div>
);

const page = (element) => <Suspense fallback={<Loader />}>{element}</Suspense>;

const router = createBrowserRouter([
  { path: '/', element: page(<Home />) },
  { path: '/app', element: page(<EditorPage />) },
  { path: '/about', element: page(<About />) },
  { path: '/login', element: page(<Login />) },
  { path: '/register', element: page(<Register />) },
  { path: '/dashboard', element: page(<Dashboard />) },
]);

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <Loader />;
  }

  return <RouterProvider router={router} />;
}

export default App;
