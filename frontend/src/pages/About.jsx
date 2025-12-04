import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

function About() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header />

      <main className="flex-1 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
            About PeerScript
          </h1>

          <section className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl p-8 shadow-lg mb-8 transform hover:scale-105 transition-all duration-300">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              What is PeerScript?
            </h2>
            <p className="text-lg text-gray-700 mb-4 leading-relaxed">
              PeerScript is a real-time collaborative code editor designed for web developers,
              students, and teams who want to code together seamlessly.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Whether you're pair programming, teaching, or working on a group project,
              PeerScript makes collaboration effortless with instant synchronization and
              live preview functionality.
            </p>
          </section>

          <section className="bg-white/80 backdrop-blur-sm border border-blue-100 rounded-2xl p-8 shadow-lg mb-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">
              Key Features
            </h2>
            <div className="space-y-4">
              {[
                { icon: '⚡', title: 'Real-time Collaboration', desc: 'Multiple users can edit code simultaneously' },
                { icon: '👁️', title: 'Live Preview', desc: 'See your changes rendered instantly' },
                { icon: '💾', title: 'Auto-save', desc: 'Your code is automatically saved to the cloud' },
                { icon: '🚀', title: 'No Installation', desc: 'Works directly in your browser' },
                { icon: '📥', title: 'Export Code', desc: 'Download your project as a formatted HTML file' },
                { icon: '🎨', title: 'Modern UI', desc: 'Clean and intuitive interface for better productivity' }
              ].map((feature, index) => (
                <div key={index} className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all">
                  <span className="text-3xl">{feature.icon}</span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                    <p className="text-gray-700">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white border-2 border-blue-200 rounded-2xl p-8 shadow-xl">
  <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
    Technology Stack
  </h2>
  <div className="grid md:grid-cols-2 gap-8">
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200 hover:border-blue-400 transition-colors">
      <h3 className="text-2xl font-semibold mb-4 text-blue-900">Frontend</h3>
      <ul className="space-y-2 text-gray-700">
        {['React', 'Tailwind CSS', 'CodeMirror', 'Socket.io Client'].map((tech, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="text-blue-600 font-bold">▹</span>
            {tech}
          </li>
        ))}
      </ul>
    </div>
    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200 hover:border-purple-400 transition-colors">
      <h3 className="text-2xl font-semibold mb-4 text-purple-900">Backend</h3>
      <ul className="space-y-2 text-gray-700">
        {['Node.js', 'Express', 'Socket.io', 'MongoDB'].map((tech, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="text-purple-600 font-bold">▹</span>
            {tech}
          </li>
        ))}
      </ul>
    </div>
  </div>
</section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default About;