import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Video, Image, XCircle, CheckCircle, Info, FileVideo, FileImage } from 'lucide-react';
import api from '../services/api';

function VideoUpload() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    grade: '',
    lesson: '',
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
  const [dragActive, setDragActive] = useState(false);
  const [thumbnailDragActive, setThumbnailDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (file) => {
    if (file) {
      setFile(file);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleThumbnailChange = (file) => {
    if (file) {
      setThumbnailFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setThumbnailFile(null);
      setThumbnailPreview(null);
    }
  };

  const handleThumbnailInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleThumbnailChange(e.target.files[0]);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith('video/')) {
        handleFileChange(droppedFile);
      }
    }
  };

  const handleThumbnailDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setThumbnailDragActive(true);
    } else if (e.type === 'dragleave') {
      setThumbnailDragActive(false);
    }
  };

  const handleThumbnailDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setThumbnailDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith('image/')) {
        handleThumbnailChange(droppedFile);
      }
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
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 w-full overflow-y-auto">
      <div className="w-full h-full p-6 lg:p-8">
        {/* Header with soft gradient */}
        <div className="mb-6">
          <div className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            <h1 className="text-3xl font-bold mb-2">Upload Video</h1>
          </div>
          <p className="text-slate-600 text-base">Add a new video to your library</p>
        </div>

        {/* Full-width white card with rounded corners and smooth shadow */}
        <form onSubmit={handleSubmit} className="bg-white rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.05)] border border-[#D9DCE3] p-6 sm:p-8 lg:p-10 space-y-6 w-full max-h-[calc(100vh-12rem)] overflow-y-auto">
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 text-red-700 px-5 py-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-base">Upload Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Hierarchy block with light blue gradient, soft border, and icon */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200/60 rounded-xl p-5 flex items-start gap-3 shadow-sm">
          <div className="flex-shrink-0 mt-0.5">
            <Info className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-blue-800 font-semibold mb-1">
              <strong>Hierarchy:</strong> Grade → Lesson
            </p>
            <p className="text-xs text-blue-700">All fields are optional. Fill in what applies to your video.</p>
          </div>
        </div>

        {/* Form fields with improved spacing and vertical rhythm */}
        <div className="space-y-6">
          {/* 2-column grid for desktop, stacked for mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Grade
              </label>
              <input
                type="text"
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                placeholder="e.g., Grade 3 or Grade Name"
                className="w-full px-4 py-[14px] text-[15px] border border-[#D9DCE3] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] bg-white transition-all duration-200 hover:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Lesson
              </label>
              <input
                type="text"
                name="lesson"
                value={formData.lesson}
                onChange={handleChange}
                placeholder="e.g., Lesson 1 or Lesson Name"
                className="w-full px-4 py-[14px] text-[15px] border border-[#D9DCE3] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] bg-white transition-all duration-200 hover:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Topic
              </label>
              <input
                type="text"
                name="topic"
                value={formData.topic}
                onChange={handleChange}
                placeholder="Optional"
                className="w-full px-4 py-[14px] text-[15px] border border-[#D9DCE3] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] bg-white transition-all duration-200 hover:border-slate-400"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Optional"
            className="w-full px-4 py-[14px] text-[15px] border border-[#D9DCE3] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] bg-white transition-all duration-200 hover:border-slate-400"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Description
          </label>
          <textarea
            name="description"
            rows="4"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter video description..."
            className="w-full px-4 py-[14px] text-[15px] border border-[#D9DCE3] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] bg-white transition-all duration-200 hover:border-slate-400 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Language
          </label>
          <select
            name="language"
            value={formData.language}
            onChange={handleChange}
            className="w-full px-4 py-[14px] text-[15px] border border-[#D9DCE3] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] bg-white transition-all duration-200 hover:border-slate-400 cursor-pointer"
          >
            <option value="en">English</option>
            <option value="ar">Arabic</option>
            <option value="fr">French</option>
            <option value="es">Spanish</option>
          </select>
        </div>

        {/* Modern drag-and-drop video upload area */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Video File <span className="text-red-500">*</span>
          </label>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-[12px] p-8 text-center cursor-pointer transition-all duration-300 ${
              dragActive
                ? 'border-[#3B82F6] bg-blue-50/50 shadow-[0_0_0_4px_rgba(59,130,246,0.1)]'
                : 'border-[#D9DCE3] bg-slate-50/50 hover:border-[#3B82F6] hover:bg-blue-50/30 hover:shadow-[0_0_0_4px_rgba(59,130,246,0.05)]'
            } ${file ? 'border-green-300 bg-green-50/30' : ''} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleFileInputChange}
              required
              disabled={loading}
              className="hidden"
            />
            {!file ? (
              <div className="flex flex-col items-center gap-3">
                <div className={`p-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${dragActive ? 'scale-110' : ''}`}>
                  <FileVideo className={`w-8 h-8 ${dragActive ? 'text-[#3B82F6]' : 'text-slate-400'}`} />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-slate-700 mb-1">
                    Drop your video here or click to browse
                  </p>
                  <p className="text-xs text-slate-500">MP4, WebM, or QuickTime formats</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <div className="p-3 rounded-full bg-green-100">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-green-800">{file.name}</p>
                  <p className="text-xs text-green-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="ml-auto p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-red-500" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modern drag-and-drop thumbnail upload area */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Custom Thumbnail <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <div
            onDragEnter={handleThumbnailDrag}
            onDragLeave={handleThumbnailDrag}
            onDragOver={handleThumbnailDrag}
            onDrop={handleThumbnailDrop}
            onClick={() => thumbnailInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-[12px] p-8 text-center cursor-pointer transition-all duration-300 ${
              thumbnailDragActive
                ? 'border-[#3B82F6] bg-blue-50/50 shadow-[0_0_0_4px_rgba(59,130,246,0.1)]'
                : 'border-[#D9DCE3] bg-slate-50/50 hover:border-[#3B82F6] hover:bg-blue-50/30 hover:shadow-[0_0_0_4px_rgba(59,130,246,0.05)]'
            } ${thumbnailFile ? 'border-green-300 bg-green-50/30' : ''} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleThumbnailInputChange}
              disabled={loading}
              className="hidden"
            />
            {!thumbnailFile ? (
              <div className="flex flex-col items-center gap-3">
                <div className={`p-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${thumbnailDragActive ? 'scale-110' : ''}`}>
                  <FileImage className={`w-8 h-8 ${thumbnailDragActive ? 'text-[#3B82F6]' : 'text-slate-400'}`} />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-slate-700 mb-1">
                    Drop thumbnail image here or click to browse
                  </p>
                  <p className="text-xs text-slate-500">JPEG, PNG, or WebP formats</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-48 h-32 object-cover rounded-[12px] border-2 border-slate-200 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setThumbnailFile(null);
                      setThumbnailPreview(null);
                      if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
                    }}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-green-800">{thumbnailFile.name}</p>
                    <p className="text-xs text-green-600">{(thumbnailFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <p className="mt-3 text-xs text-slate-500 text-center">
            If not provided, a thumbnail will be automatically generated from the video.
          </p>
        </div>

        {/* Upload Progress Bar */}
        {loading && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-[12px] p-6 border border-blue-200/60 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Upload className="w-5 h-5 text-[#3B82F6] animate-pulse" />
                </div>
                <span className="text-slate-700 font-semibold text-[15px]">Uploading video...</span>
              </div>
              <span className="text-[#3B82F6] font-bold text-lg">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-[#3B82F6] to-blue-500 h-full rounded-full transition-all duration-300 ease-out flex items-center justify-end pr-2"
                style={{ width: `${uploadProgress}%` }}
              >
                {uploadProgress > 10 && (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </div>
            </div>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <p className="text-xs text-slate-600 flex items-center gap-2 justify-center">
                <span className="animate-spin">⏳</span>
                Please wait while your video is being uploaded. Do not close this page.
              </p>
            )}
            {uploadProgress === 100 && (
              <div className="flex items-center gap-2 text-green-600 font-semibold justify-center">
                <CheckCircle className="w-5 h-5" />
                <p>Upload complete! Processing video...</p>
              </div>
            )}
          </div>
        )}

        {/* Buttons with improved styling */}
        <div className="flex justify-end gap-4 pt-6 border-t border-[#D9DCE3]">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="px-6 py-3 border border-[#D9DCE3] rounded-[12px] text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-semibold transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-[#3B82F6] text-white rounded-[12px] hover:bg-[#2563EB] disabled:opacity-50 font-bold shadow-md hover:shadow-lg hover:shadow-[#3B82F6]/30 transition-all duration-200 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload Video
              </>
            )}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}

export default VideoUpload;

