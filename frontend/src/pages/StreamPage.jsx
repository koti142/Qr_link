import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import api from '../services/api';

function StreamPage() {
  const { videoId } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playerError, setPlayerError] = useState(null);

  useEffect(() => {
    if (!videoId) {
      setError('Video ID is required');
      setLoading(false);
      return;
    }

    const fetchVideo = async () => {
      try {
        const response = await api.get(`/videos/${videoId}`);
        setVideo(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load video');
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [videoId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Error</h1>
          <p className="text-white mb-4">{error || 'Video not found'}</p>
          {videoId && (
            <Link
              to={`/diagnostic?videoId=${videoId}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Run Diagnostics</span>
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Always use the streaming endpoint URL, not the static file URL
  const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  const streamingUrl = `${backendUrl}/api/videos/${video.video_id}/stream`;
  
  console.log('Video ID:', video.video_id);
  console.log('Backend URL:', backendUrl);
  console.log('Final Streaming URL:', streamingUrl);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-7xl">
        {/* Diagnostic Button */}
        <div className="mb-4 flex justify-end">
          <Link
            to={`/diagnostic?videoId=${video.video_id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            target="_blank"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Run Diagnostics</span>
          </Link>
        </div>

        {streamingUrl ? (
          <>
            <VideoPlayer 
              src={streamingUrl} 
              captions={video.captions || []} 
              autoplay={false}
            />
            {playerError && (
              <div className="mt-4 p-4 bg-red-900 text-white rounded">
                <p className="font-bold">Error:</p>
                <p>{playerError}</p>
                <p className="text-sm mt-2">URL: {streamingUrl}</p>
                <Link
                  to={`/diagnostic?videoId=${video.video_id}`}
                  className="mt-3 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
                >
                  Run Diagnostics to Fix
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="text-white text-center">
            <p>Streaming URL not available</p>
            <p className="text-sm mt-2">Video ID: {video.video_id}</p>
            <Link
              to={`/diagnostic?videoId=${video.video_id}`}
              className="mt-4 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            >
              Run Diagnostics
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default StreamPage;

