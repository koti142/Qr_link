import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Edit, Trash2, ExternalLink, Eye, Calendar, Search, Upload, MessageCircle } from 'lucide-react';
import api from '../services/api';

function VideoList() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState({
    courses: [],
    grades: [],
    lessons: [],
    modules: [],
    activities: []
  });
  const [filters, setFilters] = useState({
    search: '',
    course: '',
    grade: '',
    lesson: '',
    module: '',
    activity: '',
    status: 'active'
  });

  useEffect(() => {
    fetchFilterOptions();
    fetchVideos();
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [filters]);

  const fetchFilterOptions = async () => {
    try {
      const response = await api.get('/videos/filters');
      setFilterOptions(response.data);
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
    }
  };

  const fetchVideos = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.course) params.append('course', filters.course);
      if (filters.grade) params.append('grade', filters.grade);
      if (filters.lesson) params.append('lesson', filters.lesson);
      if (filters.module) params.append('module', filters.module);
      if (filters.activity) params.append('activity', filters.activity);
      if (filters.status) params.append('status', filters.status);

      const response = await api.get(`/videos?${params.toString()}`);
      setVideos(response.data);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      await api.delete(`/videos/${id}`);
      fetchVideos();
    } catch (error) {
      alert('Failed to delete video');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Video List</h1>
              <p className="text-slate-600 text-lg">Manage and view all your videos</p>
            </div>
            <Link
              to="/admin/upload"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-lg"
            >
              <Upload className="w-5 h-5" />
              Upload New Video
            </Link>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Search className="w-5 h-5 text-slate-600" />
          Filters
        </h2>
        
        {/* Search Bar */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search by title, description, or video ID..."
              className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Course
            </label>
            <select
              value={filters.course || ''}
              onChange={(e) => setFilters({ ...filters, course: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white cursor-pointer"
            >
              <option value="">All Courses</option>
              {filterOptions.courses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Grade
            </label>
            <select
              value={filters.grade || ''}
              onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white cursor-pointer"
            >
              <option value="">All Grades</option>
              {filterOptions.grades.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Lesson
            </label>
            <select
              value={filters.lesson || ''}
              onChange={(e) => setFilters({ ...filters, lesson: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white cursor-pointer"
            >
              <option value="">All Lessons</option>
              {filterOptions.lessons.map((lesson) => (
                <option key={lesson} value={lesson}>
                  {lesson}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Module
            </label>
            <select
              value={filters.module || ''}
              onChange={(e) => setFilters({ ...filters, module: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white cursor-pointer"
            >
              <option value="">All Modules</option>
              {filterOptions.modules.map((module) => (
                <option key={module} value={module}>
                  {module}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Activity
            </label>
            <select
              value={filters.activity || ''}
              onChange={(e) => setFilters({ ...filters, activity: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white cursor-pointer"
            >
              <option value="">All Activities</option>
              {filterOptions.activities.map((activity) => (
                <option key={activity} value={activity}>
                  {activity}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Status
            </label>
            <select
              value={filters.status || 'active'}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white cursor-pointer"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        {/* Clear Filters Button */}
        {(filters.search || filters.course || filters.grade || filters.lesson || filters.module || filters.activity || filters.status !== 'active') && (
          <div className="mt-6">
            <button
              onClick={() => setFilters({
                search: '',
                course: '',
                grade: '',
                lesson: '',
                module: '',
                activity: '',
                status: 'active'
              })}
              className="px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {videos.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
          <p className="text-slate-500 text-lg font-semibold">No videos found</p>
          <p className="text-slate-400 text-sm mt-2">Try adjusting your filters or upload a new video</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video) => {
            const formatDate = (dateString) => {
              if (!dateString) return 'Recently';
              const date = new Date(dateString);
              const now = new Date();
              const diffTime = Math.abs(now - date);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays === 0) return 'Today';
              if (diffDays === 1) return '1 day ago';
              if (diffDays < 7) return `${diffDays} days ago`;
              if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
              if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
              return `${Math.ceil(diffDays / 365)} years ago`;
            };

            const formatSize = (bytes) => {
              if (!bytes) return '0 MB';
              return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
            };

            // Get thumbnail URL - use video thumbnail or try to fetch by videoId
            const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
            
            // Function to build thumbnail URL
            const buildThumbnailUrl = (pathOrUrl, videoId) => {
              // If we have a thumbnail_url from database
              if (pathOrUrl && pathOrUrl.trim() !== '') {
                let thumbnailPath = pathOrUrl.trim();
                
                // If it's already a full URL, return it
                if (thumbnailPath.startsWith('http://') || thumbnailPath.startsWith('https://')) {
                  return thumbnailPath;
                }
                
                // If it doesn't start with /, add it
                if (!thumbnailPath.startsWith('/')) {
                  thumbnailPath = `/${thumbnailPath}`;
                }
                
                // Ensure it starts with /thumbnails/
                if (!thumbnailPath.toLowerCase().startsWith('/thumbnails/')) {
                  // If it's just a filename, add /thumbnails/ prefix
                  if (!thumbnailPath.includes('/')) {
                    thumbnailPath = `/thumbnails/${thumbnailPath}`;
                  } else {
                    // Extract filename and add /thumbnails/ prefix
                    const filename = thumbnailPath.split('/').pop();
                    thumbnailPath = `/thumbnails/${filename}`;
                  }
                }
                
                return `${backendUrl}${thumbnailPath}`;
              }
              
              // If no thumbnail_url, try common thumbnail paths by videoId
              if (videoId) {
                // Try different extensions - start with .jpg as it's most common
                const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
                // Return the first one - the image will load if it exists, otherwise show placeholder
                return `${backendUrl}/thumbnails/${videoId}${extensions[0]}`;
              }
              
              // Fallback to null (will show placeholder)
              return null;
            };
            
            // Get thumbnail URL - prioritize database thumbnail_url, then try by videoId
            let thumbnailUrl = buildThumbnailUrl(video.thumbnail_url, video.video_id);
            
            // If no thumbnail_url in database, try to construct from videoId
            if (!thumbnailUrl && video.video_id) {
              thumbnailUrl = `${backendUrl}/thumbnails/${video.video_id}.jpg`;
            }

            return (
              <div
                key={video.id}
                className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 group"
              >
                {/* Thumbnail Section */}
                <div className="relative w-full aspect-video bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        // Try alternative extensions if first one fails
                        const currentSrc = e.target.src;
                        const videoId = video.video_id;
                        const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
                        const currentExt = extensions.find(ext => currentSrc.includes(ext)) || extensions[0];
                        const currentIndex = extensions.indexOf(currentExt);
                        
                        if (currentIndex < extensions.length - 1) {
                          // Try next extension
                          const nextExt = extensions[currentIndex + 1];
                          e.target.src = `${backendUrl}/thumbnails/${videoId}${nextExt}`;
                        } else {
                          // All extensions failed, show placeholder
                          e.target.style.display = 'none';
                          const placeholder = e.target.parentElement.querySelector('.thumbnail-placeholder');
                          if (placeholder) {
                            placeholder.classList.remove('hidden');
                            placeholder.classList.add('flex');
                          }
                        }
                      }}
                      onLoad={() => {
                        // Hide placeholder when image loads successfully
                        const placeholder = e.target.parentElement.querySelector('.thumbnail-placeholder');
                        if (placeholder) {
                          placeholder.classList.add('hidden');
                          placeholder.classList.remove('flex');
                        }
                      }}
                    />
                  ) : null}
                  
                  {/* Placeholder with Large Play Icon */}
                  <div className={`thumbnail-placeholder w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 ${thumbnailUrl ? 'hidden' : 'flex'}`}>
                    <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                      <Play className="w-12 h-12 text-blue-500 ml-1" fill="currentColor" />
                    </div>
                    <p className="text-sm text-blue-500 font-medium">No Thumbnail</p>
                  </div>

                  {/* Play Button Overlay (only on hover) */}
                  <Link
                    to={`/stream/${video.video_id}`}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-xl backdrop-blur-sm">
                      <Play className="w-8 h-8 text-blue-600 ml-1" fill="currentColor" />
                    </div>
                  </Link>

                  {/* Status Badge */}
                  {video.status === 'active' && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 text-xs rounded-full font-semibold bg-green-500 text-white shadow-md">
                        active
                      </span>
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-5 bg-white">
                  {/* Title */}
                  <h3 className="text-base font-bold text-slate-900 mb-2 line-clamp-2 min-h-[2.5rem]">
                    {video.title || 'Untitled Video'}
                  </h3>

                  {/* Category */}
                  <p className="text-sm text-slate-500 mb-3">
                    {video.course || 'Video Course'}
                  </p>

                  {/* File Size and Date */}
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                    <span className="font-medium">{formatSize(video.size)}</span>
                    <span>•</span>
                    <span>{formatDate(video.created_at)}</span>
                  </div>

                  {/* Engagement Metrics */}
                  <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Eye className="w-4 h-4" />
                      <span>0</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4" />
                      <span>0</span>
                    </div>
                  </div>

                  {/* Tags/Pills */}
                  {(video.grade || video.lesson || video.module || video.activity) && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {video.grade && (
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {video.grade}
                        </span>
                      )}
                      {video.lesson && (
                        <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          {video.lesson}
                        </span>
                      )}
                      {video.module && (
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                          {video.module}
                        </span>
                      )}
                      {video.activity && (
                        <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                          {video.activity}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
                    <Link
                      to={`/video/${video.video_id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Link>
                    <Link
                      to={`/stream/${video.video_id}`}
                      target="_blank"
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 rounded-xl text-sm font-semibold hover:bg-green-100 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Play className="w-4 h-4" />
                      Stream
                    </Link>
                    <Link
                      to={`/admin/videos/${video.id}/edit`}
                      className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(video.id);
                      }}
                      className="px-3 py-2 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}

export default VideoList;

