import { useState } from 'react';

const Cover = ({ onEnter, totalPages }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="fixed inset-0 bg-book-bg flex items-center justify-center">
      <div 
        className="relative cursor-pointer transition-transform duration-300 hover:scale-105"
        onClick={onEnter}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Paper cover with mounted photo */}
        <div className="paper-cover-standalone">
          <img
            src="/pages/1.png"
            alt="Cover"
            className="cover-photo-standalone"
          />
        </div>
        
        {/* Click to open hint */}
        {isHovered && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm whitespace-nowrap animate-fade-in">
            Click to open ❤️
          </div>
        )}
      </div>
    </div>
  );
};

export default Cover;
