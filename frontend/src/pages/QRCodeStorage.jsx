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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading QR codes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-slate-600">{error}</p>
          <button
            onClick={loadQRCodes}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="w-full p-4 sm:p-6 lg:p-8 xl:p-10">
        {/* Header Container */}
        <div className="mb-8 lg:mb-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl shadow-xl shadow-blue-500/20">
              <Filter className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">QR Code Storage</h1>
              <p className="text-slate-600 text-base sm:text-lg">Manage and download QR codes with short links for all your videos</p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 p-6 sm:p-8 mb-6 lg:mb-8">
          <div className="flex flex-col md:flex-row gap-4 lg:gap-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 z-10" />
              <input
                type="text"
                placeholder="Search by title, video ID, course, grade, lesson..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-slate-300 transition-all text-[15px]"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-3">
              <Filter className="text-slate-500 w-5 h-5" />
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-slate-300 transition-all cursor-pointer text-[15px] font-medium"
              >
                <option value="all">All Videos</option>
                <option value="course">With Course</option>
                <option value="grade">With Grade</option>
                <option value="lesson">With Lesson</option>
              </select>
            </div>

            {/* Count */}
            <div className="flex items-center px-5 py-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-sm">
              <span className="text-sm font-bold text-blue-700">
                {filteredQrCodes.length} {filteredQrCodes.length === 1 ? 'QR Code' : 'QR Codes'}
              </span>
            </div>
          </div>
        </div>

        {/* QR Codes Container */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 p-6 sm:p-8">
          {filteredQrCodes.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-blue-500" />
              </div>
              <p className="text-slate-600 text-lg sm:text-xl font-bold mb-2">No QR codes found</p>
              <p className="text-slate-500 text-sm mb-6">Try adjusting your search or filters</p>
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedFilter('all');
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-lg hover:shadow-xl"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {filteredQrCodes.map((item) => (
              <div
                key={item.videoId}
                className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-5 sm:p-6 hover:shadow-2xl transition-all duration-300 hover:border-blue-400 transform hover:-translate-y-1 group"
              >
                {/* QR Code */}
                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 rounded-xl mb-4 border-2 border-blue-200 flex justify-center shadow-inner group-hover:border-blue-300 transition-colors">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <QRCodeSVG
                      value={item.shortUrl}
                      size={160}
                      level="M"
                    />
                  </div>
                </div>

                {/* Video Info */}
                <div className="mb-5">
                  <h3 className="font-bold text-lg sm:text-xl text-slate-900 mb-3 line-clamp-2 min-h-[3rem] group-hover:text-blue-600 transition-colors leading-tight">
                    {item.title || 'Untitled Video'}
                  </h3>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.course && (
                      <span className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-300 shadow-sm">
                        {item.course}
                      </span>
                    )}
                    {item.grade && (
                      <span className="px-3 py-1.5 bg-gradient-to-r from-green-50 to-green-100 text-green-700 rounded-lg text-xs font-bold border border-green-300 shadow-sm">
                        Grade {item.grade}
                      </span>
                    )}
                    {item.lesson && (
                      <span className="px-3 py-1.5 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 rounded-lg text-xs font-bold border border-purple-300 shadow-sm">
                        {item.lesson}
                      </span>
                    )}
                  </div>

                  {/* Short URL */}
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border-2 border-slate-200 mb-4">
                    <p className="text-xs text-slate-600 mb-2 font-bold uppercase tracking-wide">
                      Short Link
                    </p>
                    <div className="flex items-center gap-2 bg-white rounded-lg p-2 border border-slate-200">
                      <input
                        type="text"
                        value={item.shortUrl}
                        readOnly
                        className="flex-1 text-xs sm:text-sm font-mono text-slate-700 bg-transparent border-none focus:outline-none truncate"
                      />
                      <button
                        onClick={() => handleCopy(item.shortUrl, item.videoId)}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-all hover:scale-110"
                        title="Copy URL"
                      >
                        {copiedId === item.videoId ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-600 hover:text-blue-600" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 font-medium">
                      Video ID: <span className="font-mono">{item.videoId}</span>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2.5 pt-4 border-t-2 border-slate-200">
                  <button
                    onClick={() => handleDownloadQR(item.videoId, item.title)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-bold text-sm shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                  <a
                    href={item.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-xl hover:from-slate-200 hover:to-slate-300 transition-all font-bold text-sm border-2 border-slate-300 shadow-sm hover:shadow-md transform hover:scale-105 flex items-center justify-center"
                  >
                    <span className="hidden sm:inline">View</span>
                    <span className="sm:hidden">→</span>
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

