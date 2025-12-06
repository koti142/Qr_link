import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Video Delivery System
        </h1>
        <p className="text-lg text-slate-600 mb-8">
          Access educational videos by grade, unit, and lesson
        </p>
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <h2 className="text-2xl font-semibold mb-4 text-slate-900">How to Access Videos</h2>
          <div className="text-left space-y-4">
            <p className="text-slate-700">
              • Use the video URL format: <code className="bg-slate-100 px-2 py-1 rounded-xl">/video/G03_U02_L01_InputDevices</code>
            </p>
            <p className="text-slate-700">
              • Or use the redirect URL: <code className="bg-slate-100 px-2 py-1 rounded-xl">/G03_U02_L01_InputDevices</code>
            </p>
            <p className="text-slate-700">
              • Scan the QR code provided by your teacher
            </p>
          </div>
          <div className="mt-8">
            <Link
              to="/admin/login"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg transition-all"
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





