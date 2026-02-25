const PageNumber = ({ pageNumber, isLeftPage, totalPages }) => {
  // Hide on cover (page 1) and last page
  if (pageNumber === 1 || pageNumber === totalPages) {
    return null;
  }

  return (
    <div 
      className={`absolute bottom-6 ${isLeftPage ? 'left-6' : 'right-6'} text-gray-600 opacity-40 pointer-events-none select-none`}
      style={{ fontFamily: 'Georgia, serif' }}
    >
      <span className="text-sm tracking-wider">— {pageNumber} —</span>
    </div>
  );
};

export default PageNumber;
