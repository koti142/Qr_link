import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

function CaptionUpload() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [captions, setCaptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    language: 'en',
    file: null
  });

  useEffect(() => {
    fetchCaptions();
  }, [videoId]);

  const fetchCaptions = async () => {
    try {
      const response = await api.get(`/captions/${videoId}`);
      setCaptions(response.data);
    } catch (error) {
      console.error('Failed to fetch captions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      file: e.target.files[0]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUploading(true);

    if (!formData.file) {
      setError('Please select a caption file');
      setUploading(false);
      return;
    }

    try {
      const uploadData = new FormData();
      uploadData.append('caption', formData.file);
      uploadData.append('videoId', videoId);
      uploadData.append('language', formData.language);

      await api.post('/captions/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('Caption uploaded successfully!');
      setFormData({ language: 'en', file: null });
      fetchCaptions();
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this caption?')) return;

    try {
      await api.delete(`/captions/${id}`);
      fetchCaptions();
    } catch (error) {
      alert('Failed to delete caption');
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
    <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-10 py-8">
      <div className="mb-8">
        <button
          onClick={() => navigate('/admin/videos')}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Back to Videos
        </button>
        <h1 className="text-3xl font-bold">Captions for {videoId}</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Upload Caption</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="en">English</option>
              <option value="ar">Arabic</option>
              <option value="fr">French</option>
              <option value="es">Spanish</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Caption File (VTT) *
            </label>
            <input
              type="file"
              accept=".vtt,text/vtt"
              onChange={handleFileChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="px-6 py-2 bg-blue-200 text-blue-800 rounded-md hover:bg-blue-300 disabled:opacity-50 font-medium"
          >
            {uploading ? 'Uploading...' : 'Upload Caption'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Existing Captions</h2>
        {captions.length === 0 ? (
          <p className="text-gray-500">No captions uploaded yet</p>
        ) : (
          <div className="space-y-4">
            {captions.map((caption) => (
              <div
                key={caption.id}
                className="flex justify-between items-center p-4 border rounded"
              >
                <div>
                  <p className="font-medium">{caption.language.toUpperCase()}</p>
                  <p className="text-sm text-gray-600">{caption.file_path}</p>
                </div>
                <button
                  onClick={() => handleDelete(caption.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CaptionUpload;

