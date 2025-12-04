import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

function VersionHistory() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVersions();
  }, [videoId]);

  const fetchVersions = async () => {
    try {
      const response = await api.get(`/videos/${videoId}/versions`);
      setVersions(response.data);
    } catch (error) {
      console.error('Failed to fetch versions:', error);
    } finally {
      setLoading(false);
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
        <h1 className="text-3xl font-bold">Version History for {videoId}</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-blue-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Version
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                File Path
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Size
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {versions.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  No versions found
                </td>
              </tr>
            ) : (
              versions.map((version) => (
                <tr key={version.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    v{version.version}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono">{version.file_path}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {(version.size / 1024 / 1024).toFixed(2)} MB
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(version.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default VersionHistory;

