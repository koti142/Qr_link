import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Video, 
  Upload, 
  FileVideo, 
  Link as LinkIcon, 
  TrendingUp, 
  Clock, 
  HardDrive,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import api from '../services/api';

/**
 * Advanced Admin Dashboard
 * 
 * Features:
 * - Comprehensive statistics cards
 * - Recently uploaded videos section
 * - Analytics and trends
 * - Quick actions
 * - Professional UI with charts
 */
function AdminDashboard() {
  const [stats, setStats] = useState({
    totalVideos: 0,
    activeVideos: 0,
    inactiveVideos: 0,
    totalSize: 0,
    totalDuration: 0,
    videosWithCaptions: 0,
    videosWithThumbnails: 0
  });
  const [recentVideos, setRecentVideos] = useState([]);
  const [videosByCourse, setVideosByCourse] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/videos');
      const videos = response.data || [];

      // Calculate statistics
      const activeVideos = videos.filter(v => v.status === 'active');
      const inactiveVideos = videos.filter(v => v.status === 'inactive');
      const totalSize = videos.reduce((sum, v) => sum + (v.size || 0), 0);
      const totalDuration = videos.reduce((sum, v) => sum + (v.duration || 0), 0);
      const videosWithCaptions = videos.filter(v => v.captions && v.captions.length > 0).length;
      const videosWithThumbnails = videos.filter(v => v.thumbnail_url).length;

      // Group videos by course
      const byCourse = {};
      videos.forEach(video => {
        const course = video.course || 'Uncategorized';
        byCourse[course] = (byCourse[course] || 0) + 1;
      });

      // Get recently uploaded videos (last 5, sorted by created_at)
      const recent = [...videos]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

      setStats({
        totalVideos: videos.length,
        activeVideos: activeVideos.length,
        inactiveVideos: inactiveVideos.length,
        totalSize,
        totalDuration,
        videosWithCaptions,
        videosWithThumbnails
      });

      setRecentVideos(recent);
      setVideosByCourse(byCourse);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Format file size
  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return '0 min';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} min`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Calculate growth percentage (mock for now)
  const calculateGrowth = (current, previous = 0) => {
    if (previous === 0) return { value: 100, isPositive: true };
    const growth = ((current - previous) / previous) * 100;
    return { value: Math.abs(growth), isPositive: growth >= 0 };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const totalGrowth = calculateGrowth(stats.totalVideos, Math.max(0, stats.totalVideos - 1));
  const activeGrowth = calculateGrowth(stats.activeVideos, Math.max(0, stats.activeVideos - 1));

  return (
    <div className="w-full min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-600 mt-1">Welcome back! Here's what's happening with your videos.</p>
          </div>
          <Link
            to="/admin/upload"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Upload size={18} />
            <span>Upload Video</span>
          </Link>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Videos Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Video className="w-6 h-6 text-blue-600" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${totalGrowth.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {totalGrowth.isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                <span>{totalGrowth.value.toFixed(1)}%</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">Total Videos</h3>
            <p className="text-3xl font-bold text-slate-900">{stats.totalVideos}</p>
            <p className="text-xs text-slate-500 mt-2">All videos in system</p>
          </div>

          {/* Active Videos Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${activeGrowth.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {activeGrowth.isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                <span>{activeGrowth.value.toFixed(1)}%</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">Active Videos</h3>
            <p className="text-3xl font-bold text-slate-900">{stats.activeVideos}</p>
            <p className="text-xs text-slate-500 mt-2">Currently available</p>
          </div>

          {/* Total Storage Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <HardDrive className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">Total Storage</h3>
            <p className="text-3xl font-bold text-slate-900">{formatSize(stats.totalSize)}</p>
            <p className="text-xs text-slate-500 mt-2">Storage used</p>
          </div>

          {/* Total Duration Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">Total Duration</h3>
            <p className="text-3xl font-bold text-slate-900">{formatDuration(stats.totalDuration)}</p>
            <p className="text-xs text-slate-500 mt-2">Combined video length</p>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <FileVideo className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Videos with Captions</p>
                <p className="text-2xl font-bold text-slate-900">{stats.videosWithCaptions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 rounded-lg">
                <Eye className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Videos with Thumbnails</p>
                <p className="text-2xl font-bold text-slate-900">{stats.videosWithThumbnails}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Inactive Videos</p>
                <p className="text-2xl font-bold text-slate-900">{stats.inactiveVideos}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recently Uploaded Videos */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-slate-600" />
                  <h2 className="text-lg font-semibold text-slate-900">Recently Uploaded Videos</h2>
                </div>
                <Link
                  to="/admin/videos"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="p-6">
              {recentVideos.length === 0 ? (
                <div className="text-center py-12">
                  <Video className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No videos uploaded yet</p>
                  <Link
                    to="/admin/upload"
                    className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Upload your first video
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentVideos.map((video) => (
                    <Link
                      key={video.id}
                      to={`/stream/${video.video_id}`}
                      target="_blank"
                      className="flex items-center gap-4 p-4 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"
                    >
                      {/* Thumbnail */}
                      <div className="flex-shrink-0">
                        {video.thumbnail_url ? (
                          <img
                            src={(() => {
                              // Get backend base URL
                              const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
                              // Ensure thumbnail_url starts with /
                              const thumbnailPath = video.thumbnail_url.startsWith('/') 
                                ? video.thumbnail_url 
                                : `/${video.thumbnail_url}`;
                              return `${backendUrl}${thumbnailPath}`;
                            })()}
                            alt={video.title}
                            className="w-20 h-14 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const placeholder = e.target.nextSibling;
                              if (placeholder) {
                                placeholder.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-20 h-14 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center ${video.thumbnail_url ? 'hidden' : 'flex'}`}
                        >
                          <Video className="w-8 h-8 text-blue-300" />
                        </div>
                      </div>

                      {/* Video Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">{video.title || 'Untitled Video'}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(video.created_at)}
                          </span>
                          {video.size && (
                            <span>{formatSize(video.size)}</span>
                          )}
                          {video.duration > 0 && (
                            <span>{formatDuration(video.duration)}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {video.course && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                              {video.course}
                            </span>
                          )}
                          {video.grade && (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                              {video.grade}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-1 rounded ${
                            video.status === 'active' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {video.status}
                          </span>
                        </div>
                      </div>

                      {/* Status Icon */}
                      <div className="flex-shrink-0">
                        {video.status === 'active' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Analytics & Quick Actions */}
          <div className="space-y-6">
            {/* Videos by Course */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-slate-600" />
                  <h2 className="text-lg font-semibold text-slate-900">Videos by Course</h2>
                </div>
              </div>
              <div className="p-6">
                {Object.keys(videosByCourse).length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No course data available</p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(videosByCourse)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([course, count]) => (
                        <div key={course}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700">{course}</span>
                            <span className="text-sm font-bold text-slate-900">{count}</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${(count / stats.totalVideos) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
              </div>
              <div className="p-6 space-y-3">
                <Link
                  to="/admin/upload"
                  className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors group"
                >
                  <div className="p-2 bg-blue-600 rounded-lg group-hover:bg-blue-700 transition-colors">
                    <Upload className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">Upload Video</p>
                    <p className="text-sm text-slate-600">Add a new video to the system</p>
                  </div>
                </Link>

                <Link
                  to="/admin/videos"
                  className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group"
                >
                  <div className="p-2 bg-slate-600 rounded-lg group-hover:bg-slate-700 transition-colors">
                    <FileVideo className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">Manage Videos</p>
                    <p className="text-sm text-slate-600">View and edit all videos</p>
                  </div>
                </Link>

                <Link
                  to="/admin/redirects"
                  className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group"
                >
                  <div className="p-2 bg-slate-600 rounded-lg group-hover:bg-slate-700 transition-colors">
                    <LinkIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">Redirect Links</p>
                    <p className="text-sm text-slate-600">Manage redirect URLs and QR codes</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">System Status</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Storage Usage</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {((stats.totalSize / (1024 * 1024 * 1024 * 10)) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min((stats.totalSize / (1024 * 1024 * 1024 * 10)) * 100, 100)}%` }}
                  />
                </div>
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-slate-600">All systems operational</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
