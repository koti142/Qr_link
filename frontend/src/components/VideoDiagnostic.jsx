import { useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, Loader, RefreshCw, Copy, ExternalLink } from 'lucide-react';
import api from '../services/api';
import { getApiUrl } from '../utils/backendUrl.js';

function VideoDiagnostic({ videoId, streamUrl, onClose }) {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [copied, setCopied] = useState(false);

  const runDiagnostics = async () => {
    setRunning(true);
    setResults(null);
    
    const diagnosticResults = {
      timestamp: new Date().toISOString(),
      videoId: videoId || 'N/A',
      streamUrl: streamUrl || 'N/A',
      checks: []
    };

    try {
      // Check 1: Backend API connectivity
      try {
        const apiUrl = getApiUrl();
        const healthCheck = await fetch(`${apiUrl}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        diagnosticResults.checks.push({
          name: 'Backend API Connectivity',
          status: healthCheck.ok ? 'success' : 'error',
          message: healthCheck.ok 
            ? 'Backend server is reachable' 
            : `Backend returned status ${healthCheck.status}`,
          details: {
            status: healthCheck.status,
            statusText: healthCheck.statusText
          }
        });
      } catch (err) {
        diagnosticResults.checks.push({
          name: 'Backend API Connectivity',
          status: 'error',
          message: 'Cannot reach backend server',
          details: {
            error: err.message,
            suggestion: 'Check if backend server is running on port 5000'
          }
        });
      }

      // Check 2: Video file existence (if videoId provided)
      if (videoId) {
        try {
          const videoResponse = await api.get(`/videos/${videoId}`);
          const video = videoResponse.data;
          
          diagnosticResults.checks.push({
            name: 'Video Database Record',
            status: 'success',
            message: 'Video found in database',
            details: {
              videoId: video.video_id,
              filePath: video.file_path,
              streamingUrl: video.streaming_url,
              status: video.status,
              size: video.size ? `${(video.size / (1024 * 1024)).toFixed(2)} MB` : 'Unknown'
            }
          });

          // Check 3: File path diagnostic
          try {
            const diagnosticResponse = await api.get(`/videos/${video.video_id}/diagnostic`);
            diagnosticResults.checks.push({
              name: 'File Path Resolution',
              status: diagnosticResponse.data.fileExists ? 'success' : 'error',
              message: diagnosticResponse.data.fileExists 
                ? 'Video file found on server' 
                : 'Video file not found on server',
              details: {
                fileExists: diagnosticResponse.data.fileExists,
                resolvedPath: diagnosticResponse.data.resolvedPath,
                fileSize: diagnosticResponse.data.fileSize ? `${(diagnosticResponse.data.fileSize / (1024 * 1024)).toFixed(2)} MB` : 'Unknown',
                fileModified: diagnosticResponse.data.fileModified,
                possiblePaths: diagnosticResponse.data.possiblePaths,
                errors: diagnosticResponse.data.errors
              }
            });
          } catch (diagErr) {
            diagnosticResults.checks.push({
              name: 'File Path Resolution',
              status: 'warning',
              message: 'Could not check file existence',
              details: {
                error: diagErr.response?.data?.error || diagErr.message
              }
            });
          }
        } catch (err) {
          diagnosticResults.checks.push({
            name: 'Video Database Record',
            status: 'error',
            message: 'Video not found in database',
            details: {
              error: err.response?.data?.error || err.message,
              videoId: videoId
            }
          });
        }
      } else {
        diagnosticResults.checks.push({
          name: 'Video Database Record',
          status: 'warning',
          message: 'Video ID not provided - cannot check database',
          details: {
            note: 'Video ID is required to check database record'
          }
        });
      }

      // Check 4: Stream URL accessibility
      if (streamUrl) {
        try {
          const streamCheck = await fetch(streamUrl, {
            method: 'HEAD',
            signal: AbortSignal.timeout(10000)
          });
          
          diagnosticResults.checks.push({
            name: 'Stream URL Accessibility',
            status: streamCheck.ok ? 'success' : 'error',
            message: streamCheck.ok 
              ? 'Stream URL is accessible' 
              : `Stream URL returned status ${streamCheck.status}`,
            details: {
              status: streamCheck.status,
              statusText: streamCheck.statusText,
              contentType: streamCheck.headers.get('content-type'),
              contentLength: streamCheck.headers.get('content-length')
            }
          });
        } catch (err) {
          diagnosticResults.checks.push({
            name: 'Stream URL Accessibility',
            status: 'error',
            message: 'Cannot access stream URL',
            details: {
              error: err.message,
              url: streamUrl,
              suggestion: 'Check if the video file exists and the server can access it'
            }
          });
        }
      }

      // Check 5: Browser video format support
      const videoEl = document.createElement('video');
      const canPlayMP4 = videoEl.canPlayType('video/mp4');
      const canPlayWebM = videoEl.canPlayType('video/webm');
      const canPlayHLS = videoEl.canPlayType('application/vnd.apple.mpegurl');
      
      diagnosticResults.checks.push({
        name: 'Browser Video Format Support',
        status: 'success',
        message: 'Browser supports common video formats',
        details: {
          mp4: canPlayMP4 || 'Not supported',
          webm: canPlayWebM || 'Not supported',
          hls: canPlayHLS || 'Not supported (requires HLS.js)'
        }
      });

      // Check 6: Network connectivity
      try {
        const networkCheck = await fetch('https://www.google.com/favicon.ico', {
          method: 'HEAD',
          mode: 'no-cors',
          signal: AbortSignal.timeout(5000)
        });
        diagnosticResults.checks.push({
          name: 'Internet Connectivity',
          status: 'success',
          message: 'Internet connection is active',
          details: {}
        });
      } catch (err) {
        diagnosticResults.checks.push({
          name: 'Internet Connectivity',
          status: 'warning',
          message: 'Could not verify internet connectivity',
          details: {
            note: 'This may not affect local video playback'
          }
        });
      }

      // Check 7: CORS headers (if streamUrl provided)
      if (streamUrl) {
        try {
          // Try HEAD request first (for actual stream endpoint)
          let corsCheck;
          try {
            corsCheck = await fetch(streamUrl, {
              method: 'HEAD',
              signal: AbortSignal.timeout(5000)
            });
          } catch (headErr) {
            // If HEAD fails, try OPTIONS (for CORS preflight)
            try {
              corsCheck = await fetch(streamUrl, {
                method: 'OPTIONS',
                signal: AbortSignal.timeout(5000)
              });
            } catch (optErr) {
              // If both fail, try GET (even if 404, headers should be present)
              corsCheck = await fetch(streamUrl, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
              });
            }
          }
          
          const corsHeaders = {
            'Access-Control-Allow-Origin': corsCheck.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': corsCheck.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': corsCheck.headers.get('Access-Control-Allow-Headers'),
            'Access-Control-Expose-Headers': corsCheck.headers.get('Access-Control-Expose-Headers')
          };
          
          const hasCORS = Object.values(corsHeaders).some(h => h !== null && h !== '');
          
          diagnosticResults.checks.push({
            name: 'CORS Configuration',
            status: hasCORS ? 'success' : 'warning',
            message: hasCORS 
              ? 'CORS headers detected' 
              : 'CORS headers not detected (may still work)',
            details: corsHeaders
          });
        } catch (err) {
          diagnosticResults.checks.push({
            name: 'CORS Configuration',
            status: 'warning',
            message: 'Could not check CORS configuration',
            details: {
              error: err.message,
              note: 'CORS check failed, but this may not be an issue if the server sets CORS headers'
            }
          });
        }
      }

    } catch (err) {
      diagnosticResults.checks.push({
        name: 'Diagnostic Error',
        status: 'error',
        message: 'Error running diagnostics',
        details: {
          error: err.message
        }
      });
    }

    setResults(diagnosticResults);
    setRunning(false);
  };

  const copyDiagnostics = () => {
    const diagnosticText = JSON.stringify(results, null, 2);
    navigator.clipboard.writeText(diagnosticText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6" />
            <h2 className="text-xl font-bold">Video Diagnostic Tool</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!results && !running && (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                This diagnostic tool will check:
              </p>
              <ul className="text-left max-w-md mx-auto space-y-2 text-sm text-gray-600">
                <li>• Backend API connectivity</li>
                <li>• Video database record</li>
                <li>• File path resolution and existence</li>
                <li>• Stream URL accessibility</li>
                <li>• Browser video format support</li>
                <li>• Network connectivity</li>
                <li>• CORS configuration</li>
              </ul>
              <button
                onClick={runDiagnostics}
                className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-5 h-5" />
                Run Diagnostics
              </button>
            </div>
          )}

          {running && (
            <div className="text-center py-12">
              <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Running diagnostics...</p>
            </div>
          )}

          {results && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Diagnostic Results</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(results.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={copyDiagnostics}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm flex items-center gap-2 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={runDiagnostics}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Re-run
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {results.checks.map((check, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${
                      check.status === 'success'
                        ? 'border-green-200 bg-green-50'
                        : check.status === 'error'
                        ? 'border-red-200 bg-red-50'
                        : 'border-yellow-200 bg-yellow-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getStatusIcon(check.status)}
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {check.name}
                        </h4>
                        <p className="text-sm text-gray-700 mb-2">
                          {check.message}
                        </p>
                        {check.details && Object.keys(check.details).length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                              Show details
                            </summary>
                            <pre className="mt-2 text-xs bg-white p-3 rounded border overflow-x-auto">
                              {JSON.stringify(check.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-green-600 font-semibold">
                      {results.checks.filter(c => c.status === 'success').length} Passed
                    </span>
                  </div>
                  <div>
                    <span className="text-yellow-600 font-semibold">
                      {results.checks.filter(c => c.status === 'warning').length} Warnings
                    </span>
                  </div>
                  <div>
                    <span className="text-red-600 font-semibold">
                      {results.checks.filter(c => c.status === 'error').length} Failed
                    </span>
                  </div>
                </div>
              </div>

              {/* Video Info */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2">Video Information</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Video ID:</strong> {results.videoId}</p>
                  <p><strong>Stream URL:</strong> 
                    <a 
                      href={results.streamUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline ml-2 inline-flex items-center gap-1"
                    >
                      {results.streamUrl}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default VideoDiagnostic;

