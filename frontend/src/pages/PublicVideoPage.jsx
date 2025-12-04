import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Download, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import VideoPlayer from '../components/VideoPlayer';
import QRCodeViewer from '../components/QRCodeViewer';
import api from '../services/api';

function PublicVideoPage() {
  const { videoId } = useParams();
  const [searchParams] = useSearchParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isEmbed = searchParams.get('embed') === 'true';
  const printRef = useRef(null);

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">{error || 'Video not found'}</p>
        </div>
      </div>
    );
  }

  const redirectUrl = `${window.location.origin}/${video.redirect_slug}`;
  const streamUrl = `${window.location.origin}/stream/${video.video_id}`;

  const handleDownloadPDF = async () => {
    try {
      // Dynamic import of html2canvas and jspdf
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const element = printRef.current;
      if (!element) {
        alert('Print content not found');
        return;
      }

      // Show the element temporarily for capture
      element.style.display = 'block';
      element.style.position = 'absolute';
      element.style.left = '-9999px';
      element.style.top = '0';

      // Wait a bit for rendering
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        foreignObjectRendering: true,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });

      // Hide element again
      element.style.display = 'none';
      element.style.position = '';

      const imgData = canvas.toDataURL('image/png', 1.0);
      
      if (!imgData || imgData === 'data:,') {
        throw new Error('Failed to capture image');
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${video.video_id}_qr_code.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`Failed to generate PDF: ${error.message}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`w-full px-4 sm:px-6 lg:px-8 py-8 ${isEmbed ? '' : 'min-h-screen'}`}>
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-blue-100 aspect-video">
            <VideoPlayer src={video.streaming_url} captions={video.captions || []} />
          </div>
          
          {/* Video Title Section */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-md p-6 border border-blue-200">
            <h1 className="text-4xl font-bold mb-4 text-gray-900 bg-white px-4 py-3 rounded-lg shadow-sm border border-blue-200">
              {video.title || 'Untitled Video'}
            </h1>
            
            {/* Description */}
            {video.description && (
              <div className="mb-6 bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
                <h3 className="text-sm font-semibold text-purple-700 mb-2 uppercase tracking-wide">Description</h3>
                <p className="text-gray-800 text-lg leading-relaxed">{video.description}</p>
              </div>
            )}
          </div>

          {/* Course Information Section */}
          <div className="mt-6 bg-white rounded-xl shadow-md p-6 border border-blue-200 w-full">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
              <span className="w-1 h-8 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full"></span>
              Course Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {video.course && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide block mb-1">Course</span>
                  <span className="text-lg font-bold text-blue-900">{video.course}</span>
                </div>
              )}
              {video.grade && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <span className="text-xs font-semibold text-green-600 uppercase tracking-wide block mb-1">Grade</span>
                  <span className="text-lg font-bold text-green-900">{video.grade}</span>
                </div>
              )}
              {video.lesson && (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide block mb-1">Lesson</span>
                  <span className="text-lg font-bold text-purple-900">{video.lesson}</span>
                </div>
              )}
              {video.module && (
                <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
                  <span className="text-xs font-semibold text-pink-600 uppercase tracking-wide block mb-1">Module</span>
                  <span className="text-lg font-bold text-pink-900">{video.module}</span>
                </div>
              )}
              {video.activity && (
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide block mb-1">Activity</span>
                  <span className="text-lg font-bold text-orange-900">{video.activity}</span>
                </div>
              )}
              {video.topic && (
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 md:col-span-2">
                  <span className="text-xs font-semibold text-yellow-600 uppercase tracking-wide block mb-1">Topic</span>
                  <span className="text-lg font-bold text-yellow-900">{video.topic}</span>
                </div>
              )}
            </div>
          </div>

          {/* Video Details Section - YouTube Format */}
          <div className="mt-4 border-t border-gray-200 pt-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
              {video.size > 0 && (
                <>
                  <span className="font-semibold text-gray-700">Size:</span>
                  <span className="text-gray-800">{(video.size / 1024 / 1024).toFixed(2)} MB</span>
                  <span className="text-gray-400">•</span>
                </>
              )}
              {video.duration > 0 && (
                <>
                  <span className="font-semibold text-gray-700">Duration:</span>
                  <span className="text-gray-800">{Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}</span>
                  <span className="text-gray-400">•</span>
                </>
              )}
              <span className="font-semibold text-gray-700">Version:</span>
              <span className="text-gray-800">v{video.version}</span>
              {video.created_at && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">
                    {new Date(video.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </>
              )}
            </div>
          </div>

          {video.relatedVideos && video.relatedVideos.length > 0 && (
            <div className="mt-6 bg-white rounded-xl shadow-md p-6 border border-blue-200">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                <span className="w-1 h-8 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full"></span>
                Related Videos
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {video.relatedVideos.map((related) => (
                  <a
                    key={related.id}
                    href={`/video/${related.video_id}`}
                    className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300"
                  >
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{related.title}</h3>
                    <div className="flex flex-wrap gap-2 text-sm">
                      {related.grade && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md font-medium">
                          {related.grade}
                        </span>
                      )}
                      {related.lesson && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md font-medium">
                          {related.lesson}
                        </span>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6">
          {!isEmbed && (
            <>
              {/* QR Code - Match video player height */}
              <div className="aspect-video">
                <QRCodeViewer url={redirectUrl} videoId={video.video_id} />
              </div>
              
              {/* Streaming URL - Match header/description block height */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-blue-200 h-fit">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-1 h-6 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full"></span>
                    Streaming URL
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDownloadPDF}
                      className="px-3 py-2 bg-blue-200 text-blue-800 rounded-lg hover:bg-blue-300 font-medium text-xs shadow-sm transition-colors flex items-center gap-1"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </button>
                    <button
                      onClick={handlePrint}
                      className="px-3 py-2 bg-purple-200 text-purple-800 rounded-lg hover:bg-purple-300 font-medium text-xs shadow-sm transition-colors flex items-center gap-1"
                      title="Print"
                    >
                      <Printer className="w-4 h-4" />
                      Print
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-green-700 mb-2 uppercase tracking-wide">Stream URL:</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={streamUrl}
                        className="flex-1 px-3 py-2 border border-green-200 rounded-lg bg-green-50 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-300"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(streamUrl);
                          alert('Streaming URL copied to clipboard!');
                        }}
                        className="px-4 py-2 bg-green-200 text-green-800 rounded-lg hover:bg-green-300 font-medium text-sm whitespace-nowrap shadow-sm transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <a
                    href={`/stream/${video.video_id}`}
                    target="_blank"
                    className="block px-4 py-3 bg-gradient-to-r from-blue-200 to-purple-200 text-blue-900 rounded-lg hover:from-blue-300 hover:to-purple-300 font-semibold text-sm text-center shadow-sm transition-all duration-300"
                  >
                    Open Stream Page
                  </a>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Printable Content - Hidden from screen, visible when printing */}
        <div 
          ref={printRef} 
          className="bg-white p-8" 
          style={{ 
            display: 'none',
            position: 'absolute',
            left: '-9999px',
            top: '0',
            width: '210mm',
            minHeight: '297mm'
          }}
        >
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8 border-b-2 border-gray-300 pb-4">
              <h1 className="text-3xl font-bold mb-4 text-gray-900">{video.title || 'Untitled Video'}</h1>
              {video.description && (
                <p className="text-lg text-gray-700">{video.description}</p>
              )}
            </div>

            {/* Main Content - Two Columns */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Left Column - QR Code */}
              <div className="border-2 border-gray-200 p-6 rounded-lg">
                <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center">QR Code</h2>
                <div className="flex justify-center mb-6 p-4 bg-white border-2 border-gray-300 rounded-lg">
                  <QRCodeSVG 
                    value={redirectUrl} 
                    size={250}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-sm font-bold mb-1 text-gray-700">Redirect URL:</p>
                    <p className="text-xs font-mono break-all text-gray-800 bg-gray-50 p-2 rounded border">{redirectUrl}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold mb-1 text-gray-700">Streaming URL:</p>
                    <p className="text-xs font-mono break-all text-gray-800 bg-gray-50 p-2 rounded border">{streamUrl}</p>
                  </div>
                </div>
              </div>

              {/* Right Column - Video Information */}
              <div className="border-2 border-gray-200 p-6 rounded-lg">
                <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center">Video Information</h2>
                <div className="space-y-4 text-sm">
                  {video.course && (
                    <div className="border-b border-gray-200 pb-2">
                      <span className="font-bold text-gray-700">Course: </span>
                      <span className="text-gray-900">{video.course}</span>
                    </div>
                  )}
                  {video.grade && (
                    <div className="border-b border-gray-200 pb-2">
                      <span className="font-bold text-gray-700">Grade: </span>
                      <span className="text-gray-900">{video.grade}</span>
                    </div>
                  )}
                  {video.lesson && (
                    <div className="border-b border-gray-200 pb-2">
                      <span className="font-bold text-gray-700">Lesson: </span>
                      <span className="text-gray-900">{video.lesson}</span>
                    </div>
                  )}
                  {video.module && (
                    <div className="border-b border-gray-200 pb-2">
                      <span className="font-bold text-gray-700">Module: </span>
                      <span className="text-gray-900">{video.module}</span>
                    </div>
                  )}
                  {video.activity && (
                    <div className="border-b border-gray-200 pb-2">
                      <span className="font-bold text-gray-700">Activity: </span>
                      <span className="text-gray-900">{video.activity}</span>
                    </div>
                  )}
                  {video.topic && (
                    <div className="border-b border-gray-200 pb-2">
                      <span className="font-bold text-gray-700">Topic: </span>
                      <span className="text-gray-900">{video.topic}</span>
                    </div>
                  )}
                  {video.size > 0 && (
                    <div className="border-b border-gray-200 pb-2">
                      <span className="font-bold text-gray-700">Size: </span>
                      <span className="text-gray-900">{(video.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  )}
                  {video.duration > 0 && (
                    <div className="border-b border-gray-200 pb-2">
                      <span className="font-bold text-gray-700">Duration: </span>
                      <span className="text-gray-900">{Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}</span>
                    </div>
                  )}
                  <div className="border-b border-gray-200 pb-2">
                    <span className="font-bold text-gray-700">Version: </span>
                    <span className="text-gray-900">v{video.version}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t-2 border-gray-300 text-center text-xs text-gray-500">
              <p>Video Delivery System - {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicVideoPage;

