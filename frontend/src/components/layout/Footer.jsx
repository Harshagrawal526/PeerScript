import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-8 border-t border-gray-800">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-lg font-semibold">
              &copy; {new Date().getFullYear()} PeerScript
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Collaborate. Code. Create.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end">
            <p className="text-sm text-gray-400 mb-2">
              Built with ❤️ using
            </p>
            <div className="flex gap-3 text-xs">
              <span className="bg-blue-600 px-2 py-1 rounded">React</span>
              <span className="bg-green-600 px-2 py-1 rounded">Node.js</span>
              <span className="bg-purple-600 px-2 py-1 rounded">Socket.io</span>
              <span className="bg-green-700 px-2 py-1 rounded">MongoDB</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;