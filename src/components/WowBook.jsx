import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import PageIndicator from './PageIndicator';
import Loading from './Loading';
import QrToggle from './QrToggle';

// WowBook and jQuery will be loaded via script tags in index.html
// They attach to the global window object

const WowBook = () => {
  const PAGE_COUNT = 52;
  const bookRef = useRef(null);
  const bookWrapperRef = useRef(null);
  const wowBookInstance = useRef(null);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [imagesReady, setImagesReady] = useState(false);
  const [libraryReady, setLibraryReady] = useState(false);
  const [musicStarted, setMusicStarted] = useState(false);
  const [volume, setVolume] = useState(0.60);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(0.60);
  const [isLastPage, setIsLastPage] = useState(false);
  const [pianoEnabled, setPianoEnabled] = useState(true);
  const [flipSoundEnabled, setFlipSoundEnabled] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isIOSFullscreen, setIsIOSFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);
  const [mobileCurrentPage, setMobileCurrentPage] = useState(1);
  const musicRef = useRef(null);
  const flipRef = useRef(null);
  const heartsIntervalRef = useRef(null);
  const pianoEnabledRef = useRef(true);
  const flipSoundEnabledRef = useRef(false);
  const isMutedRef = useRef(false); // Ref to track mute state in closures
  const bookContainerRef = useRef(null);
  const mobileGalleryRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const didSwipe = useRef(false);
  const [flipDirection, setFlipDirection] = useState(null); // 'next' or 'prev'
  const [isFlipping, setIsFlipping] = useState(false);
  
  // Autoplay state
  const [autoDirection, setAutoDirection] = useState(null); // "forward" | "backward" | null
  const autoPlayRef = useRef(null);
  const isAutoPlayingRef = useRef(false); // Track if autoplay triggered the navigation
  const [mobileZoom, setMobileZoom] = useState(1);
  const [mobilePan, setMobilePan] = useState({ x: 0, y: 0 });
  const [showZoomControls, setShowZoomControls] = useState(true);
  const initialPinchDistance = useRef(0);
  const initialPinchZoom = useRef(1);
  const lastTouchCount = useRef(0);
  const lastPanPosition = useRef({ x: 0, y: 0 });
  const idleTimeoutRef = useRef(null);
  const originalBookSize = useRef({ width: 778, height: 519 }); // Store original size for fullscreen calc
  const iosFullscreenScale = useRef(1); // Store the iOS fullscreen scale to reapply after page changes
  const fullscreenToggleTime = useRef(0); // Debounce fullscreen toggle
  
  // Web Audio API refs for iOS volume control
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const audioSourceRef = useRef(null);
  const audioApiInitialized = useRef(false);

  // Detect mobile and iOS on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      // Use width-based detection only - phones in landscape will get desktop view
      const mobile = window.matchMedia('(max-width: 768px)').matches;
      setIsMobile(mobile);
      
      // Detect mobile landscape (for future use if needed)
      const isShortHeight = window.matchMedia('(max-height: 500px)').matches;
      const isLandscape = window.matchMedia('(orientation: landscape)').matches;
      setIsMobileLandscape(isShortHeight && isLandscape);
    };
    
    // Detect iOS (including iPadOS which presents as Mac)
    const checkIOS = () => {
      const ua = navigator.userAgent;
      const isIOSUA = /iPad|iPhone|iPod/.test(ua);
      const isMacWithTouch = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
      const isIOSDevice = isIOSUA || isMacWithTouch;
      setIsIOS(isIOSDevice);
    };
    
    checkMobile();
    checkIOS();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  // Fullscreen state listener
  // Track if fullscreen was triggered by our button vs Escape key
  const fullscreenByButtonRef = useRef(false);
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFS = !!(document.fullscreenElement || 
                      document.webkitFullscreenElement || 
                      document.mozFullScreenElement);
      setIsFullscreen(isFS);
      
      // If exiting fullscreen and NOT by our button, reload page
      if (!isFS && !fullscreenByButtonRef.current) {
        window.location.reload();
        return;
      }
      
      // Reset the flag after handling
      fullscreenByButtonRef.current = false;
      
      // Resize book on fullscreen change - single smooth transition
      const resizeBook = () => {
        if (!wowBookInstance.current) return;
        
        if (isFS) {
          // Expand book to fill fullscreen
          const screenWidth = window.innerWidth;
          const screenHeight = window.innerHeight;
          // Use 90% of screen for the book, maintaining aspect ratio
          const bookHeight = screenHeight * 0.9;
          const bookWidth = Math.min(screenWidth * 0.95, bookHeight * 1.5);
          
          if (wowBookInstance.current.resize) {
            wowBookInstance.current.resize(bookWidth, bookHeight);
          }
        } else {
          // Restore viewport-appropriate size
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const isPortrait = viewportHeight > viewportWidth;
          
          let bookWidth, bookHeight;
          if (isPortrait) {
            bookWidth = Math.min(900, viewportWidth - 40);
            bookHeight = bookWidth * (600 / 900);
          } else {
            bookHeight = Math.min(600, viewportHeight * 0.75);
            bookWidth = bookHeight * (900 / 600);
          }
          
          if (wowBookInstance.current.resize) {
            wowBookInstance.current.resize(bookWidth, bookHeight);
          }
        }
        
        if (wowBookInstance.current.fit) {
          wowBookInstance.current.fit();
        }
      };
      
      // Single resize after fullscreen transition completes
      setTimeout(resizeBook, 250);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle window resize - fit and recalculate size
  useEffect(() => {
    const handleResize = () => {
      // Skip resize if in iOS fullscreen mode - we control the transform ourselves
      if (iosFullscreenScale.current !== 1) {
        return;
      }
      
      if (wowBookInstance.current) {
        // Calculate new dimensions based on viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const isPortrait = viewportHeight > viewportWidth;
        
        let bookWidth, bookHeight;
        if (isPortrait) {
          // In portrait, constrain by width
          bookWidth = Math.min(900, viewportWidth - 40);
          bookHeight = bookWidth * (600 / 900);
        } else {
          // In landscape, constrain by height
          bookHeight = Math.min(600, viewportHeight * 0.75);
          bookWidth = bookHeight * (900 / 600);
        }
        
        // Use multiple timeouts to ensure proper resize on orientation change
        setTimeout(() => {
          // Double check we're still not in fullscreen
          if (iosFullscreenScale.current !== 1) return;
          
          if (wowBookInstance.current) {
            // Resize to new dimensions
            if (wowBookInstance.current.resize) {
              wowBookInstance.current.resize(bookWidth, bookHeight);
            }
            if (wowBookInstance.current.fit) {
              wowBookInstance.current.fit();
            }
          }
        }, 100);
        
        // Second pass to handle iOS orientation change delay
        setTimeout(() => {
          // Double check we're still not in fullscreen
          if (iosFullscreenScale.current !== 1) return;
          
          if (wowBookInstance.current && wowBookInstance.current.fit) {
            wowBookInstance.current.fit();
          }
        }, 500);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Auto-hide zoom controls after 3 seconds idle
  useEffect(() => {
    const resetIdleTimer = () => {
      setShowZoomControls(true);
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      idleTimeoutRef.current = setTimeout(() => {
        setShowZoomControls(false);
      }, 3000);
    };

    // Initial timer
    resetIdleTimer();

    // Listen for any user interaction
    const events = ['click', 'touchstart', 'mousemove', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer, { passive: true });
    });

    return () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer);
      });
    };
  }, []);

  // Sync volume state to audio element using Web Audio API GainNode (works on iOS)
  useEffect(() => {
    // Use GainNode if available (iOS), otherwise fall back to regular volume
    if (gainNodeRef.current) {
      const gainValue = isMuted ? 0 : volume;
      gainNodeRef.current.gain.value = gainValue;
    } else if (musicRef.current && !isMuted) {
      musicRef.current.volume = volume;
    }
  }, [volume, isMuted]);

  // Start music on first user click or touch
  const startMusic = () => {
    if (!musicStarted && musicRef.current && pianoEnabled) {
      
      // Only use Web Audio API on iPhone in mobile gallery mode (portrait)
      // Skip Web Audio API when showing desktop WowBook view (landscape/wide screens)
      // iPhone is detected by checking for iPhone in user agent
      const isIPhone = /iPhone/.test(navigator.userAgent) && !window.MSStream;
      const useWebAudioAPI = isIPhone && isMobile && !audioApiInitialized.current;
      
      if (useWebAudioAPI) {
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          
          if (AudioContext) {
            audioContextRef.current = new AudioContext();
            
            // Create a MediaElementSource from the audio element
            audioSourceRef.current = audioContextRef.current.createMediaElementSource(musicRef.current);
            
            // Create a GainNode for volume control
            gainNodeRef.current = audioContextRef.current.createGain();
            gainNodeRef.current.gain.value = isMuted ? 0 : volume;
            
            // Connect: audio -> gain -> destination
            audioSourceRef.current.connect(gainNodeRef.current);
            gainNodeRef.current.connect(audioContextRef.current.destination);
            
            audioApiInitialized.current = true;
          }
        } catch (err) {
        }
      }
      
      // Resume AudioContext if suspended (required for iOS)
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().then(() => {
        });
      }
      
      // Set initial gain if using Web Audio API
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = isMuted ? 0 : volume;
        musicRef.current.volume = 1; // GainNode controls actual volume
      } else {
        // Normal volume control for non-iPhone devices or desktop view
        musicRef.current.volume = isMuted ? 0 : volume;
      }
      
      musicRef.current.play()
      setMusicStarted(true);
    }
  };
  
  // Toggle mute
  const toggleMute = () => {
    if (isMuted) {
      // Unmute - restore previous volume and resume playback
      setVolume(previousVolume);
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = previousVolume;
      }
      if (musicRef.current) {
      }
      setIsMuted(false);
      isMutedRef.current = false;
    } else {
      // Mute - save current volume, set to 0, and pause
      setPreviousVolume(volume);
      setVolume(0);
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = 0;
      }
      if (musicRef.current) {
        musicRef.current.pause();
      }
      setIsMuted(true);
      isMutedRef.current = true;
    }
  };

  // Toggle piano music (mutually exclusive with flip sound)
  const togglePiano = () => {
    if (pianoEnabled) {
      // Turn off piano
      if (musicRef.current) {
        musicRef.current.pause();
        setMusicStarted(false);
      }
      setPianoEnabled(false);
      pianoEnabledRef.current = false;
    } else {
      // Turn on piano, turn off flip sound
      if (flipSoundEnabled) {
        setFlipSoundEnabled(false);
        flipSoundEnabledRef.current = false;
      }
      // Restore volume if it was muted
      const playVolume = isMuted ? previousVolume : volume;
      if (isMuted) {
        setVolume(previousVolume);
        setIsMuted(false);
      }
      if (musicRef.current) {
        musicRef.current.volume = playVolume;
        setMusicStarted(true);
      }
      setPianoEnabled(true);
      pianoEnabledRef.current = true;
    }
  };

  // Toggle flip sound (mutually exclusive with piano)
  const toggleFlipSound = () => {
    if (flipSoundEnabled) {
      // Turn off flip sound
      setFlipSoundEnabled(false);
      flipSoundEnabledRef.current = false;
    } else {
      // Turn on flip sound, turn off piano
      if (pianoEnabled && musicRef.current) {
        musicRef.current.pause();
        setMusicStarted(false);
        setPianoEnabled(false);
        pianoEnabledRef.current = false;
      }
      setFlipSoundEnabled(true);
      flipSoundEnabledRef.current = true;
    }
  };

  // Autoplay controls
  const stopAutoPlay = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
    isAutoPlayingRef.current = false;
    setAutoDirection(null);
  };

  const startAutoPlayForward = () => {
    stopAutoPlay();
    
    // Start music if not already playing
    if (!musicStarted && pianoEnabledRef.current) {
      startMusic();
    }
    
    setAutoDirection('forward');
    isAutoPlayingRef.current = true;
    
    // Immediate first flip
    if (isMobile) {
      if (mobileCurrentPage < PAGE_COUNT) {
        isAutoPlayingRef.current = true; // Mark before navigation
        mobileNextPage();
      }
    } else if (wowBookInstance.current) {
      wowBookInstance.current.advance();
    }
    
    autoPlayRef.current = setInterval(() => {
      if (isMobile) {
        // Check edge before flipping on mobile - use current state
        const currentMobilePage = mobileCurrentPage;
        if (currentMobilePage >= PAGE_COUNT) {
          stopAutoPlay();
        } else {
          isAutoPlayingRef.current = true;
          mobileNextPage();
        }
      } else if (wowBookInstance.current) {
        const currentIdx = wowBookInstance.current.currentPage || 0;
        const lastIdx = PAGE_COUNT - 1;
        if (currentIdx >= lastIdx) {
          stopAutoPlay();
        } else {
          wowBookInstance.current.advance();
        }
      }
    }, 4000);
  };

  const startAutoPlayBackward = () => {
    stopAutoPlay();
    
    // Start music if not already playing
    if (!musicStarted && pianoEnabledRef.current) {
      startMusic();
    }
    
    setAutoDirection('backward');
    isAutoPlayingRef.current = true;
    
    // Immediate first flip
    if (isMobile) {
      if (mobileCurrentPage > 1) {
        isAutoPlayingRef.current = true;
        mobilePrevPage();
      }
    } else if (wowBookInstance.current) {
      wowBookInstance.current.back();
    }
    
    autoPlayRef.current = setInterval(() => {
      if (isMobile) {
        const currentMobilePage = mobileCurrentPage;
        if (currentMobilePage <= 1) {
          stopAutoPlay();
        } else {
          isAutoPlayingRef.current = true;
          mobilePrevPage();
        }
      } else if (wowBookInstance.current) {
        const currentIdx = wowBookInstance.current.currentPage || 0;
        if (currentIdx <= 0) {
          stopAutoPlay();
        } else {
          wowBookInstance.current.back();
        }
      }
    }, 4000);
  };

  // Confetti celebration for last page - 3 elegant bursts (iOS compatible)
  const fireConfettiCelebration = () => {
    const colors = ['#ff9aa2', '#ffd1dc', '#fff1c1', '#c1e1c1', '#b5ead7'];
    
    // Create a dedicated confetti canvas that works on iOS
    const createConfettiCanvas = () => {
      // Remove any existing confetti canvas
      const existing = document.querySelector('.confetti-canvas-global');
      if (existing) existing.remove();
      
      const canvas = document.createElement('canvas');
      canvas.className = 'confetti-canvas-global';
      canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:999999;';
      canvas.width = window.innerWidth * (window.devicePixelRatio || 1);
      canvas.height = window.innerHeight * (window.devicePixelRatio || 1);
      
      // Append to fullscreen container if in fullscreen, otherwise to body
      const fullscreenContainer = document.fullscreenElement || 
                                  document.webkitFullscreenElement ||
                                  document.querySelector('.ios-fullscreen');
      if (fullscreenContainer) {
        fullscreenContainer.appendChild(canvas);
      } else {
        document.body.appendChild(canvas);
      }
      
      // Clean up after animation
      setTimeout(() => canvas.remove(), 5000);
      
      return confetti.create(canvas, { resize: true, useWorker: false }); // useWorker: false for iOS compatibility
    };
    
    const myConfetti = createConfettiCanvas();
    
    // First burst - center
    myConfetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6, x: 0.5 },
      colors,
      disableForReducedMotion: false,
      scalar: 1.2
    });
    
    // Second burst - left side
    setTimeout(() => {
      myConfetti({
        particleCount: 40,
        spread: 55,
        origin: { y: 0.65, x: 0.3 },
        colors,
        disableForReducedMotion: false,
        scalar: 1.2
      });
    }, 300);
    
    // Third burst - right side
    setTimeout(() => {
      myConfetti({
        particleCount: 40,
        spread: 55,
        origin: { y: 0.65, x: 0.7 },
        colors,
        disableForReducedMotion: false,
        scalar: 1.2
      });
    }, 600);
  };

  // Zoom controls - use CSS transform on wrapper (WowBook overrides transform on #wowbook)
  const applyZoomTransform = (zoom, pan = panPosition) => {
    const wrapper = bookWrapperRef.current;
    if (wrapper) {
      // Combine fullscreen scale with zoom scale
      const baseScale = iosFullscreenScale.current || 1;
      const combinedScale = baseScale * zoom;
      const transform = `scale(${combinedScale}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`;
      wrapper.style.transform = transform;
      wrapper.style.transformOrigin = 'center center';
      wrapper.style.transition = 'transform 0.3s ease';
    } else {
    }
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + 0.25, 2);
    setZoomLevel(newZoom);
    // Apply transform immediately for iPad
    applyZoomTransform(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 0.25, 1);
    // Reset pan when zooming out to 1x
    const newPan = newZoom === 1 ? { x: 0, y: 0 } : panPosition;
    if (newZoom === 1) {
      setPanPosition({ x: 0, y: 0 });
    }
    setZoomLevel(newZoom);
    // Apply transform immediately for iPad
    applyZoomTransform(newZoom, newPan);
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    applyZoomTransform(1, { x: 0, y: 0 });
  };

  // Fullscreen toggle
  const toggleFullscreen = async () => {
    // Debounce to prevent double-toggle from touch + click events
    const now = Date.now();
    if (now - fullscreenToggleTime.current < 500) {
      return;
    }
    fullscreenToggleTime.current = now;
    
    
    if (!bookContainerRef.current) {
      return;
    }

    // iOS doesn't support Fullscreen API - use pseudo-fullscreen with CSS scaling
    if (isIOS) {
      const newFullscreenState = !isIOSFullscreen;
      setIsIOSFullscreen(newFullscreenState);
      setIsFullscreen(newFullscreenState);
      
      // Use CSS scaling for iOS fullscreen instead of resize()
      // This is more reliable than WowBook's resize which can be buggy
      if (bookWrapperRef.current) {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const isPortraitMode = screenHeight > screenWidth;
        
        if (newFullscreenState) {
          // For iOS fullscreen, we want to make the book noticeably bigger
          // Use a fixed scale factor since WowBook already fits the viewport
          let scale;
          if (isPortraitMode) {
            // In portrait, WowBook already uses most of the width
            // Scale up slightly to create a noticeable fullscreen effect
            // But keep it modest to avoid clipping
            const bookRect = bookRef.current?.getBoundingClientRect();
            const currentHeight = bookRect?.height || 520;
            const currentWidth = bookRect?.width || 780;
            const maxScaleHeight = (screenHeight * 0.78) / currentHeight; // Don't exceed 78% of screen height
            const maxScaleWidth = (screenWidth * 0.98) / currentWidth; // Don't exceed 98% of screen width
            scale = Math.min(1.12, maxScaleHeight, maxScaleWidth); // 12% bigger, capped
            // Ensure scale is at least 1 - never make it smaller
            scale = Math.max(scale, 1.05);
          } else {
            // Landscape: can usually scale more
            const bookRect = bookRef.current?.getBoundingClientRect();
            const currentWidth = bookRect?.width || 780;
            const currentHeight = bookRect?.height || 520;
            
            // Calculate how much we can scale to fill 90% of screen
            const scaleByWidth = (screenWidth * 0.92) / currentWidth;
            const scaleByHeight = (screenHeight * 0.88) / currentHeight;
            scale = Math.min(scaleByWidth, scaleByHeight, 1.3); // Cap at 30% increase
            scale = Math.max(scale, 1.1); // At least 10% increase
          }
          
          // Store the scale so we can reapply it after page changes
          iosFullscreenScale.current = scale;
          
          bookWrapperRef.current.style.transform = `scale(${scale})`;
          bookWrapperRef.current.style.transformOrigin = 'center center';
        } else {
          // Reset to normal
          iosFullscreenScale.current = 1;
          bookWrapperRef.current.style.transform = 'scale(1)';
        }
      }
      return;
    }
    
    // Add transitioning class to disable animations
    bookContainerRef.current.classList.add('fullscreen-transitioning');

    try {
      if (!document.fullscreenElement && 
          !document.webkitFullscreenElement && 
          !document.mozFullScreenElement) {
        // Enter fullscreen
        if (bookContainerRef.current.requestFullscreen) {
          await bookContainerRef.current.requestFullscreen();
        } else if (bookContainerRef.current.webkitRequestFullscreen) {
          await bookContainerRef.current.webkitRequestFullscreen();
        } else if (bookContainerRef.current.mozRequestFullScreen) {
          await bookContainerRef.current.mozRequestFullScreen();
        }
      } else {
        // Exit fullscreen via button - set flag so we don't reload
        fullscreenByButtonRef.current = true;
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          await document.mozCancelFullScreen();
        }
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
    
    // Remove transitioning class after animation
    setTimeout(() => {
      if (bookContainerRef.current) {
        bookContainerRef.current.classList.remove('fullscreen-transitioning');
      }
    }, 500);
  };

  // Mobile navigation functions
  const mobileNextPage = () => {
    if (mobileCurrentPage < PAGE_COUNT && !isFlipping) {
      // Stop autoplay only on manual navigation (not triggered by autoplay)
      if (!isAutoPlayingRef.current) {
        stopAutoPlay();
      }
      isAutoPlayingRef.current = false; // Reset after check
      
      setIsFlipping(true);
      setFlipDirection('next');
      
      // Play flip sound - same volume as web view
      if (flipSoundEnabledRef.current && flipRef.current) {
        flipRef.current.currentTime = 0;
        flipRef.current.volume = 0.3;
        flipRef.current.play().catch(() => {});
      }
      // Start music on first navigation
      if (!musicStarted && pianoEnabledRef.current) {
        startMusic();
      }
      
      // Change page mid-animation for smooth transition
      setTimeout(() => {
        setMobileCurrentPage(prev => prev + 1);
        // Reset flip state after animation completes
        setTimeout(() => {
          setIsFlipping(false);
          setFlipDirection(null);
        }, 200);
      }, 200);
    }
  };

  const mobilePrevPage = () => {
    if (mobileCurrentPage > 1 && !isFlipping) {
      // Stop autoplay only on manual navigation (not triggered by autoplay)
      if (!isAutoPlayingRef.current) {
        stopAutoPlay();
      }
      isAutoPlayingRef.current = false; // Reset after check
      
      setIsFlipping(true);
      setFlipDirection('prev');
      
      // Play flip sound - same volume as web view
      if (flipSoundEnabledRef.current && flipRef.current) {
        flipRef.current.currentTime = 0;
        flipRef.current.volume = 0.3;
        flipRef.current.play().catch(() => {});
      }
      
      // Start music on first navigation
      if (!musicStarted && pianoEnabledRef.current) {
        startMusic();
      }
      
      // Change page mid-animation for smooth transition
      setTimeout(() => {
        setMobileCurrentPage(prev => prev - 1);
        // Reset flip state after animation completes
        setTimeout(() => {
          setIsFlipping(false);
          setFlipDirection(null);
        }, 200);
      }, 200);
    }
  };

  // Mobile touch handlers for swipe
  const handleTouchStart = (e) => {
    lastTouchCount.current = e.touches.length;
    
    // Try to start music on first touch (required for mobile browsers)
    if (!musicStarted && pianoEnabledRef.current && musicRef.current) {
      const vol = isMutedRef.current ? 0 : (musicRef.current.volume || 0.6);
      musicRef.current.volume = vol;
      musicRef.current.play()
        .then(() => {
          setMusicStarted(true);
        })
    }
    
    if (e.touches.length === 2) {
      // Pinch zoom start
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      initialPinchDistance.current = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      initialPinchZoom.current = mobileZoom;
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartX.current = touch.clientX;
      touchEndX.current = touch.clientX;
      lastPanPosition.current = { x: touch.clientX, y: touch.clientY };
      didSwipe.current = false;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      // Pinch zoom
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      const scale = currentDistance / initialPinchDistance.current;
      const newZoom = Math.min(Math.max(initialPinchZoom.current * scale, 1), 3);
      setMobileZoom(newZoom);
      
      if (newZoom === 1) {
        setMobilePan({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      
      if (mobileZoom > 1) {
        // Pan when zoomed
        e.preventDefault();
        const deltaX = touch.clientX - lastPanPosition.current.x;
        const deltaY = touch.clientY - lastPanPosition.current.y;
        
        setMobilePan(prev => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY
        }));
        
        lastPanPosition.current = { x: touch.clientX, y: touch.clientY };
      } else {
        // Track for swipe when not zoomed
        touchEndX.current = touch.clientX;
      }
    }
  };

  const handleTouchEnd = (e) => {
    // Only handle swipe if it was a single-finger gesture and not zoomed
    if (lastTouchCount.current === 1 && mobileZoom === 1) {
      const diff = touchStartX.current - touchEndX.current;
      const minSwipeDistance = 50;

      if (Math.abs(diff) > minSwipeDistance) {
        didSwipe.current = true;
        
        // Start music on any swipe interaction
        if (!musicStarted && pianoEnabledRef.current && musicRef.current) {
          const vol = isMutedRef.current ? 0 : (musicRef.current.volume || 0.6);
          musicRef.current.volume = vol;
          musicRef.current.play()
            .then(() => {
              setMusicStarted(true);
            })
        }
        
        if (diff > 0) {
          mobileNextPage();
        } else {
          mobilePrevPage();
        }
      }
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // Reset zoom on page change
  useEffect(() => {
    setMobileZoom(1);
    setMobilePan({ x: 0, y: 0 });
  }, [mobileCurrentPage]);

  // Double tap to zoom on mobile
  const lastTapTime = useRef(0);
  const handleDoubleTap = (e) => {
    const now = Date.now();
    const timeDiff = now - lastTapTime.current;
    
    if (timeDiff < 300 && timeDiff > 0) {
      // Double tap detected
      e.preventDefault();
      if (mobileZoom > 1) {
        // Zoom out
        setMobileZoom(1);
        setMobilePan({ x: 0, y: 0 });
      } else {
        // Zoom in to 2x
        setMobileZoom(2);
      }
      lastTapTime.current = 0;
    } else {
      lastTapTime.current = now;
    }
  };

  // Mobile tap navigation (tap left/right sides) - only if not swiping
  const handleMobileTap = (e) => {
    // If we just swiped, don't also handle tap
    if (didSwipe.current) {
      didSwipe.current = false;
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const tapX = e.clientX - rect.left;
    const width = rect.width;

    if (tapX < width * 0.3) {
      // Tap left 30% - previous
      mobilePrevPage();
    } else if (tapX > width * 0.7) {
      // Tap right 30% - next
      mobileNextPage();
    }
    // Tap center - do nothing (could be for zoom later)
  };

  // Update isLastPage for mobile
  useEffect(() => {
    if (isMobile) {
      setIsLastPage(mobileCurrentPage === PAGE_COUNT);
      setCurrentPage(mobileCurrentPage);
      
      // Stop autoplay at edges
      if (autoDirection === 'forward' && mobileCurrentPage >= PAGE_COUNT) {
        stopAutoPlay();
      } else if (autoDirection === 'backward' && mobileCurrentPage <= 1) {
        stopAutoPlay();
      }
      
      // Fire confetti celebration every time user arrives at last page
      if (mobileCurrentPage === PAGE_COUNT) {
        fireConfettiCelebration();
      }
    }
  }, [mobileCurrentPage, isMobile, autoDirection]);

  // Mobile pinch zoom support
  useEffect(() => {
    let initialDistance = 0;
    let currentZoom = 1;

    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        currentZoom = zoomLevel;
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault(); // Prevent page flip during pinch
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        
        const scale = currentDistance / initialDistance;
        const newZoom = Math.min(Math.max(currentZoom * scale, 1), 2);
        setZoomLevel(newZoom);
        if (newZoom === 1) {
          setPanPosition({ x: 0, y: 0 });
        }
      }
    };

    const bookElement = bookRef.current;
    if (bookElement) {
      bookElement.addEventListener('touchstart', handleTouchStart, { passive: true });
      bookElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    }

    return () => {
      if (bookElement) {
        bookElement.removeEventListener('touchstart', handleTouchStart);
        bookElement.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, [zoomLevel]);
  
  // iPad/touch: Start music on any touch/click interaction with the book or container
  useEffect(() => {
    // Skip for mobile portrait (uses mobile gallery with its own handlers)
    // But keep for mobile landscape (uses WowBook desktop view)
    if (isMobile && !isMobileLandscape) return;
    
    const unlockAndPlayAudio = (e) => {
      // Only try once per interaction type
      if (musicStarted) return;
      if (!pianoEnabledRef.current || !musicRef.current) return;
      
      
      // Use ref for mute check to avoid stale closure
      const vol = isMutedRef.current ? 0 : musicRef.current.volume || 0.6;
      musicRef.current.volume = vol;
      
      // IMPORTANT: Call play() SYNCHRONOUSLY within the event handler
      // Do NOT do any async operations before this
      const playPromise = musicRef.current.play();
      
      // Set state immediately (before promise resolves)
      setMusicStarted(true);
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
          })
          .catch(err => {
            // Reset if play failed so user can try again
            setMusicStarted(false);
          });
      }
    };
    
    const bookElement = bookRef.current;
    const containerElement = bookContainerRef.current;
    
    // Use capture phase to catch events before WowBook handles them
    // Use touchstart for more reliable touch detection on mobile
    const options = { capture: true };
    
    if (bookElement) {
      bookElement.addEventListener('touchstart', unlockAndPlayAudio, options);
      bookElement.addEventListener('touchend', unlockAndPlayAudio, options);
      bookElement.addEventListener('click', unlockAndPlayAudio, options);
    }
    if (containerElement) {
      containerElement.addEventListener('touchstart', unlockAndPlayAudio, options);
      containerElement.addEventListener('touchend', unlockAndPlayAudio, options);
      containerElement.addEventListener('click', unlockAndPlayAudio, options);
    }
    
    return () => {
      if (bookElement) {
        bookElement.removeEventListener('touchstart', unlockAndPlayAudio, options);
        bookElement.removeEventListener('touchend', unlockAndPlayAudio, options);
        bookElement.removeEventListener('click', unlockAndPlayAudio, options);
      }
      if (containerElement) {
        containerElement.removeEventListener('touchstart', unlockAndPlayAudio, options);
        containerElement.removeEventListener('touchend', unlockAndPlayAudio, options);
        containerElement.removeEventListener('click', unlockAndPlayAudio, options);
      }
    };
  }, [isMobile, isMobileLandscape, musicStarted, volume, isMuted]);

  // Pan/drag when zoomed (mouse and touch)
  useEffect(() => {
    const wrapper = bookWrapperRef.current;
    
    if (zoomLevel <= 1) {
      // Reset transform when not zoomed
      if (wrapper) {
        wrapper.style.transform = 'scale(1)';
      }
      return;
    }

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let currentPanX = panPosition.x;
    let currentPanY = panPosition.y;
    let rafId = null;

    const updateTransform = () => {
      if (wrapper) {
        const transform = `scale(${zoomLevel}) translate(${currentPanX / zoomLevel}px, ${currentPanY / zoomLevel}px)`;
        wrapper.style.transform = transform;
      }
    };

    const handleMouseDown = (e) => {
      if (e.target.closest('.wowbook-control')) return; // Don't interfere with WowBook controls
      dragging = true;
      setIsDragging(true);
      if (wrapper) {
        wrapper.classList.add('is-dragging');
      }
      startX = e.clientX - currentPanX;
      startY = e.clientY - currentPanY;
      e.preventDefault();
    };

    const handleMouseMove = (e) => {
      if (!dragging) return;
      
      currentPanX = e.clientX - startX;
      currentPanY = e.clientY - startY;
      
      // Cancel any pending frame and request a new one
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateTransform);
    };

    const handleMouseUp = () => {
      if (!dragging) return;
      dragging = false;
      if (wrapper) {
        wrapper.classList.remove('is-dragging');
      }
      // Sync final position to React state
      setPanPosition({
        x: currentPanX,
        y: currentPanY
      });
      setIsDragging(false);
      if (rafId) cancelAnimationFrame(rafId);
    };
    
    // Touch handlers for iPad panning (when zoomed)
    const handleTouchStart = (e) => {
      // Only handle single-finger pan when zoomed
      if (e.touches.length === 1 && zoomLevel > 1) {
        dragging = true;
        setIsDragging(true);
        if (wrapper) {
          wrapper.classList.add('is-dragging');
        }
        const touch = e.touches[0];
        startX = touch.clientX - currentPanX;
        startY = touch.clientY - currentPanY;
      }
    };
    
    const handleTouchMove = (e) => {
      if (!dragging || e.touches.length !== 1) return;
      
      const touch = e.touches[0];
      currentPanX = touch.clientX - startX;
      currentPanY = touch.clientY - startY;
      
      
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateTransform);
    };
    
    const handleTouchEnd = () => {
      if (!dragging) return;
      dragging = false;
      if (wrapper) {
        wrapper.classList.remove('is-dragging');
      }
      setPanPosition({
        x: currentPanX,
        y: currentPanY
      });
      setIsDragging(false);
      if (rafId) cancelAnimationFrame(rafId);
    };

    const containerElement = bookContainerRef.current;
    
    // Attach to wrapper for mouse, container for touch
    if (wrapper) {
      wrapper.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    // Touch events on container for iPad panning
    const panTarget = containerElement || wrapper;
    if (panTarget) {
      panTarget.addEventListener('touchstart', handleTouchStart, { passive: true });
      panTarget.addEventListener('touchmove', handleTouchMove, { passive: true });
      panTarget.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (wrapper) {
        wrapper.removeEventListener('mousedown', handleMouseDown);
        wrapper.classList.remove('is-dragging');
      }
      if (panTarget) {
        panTarget.removeEventListener('touchstart', handleTouchStart);
        panTarget.removeEventListener('touchmove', handleTouchMove);
        panTarget.removeEventListener('touchend', handleTouchEnd);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [zoomLevel]);

  // Create floating heart animation
  const createFloatingHeart = () => {
    const heart = document.createElement('div');
    heart.className = 'floating-heart';
    heart.textContent = '❤️';
    heart.style.left = `${Math.random() * 80 + 10}%`;
    
    // Append to fullscreen container if in fullscreen, otherwise to body
    const container = bookContainerRef.current || document.body;
    container.appendChild(heart);
    
    setTimeout(() => {
      heart.remove();
    }, 4000);
  };

  // Preload all images before initializing WowBook
  const preloadImages = () => {
    return new Promise((resolve) => {
      const imagePromises = [];
      let loadedCount = 0;

      for (let i = 1; i <= PAGE_COUNT; i++) {
        const promise = new Promise((imgResolve) => {
          const img = new Image();
          img.onload = () => {
            loadedCount++;
            setLoadProgress(Math.round((loadedCount / PAGE_COUNT) * 100));
            imgResolve();
          };
          img.onerror = () => {
            console.warn(`Failed to load image: ${i}.webp`);
            loadedCount++;
            setLoadProgress(Math.round((loadedCount / PAGE_COUNT) * 100));
            imgResolve();
          };
          // Use WebP format for much smaller file sizes
          img.src = `/pages/${i}.webp`;
        });
        imagePromises.push(promise);
      }

      Promise.all(imagePromises).then(() => {
        setImagesReady(true);
        setLoading(false); // This will render the book div
        resolve();
      });
    });
  };

  // Initialize WowBook
  const initWowBook = () => {
    const $ = window.jQuery;
    
    if (!bookRef.current) {
      console.error('bookRef.current is null - DOM element not ready');
      return;
    }
    
    if (!$ || !$.fn.wowBook) {
      console.error('WowBook library not loaded. jQuery:', !!$, 'wowBook:', !!($ && $.fn.wowBook));
      return;
    }

    // Only destroy if instance exists (initial setup only)
    if (wowBookInstance.current) {
      try {
        if (wowBookInstance.current.pageCheckInterval) {
          clearInterval(wowBookInstance.current.pageCheckInterval);
        }
        $(bookRef.current).wowBook('destroy');
        wowBookInstance.current = null;
      } catch (e) {
        console.warn('Error destroying WowBook:', e);
      }
    }

    try {
      
      // On mobile, skip WowBook initialization - we'll render a simple gallery
      const isMobileView = window.innerWidth <= 768;
      if (isMobileView) {
        return;
      }
      
      // Simple page generation - one image per page (WebP for faster loading)
      let pagesHTML = '';
      for (let i = 1; i <= PAGE_COUNT; i++) {
        pagesHTML += `
          <div class="page" data-page="${i}">
            <img src="/pages/${i}.webp" alt="Page ${i}" loading="lazy" decoding="async" />
          </div>
        `;
      }

      // Inject pages into container
      $(bookRef.current).html(pagesHTML);
      

      const $book = $(bookRef.current);
      
      
      // Calculate initial dimensions based on viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const isPortrait = viewportHeight > viewportWidth;
      
      // For portrait mode, use smaller initial dimensions
      // Book aspect ratio is 3:2 (900:600) for open spread
      let bookWidth, bookHeight;
      if (isPortrait) {
        // In portrait, constrain by width (leave padding)
        bookWidth = Math.min(900, viewportWidth - 40);
        bookHeight = bookWidth * (600 / 900); // Maintain aspect ratio
      } else {
        // In landscape, use default or constrain by height
        bookHeight = Math.min(600, viewportHeight * 0.75);
        bookWidth = bookHeight * (900 / 600); // Maintain aspect ratio
      }
      
      // Desktop config - full WowBook experience
      const config = {
        width: bookWidth,
        height: bookHeight,
        centeredWhenClosed: true,
        hardcovers: true,
        hardcover: true,
        turnPageDuration: 900,
        shadows: true,
        gutterShadow: true,
        curl: false,
        curlSize: 0,
        pageNumbers: false,
        responsive: true,
        slideShow: false,
        toolbar: 'none',
        controls: {
          zoomIn: false,
          zoomOut: false,
          slideShow: false,
          fullScreen: false,
          thumbnail: false
        }
      };
      
      $book.wowBook(config);
      wowBookInstance.current = $book.data('wowBook');
      
      // Store original book dimensions for fullscreen calculations
      originalBookSize.current = { width: bookWidth, height: bookHeight };
      
      
      // Fit after initialization - multiple times to ensure proper sizing
      setTimeout(() => {
        if (wowBookInstance.current && wowBookInstance.current.fit) {
          wowBookInstance.current.fit();
        }
        
        // Add elegant page corner hints to all WowBook pages
        const pages = document.querySelectorAll('#wowbook .page');
        pages.forEach((page, index) => {
          if (!page.querySelector('.page-corner-hint')) {
            const corner = document.createElement('div');
            // Odd index = left page (corner on left), Even index = right page (corner on right)
            const isLeftPage = index % 2 === 1;
            corner.className = isLeftPage ? 'page-corner-hint page-corner-hint-left' : 'page-corner-hint page-corner-hint-right';
            page.appendChild(corner);
          }
        });
      }, 200);
      
      // Second fit after layout settles (helps with iPad)
      setTimeout(() => {
        if (wowBookInstance.current && wowBookInstance.current.fit) {
          wowBookInstance.current.fit();
        }
      }, 600);

      // Poll WowBook's currentPage since events may not fire reliably
      // WowBook uses 0-based indexing, so add 1 to display properly
      let lastKnownPage = 0;
      const checkPageInterval = setInterval(() => {
        if (wowBookInstance.current) {
          const page = wowBookInstance.current.currentPage;
          if (page !== undefined && page !== null) {
            const displayPage = page + 1; // Convert 0-based to 1-based
            
            // Play flip sound when page changes
            if (page !== lastKnownPage) {
              // Reset zoom on page change
              resetZoom();
              
              if (flipSoundEnabledRef.current && flipRef.current) {
                flipRef.current.currentTime = 0;
                flipRef.current.volume = 0.15;
                flipRef.current.play().catch(() => {});
              }
              
              // Try to start music on page flip
              // This works on desktop where click already unlocked audio
              if (!musicStarted && pianoEnabledRef.current && musicRef.current) {
                const vol = isMutedRef.current ? 0 : (musicRef.current.volume || 0.6);
                musicRef.current.volume = vol;
                musicRef.current.play()
                  .then(() => {
                    setMusicStarted(true);
                  })
                  .catch(() => {
                    // Expected to fail on mobile - audio requires direct user gesture
                  });
              }
              
              // Fire confetti celebration every time user arrives at last page
              if (displayPage === PAGE_COUNT) {
                fireConfettiCelebration();
              }
            }
            lastKnownPage = page;
            
            setCurrentPage(displayPage);
            
            // Detect last page for heartbeat animation
            setIsLastPage(displayPage === PAGE_COUNT);
          }
        }
      }, 100);

      // Store interval for cleanup
      if (!wowBookInstance.current.pageCheckInterval) {
        wowBookInstance.current.pageCheckInterval = checkPageInterval;
      }
      
      // Add touch handler directly to WowBook pages for mobile audio unlock
      const wowbookEl = document.querySelector('#wowbook');
      if (wowbookEl) {
        const audioUnlockHandler = () => {
          if (!musicStarted && pianoEnabledRef.current && musicRef.current) {
            const vol = isMutedRef.current ? 0 : (musicRef.current.volume || 0.6);
            musicRef.current.volume = vol;
            musicRef.current.play()
              .then(() => {
                setMusicStarted(true);
                // Remove listener after successful unlock
                wowbookEl.removeEventListener('touchstart', audioUnlockHandler);
                wowbookEl.removeEventListener('touchend', audioUnlockHandler);
              })
          }
        };
        wowbookEl.addEventListener('touchstart', audioUnlockHandler, { passive: true });
        wowbookEl.addEventListener('touchend', audioUnlockHandler, { passive: true });
      }

    } catch (error) {
      console.error('Error initializing WowBook:', error);
      console.error('Error stack:', error.stack);
    }
  };

  useEffect(() => {
    
    // Wait for WowBook library to be available
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max
    
    const checkWowBook = setInterval(() => {
      attempts++;
      const $ = window.jQuery;
      
      if ($ && $.fn.wowBook) {
        clearInterval(checkWowBook);
        setLibraryReady(true);
        
        // Preload images
        preloadImages();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkWowBook);
        setLoading(false);
      }
    }, 100);

    return () => {
      clearInterval(checkWowBook);
    };
  }, []);

  // Initialize WowBook after images are loaded and div is rendered
  useEffect(() => {
    if (imagesReady && libraryReady && !loading && bookRef.current) {
      // Small delay to ensure DOM is fully ready
      setTimeout(() => {
        initWowBook();
      }, 100);
    }
  }, [imagesReady, libraryReady, loading, isMobile]);

  // Cleanup
  useEffect(() => {
    return () => {
      // Clear autoplay interval
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
      
      if (wowBookInstance.current) {
        try {
          // Clear polling interval
          if (wowBookInstance.current.pageCheckInterval) {
            clearInterval(wowBookInstance.current.pageCheckInterval);
          }
          
          const $ = window.jQuery;
          if ($) {
            $(bookRef.current).wowBook('destroy');
          }
        } catch (e) {
          console.warn('Error destroying WowBook:', e);
        }
      }
    };  }, []);

  // Update music volume and slider CSS
  useEffect(() => {
    if (musicRef.current) {
      musicRef.current.volume = volume;
    }
    
    // Update CSS variable for volume slider fill - find all sliders
    const sliders = document.querySelectorAll('.volume-control input[type="range"]');
    sliders.forEach(slider => {
      slider.style.setProperty('--volume-percent', `${volume * 100}%`);
    });
  }, [volume, pianoEnabled, musicStarted, isMuted]);

  // Continuously sync piano volume to prevent browser ducking
  useEffect(() => {
    if (!musicStarted || !pianoEnabled) return;
    
    const volumeSyncInterval = setInterval(() => {
      if (musicRef.current && !musicRef.current.paused) {
        const currentVol = musicRef.current.volume;
        const targetVol = volume;
        const diff = targetVol - currentVol;
        
        // Smooth volume transition if drift detected
        if (Math.abs(diff) > 0.01) {
          // Gradually adjust volume (25% of the difference per check)
          musicRef.current.volume = currentVol + (diff * 0.25);
        }
      }
    }, 50);
    
    return () => clearInterval(volumeSyncInterval);
  }, [musicStarted, pianoEnabled, volume]);

  // Apply CSS zoom fallback (backup for state-based updates)
  // Combine with iOS fullscreen scale when active
  useEffect(() => {
    const wrapper = bookWrapperRef.current;
    if (wrapper) {
      // Combine fullscreen scale with zoom scale
      const baseScale = iosFullscreenScale.current || 1;
      const combinedScale = baseScale * zoomLevel;
      const transform = `scale(${combinedScale}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`;
      wrapper.style.transform = transform;
      wrapper.style.transformOrigin = 'center center';
      wrapper.style.transition = isDragging ? 'none' : 'transform 0.3s ease';
      wrapper.style.cursor = zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default';
    }
  }, [zoomLevel, panPosition, isDragging, isIOSFullscreen]);

  // Maintain iOS fullscreen scale - reapply combined scale after any potential reset (page changes, resize)
  useEffect(() => {
    if (!isIOSFullscreen || !bookWrapperRef.current) return;
    
    // Use MutationObserver to detect when something changes the wrapper style
    const observer = new MutationObserver(() => {
      if (isIOSFullscreen && bookWrapperRef.current && iosFullscreenScale.current !== 1) {
        const currentTransform = bookWrapperRef.current.style.transform;
        const baseScale = iosFullscreenScale.current;
        const combinedScale = baseScale * zoomLevel;
        const expectedScaleStr = combinedScale.toFixed(2);
        
        // If transform was reset to scale(1), reapply our combined scale
        if (currentTransform === 'scale(1)' || currentTransform === 'scale(1) translate(0px, 0px)') {
          const transform = `scale(${combinedScale}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`;
          bookWrapperRef.current.style.transform = transform;
          bookWrapperRef.current.style.transformOrigin = 'center center';
        }
      }
    });
    
    observer.observe(bookWrapperRef.current, { 
      attributes: true, 
      attributeFilter: ['style'] 
    });
    
    // Also reapply immediately in case something already changed
    const baseScale = iosFullscreenScale.current;
    if (baseScale !== 1) {
      const combinedScale = baseScale * zoomLevel;
      const transform = `scale(${combinedScale}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`;
      bookWrapperRef.current.style.transform = transform;
      bookWrapperRef.current.style.transformOrigin = 'center center';
    }
    
    return () => observer.disconnect();
  }, [isIOSFullscreen, currentPage, zoomLevel, panPosition]); // Re-run on page/zoom change too

  // Start floating hearts interval
  useEffect(() => {
    heartsIntervalRef.current = setInterval(() => {
      createFloatingHeart();
    }, 6000);
    
    return () => {
      if (heartsIntervalRef.current) {
        clearInterval(heartsIntervalRef.current);
      }
    };
  }, []);

  if (loading) {
    return <Loading progress={loadProgress} />;
  }

  return (
    <>
      {/* Audio elements - outside fullscreen container */}
      <audio ref={musicRef} src="/audio/piano.mp3" loop preload="auto" />
      <audio ref={flipRef} src="/audio/page.mp3" preload="auto" />
      
      {/* Fullscreen container wraps all UI */}
      <div ref={bookContainerRef} className={`flipbook-fullscreen-container ${isIOSFullscreen ? 'ios-fullscreen' : ''}`}>
        {/* Zoom controls */}
        <div className={`zoom-controls ${showZoomControls ? '' : 'hidden'}`}>
          <button
            onClick={(e) => { if (e.detail !== 0) handleZoomIn(); }}
            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); handleZoomIn(); }}
            className="zoom-btn"
            aria-label="Zoom in"
            title="Zoom In"
            disabled={zoomLevel >= 2}
          >
            ➕
          </button>
          <button
            onClick={(e) => { if (e.detail !== 0) handleZoomOut(); }}
            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); handleZoomOut(); }}
            className="zoom-btn"
            aria-label="Zoom out"
            title="Zoom Out"
            disabled={zoomLevel <= 1}
          >
            ➖
          </button>
        </div>
        
        {/* Fullscreen button */}
        <button
          onClick={(e) => {
            // Only handle click on non-touch devices (touch devices use onTouchEnd)
            if (e.detail === 0) return; // detail is 0 for keyboard/programmatic, 1+ for mouse clicks
            e.stopPropagation();
            toggleFullscreen();
          }}
          onTouchEnd={(e) => {
            e.preventDefault(); // Prevent click from firing after touch
            e.stopPropagation();
            toggleFullscreen();
          }}
          className={`fullscreen-btn ${showZoomControls ? '' : 'hidden'}`}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? '⛶' : '⛶'}
        </button>
        
        {/* Mobile Gallery - swipeable single page view */}
        {isMobile ? (
          <div 
            ref={mobileGalleryRef}
            className="mobile-gallery"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={(e) => {
              startMusic();
              handleDoubleTap(e);
              if (mobileZoom === 1) {
                handleMobileTap(e);
              }
            }}
          >
            {/* Left tap zone - only show when not zoomed */}
            {mobileZoom === 1 && (
              <div className="mobile-tap-zone mobile-tap-left"></div>
            )}
            
            {/* Current page */}
            <div 
              className={`mobile-page-container ${isLastPage && mobileZoom === 1 ? 'heartbeat' : ''} ${isFlipping ? `flip-${flipDirection}` : ''}`}
              style={{
                transform: `scale(${mobileZoom}) translate(${mobilePan.x / mobileZoom}px, ${mobilePan.y / mobileZoom}px)`,
                willChange: mobileZoom > 1 ? 'transform' : 'auto'
              }}
            >
              {/* Last page glow overlay for mobile - outside mobile-page to avoid overflow clip */}
              {isLastPage && <div className="mobile-last-page-glow-overlay"></div>}
              <div className="mobile-page">
                <img 
                  src={`/pages/${mobileCurrentPage}.webp`} 
                  alt={`Page ${mobileCurrentPage}`}
                  draggable={false}
                  loading="eager"
                  decoding="async"
                />
                {/* Page corner turn hint - only on right side (left has binding) */}
                {mobileCurrentPage < PAGE_COUNT && (
                  <div className="mobile-page-corner mobile-page-corner-right"></div>
                )}
              </div>
            </div>
            
            {/* Right tap zone indicator - only show when not zoomed */}
            {mobileZoom === 1 && (
              <div className="mobile-tap-zone mobile-tap-right">
                {mobileCurrentPage < PAGE_COUNT && <span className="tap-arrow">›</span>}
              </div>
            )}
            
            {/* Zoom indicator */}
            {mobileZoom > 1 && (
              <div className="mobile-zoom-indicator">
                {Math.round(mobileZoom * 100)}% - Double tap to reset
              </div>
            )}
            
            {/* Mobile Volume Control - top center - Android only */}
            {pianoEnabled && musicStarted && !isIOS && (
              <div className={`mobile-volume-control ${showZoomControls ? '' : 'hidden'}`}>
                <button 
                  className="mobile-volume-icon-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMute();
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleMute();
                  }}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? '🔇' : (volume < 0.5 ? '🔉' : '🔊')}
                </button>
                {/* Volume slider - only show on non-iOS devices since iOS doesn't support programmatic volume */}
                {!isMuted && !isIOS && (
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    className="mobile-volume-slider"
                    style={{ '--volume-percent': `${volume * 100}%` }}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onInput={(e) => {
                      const newVol = parseFloat(e.target.value);
                      setVolume(newVol);
                      if (newVol > 0) {
                        setPreviousVolume(newVol);
                      }
                      // Use GainNode for iOS
                      if (gainNodeRef.current) {
                        gainNodeRef.current.gain.value = newVol;
                      } else {
                      }
                    }}
                    onChange={(e) => {
                      const newVol = parseFloat(e.target.value);
                      setVolume(newVol);
                      if (newVol > 0) {
                        setPreviousVolume(newVol);
                      }
                      // Use GainNode for iOS
                      if (gainNodeRef.current) {
                        gainNodeRef.current.gain.value = newVol;
                      }
                    }}
                    aria-label="Volume control"
                  />
                )}
              </div>
            )}
          </div>
        ) : (
          /* Desktop WowBook flipbook */
          <div 
            className="book-stage"
            onClick={startMusic}
            onTouchStart={startMusic}
          >
            <div className="book-container">
              <div ref={bookWrapperRef} className={`book-wrapper ${isLastPage && !isIOSFullscreen && zoomLevel === 1 ? 'heartbeat' : ''}`}>
                <div ref={bookRef} id="wowbook"></div>
                {/* Last page glow overlay */}
                {isLastPage && <div className="last-page-glow-overlay"></div>}
              </div>
            </div>
          </div>
        )}

        {/* Audio controls */}
        <div className="audio-controls">
          {/* Toggle buttons */}
          <div className="audio-toggles">
            <button
              onClick={togglePiano}
              className={`audio-toggle ${pianoEnabled ? 'active' : ''}`}
              aria-label="Toggle piano music"
              title={pianoEnabled ? 'Piano: ON' : 'Piano: OFF'}
            >
              🎹
            </button>
            <button
              onClick={toggleFlipSound}
              className={`audio-toggle ${flipSoundEnabled ? 'active' : ''}`}
              aria-label="Toggle flip sound"
              title={flipSoundEnabled ? 'Flip Sound: ON' : 'Flip Sound: OFF'}
            >
              📄
            </button>
          </div>
          
          {/* Volume slider - show when piano is enabled and started */}
          {pianoEnabled && musicStarted && (
            <div className={`volume-control ${showZoomControls ? '' : 'hidden'}`}>
              <button 
                className="volume-icon-btn"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? '🔇' : (volume < 0.5 ? '🔉' : '🔊')}
              </button>
              {!isMuted && (
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  style={{ '--volume-percent': `${volume * 100}%` }}
                  onChange={(e) => {
                    const newVol = parseFloat(e.target.value);
                    setVolume(newVol);
                    if (newVol > 0) {
                      setPreviousVolume(newVol);
                    }
                    if (musicRef.current) {
                      musicRef.current.volume = newVol;
                    }
                  }}
                  aria-label="Volume control"
                />
              )}
            </div>
          )}
        </div>

        {/* Autoplay controls - floating pill */}
        <div className={`autoplay-controls ${showZoomControls ? '' : 'hidden'}`}>
          <button
            onClick={(e) => { e.stopPropagation(); startAutoPlayBackward(); }}
            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); startAutoPlayBackward(); }}
            className={`autoplay-btn ${autoDirection === 'backward' ? 'active' : ''}`}
            aria-label="Auto-play backward"
            title="Rewind"
          >
            ◀
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); startAutoPlayForward(); }}
            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); startAutoPlayForward(); }}
            className={`autoplay-btn ${autoDirection === 'forward' ? 'active' : ''}`}
            aria-label="Auto-play forward"
            title="Play"
          >
            ▶
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); stopAutoPlay(); }}
            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); stopAutoPlay(); }}
            className={`autoplay-btn ${autoDirection === null ? 'paused' : ''}`}
            aria-label="Pause auto-play"
            title="Pause"
          >
            ⏸
          </button>
        </div>

        {/* QR code toggle */}
        <QrToggle />

        {/* Page indicator */}
        {!loading && <PageIndicator currentPage={currentPage} totalPages={PAGE_COUNT} />}
      </div>
    </>
  );
};

export default WowBook;
