import { useEffect, useState } from 'react';
import { Download, Copy, Check, Search, Filter } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';

function QRCodeStorage() {
  const [qrCodes, setQrCodes] = useState([]);
  const [filteredQrCodes, setFilteredQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    loadQRCodes();
  }, []);

  useEffect(() => {
    filterQRCodes();
  }, [searchTerm, selectedFilter, qrCodes]);

  const loadQRCodes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/videos/qr-codes');
      setQrCodes(response.data);
      setFilteredQrCodes(response.data);
    } catch (err) {
      console.error('Failed to load QR codes:', err);
      setError(err.response?.data?.error || 'Failed to load QR codes');
    } finally {
      setLoading(false);
    }
  };

  const filterQRCodes = () => {
    let filtered = [...qrCodes];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.title?.toLowerCase().includes(term) ||
        item.videoId?.toLowerCase().includes(term) ||
        item.course?.toLowerCase().includes(term) ||
        item.grade?.toString().includes(term) ||
        item.lesson?.toLowerCase().includes(term) ||
        item.module?.toLowerCase().includes(term) ||
        item.shortSlug?.toLowerCase().includes(term)
      );
    }

    // Apply category filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(item => {
        switch (selectedFilter) {
          case 'course':
            return item.course;
          case 'grade':
            return item.grade;
          case 'lesson':
            return item.lesson;
          default:
            return true;
        }
      });
    }

    setFilteredQrCodes(filtered);
  };

  const handleCopy = async (url, id) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadQR = async (videoId, title) => {
    try {
      console.log('Downloading QR code for video:', videoId);
      const response = await api.get(`/videos/${videoId}/qr-download`, {
        responseType: 'blob'
      });
      
      if (!response.data || response.data.size === 0) {
        throw new Error('Empty response from server');
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title || videoId}_qr_code.png`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      console.log('QR code downloaded successfully');
    } catch (err) {
      console.error('Failed to download QR code:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error';
      alert(`Failed to download QR code: ${errorMessage}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading QR codes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={loadQRCodes}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Container */}
        <div className="bg-white rounded-xl shadow-md border border-blue-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <span className="w-1 h-10 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full"></span>
                QR Code Storage
              </h1>
              <p className="text-gray-600 text-lg">
                Manage and download QR codes with short links for all your videos
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filter Container */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-blue-200">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by title, video ID, course, grade, lesson..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400 w-5 h-5" />
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Videos</option>
                <option value="course">With Course</option>
                <option value="grade">With Grade</option>
                <option value="lesson">With Lesson</option>
              </select>
            </div>

            {/* Count */}
            <div className="flex items-center px-4 py-2 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-700">
                {filteredQrCodes.length} {filteredQrCodes.length === 1 ? 'QR Code' : 'QR Codes'}
              </span>
            </div>
          </div>
        </div>

        {/* QR Codes Container */}
        <div className="bg-white rounded-xl shadow-md border border-blue-200 p-6">
          {filteredQrCodes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No QR codes found</p>
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedFilter('all');
                  }}
                  className="mt-4 text-blue-600 hover:text-blue-700 underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredQrCodes.map((item) => (
              <div
                key={item.videoId}
                className="bg-white rounded-xl shadow-lg border border-blue-200 p-6 hover:shadow-xl transition-all duration-300 hover:border-blue-300"
              >
                {/* QR Code */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-3 rounded-lg mb-3 border border-blue-200 flex justify-center">
                  <QRCodeSVG
                    value={item.shortUrl}
                    size={160}
                    level="M"
                  />
                </div>

                {/* Video Info */}
                <div className="mb-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">
                    {item.title || 'Untitled Video'}
                  </h3>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {item.course && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                        {item.course}
                      </span>
                    )}
                    {item.grade && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">
                        Grade {item.grade}
                      </span>
                    )}
                    {item.lesson && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">
                        {item.lesson}
                      </span>
                    )}
                  </div>

                  {/* Short URL */}
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">
                      Short Link
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.shortUrl}
                        readOnly
                        className="flex-1 text-sm font-mono text-gray-700 bg-transparent border-none focus:outline-none"
                      />
                      <button
                        onClick={() => handleCopy(item.shortUrl, item.videoId)}
                        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                        title="Copy URL"
                      >
                        {copiedId === item.videoId ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Video ID: {item.videoId}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadQR(item.videoId, item.title)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download QR
                  </button>
                  <a
                    href={item.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                  >
                    View
                  </a>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QRCodeStorage;

