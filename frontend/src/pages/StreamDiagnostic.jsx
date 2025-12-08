import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { getBackendUrl, getApiUrl } from '../utils/backendUrl.js';

function StreamDiagnostic() {
  const { videoId } = useParams();
  const [searchParams] = useSearchParams();
  const testVideoId = searchParams.get('videoId') || videoId;
  
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [videoData, setVideoData] = useState(null);

  const addResult = (test, status, message, details = {}) => {
    setResults(prev => [...prev, {
      test,
      status, // 'success', 'error', 'warning'
      message,
      details,
      timestamp: new Date().toISOString()
    }]);
  };

  const runDiagnostics = async () => {
    setResults([]);
    setRunning(true);
    setVideoData(null);

    const backendUrl = getBackendUrl();
    const apiUrl = getApiUrl();

    // Test 1: Backend connectivity
    addResult('Backend Connectivity', 'info', 'Testing backend server...');
    try {
      const response = await fetch(`${apiUrl}/videos`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        addResult('Backend Connectivity', 'success', 'Backend server is reachable', {
          status: response.status,
          url: `${apiUrl}/videos`
        });
      } else {
        addResult('Backend Connectivity', 'error', `Backend returned status ${response.status}`, {
          status: response.status,
          statusText: response.statusText
        });
      }
    } catch (error) {
      addResult('Backend Connectivity', 'error', 'Cannot reach backend server', {
        error: error.message,
        url: apiUrl
      });
      setRunning(false);
      return;
    }

    // Test 2: Video ID validation
    if (!testVideoId) {
      addResult('Video ID', 'error', 'No video ID provided');
      setRunning(false);
      return;
    }
    addResult('Video ID', 'success', `Video ID: ${testVideoId}`);

    // Test 3: Get video from database
    addResult('Database Query', 'info', 'Fetching video from database...');
    try {
      const response = await api.get(`/videos/${testVideoId}`);
      const video = response.data;
      setVideoData(video);
      addResult('Database Query', 'success', 'Video found in database', {
        videoId: video.video_id,
        title: video.title,
        filePath: video.file_path,
        size: video.size,
        duration: video.duration,
        status: video.status,
        version: video.version
      });
    } catch (error) {
      const errorDetails = {
        error: error.response?.data?.error || error.message,
        status: error.response?.status,
        videoId: testVideoId
      };
      
      // Try to get more info about why it failed
      if (error.response?.status === 404) {
        errorDetails.message = 'Video not found. Possible reasons:';
        errorDetails.reasons = [
          'Video ID does not exist in database',
          'Video status is not "active"',
          'Video was deleted or archived'
        ];
      }
      
      addResult('Database Query', 'error', 'Video not found in database', errorDetails);
      setRunning(false);
      return;
    }

    // Test 4: Streaming endpoint - HEAD request
    const streamingUrl = `${backendUrl}/api/videos/${testVideoId}/stream`;
    addResult('Streaming Endpoint (HEAD)', 'info', 'Testing streaming endpoint with HEAD request...');
    try {
      const headResponse = await fetch(streamingUrl, {
        method: 'HEAD',
        headers: {
          'Range': 'bytes=0-1023'
        }
      });
      
      const headers = {};
      headResponse.headers.forEach((value, key) => {
        headers[key] = value;
      });

      if (headResponse.ok || headResponse.status === 206) {
        addResult('Streaming Endpoint (HEAD)', 'success', 'Streaming endpoint is accessible', {
          status: headResponse.status,
          contentType: headers['content-type'],
          contentLength: headers['content-length'],
          acceptRanges: headers['accept-ranges'],
          contentRange: headers['content-range'],
          cors: headers['access-control-allow-origin']
        });
      } else {
        addResult('Streaming Endpoint (HEAD)', 'error', `Streaming endpoint returned ${headResponse.status}`, {
          status: headResponse.status,
          statusText: headResponse.statusText,
          headers
        });
      }
    } catch (error) {
      addResult('Streaming Endpoint (HEAD)', 'error', 'Cannot access streaming endpoint', {
        error: error.message
      });
    }

    // Test 5: CORS check
    addResult('CORS Check', 'info', 'Testing CORS headers...');
    try {
      const corsResponse = await fetch(streamingUrl, {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Range'
        }
      });
      const corsHeaders = {};
      corsResponse.headers.forEach((value, key) => {
        corsHeaders[key] = value;
      });
      
      if (corsHeaders['access-control-allow-origin']) {
        addResult('CORS Check', 'success', 'CORS headers are present', {
          allowOrigin: corsHeaders['access-control-allow-origin'],
          allowMethods: corsHeaders['access-control-allow-methods'],
          allowHeaders: corsHeaders['access-control-allow-headers']
        });
      } else {
        addResult('CORS Check', 'warning', 'CORS headers may be missing', {
          headers: corsHeaders
        });
      }
    } catch (error) {
      addResult('CORS Check', 'error', 'CORS preflight failed', {
        error: error.message
      });
    }

    // Test 6: Range request test
    addResult('Range Request', 'info', 'Testing HTTP range request support...');
    try {
      const rangeResponse = await fetch(streamingUrl, {
        method: 'GET',
        headers: {
          'Range': 'bytes=0-1023'
        }
      });

      if (rangeResponse.status === 206) {
        const rangeHeaders = {};
        rangeResponse.headers.forEach((value, key) => {
          rangeHeaders[key] = value;
        });
        addResult('Range Request', 'success', 'Range requests are supported', {
          status: rangeResponse.status,
          contentRange: rangeHeaders['content-range'],
          contentLength: rangeHeaders['content-length']
        });
      } else if (rangeResponse.status === 200) {
        addResult('Range Request', 'warning', 'Range requests not supported, full file returned', {
          status: rangeResponse.status
        });
      } else {
        addResult('Range Request', 'error', `Range request failed with status ${rangeResponse.status}`, {
          status: rangeResponse.status
        });
      }
    } catch (error) {
      addResult('Range Request', 'error', 'Range request failed', {
        error: error.message
      });
    }

    // Test 7: Video format check
    if (videoData?.file_path) {
      const ext = videoData.file_path.split('.').pop()?.toLowerCase();
      const supportedFormats = ['mp4', 'webm', 'ogg'];
      const isSupported = supportedFormats.includes(ext);
      
      addResult('Video Format', isSupported ? 'success' : 'warning', 
        `Video format: ${ext?.toUpperCase() || 'unknown'}`, {
        extension: ext,
        supported: isSupported,
        supportedFormats: supportedFormats.join(', ')
      });
    }

    // Test 8: Direct video element test
    addResult('Video Element Test', 'info', 'Testing with HTML5 video element...');
    const videoTest = document.createElement('video');
    videoTest.src = streamingUrl;
    videoTest.preload = 'metadata';
    
    const videoTestPromise = new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Timeout waiting for video metadata' });
      }, 10000);

      videoTest.addEventListener('loadedmetadata', () => {
        clearTimeout(timeout);
        resolve({
          success: true,
          videoWidth: videoTest.videoWidth,
          videoHeight: videoTest.videoHeight,
          duration: videoTest.duration,
          readyState: videoTest.readyState
        });
      });

      videoTest.addEventListener('error', (e) => {
        clearTimeout(timeout);
        const error = videoTest.error;
        let errorMsg = 'Unknown error';
        if (error) {
          switch (error.code) {
            case error.MEDIA_ERR_ABORTED:
              errorMsg = 'Video loading aborted';
              break;
            case error.MEDIA_ERR_NETWORK:
              errorMsg = 'Network error';
              break;
            case error.MEDIA_ERR_DECODE:
              errorMsg = 'Video decoding error';
              break;
            case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
              errorMsg = 'Video format not supported';
              break;
          }
        }
        resolve({
          success: false,
          error: errorMsg,
          errorCode: error?.code,
          errorMessage: error?.message
        });
      });
    });

    const videoTestResult = await videoTestPromise;
    if (videoTestResult.success) {
      addResult('Video Element Test', 'success', 'Video metadata loaded successfully', videoTestResult);
    } else {
      addResult('Video Element Test', 'error', videoTestResult.error, videoTestResult);
    }

    // Test 9: Network information
    if (navigator.connection) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      addResult('Network Info', 'info', 'Network connection information', {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      });
    }

    setRunning(false);
  };

  useEffect(() => {
    if (testVideoId) {
      runDiagnostics();
    }
  }, [testVideoId]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 border-green-300';
      case 'error': return 'bg-red-100 text-red-800 border-red-300';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✓';
      case 'error': return '✗';
      case 'warning': return '⚠';
      default: return 'ℹ';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Video Streaming Diagnostic Tool</h1>
          <p className="text-gray-600 mb-4">
            This tool tests various aspects of video streaming to help identify issues.
          </p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video ID to Test:
            </label>
            <input
              type="text"
              defaultValue={testVideoId || ''}
              placeholder="Enter video ID (e.g., dxssd_sddsds_dsdsds_dsdsds_dsdsds)"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  window.location.href = `/diagnostic?videoId=${e.target.value}`;
                }
              }}
            />
            <p className="mt-2 text-sm text-gray-500">
              Or use URL: <code className="bg-gray-100 px-2 py-1 rounded">/diagnostic?videoId=YOUR_VIDEO_ID</code>
            </p>
          </div>

          <button
            onClick={runDiagnostics}
            disabled={running}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {running ? 'Running Diagnostics...' : 'Run Diagnostics'}
          </button>
        </div>

        {videoData && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Video Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Video ID:</p>
                <p className="font-mono text-sm">{videoData.video_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Title:</p>
                <p className="font-semibold">{videoData.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">File Path:</p>
                <p className="font-mono text-xs break-all">{videoData.file_path}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Size:</p>
                <p>{videoData.size ? `${(videoData.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Test Results</h2>
          {results.length === 0 ? (
            <p className="text-gray-500">No tests run yet. Enter a video ID and click "Run Diagnostics".</p>
          ) : (
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold">{getStatusIcon(result.status)}</span>
                        <h3 className="font-semibold">{result.test}</h3>
                      </div>
                      <p className="text-sm mb-2">{result.message}</p>
                      {Object.keys(result.details).length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm font-medium">Details</summary>
                          <pre className="mt-2 text-xs bg-white bg-opacity-50 p-2 rounded overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                    <span className="text-xs opacity-75">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {results.length > 0 && !running && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Summary</h3>
            <p className="text-sm text-blue-800">
              {results.filter(r => r.status === 'success').length} tests passed,{' '}
              {results.filter(r => r.status === 'error').length} tests failed,{' '}
              {results.filter(r => r.status === 'warning').length} warnings
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default StreamDiagnostic;

