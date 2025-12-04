import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import QRCodeViewer from '../components/QRCodeViewer';
import api from '../services/api';

function RedirectViewer() {
  const [redirects, setRedirects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRedirect, setSelectedRedirect] = useState(null);

  useEffect(() => {
    fetchRedirects();
  }, []);

  const fetchRedirects = async () => {
    try {
      const response = await api.get('/admin/redirects');
      setRedirects(response.data);
    } catch (error) {
      console.error('Failed to fetch redirects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slug, e) => {
    e.stopPropagation(); // Prevent selecting the redirect when clicking delete
    
    if (!confirm(`Are you sure you want to delete the redirect "${slug}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/admin/redirects/${slug}`);
      
      // If the deleted redirect was selected, clear selection
      if (selectedRedirect?.slug === slug) {
        setSelectedRedirect(null);
      }
      
      // Refresh the redirects list
      fetchRedirects();
    } catch (error) {
      console.error('Failed to delete redirect:', error);
      alert(error.response?.data?.error || 'Failed to delete redirect');
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
    <div className="p-6 bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Redirect Links & QR Codes</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="bg-white rounded-lg shadow-sm border border-blue-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">All Redirects</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-[calc(100vh-300px)] overflow-y-auto">
              {redirects.length === 0 ? (
                <div className="px-6 py-4 text-center text-gray-500">
                  No redirects found
                </div>
              ) : (
                redirects.map((redirect) => (
                  <div
                    key={redirect.id}
                    className={`px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedRedirect?.id === redirect.id ? 'bg-blue-100' : ''
                    }`}
                    onClick={() => setSelectedRedirect(redirect)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm font-semibold">{redirect.slug}</p>
                        <p className="text-sm text-gray-600 mt-1 truncate">{redirect.target_url}</p>
                      </div>
                      <button
                        onClick={(e) => handleDelete(redirect.slug, e)}
                        className="flex-shrink-0 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete redirect"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div>
          {selectedRedirect ? (
            <div className="space-y-4">
              <QRCodeViewer
                url={`${window.location.origin}/${selectedRedirect.slug}`}
                videoId={selectedRedirect.slug}
              />
              <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Streaming URL</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/stream/${selectedRedirect.slug}`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/stream/${selectedRedirect.slug}`);
                      alert('Streaming URL copied to clipboard!');
                    }}
                    className="px-4 py-2 bg-green-200 text-green-800 rounded-md hover:bg-green-300 font-medium text-sm"
                  >
                    Copy Stream URL
                  </button>
                </div>
                <a
                  href={`/stream/${selectedRedirect.slug}`}
                  target="_blank"
                  className="mt-3 inline-block px-4 py-2 bg-blue-200 text-blue-800 rounded-md hover:bg-blue-300 font-medium text-sm text-center w-full"
                >
                  Open Stream Page
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-6">
              <p className="text-gray-500 text-center">Select a redirect to view QR code</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RedirectViewer;

