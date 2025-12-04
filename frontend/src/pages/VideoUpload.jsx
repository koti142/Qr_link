import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function VideoUpload() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    course: '',
    grade: '',
    lesson: '',
    module: '',
    activity: '',
    topic: '',
    title: '',
    description: '',
    language: 'en'
  });
  const [file, setFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleThumbnailChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setThumbnailFile(selectedFile);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setThumbnailFile(null);
      setThumbnailPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setUploadProgress(0);

    // All fields are optional, but we need at least a title or some identifier
    if (!file) {
      setError('Please select a video file');
      setLoading(false);
      return;
    }

    try {
      const uploadData = new FormData();
      uploadData.append('video', file);
      // Add thumbnail if provided
      if (thumbnailFile) {
        uploadData.append('thumbnail', thumbnailFile);
      }
      Object.keys(formData).forEach(key => {
        uploadData.append(key, formData[key]);
      });

      const response = await api.post('/videos/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          }
        }
      });

      // Set progress to 100% on success
      setUploadProgress(100);
      
      // Small delay to show 100% before navigating
      setTimeout(() => {
        alert('Video uploaded successfully!');
        navigate('/admin/videos');
      }, 500);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-6 sm:px-8 lg:px-10 py-8">
      <h1 className="text-3xl font-bold mb-8">Upload Video</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-blue-200 p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">
              <strong>Hierarchy:</strong> Courses → Lessons → Modules → Activities
            </p>
            <p className="text-xs text-blue-700 mt-1">All fields are optional. Fill in what applies to your video.</p>
          </div>

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
            placeholder="Optional"
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
            Video File <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleFileChange}
            required
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Thumbnail (Optional)
          </label>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleThumbnailChange}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500">
            Upload a custom thumbnail image. If not provided, a thumbnail will be automatically generated from the video.
          </p>
          {thumbnailPreview && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-2">Preview:</p>
              <div className="relative inline-block">
                <img
                  src={thumbnailPreview}
                  alt="Thumbnail preview"
                  className="w-48 h-32 object-cover rounded-md border border-gray-300"
                />
                {thumbnailFile && (
                  <p className="mt-1 text-xs text-gray-500">
                    {thumbnailFile.name} ({(thumbnailFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Upload Progress Bar */}
        {loading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 font-medium">Uploading video...</span>
              <span className="text-blue-600 font-semibold">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              >
                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 animate-pulse"></div>
              </div>
            </div>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <p className="text-xs text-gray-500">
                Please wait while your video is being uploaded. Do not close this page.
              </p>
            )}
            {uploadProgress === 100 && (
              <p className="text-xs text-green-600 font-medium">
                Upload complete! Processing video...
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-200 text-blue-800 rounded-md hover:bg-blue-300 disabled:opacity-50 font-medium"
          >
            {loading ? 'Uploading...' : 'Upload Video'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default VideoUpload;

