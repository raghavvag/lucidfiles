import React from 'react';
import './index.css';

function App() {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">
          Hello World! 🎉
        </h1>
        <p className="text-xl text-gray-700 mb-6">
          Semantic File Explorer is Running!
        </p>
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            ✅ Electron App Working!
          </h2>
          <div className="space-y-2 text-left">
            <p className="text-green-600">✓ React is loaded</p>
            <p className="text-green-600">✓ Tailwind CSS is working</p>
            <p className="text-green-600">✓ Electron is running</p>
            <p className="text-blue-600">🚀 Ready for development!</p>
          </div>
        </div>
        <button 
          className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => alert('Desktop app is working! 🎉')}
        >
          Test Button
        </button>
      </div>
    </div>
  );
}

export default App;
