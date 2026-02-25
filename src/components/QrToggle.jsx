import { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const QrToggle = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  if (!url) return null;

  return (
    <>
      {/* Floating QR Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center z-40 hover:scale-110 transition-transform duration-200"
          aria-label="Show QR Code"
        >
          <span className="text-2xl">📱</span>
        </button>
      )}

      {/* QR Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl p-4 shadow-2xl relative animate-scale-in"
            style={{ 
              maxWidth: 'min(85vw, 85vh, 320px)',
              maxHeight: '85vh'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button - positioned outside the QR area */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors z-10 border border-gray-200"
              aria-label="Close"
            >
              <span className="text-lg text-gray-600 leading-none">×</span>
            </button>

            {/* QR Code - responsive sizing based on viewport */}
            <div className="bg-white rounded-lg mb-2 flex items-center justify-center">
              <QRCodeCanvas 
                value={url} 
                size={Math.min(window.innerWidth * 0.5, window.innerHeight * 0.45, 180)}
                level="H"
                includeMargin={false}
              />
            </div>

            {/* Caption */}
            <div className="text-center">
              <p className="text-gray-700 font-medium text-xs sm:text-sm">Scan to open on phone</p>
              <p className="text-pink-500 text-xs">❤️</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QrToggle;
