import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, FileVideo, X, AlertCircle, Save, ArrowLeft, RefreshCw, CheckCircle2, Info, FileText, Link2, QrCode, Video as VideoIcon } from 'lucide-react';
import api from '../services/api';

function VideoEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newVideoFile, setNewVideoFile] = useState(null);
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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        setError('Please select a valid video file');
        return;
      }
      setNewVideoFile(file);
      setError('');
      setSuccess('');
    }
  };

  const handleRemoveFile = () => {
    setNewVideoFile(null);
    const fileInput = document.getElementById('video-file-input');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // If new video file is selected, replace the video first
      if (newVideoFile) {
        setUploadingVideo(true);
        const replaceFormData = new FormData();
        replaceFormData.append('video', newVideoFile);

        try {
          const replaceResponse = await api.post(`/videos/${id}/replace-video`, replaceFormData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          if (replaceResponse.data.success) {
            setSuccess('Video file replaced successfully!');
            // Show popup and then redirect to videos page
            alert('Video file replaced successfully!');
            navigate('/admin/videos');
            return;
          }
        } catch (replaceErr) {
          setError(replaceErr.response?.data?.error || 'Failed to replace video file');
          setUploadingVideo(false);
          setSaving(false);
          return;
        }
      }

      // Update video metadata
      const updateData = { ...formData };
      delete updateData.streaming_url;
      delete updateData.file_path;

      await api.put(`/videos/${id}`, updateData);
      setSuccess('Video updated successfully!');
      // Show popup and then redirect to videos page
      alert('Video updated successfully!');
      navigate('/admin/videos');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update video');
    } finally {
      setSaving(false);
      setUploadingVideo(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 MB';
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading video details...</p>
        </div>
      </div>
    );
  }

  if (error && !video) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-red-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/admin/videos')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Back to Videos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 w-full overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full h-full p-4 sm:p-6 lg:p-8 xl:p-10">
        {/* Header Section */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/videos')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-all duration-200 font-medium group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Videos</span>
          </button>
          <div className="flex items-center gap-5 mb-2">
            <div className="p-4 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl shadow-xl shadow-blue-500/20">
              <VideoIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                Edit Video
              </h1>
              <p className="text-slate-600 text-base sm:text-lg" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                Update video information and replace video file
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-xl shadow-md animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
              <p className="text-green-800 font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-5 bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 rounded-xl shadow-md animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column - Form Fields */}
            <div className="lg:col-span-2 space-y-6 lg:space-y-8">
              {/* Basic Information Card */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-6 sm:p-8 lg:p-10 hover:shadow-2xl transition-shadow duration-300">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200">
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl shadow-sm">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Basic Information</h2>
                    <p className="text-sm text-slate-500 mt-1">Update the core video details</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3.5 text-[15px] border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-slate-300"
                      placeholder="Enter video title"
                      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={5}
                      className="w-full px-4 py-3.5 text-[15px] border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none bg-white hover:border-slate-300"
                      placeholder="Enter video description"
                      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                        Language
                      </label>
                      <select
                        name="language"
                        value={formData.language}
                        onChange={handleChange}
                        className="w-full px-4 py-3.5 text-[15px] border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white cursor-pointer hover:border-slate-300"
                        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                      >
                        <option value="en">English</option>
                        <option value="ar">Arabic</option>
                        <option value="fr">French</option>
                        <option value="es">Spanish</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-4 py-3.5 text-[15px] border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white cursor-pointer hover:border-slate-300"
                        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Information Card */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-6 sm:p-8 lg:p-10 hover:shadow-2xl transition-shadow duration-300">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200">
                  <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl shadow-sm">
                    <Info className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Course Information</h2>
                    <p className="text-sm text-slate-500 mt-1">Organize video by course structure</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2.5">Course</label>
                    <input
                      type="text"
                      name="course"
                      value={formData.course}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 text-[15px] border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-slate-300"
                      placeholder="Course name"
                      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2.5">Grade</label>
                    <input
                      type="text"
                      name="grade"
                      value={formData.grade}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 text-[15px] border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-slate-300"
                      placeholder="Grade"
                      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2.5">Lesson</label>
                    <input
                      type="text"
                      name="lesson"
                      value={formData.lesson}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 text-[15px] border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-slate-300"
                      placeholder="Lesson"
                      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2.5">Module</label>
                    <input
                      type="text"
                      name="module"
                      value={formData.module}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 text-[15px] border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-slate-300"
                      placeholder="Module"
                      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2.5">Activity</label>
                    <input
                      type="text"
                      name="activity"
                      value={formData.activity}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 text-[15px] border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-slate-300"
                      placeholder="Activity"
                      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2.5">Topic</label>
                    <input
                      type="text"
                      name="topic"
                      value={formData.topic}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 text-[15px] border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-slate-300"
                      placeholder="Topic"
                      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Video Replacement & Info */}
            <div className="space-y-6 lg:space-y-8">
              {/* Video Replacement Card */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-6 sm:p-8 hover:shadow-2xl transition-shadow duration-300">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-200">
                  <div className="p-3 bg-gradient-to-br from-green-100 to-green-50 rounded-xl shadow-sm">
                    <Upload className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Replace Video</h2>
                    <p className="text-sm text-slate-500 mt-1">Upload a new video file</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800">
                        Upload a new video file to replace the current one. The link and QR code will remain the same.
                      </p>
                    </div>
                  </div>

                  {!newVideoFile ? (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FileVideo className="w-12 h-12 text-slate-400 group-hover:text-blue-500 mb-3 transition-colors" />
                        <p className="mb-2 text-sm font-medium text-slate-700" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                          <span className="text-blue-600">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-slate-500" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                          MP4, WebM, MOV (MAX. 5GB)
                        </p>
                      </div>
                      <input
                        id="video-file-input"
                        type="file"
                        accept="video/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileVideo className="w-8 h-8 text-green-600" />
                          <div>
                            <p className="font-semibold text-slate-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                              {newVideoFile.name}
                            </p>
                            <p className="text-sm text-slate-600" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                              {formatFileSize(newVideoFile.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-xl transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Video Information Card */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-6 sm:p-8 hover:shadow-2xl transition-shadow duration-300">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-200">
                  <div className="p-3 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-xl shadow-sm">
                    <Info className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Video Information</h2>
                    <p className="text-sm text-slate-500 mt-1">Current video details</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                      File Path
                    </label>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-700 font-mono break-all" style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace' }}>
                        {formData.file_path || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                      Streaming URL
                    </label>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <Link2 className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-700 break-all" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                        {formData.streaming_url || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {video?.qr_url && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                        QR Code
                      </label>
                      <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <QrCode className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-700 break-all" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                          {video.qr_url}
                        </span>
                      </div>
                    </div>
                  )}

                  {video?.size && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                        File Size
                      </label>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className="text-sm text-slate-700 font-medium" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                          {formatFileSize(video.size)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-4 pt-8 mt-8 border-t-2 border-slate-200">
            <button
              type="button"
              onClick={() => navigate('/admin/videos')}
              className="px-6 py-3.5 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all font-semibold"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploadingVideo}
              className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
            >
              {saving || uploadingVideo ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  {uploadingVideo ? 'Uploading...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VideoEdit;
