const Loading = ({ progress }) => {
  return (
    <div 
      className="fixed inset-0 flex flex-col items-center justify-center z-50"
      style={{ 
        background: 'radial-gradient(circle at center, #fffdfb 0%, #f9f1ed 45%, #efe2da 100%)',
        backgroundColor: '#efe2da'
      }}
    >
      {/* Animated Heart */}
      <div className="heart-pulse mb-6">
        <svg 
          width="80" 
          height="80" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="text-pink-500"
        >
          <path 
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" 
            fill="currentColor"
            opacity="0.85"
          />
        </svg>
      </div>

      {/* Loading Text */}
      <div className="text-2xl text-gray-700 font-light mb-3 tracking-wide">
        Loading our memories… ❤️
      </div>

      {/* Progress Bar */}
      <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-pink-400 transition-all duration-300 ease-out rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Progress Percentage */}
      <div className="mt-3 text-sm text-gray-500">
        {progress}%
      </div>
    </div>
  );
};

export default Loading;
