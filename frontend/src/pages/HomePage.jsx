import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Video Delivery System
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Access educational videos by grade, unit, and lesson
        </p>
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold mb-4">How to Access Videos</h2>
          <div className="text-left space-y-4">
            <p className="text-gray-700">
              • Use the video URL format: <code className="bg-gray-100 px-2 py-1 rounded">/video/G03_U02_L01_InputDevices</code>
            </p>
            <p className="text-gray-700">
              • Or use the redirect URL: <code className="bg-gray-100 px-2 py-1 rounded">/G03_U02_L01_InputDevices</code>
            </p>
            <p className="text-gray-700">
              • Scan the QR code provided by your teacher
            </p>
          </div>
          <div className="mt-8">
            <Link
              to="/admin/login"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;





