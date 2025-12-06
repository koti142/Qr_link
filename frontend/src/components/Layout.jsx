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
  // Check if it's a short URL route (not starting with /admin, /video, /stream, etc.)
  // Check if it's a short URL route (single segment path that's not a known route)
  // Short URLs are like /7ipakfbaky (single segment, not starting with /admin, /video, /stream, etc.)
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const isShortUrl = pathSegments.length === 1 && 
                     !isAdmin && 
                     !isStreaming && 
                     !isVideoView && 
                     location.pathname !== '/' && 
                     !location.pathname.startsWith('/diagnostic') &&
                     location.pathname !== '/admin';
  const showSidebar = (isAdmin && !isLogin) || isVideoView;

  if (isEmbed) {
    return <Outlet />;
  }

  // For short URL routes, don't show navbar or sidebar
  if (isShortUrl) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-white">
      {!isStreaming && <Navbar />}
      
      {showSidebar && <Sidebar />}
      
      <main className={showSidebar ? 'pt-16 ml-64' : isStreaming ? '' : 'pt-16'}>
        <Outlet />
      </main>

      
    </div>
  );
}

export default Layout;

