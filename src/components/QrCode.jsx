import { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const QrCode = () => {
  const [url, setUrl] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Get current URL
    setUrl(window.location.href);
    
    // Fade in after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (!url) return null;

  return (
    <div 
      className={`fixed bottom-5 right-5 bg-white rounded-xl shadow-2xl p-4 transition-all duration-700 z-40 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ maxWidth: '160px' }}
    >
      {/* QR Code */}
      <div className="bg-white p-2 rounded-lg">
        <QRCodeCanvas 
          value={url} 
          size={120}
          level="H"
          includeMargin={false}
        />
      </div>

      {/* Caption */}
      <div className="text-center mt-3 text-xs text-gray-600 leading-tight">
        Scan to open<br />on phone ❤️
      </div>
    </div>
  );
};

export default QrCode;
