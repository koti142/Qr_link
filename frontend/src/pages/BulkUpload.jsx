import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Loader2, Video, FileCheck, AlertTriangle, Clock, History, RefreshCw, Info, Sparkles, Trash2, Square, CheckSquare2 } from 'lucide-react';
import api from '../services/api';

function BulkUpload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [fileName, setFileName] = useState('');
  const [uploadHistory, setUploadHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [deleting, setDeleting] = useState(false);

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

      const responseData = response.data;
      if (responseData.results) {
        setResults(responseData.results);
      } else {
        setResults({
          total: responseData.total || 0,
          successful: responseData.successful || 0,
          failed: responseData.failed || 0,
          errors: responseData.errors || []
        });
      }
      setError('');
      
      try {
        await fetchUploadHistory();
      } catch (historyError) {
        console.warn('Failed to refresh upload history:', historyError);
      }
      
      const results = responseData.results || responseData;
      if (results && results.successful > 0) {
        setTimeout(() => {
          if (window.confirm(`${results.successful} video(s) uploaded successfully! Would you like to view them in the Videos page?`)) {
            window.location.href = '/admin/videos';
          }
        }, 1000);
      }
      
      e.target.value = '';
    } catch (err) {
      console.error('CSV upload error:', err);
      console.error('Error response:', err.response?.data);
      
      let errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to upload CSV file. Please check the file format and try again.';
      
      if (err.response?.data?.details) {
        errorMessage += ` (Processed: ${err.response.data.details.totalProcessed || 0}, Successful: ${err.response.data.details.successful || 0}, Failed: ${err.response.data.details.failed || 0})`;
      }
      
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
      
      if (err.response?.data?.results?.errors && err.response.data.results.errors.length > 0) {
        const errorList = err.response.data.results.errors.slice(0, 10);
        errorMessage += `\n\nDetailed Errors (${err.response.data.results.errors.length} total):\n${errorList.map((e, i) => `  ${i + 1}. Row ${e.row} - ${e.video || 'Unknown'}: ${e.message}${e.errorType ? ` (${e.errorType})` : ''}${e.errorCode ? ` [${e.errorCode}]` : ''}`).join('\n')}`;
        if (err.response.data.results.errors.length > 10) {
          errorMessage += `\n  ... and ${err.response.data.results.errors.length - 10} more errors`;
        }
      }
      
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

  const handleSelectItem = (id) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === uploadHistory.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(uploadHistory.map(item => item.id)));
    }
  };

  const handleDeleteItem = async (id, event) => {
    event.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this upload history record?')) {
      return;
    }

    try {
      setDeleting(true);
      await api.delete(`/videos/upload-history/${id}`);
      await fetchUploadHistory();
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Failed to delete upload history:', error);
      alert(error.response?.data?.error || 'Failed to delete upload history record');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) {
      alert('Please select at least one item to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedItems.size} upload history record(s)?`)) {
      return;
    }

    try {
      setDeleting(true);
      const ids = Array.from(selectedItems);
      await api.delete('/videos/upload-history', { data: { ids } });
      await fetchUploadHistory();
      setSelectedItems(new Set());
      alert(`${ids.length} record(s) deleted successfully`);
    } catch (error) {
      console.error('Failed to bulk delete upload history:', error);
      alert(error.response?.data?.error || 'Failed to delete upload history records');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="h-full w-full p-6 lg:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-xl shadow-lg">
              <Video className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Bulk Video Upload
              </h1>
              <p className="text-gray-600 text-lg mt-1">Upload CSV file to import videos and automatically generate QR codes</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-5 bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 rounded-xl text-red-700 flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-6 h-6 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-lg mb-1">Upload Error</div>
              <div className="text-sm whitespace-pre-wrap">{error}</div>
            </div>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 transition-colors">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          {/* Left Column - Upload Section */}
          <div className="xl:col-span-2 space-y-6">
            {/* Upload Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
              <div className="text-center">
                <div className="mb-6">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-100 via-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                    <FileText className="w-10 h-10 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Your CSV File</h2>
                  <p className="text-gray-600 text-sm">
                    Select a CSV file containing video resource information
                  </p>
                  {fileName && !loading && (
                    <p className="text-sm text-blue-600 font-medium mt-3">
                      Selected: {fileName}
                    </p>
                  )}
                </div>

                <label className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer font-semibold shadow-lg text-base disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95">
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing CSV...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
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

                {/* CSV Format Info */}
                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">CSV Format Requirements:</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-700">
                        <li>Required columns: <code className="bg-blue-100 px-1 rounded">ID</code>, <code className="bg-blue-100 px-1 rounded">Link/Path</code></li>
                        <li>Optional columns: <code className="bg-blue-100 px-1 rounded">Title</code>, <code className="bg-blue-100 px-1 rounded">Thumbnail Images</code>, <code className="bg-blue-100 px-1 rounded">Tag 1</code>, <code className="bg-blue-100 px-1 rounded">Tag 2</code></li>
                        <li>Videos will be saved to <code className="bg-blue-100 px-1 rounded">backend/upload/</code> folder</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Section */}
            {results && (() => {
              const normalizedResults = results.results || results;
              const total = normalizedResults.total || 0;
              const successful = normalizedResults.successful || 0;
              const failed = normalizedResults.failed || 0;
              const errors = normalizedResults.errors || results.errors || [];
              
              return (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
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
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                        {errors.map((error, index) => {
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
          </div>

          {/* Right Column - Upload History */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <History className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Upload History</h2>
                </div>
                <button
                  onClick={fetchUploadHistory}
                  disabled={loadingHistory}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                  title="Refresh history"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Bulk Actions */}
              {uploadHistory.length > 0 && (
                <div className="mb-4 flex items-center justify-between gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    title={selectedItems.size === uploadHistory.length ? 'Deselect all' : 'Select all'}
                  >
                    {selectedItems.size === uploadHistory.length ? (
                      <CheckSquare2 className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-600" />
                    )}
                    <span className="text-gray-700">
                      {selectedItems.size === uploadHistory.length ? 'Deselect All' : 'Select All'}
                    </span>
                  </button>
                  {selectedItems.size > 0 && (
                    <button
                      onClick={handleBulkDelete}
                      disabled={deleting}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      <span>Delete ({selectedItems.size})</span>
                    </button>
                  )}
                </div>
              )}

              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : uploadHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-medium">No upload history yet</p>
                  <p className="text-xs mt-1 text-gray-400">Upload your first CSV file to see history here</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 custom-scrollbar">
                  {uploadHistory.map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-4 border rounded-lg transition-colors cursor-pointer ${
                        selectedItems.has(item.id) 
                          ? 'bg-blue-50 border-blue-300 hover:bg-blue-100' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => handleSelectItem(item.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectItem(item.id);
                            }}
                            className="flex-shrink-0"
                          >
                            {selectedItems.has(item.id) ? (
                              <CheckSquare2 className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="font-medium text-gray-900 text-sm truncate" title={item.file_name}>
                            {item.file_name}
                          </span>
                        </div>
                        <button
                          onClick={(e) => handleDeleteItem(item.id, e)}
                          disabled={deleting}
                          className="flex-shrink-0 p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete this record"
                        >
                          {deleting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 mb-3">{formatFileSize(item.file_size)}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-gray-600">Total: <span className="font-semibold text-gray-900">{item.total_videos || 0}</span></span>
                          <span className="text-green-600">✓ <span className="font-semibold">{item.successful_videos || 0}</span></span>
                          <span className="text-red-600">✗ <span className="font-semibold">{item.failed_videos || 0}</span></span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        {getStatusBadge(item.status)}
                        <span className="text-xs text-gray-500">{item.uploaded_by || 'System'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
}

export default BulkUpload;
