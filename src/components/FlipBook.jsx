import { useEffect, useRef, useState } from 'react';
import { PageFlip } from 'page-flip';
import Loading from './Loading';
import PageIndicator from './PageIndicator';
import PageNumber from './PageNumber';

const FlipBook = () => {
  // CONFIGURATION: Update this to match your number of pages
  const PAGE_COUNT = 52;
  // PageFlip starts from page 2 (cover is separate)
  const FLIP_PAGE_COUNT = PAGE_COUNT - 1;
  
  const bookRef = useRef(null);
  const pageFlipRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 550, height: 733 });
  const [currentPage, setCurrentPage] = useState(2); // Start from page 2
  const [isSinglePage, setIsSinglePage] = useState(false);

  // Calculate responsive book dimensions based on viewport
  const calculateDimensions = () => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Use actual book/page aspect ratio matching FlipHTML5
    const aspectRatio = 4 / 3; // width/height ratio of a single page
    
    // Account for padding and margins
    const padding = viewportWidth < 768 ? 20 : 40;
    const availableWidth = viewportWidth - padding;
    const availableHeight = viewportHeight - padding;
    
    let bookWidth, bookHeight;
    
    if (viewportWidth < 768) {
      // Mobile: optimize for single page view with stretch sizing
      bookHeight = Math.min(availableHeight, 700);
      bookWidth = bookHeight * aspectRatio;
      
      // Clamp to min/max
      bookWidth = Math.max(320, Math.min(bookWidth, availableWidth));
      bookHeight = bookWidth / aspectRatio;
      
      // Ensure height constraint
      if (bookHeight < 450) {
        bookHeight = 450;
        bookWidth = bookHeight * aspectRatio;
      }
    } else {
      // Desktop: optimize for double page spread
      const maxSpreadWidth = availableWidth;
      const maxSpreadHeight = availableHeight;
      
      // Calculate based on height constraint first
      bookHeight = Math.min(maxSpreadHeight, 800);
      bookWidth = bookHeight * aspectRatio;
      
      // Ensure width fits
      const maxBookWidth = Math.min(maxSpreadWidth / 2, 900);
      if (bookWidth > maxBookWidth) {
        bookWidth = maxBookWidth;
        bookHeight = bookWidth / aspectRatio;
      }
    }
    
    return {
      width: Math.floor(bookWidth),
      height: Math.floor(bookHeight)
    };
  };

  // Preload all images before initializing the flipbook
  const preloadImages = () => {
    return new Promise((resolve, reject) => {
      const imagePromises = [];
      let loadedCount = 0;

      // Start from page 2 (skip cover)
      for (let i = 2; i <= PAGE_COUNT; i++) {
        const promise = new Promise((imgResolve, imgReject) => {
          const img = new Image();
          img.onload = () => {
            loadedCount++;
            setLoadProgress(Math.round((loadedCount / FLIP_PAGE_COUNT) * 100));
            imgResolve();
          };
          img.onerror = () => {
            console.warn(`Failed to load image: ${i}.png`);
            loadedCount++;
            setLoadProgress(Math.round((loadedCount / FLIP_PAGE_COUNT) * 100));
            imgResolve(); // Continue even if an image fails
          };
          img.src = `/pages/${i}.png`;
        });
        imagePromises.push(promise);
      }

      Promise.all(imagePromises)
        .then(() => resolve())
        .catch(() => reject());
    });
  };

  useEffect(() => {
    // Calculate initial dimensions
    const dims = calculateDimensions();
    setDimensions(dims);

    // Preload images first
    preloadImages()
      .then(() => {
        setLoading(false);
        // Wait for next render cycle
        setTimeout(() => {
          setIsReady(true);
        }, 100);
      })
      .catch((error) => {
        console.error('Error preloading images:', error);
        setLoading(false);
      });

    // Handle window resize
    const handleResize = () => {
      const newDims = calculateDimensions();
      setDimensions(newDims);
      
      // Reinitialize flipbook with new dimensions if already created
      if (pageFlipRef.current && !loading) {
        setTimeout(() => {
          if (pageFlipRef.current) {
            try {
              pageFlipRef.current.destroy();
            } catch (e) {
            }
          }
          initializeFlipBook();
        }, 200);
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      if (pageFlipRef.current) {
        try {
          pageFlipRef.current.destroy();
        } catch (e) {
        }
      }
    };
  }, []);

  useEffect(() => {
    if (isReady && !loading) {
      // Initialize after DOM is ready
      setTimeout(() => {
        initializeFlipBook();
      }, 300);
    }
  }, [isReady, loading]);

  const initializeFlipBook = () => {
    if (!bookRef.current) {
      console.error('Book ref is not ready');
      return;
    }

    const pages = bookRef.current.querySelectorAll('.page');
    if (pages.length === 0) {
      console.error('No pages found');
      return;
    }


    try {
      const isMobile = window.innerWidth < 768;
      
      // Initialize PageFlip matching FlipHTML5 paper curl style
      const pageFlip = new PageFlip(bookRef.current, {
        width: dimensions.width,
        height: dimensions.height,
        size: isMobile ? 'stretch' : 'fixed',
        minWidth: 320,
        maxWidth: 900,
        minHeight: 450,
        maxHeight: 700,
        maxShadowOpacity: 0.45,
        showCover: true,
        mobileScrollSupport: false,
        swipeDistance: 30,
        clickEventForward: true,
        usePortrait: false,
        startPage: 0,
        startZIndex: 0,
        drawShadow: true,
        flippingTime: 950,
        useMouseEvents: true,
        showPageCorners: true,
        disableFlipByClick: false,
      });
      

      // Load pages from the container
      pageFlip.loadFromHTML(pages);

      // Store reference
      pageFlipRef.current = pageFlip;


      // Event listeners
      pageFlip.on('flip', (e) => {
        // Add 1 to account for cover (page 1) being separate
        const page = e.data + 2;
        setCurrentPage(page);
        
        // Check if we're on last page
        const isOnLastPage = page === PAGE_COUNT;
        setIsSinglePage(isOnLastPage);
        
        // Enforce symmetric animation on both directions
        document.querySelectorAll('.stf__item').forEach(el => {
          el.style.transition = 'transform 0.95s cubic-bezier(.22,.61,.36,1)';
        });
        
      });

      pageFlip.on('changeState', (e) => {
      });

      pageFlip.on('changeOrientation', (e) => {
      });
    } catch (error) {
      console.error('Error initializing PageFlip:', error);
    }
  };

  // Show loading screen while preloading
  if (loading) {
    return <Loading progress={loadProgress} />;
  }

  return (
    <>
      <div className="book-stage w-full h-full flex items-center justify-center absolute inset-0">
        {/* Book wrapper - no fake spines */}
        <div className={`relative book-container ${isSinglePage ? 'single-page-mode' : ''}`}>
          
          {/* Book container with clean shadows - NO FAKE SPINES */}
          <div className="book-wrapper-clean rounded-xl overflow-hidden">
            {/* Vignette overlay */}
            <div className="vignette" />
            
            <div ref={bookRef} id="flipbook" className="flipbook-container">
              {/* Generate pages starting from page 2 */}
              {Array.from({ length: FLIP_PAGE_COUNT }, (_, i) => i + 2).map((pageNum) => {
                // Determine if this is a left or right page
                const isLeftPage = pageNum % 2 === 0;
                const isBackCover = pageNum === PAGE_COUNT;
                
                return (
                <div key={pageNum} className={`page ${isBackCover ? 'cover-page' : 'regular-page'}`} data-density="hard">
                  {isBackCover ? (
                    <div className="paper-cover">
                      <img
                        src={`/pages/${pageNum}.png`}
                        alt={`Page ${pageNum}`}
                        loading="eager"
                        className="cover-photo"
                      />
                    </div>
                  ) : (
                    <img
                      src={`/pages/${pageNum}.png`}
                      alt={`Page ${pageNum}`}
                      loading="eager"
                    />
                  )}
                  
                  {/* Page Number */}
                  <PageNumber 
                    pageNumber={pageNum} 
                    isLeftPage={isLeftPage} 
                    totalPages={PAGE_COUNT} 
                  />
            
                  {/* Optional: Embed video on last page */}
                  {pageNum === PAGE_COUNT && false && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white">
                      <video
                        controls
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="max-w-full max-h-full"
                      >
                        <source src="/video.mp4" type="video/mp4" />
                      </video>
                    </div>
                  )}
                </div>
              );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Page indicator */}
      {!loading && <PageIndicator currentPage={currentPage} totalPages={PAGE_COUNT} />}
    </>
  );
};

export default FlipBook;
