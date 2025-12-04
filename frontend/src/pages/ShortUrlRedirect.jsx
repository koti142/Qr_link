import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

function ShortUrlRedirect() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleRedirect = async () => {
      if (!slug) {
        setError('Invalid URL');
        setLoading(false);
        return;
      }

      try {
        // First, try to get redirect info from API to find the target URL
        try {
          const response = await api.get(`/videos/redirect-info/${slug}`);
          if (response.data && response.data.target_url) {
            // Extract the path from the target URL (e.g., /stream/videoId)
            const targetUrl = response.data.target_url;
            let targetPath = targetUrl;
            
            // If it's a full URL, extract just the path
            if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
              const url = new URL(targetUrl);
              targetPath = url.pathname + url.search;
            }
            
            // Navigate to the stream page
            console.log('Redirecting to:', targetPath);
            navigate(targetPath, { replace: true });
            return;
          }
        } catch (fetchError) {
          console.log('Redirect API call failed, trying direct video lookup...', fetchError);
        }

        // If redirect API doesn't work, check if slug is a video_id by looking up in videos table
        // We need to check if there's a video with this slug as redirect_slug
        try {
          // Try to get video by checking if slug matches redirect_slug in database
          // Since we can't query directly, try fetching as video_id first
          const videoResponse = await api.get(`/videos/${slug}`);
          if (videoResponse.data) {
            // It's a valid video, redirect to stream page
            console.log('Found video, redirecting to stream:', slug);
            navigate(`/stream/${slug}`, { replace: true });
            return;
          }
        } catch (videoError) {
          console.log('Video lookup failed:', videoError);
        }

        // If we get here, the slug doesn't exist
        setError('Short URL not found');
        setLoading(false);
      } catch (err) {
        console.error('Redirect error:', err);
        setError('Failed to redirect');
        setLoading(false);
      }
    };

    handleRedirect();
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default ShortUrlRedirect;

