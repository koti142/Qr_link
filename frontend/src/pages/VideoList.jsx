import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Edit, Trash2, ExternalLink, Eye, Calendar } from 'lucide-react';
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 sm:px-8 lg:px-10 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Video List</h1>
        <Link
          to="/admin/upload"
          className="px-4 py-2 bg-blue-200 text-blue-800 rounded-md hover:bg-blue-300 font-medium"
        >
          Upload New Video
        </Link>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course
            </label>
            <input
              type="text"
              value={filters.course || ''}
              onChange={(e) => setFilters({ ...filters, course: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Filter by course"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grade
            </label>
            <input
              type="text"
              value={filters.grade || ''}
              onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Filter by grade"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lesson
            </label>
            <input
              type="text"
              value={filters.lesson || ''}
              onChange={(e) => setFilters({ ...filters, lesson: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Filter by lesson"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Module
            </label>
            <input
              type="text"
              value={filters.module || ''}
              onChange={(e) => setFilters({ ...filters, module: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Filter by module"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status || 'active'}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white cursor-pointer"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        {/* Activity Filter - Optional, can be shown in a second row if needed */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Activity
          </label>
          <input
            type="text"
            value={filters.activity || ''}
            onChange={(e) => setFilters({ ...filters, activity: e.target.value })}
            className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Filter by activity"
          />
        </div>
        {/* Clear Filters Button */}
        {(filters.course || filters.grade || filters.lesson || filters.module || filters.activity || filters.status !== 'active') && (
          <div className="mt-4">
            <button
              onClick={() => setFilters({
                course: '',
                grade: '',
                lesson: '',
                module: '',
                activity: '',
                status: 'active'
              })}
              className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {videos.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-12 text-center">
          <p className="text-gray-500 text-lg">No videos found</p>
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

            const thumbnailUrl = video.thumbnail_url ? (() => {
              const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
              const thumbnailPath = video.thumbnail_url.startsWith('/') 
                ? video.thumbnail_url 
                : `/${video.thumbnail_url}`;
              return `${backendUrl}${thumbnailPath}`;
            })() : null;

            return (
              <div
                key={video.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer"
              >
                {/* Thumbnail with Overlay */}
                <div className="relative w-full aspect-video bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const placeholder = e.target.parentElement.querySelector('.thumbnail-placeholder');
                        if (placeholder) {
                          placeholder.classList.remove('hidden');
                          placeholder.classList.add('flex');
                        }
                      }}
                    />
                  ) : null}
                  
                  {/* Placeholder */}
                  <div className={`thumbnail-placeholder w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 ${thumbnailUrl ? 'hidden' : 'flex'}`}>
                    <svg className="w-20 h-20 text-blue-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs text-blue-400 font-medium">No Thumbnail</p>
                  </div>

                  {/* Gradient Overlay for Title */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

                  {/* Play Button Overlay */}
                  <Link
                    to={`/stream/${video.video_id}`}
                    className="absolute inset-0 flex items-center justify-center group/play"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg group-hover/play:scale-110 transition-transform duration-300">
                      <Play className="w-8 h-8 text-blue-600 ml-1" fill="currentColor" />
                    </div>
                  </Link>

                  {/* Title Overlaid on Image */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-bold text-xl mb-1 drop-shadow-lg line-clamp-2">
                      {video.title || 'Untitled Video'}
                    </h3>
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 text-xs rounded-full font-semibold shadow-md ${
                      video.status === 'active' ? 'bg-green-500 text-white' :
                      video.status === 'inactive' ? 'bg-yellow-500 text-white' :
                      'bg-red-500 text-white'
                    }`}>
                      {video.status}
                    </span>
                  </div>
                </div>

                {/* Metadata Section */}
                <div className="p-4 bg-white">
                  {/* Author/Course Info */}
                  <div className="mb-2">
                    <p className="text-sm text-gray-500">
                      {video.course || 'Video Course'}
                    </p>
                  </div>

                  {/* Views and Date */}
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{formatSize(video.size)}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(video.created_at)}</span>
                    </div>
                  </div>

                  {/* Course Details (Collapsible) */}
                  {(video.grade || video.lesson || video.module || video.activity) && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                        {video.grade && (
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
                            {video.grade}
                          </span>
                        )}
                        {video.lesson && (
                          <span className="px-2 py-1 bg-green-50 text-green-700 rounded-md">
                            {video.lesson}
                          </span>
                        )}
                        {video.module && (
                          <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md">
                            {video.module}
                          </span>
                        )}
                        {video.activity && (
                          <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded-md">
                            {video.activity}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-gray-200 flex gap-2">
                    <Link
                      to={`/stream/${video.video_id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Play className="w-4 h-4" />
                      Stream
                    </Link>
                    <Link
                      to={`/admin/videos/${video.id}/edit`}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(video.id);
                      }}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
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
  );
}

export default VideoList;

