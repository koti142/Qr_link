import { useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, Loader, RefreshCw, Copy, Info } from 'lucide-react';
import api from '../services/api';

function VideoReplacementDiagnostic({ videoId, onClose }) {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [copied, setCopied] = useState(false);

  const runDiagnostics = async () => {
    setRunning(true);
    setResults(null);
    setCopied(false);
    
    try {
      const response = await api.get(`/videos/${videoId}/replace-diagnostic`);
      setResults(response.data);
    } catch (error) {
      console.error('Diagnostic error:', error);
      setResults({
        videoId: videoId,
        canReplace: false,
        checks: [{
          name: 'API Request',
          status: 'error',
          message: 'Failed to fetch diagnostic data',
          details: {
            error: error.response?.data?.message || error.message,
            status: error.response?.status
          }
        }],
        errors: [error.response?.data?.message || error.message || 'Unknown error'],
        warnings: []
      });
    } finally {
      setRunning(false);
    }
  };

  const copyResults = () => {
    const text = JSON.stringify(results, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (!results && !running) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Video Replacement Diagnostic</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        <p className="text-gray-600 mb-4">
          Run diagnostics to check if this video can be replaced and identify any potential issues.
        </p>
        <button
          onClick={runDiagnostics}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Run Diagnostic
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Video Replacement Diagnostic</h3>
        <div className="flex gap-2">
          <button
            onClick={copyResults}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            title="Copy results"
          >
            {copied ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
          </button>
          <button
            onClick={runDiagnostics}
            disabled={running}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded disabled:opacity-50"
            title="Re-run diagnostic"
          >
            <RefreshCw className={`w-5 h-5 ${running ? 'animate-spin' : ''}`} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {running && (
        <div className="flex items-center justify-center py-8">
          <Loader className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-3 text-gray-600">Running diagnostics...</span>
        </div>
      )}

      {results && !running && (
        <div className="space-y-4">
          {/* Summary */}
          <div className={`p-4 rounded-lg border-2 ${results.canReplace ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
            <div className="flex items-center gap-2 mb-2">
              {results.canReplace ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              <h4 className="font-semibold text-lg">
                {results.canReplace ? 'Video Can Be Replaced' : 'Video Cannot Be Replaced'}
              </h4>
            </div>
            {results.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-red-700">Errors ({results.errors.length}):</p>
                <ul className="list-disc list-inside text-sm text-red-600 mt-1">
                  {results.errors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {results.warnings.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-yellow-700">Warnings ({results.warnings.length}):</p>
                <ul className="list-disc list-inside text-sm text-yellow-600 mt-1">
                  {results.warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Video Info */}
          {results.videoInfo && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Video Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="font-medium">ID:</span> {results.videoInfo.id}</div>
                <div><span className="font-medium">Video ID:</span> {results.videoInfo.video_id}</div>
                <div><span className="font-medium">Redirect Slug:</span> {results.videoInfo.redirect_slug || 'N/A'}</div>
                <div><span className="font-medium">Status:</span> {results.videoInfo.status}</div>
                <div className="col-span-2"><span className="font-medium">File Path:</span> {results.videoInfo.file_path || 'N/A'}</div>
              </div>
            </div>
          )}

          {/* File Info */}
          {results.fileInfo && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">File Path Information</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Expected Path:</span> {results.fileInfo.expectedPath}</div>
                <div><span className="font-medium">Current Path:</span> {results.fileInfo.currentPath || 'N/A'}</div>
                <div><span className="font-medium">Path Will Change:</span> {results.fileInfo.pathWillChange ? 'Yes' : 'No'}</div>
              </div>
            </div>
          )}

          {/* Checks */}
          <div className="space-y-3">
            <h4 className="font-semibold">Diagnostic Checks</h4>
            {results.checks.map((check, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${getStatusColor(check.status)}`}
              >
                <div className="flex items-start gap-3">
                  {getStatusIcon(check.status)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-800">{check.name}</h5>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        check.status === 'success' ? 'bg-green-100 text-green-700' :
                        check.status === 'error' ? 'bg-red-100 text-red-700' :
                        check.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {check.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{check.message}</p>
                    {check.details && Object.keys(check.details).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                          Show details
                        </summary>
                        <pre className="mt-2 p-2 bg-white rounded text-xs overflow-x-auto">
                          {JSON.stringify(check.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Timestamp */}
          <div className="text-xs text-gray-500 text-center pt-4 border-t">
            Diagnostic run at: {new Date().toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoReplacementDiagnostic;


