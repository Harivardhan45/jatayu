import React, { useRef, useEffect, useState } from 'react';

interface CustomScrollbarProps {
  children: React.ReactNode;
  className?: string;
}

const SCROLL_KEY = 'feature-nav-scroll-position';

const CustomScrollbar: React.FC<CustomScrollbarProps> = ({ children, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [thumbWidth, setThumbWidth] = useState(0);
  const [thumbLeft, setThumbLeft] = useState(0);

  // Restore scroll position on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) {
      container.scrollLeft = parseInt(saved, 10);
    }
  }, []);

  // Save scroll position on scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleSaveScroll = () => {
      sessionStorage.setItem(SCROLL_KEY, String(container.scrollLeft));
    };
    container.addEventListener('scroll', handleSaveScroll);
    return () => {
      container.removeEventListener('scroll', handleSaveScroll);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScrollbar = () => {
      const { scrollWidth, clientWidth, scrollLeft } = container;
      const scrollRatio = clientWidth / scrollWidth;
      const newThumbWidth = Math.max(20, scrollRatio * clientWidth);
      const maxScroll = scrollWidth - clientWidth;
      const scrollRatio2 = maxScroll > 0 ? scrollLeft / maxScroll : 0;
      const maxThumbLeft = clientWidth - newThumbWidth;
      const newThumbLeft = scrollRatio2 * maxThumbLeft;

      setThumbWidth(newThumbWidth);
      setThumbLeft(newThumbLeft);
    };

    updateScrollbar();
    container.addEventListener('scroll', updateScrollbar);
    window.addEventListener('resize', updateScrollbar);

    return () => {
      container.removeEventListener('scroll', updateScrollbar);
      window.removeEventListener('resize', updateScrollbar);
    };
  }, []);

  const handleThumbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current || !thumbRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const containerWidth = container.clientWidth;
      const maxThumbLeft = containerWidth - thumbWidth;
      
      let newThumbLeft = e.clientX - containerRect.left - (thumbWidth / 2);
      newThumbLeft = Math.max(0, Math.min(maxThumbLeft, newThumbLeft));
      
      const scrollRatio = newThumbLeft / maxThumbLeft;
      const maxScroll = container.scrollWidth - container.clientWidth;
      container.scrollLeft = scrollRatio * maxScroll;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, thumbWidth]);

  return (
    <div className={`feature-nav-scroll-container ${className}`}>
      <div
        ref={containerRef}
        className="feature-nav-scroll overflow-x-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>
      <div className="feature-nav-scroll-track">
        <div
          ref={thumbRef}
          className="feature-nav-scroll-thumb"
          style={{
            width: `${thumbWidth}px`,
            left: `${thumbLeft}px`,
          }}
          onMouseDown={handleThumbMouseDown}
        />
      </div>
    </div>
  );
};

export default CustomScrollbar; 