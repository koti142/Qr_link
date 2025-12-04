import { QRCodeSVG } from 'qrcode.react';

function QRCodeViewer({ url, videoId }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div className="flex items-center justify-center">
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-3 rounded-lg border border-blue-200 shadow-sm">
          <QRCodeSVG value={url} size={180} className="w-full h-full" />
        </div>
      </div>
      <div className="w-full">
        <p className="text-xs font-semibold text-blue-700 mb-1.5 uppercase tracking-wide">Short URL:</p>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={url}
            readOnly
            className="flex-1 px-2.5 py-1.5 border border-blue-200 rounded-lg bg-blue-50 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-blue-200 text-blue-800 rounded-lg hover:bg-blue-300 text-xs font-medium shadow-sm transition-colors"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}

export default QRCodeViewer;

