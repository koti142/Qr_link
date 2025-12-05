import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Loader2, Video, FileCheck, AlertTriangle, Clock, History, RefreshCw } from 'lucide-react';
import api from '../services/api';

function BulkUpload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [fileName, setFileName] = useState('');
  const [uploadHistory, setUploadHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    fetchUploadHistory();
  }, []);

  const fetchUploadHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await api.get('/videos/upload-history');
      setUploadHistory(response.data.history || []);
    } catch (error) {
      console.error('Failed to fetch upload history:', error);
      // If it's a 500 error and table doesn't exist, show empty history
      if (error.response?.status === 500) {
        console.warn('Upload history endpoint returned 500, showing empty history');
        setUploadHistory([]);
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file (.csv extension required)');
      e.target.value = '';
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append('csv', file);

      const response = await api.post('/videos/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Handle response - check if results are nested or direct
      const responseData = response.data;
      if (responseData.results) {
        setResults(responseData.results);
      } else {
        // If results are at top level, wrap them
        setResults({
          total: responseData.total || 0,
          successful: responseData.successful || 0,
          failed: responseData.failed || 0,
          errors: responseData.errors || []
        });
      }
      setError('');
      
      // Refresh upload history
      try {
        await fetchUploadHistory();
      } catch (historyError) {
        console.warn('Failed to refresh upload history:', historyError);
      }
      
      // Show success message
      const results = responseData.results || responseData;
      if (results && results.successful > 0) {
        setTimeout(() => {
          if (window.confirm(`${results.successful} video(s) uploaded successfully! Would you like to view them in the Videos page?`)) {
            window.location.href = '/admin/videos';
          }
        }, 1000);
      }
      
      // Reset file input
      e.target.value = '';
    } catch (err) {
      console.error('CSV upload error:', err);
      console.error('Error response:', err.response?.data);
      
      // Get detailed error message
      let errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to upload CSV file. Please check the file format and try again.';
      
      // Add more details if available
      if (err.response?.data?.details) {
        errorMessage += ` (Processed: ${err.response.data.details.totalProcessed || 0}, Successful: ${err.response.data.details.successful || 0}, Failed: ${err.response.data.details.failed || 0})`;
      }
      
      // Show first error if available
      if (err.response?.data?.firstErrors && err.response.data.firstErrors.length > 0) {
        const firstError = err.response.data.firstErrors[0];
        errorMessage += `\n\nFirst error (Row ${firstError.row}): ${firstError.message}`;
        if (firstError.errorType) {
          errorMessage += `\nError Type: ${firstError.errorType}`;
        }
        if (firstError.errorCode) {
          errorMessage += `\nError Code: ${firstError.errorCode}`;
        }
      }
      
      // Show all errors if available (limit to first 10 for better visibility)
      if (err.response?.data?.results?.errors && err.response.data.results.errors.length > 0) {
        const errorList = err.response.data.results.errors.slice(0, 10);
        errorMessage += `\n\nDetailed Errors (${err.response.data.results.errors.length} total):\n${errorList.map((e, i) => `  ${i + 1}. Row ${e.row} - ${e.video || 'Unknown'}: ${e.message}${e.errorType ? ` (${e.errorType})` : ''}${e.errorCode ? ` [${e.errorCode}]` : ''}`).join('\n')}`;
        if (err.response.data.results.errors.length > 10) {
          errorMessage += `\n  ... and ${err.response.data.results.errors.length - 10} more errors`;
        }
      }
      
      // Show summary
      if (err.response?.data?.results) {
        errorMessage += `\n\nSummary: ${err.response.data.results.successful || 0} successful, ${err.response.data.results.failed || 0} failed out of ${err.response.data.results.total || 0} total`;
      }
      
      setError(errorMessage);
      setResults({
        total: err.response?.data?.results?.total || err.response?.data?.details?.totalProcessed || 0,
        successful: err.response?.data?.results?.successful || err.response?.data?.details?.successful || 0,
        failed: err.response?.data?.results?.failed || err.response?.data?.details?.failed || 0,
        errors: err.response?.data?.results?.errors || err.response?.data?.firstErrors || []
      });
      e.target.value = '';
      setFileName('');
      // Refresh upload history even on error
      try {
        await fetchUploadHistory();
      } catch (historyError) {
        console.warn('Failed to refresh upload history:', historyError);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5";
    switch (status) {
      case 'completed':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            <CheckCircle className="w-3.5 h-3.5" />
            Done
          </span>
        );
      case 'failed':
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800`}>
            <XCircle className="w-3.5 h-3.5" />
            Failed
          </span>
        );
      case 'processing':
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Processing
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-xl shadow-lg">
              <Video className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Bulk Video Upload
              </h1>
              <p className="text-gray-600 text-lg">Upload CSV file to import videos and automatically generate QR codes</p>
            </div>
          </div>
        </div>

        {/* CSV Format Info */}
       

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-5 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-700 flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-6 h-6 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-lg mb-1">Upload Error</div>
              <div className="text-sm">{error}</div>
            </div>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 transition-colors">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-10 mb-6">
          <div className="text-center">
            <div className="mb-8">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 via-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <FileText className="w-12 h-12 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Upload Your CSV File</h2>
              <p className="text-gray-600 mb-2">
                Select a CSV file containing video resource information
              </p>
              {fileName && !loading && (
                <p className="text-sm text-blue-600 font-medium mt-2">
                  Selected: {fileName}
                </p>
              )}
            </div>

            <label className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all cursor-pointer font-semibold shadow-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95">
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Processing CSV...</span>
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6" />
                  <span>Choose CSV File</span>
                </>
              )}
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
                disabled={loading}
              />
            </label>

            {loading && (
              <div className="mt-6">
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Uploading and processing videos...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {results && (() => {
          // Normalize results structure - handle both nested and flat structures
          const normalizedResults = results.results || results;
          const total = normalizedResults.total || 0;
          const successful = normalizedResults.successful || 0;
          const failed = normalizedResults.failed || 0;
          const errors = normalizedResults.errors || results.errors || [];
          
          return (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileCheck className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Upload Results</h2>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Total Videos</span>
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-4xl font-bold text-blue-900">{total}</div>
                <div className="text-xs text-blue-600 mt-1">videos processed</div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-green-700 uppercase tracking-wide">Successful</span>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-4xl font-bold text-green-900">{successful}</div>
                <div className="text-xs text-green-600 mt-1">uploaded successfully</div>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-red-700 uppercase tracking-wide">Failed</span>
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="text-4xl font-bold text-red-900">{failed}</div>
                <div className="text-xs text-red-600 mt-1">need attention</div>
              </div>
            </div>

            {/* Success Message */}
            {successful > 0 && (
              <div className="mb-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="font-bold text-green-900 text-lg">Success!</span>
                </div>
                <p className="text-green-800 ml-9">
                  {successful} video(s) uploaded successfully. QR codes and short links have been automatically generated and are ready to use.
                </p>
              </div>
            )}

            {/* Warning if some failed */}
            {failed > 0 && (
              <div className="mb-6 p-5 bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-500 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  <span className="font-bold text-yellow-900 text-lg">Partial Success</span>
                </div>
                <p className="text-yellow-800 ml-9">
                  {successful} video(s) uploaded successfully, but {failed} video(s) failed. Check error details below.
                </p>
              </div>
            )}

            {/* Error Details */}
            {errors.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  Error Details ({errors.length} error{errors.length !== 1 ? 's' : ''})
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {errors.map((error, index) => {
                    // Check if it's a duplicate resource (not a real error, just informational)
                    const isDuplicate = error.errorType === 'DuplicateResource' || error.errorCode === 'DUPLICATE_RESOURCE';
                    return (
                      <div
                        key={index}
                        className={`p-4 border-l-4 rounded-lg transition-colors ${
                          isDuplicate 
                            ? 'bg-yellow-50 border-yellow-400 hover:bg-yellow-100' 
                            : 'bg-red-50 border-red-400 hover:bg-red-100'
                        }`}
                      >
                        <div className={`font-semibold mb-2 ${
                          isDuplicate ? 'text-yellow-900' : 'text-red-900'
                        }`}>
                          Row {error.row || index + 1}: {error.video || 'Unknown Video'}
                        </div>
                        <div className={`text-sm mb-2 whitespace-pre-wrap break-words ${
                          isDuplicate ? 'text-yellow-700' : 'text-red-700'
                        }`}>
                          {isDuplicate ? 'ℹ️ ' : '❌ '}{error.message || 'No error message provided'}
                        </div>
                        {error.errorType && !isDuplicate && (
                          <div className="text-xs text-red-600 mt-2 mb-1">
                            <span className="font-semibold">Error Type:</span> {error.errorType}
                            {error.errorCode && (
                              <>
                                <span className="mx-2">|</span>
                                <span className="font-semibold">Code:</span> {error.errorCode}
                              </>
                            )}
                          </div>
                        )}
                        {error.details && typeof error.details === 'object' && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs font-semibold text-gray-700 hover:text-gray-900">
                              Show Additional Details
                            </summary>
                            <pre className="mt-2 text-xs bg-white bg-opacity-70 p-2 rounded overflow-auto max-h-40 border border-gray-200">
                              {JSON.stringify(error.details, null, 2)}
                            </pre>
                          </details>
                        )}
                        {error.stack && process.env.NODE_ENV === 'development' && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs font-semibold text-gray-700 hover:text-gray-900">
                              Show Stack Trace (Dev Only)
                            </summary>
                            <pre className="mt-2 text-xs bg-white bg-opacity-70 p-2 rounded overflow-auto max-h-40 border border-gray-200 text-gray-600">
                              {error.stack}
                            </pre>
                          </details>
                        )}
                        {isDuplicate && (
                          <div className="text-xs text-yellow-600 mt-2">
                            ℹ️ This video resource already exists in the system. No duplicate was created.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Perfect Success Message */}
            {successful === total && total > 0 && (
              <div className="mt-6 p-6 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-xl text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <p className="text-green-900 font-bold text-lg mb-1">
                  Perfect! All videos uploaded successfully!
                </p>
                <p className="text-green-700 text-sm">
                  All QR codes and short links have been generated and are ready to use.
                </p>
              </div>
            )}
          </div>
          );
        })()}

        {/* Upload History Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <History className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Upload History</h2>
            </div>
            <button
              onClick={fetchUploadHistory}
              disabled={loadingHistory}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : uploadHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <History className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No upload history yet</p>
              <p className="text-sm mt-2">Upload your first CSV file to see history here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">File Name</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Date & Time</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-700">Total</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-700">Successful</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-700">Failed</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Uploaded By</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadHistory.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{item.file_name}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{formatFileSize(item.file_size)}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{formatDate(item.created_at)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-semibold text-gray-900">{item.total_videos || 0}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-semibold text-green-600">{item.successful_videos || 0}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-semibold text-red-600">{item.failed_videos || 0}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">{item.uploaded_by || 'System'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BulkUpload;
