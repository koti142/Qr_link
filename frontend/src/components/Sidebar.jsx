import { Link, useLocation } from 'react-router-dom';

function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-white min-h-screen fixed left-0 top-16 z-40 border-r border-blue-200 shadow-sm overflow-y-auto">
      <div className="p-4">
        <nav className="space-y-2">
          {/* 1. Dashboard */}
          <Link
            to="/admin"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              location.pathname === '/admin' 
                ? 'bg-blue-100 text-blue-800 shadow-sm' 
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </Link>

          {/* 2. Upload view */}
          <Link
            to="/admin/upload"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              location.pathname === '/admin/upload' 
                ? 'bg-blue-100 text-blue-800 shadow-sm' 
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload view
          </Link>

          {/* 3. Cloudflare resource */}
          <Link
            to="/admin/cloudflare"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              location.pathname === '/admin/cloudflare' 
                ? 'bg-blue-100 text-blue-800 shadow-sm' 
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
            Cloudflare resource
          </Link>

          {/* 4. Bulk upload */}
          <Link
            to="/admin/bulk-upload"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              location.pathname === '/admin/bulk-upload' 
                ? 'bg-blue-100 text-blue-800 shadow-sm' 
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Bulk upload
          </Link>

          {/* 5. Videos */}
          <Link
            to="/admin/videos"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              location.pathname.startsWith('/admin/videos') 
                ? 'bg-blue-100 text-blue-800 shadow-sm' 
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Videos
          </Link>

          {/* 6. QR storage */}
          <Link
            to="/admin/qr-codes"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              location.pathname === '/admin/qr-codes' 
                ? 'bg-blue-100 text-blue-800 shadow-sm' 
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            QR storage
          </Link>

          {/* 7. Redirect */}
          <Link
            to="/admin/redirects"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              location.pathname === '/admin/redirects' 
                ? 'bg-blue-100 text-blue-800 shadow-sm' 
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Redirect
          </Link>

          {/* 8. User management */}
          <Link
            to="/admin/users"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              location.pathname === '/admin/users' 
                ? 'bg-blue-100 text-blue-800 shadow-sm' 
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            User management
          </Link>
        </nav>
      </div>
    </aside>
  );
}

export default Sidebar;

