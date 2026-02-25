const PageIndicator = ({ currentPage, totalPages }) => {
  const pagesLeft = totalPages - currentPage;
  const progressPercent = (currentPage / totalPages) * 100;

  return (
    <div className="fixed bottom-4 left-0 right-0 z-30 flex flex-col items-center animate-fade-in">
      <div className="px-5 py-2.5 rounded-full shadow-lg bg-white/90 backdrop-blur-sm border border-gray-100">
        <p className="text-sm font-medium text-gray-700 tracking-wide">
          Page <span className="font-semibold text-gray-900">{currentPage}</span> of {totalPages} 
          <span className="mx-1.5">•</span>
          <span className="text-pink-500">{pagesLeft} left ❤️</span>
        </p>
      </div>
      {/* Mini progress bar */}
      <div className="mt-2 w-48 h-[3px] rounded-sm bg-gray-200/50 overflow-hidden">
        <div 
          className="h-full rounded-sm transition-all duration-300 ease-out"
          style={{ 
            width: `${progressPercent}%`,
            background: '#ffb6c1',
            opacity: 0.6
          }}
        />
      </div>
    </div>
  );
};

export default PageIndicator;
