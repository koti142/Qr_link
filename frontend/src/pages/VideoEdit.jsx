import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

function VideoEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    language: 'en',
    status: 'active',
    course: '',
    grade: '',
    lesson: '',
    module: '',
    activity: '',
    topic: '',
    streaming_url: '',
    file_path: ''
  });

  useEffect(() => {
    fetchVideo();
  }, [id]);

  const fetchVideo = async () => {
    try {
      const response = await api.get(`/videos`);
      const videos = response.data;
      const foundVideo = videos.find(v => v.id === parseInt(id));
      
      if (foundVideo) {
        setVideo(foundVideo);
        setFormData({
          title: foundVideo.title || '',
          description: foundVideo.description || '',
          language: foundVideo.language || 'en',
          status: foundVideo.status || 'active',
          course: foundVideo.course || '',
          grade: foundVideo.grade || '',
          lesson: foundVideo.lesson || '',
          module: foundVideo.module || '',
          activity: foundVideo.activity || '',
          topic: foundVideo.topic || '',
          streaming_url: foundVideo.streaming_url || '',
          file_path: foundVideo.file_path || ''
        });
      } else {
        setError('Video not found');
      }
    } catch (err) {
      setError('Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await api.put(`/videos/${id}`, formData);
      alert('Video updated successfully!');
      navigate('/admin/videos');
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !video) {
    return (
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-10 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-10 py-8">
      <h1 className="text-3xl font-bold mb-8">Edit Video</h1>

      {video && (
        <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-6 mb-6">
          <p className="text-sm text-gray-600 mb-2">Video ID</p>
          <p className="font-mono text-lg">{video.video_id}</p>
          {(video.course || video.grade || video.lesson || video.module || video.activity) && (
            <p className="text-sm text-gray-600 mt-4 mb-2">Hierarchy</p>
          )}
          <p className="text-sm">
            {video.course && `Course: ${video.course}`}
            {video.course && video.grade && ' • '}
            {video.grade && `Grade: ${video.grade}`}
            {video.grade && video.lesson && ' • '}
            {video.lesson && `Lesson: ${video.lesson}`}
            {video.lesson && video.module && ' • '}
            {video.module && `Module: ${video.module}`}
            {video.module && video.activity && ' • '}
            {video.activity && `Activity: ${video.activity}`}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-blue-200 p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course
            </label>
            <input
              type="text"
              name="course"
              value={formData.course}
              onChange={handleChange}
              placeholder="e.g., Course 1 or Course Name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grade
            </label>
            <input
              type="text"
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              placeholder="e.g., Grade 3 or Grade Name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lesson
            </label>
            <input
              type="text"
              name="lesson"
              value={formData.lesson}
              onChange={handleChange}
              placeholder="e.g., Lesson 1 or Lesson Name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Module
            </label>
            <input
              type="text"
              name="module"
              value={formData.module}
              onChange={handleChange}
              placeholder="e.g., Module 1 or Module Name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Activity
            </label>
            <input
              type="text"
              name="activity"
              value={formData.activity}
              onChange={handleChange}
              placeholder="e.g., Activity 1 or Activity Name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic
            </label>
            <input
              type="text"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              placeholder="Optional"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            rows="4"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <select
            name="language"
            value={formData.language}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="en">English</option>
            <option value="ar">Arabic</option>
            <option value="fr">French</option>
            <option value="es">Spanish</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>

        <div className="border-t border-gray-200 pt-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Video Source</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cloudflare/Streaming URL
            </label>
            <input
              type="url"
              name="streaming_url"
              value={formData.streaming_url}
              onChange={handleChange}
              placeholder="https://your-account.r2.cloudflarestorage.com/path/to/video.mp4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter a valid Cloudflare R2 URL or other streaming URL. Leave empty to use local file.
            </p>
            {formData.streaming_url && (
              formData.streaming_url.includes('your-account.r2.cloudflarestorage.com') ||
              formData.streaming_url.includes('mock-cloudflare') ||
              formData.streaming_url.includes('example.com')
            ) && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                ⚠️ Warning: This appears to be a test/mock URL. Please update with a real Cloudflare URL.
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Local File Path
            </label>
            <input
              type="text"
              name="file_path"
              value={formData.file_path}
              onChange={handleChange}
              placeholder="e.g., misc/video.mp4 or relative path"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter a local file path relative to the video-storage directory. Leave empty if using Cloudflare URL only.
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin/videos')}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-200 text-blue-800 rounded-md hover:bg-blue-300 disabled:opacity-50 font-medium"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default VideoEdit;

