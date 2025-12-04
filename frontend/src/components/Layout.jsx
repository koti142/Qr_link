import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

function Layout() {
  const location = useLocation();
  const isEmbed = new URLSearchParams(location.search).get('embed') === 'true';
  const isAdmin = location.pathname.startsWith('/admin');
  const isLogin = location.pathname === '/admin/login';
  const isStreaming = location.pathname.startsWith('/stream');
  const isVideoView = location.pathname.startsWith('/video/');
  const showSidebar = (isAdmin && !isLogin) || isVideoView;

  if (isEmbed) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-white">
      {!isStreaming && <Navbar />}
      
      {showSidebar && <Sidebar />}
      
      <main className={showSidebar ? 'pt-16 ml-64' : isStreaming ? '' : 'pt-16'}>
        <Outlet />
      </main>

      {!isAdmin && (
        <footer className="bg-white border-t border-blue-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <p className="text-center text-gray-500">
              © 2024 Video Delivery System
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}

export default Layout;

