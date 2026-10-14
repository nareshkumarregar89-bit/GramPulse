import { useEffect, useRef } from 'react';

export function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const rippleContainerRef = useRef(null);

  useEffect(() => {
    // 1. Disable on touch / coarse pointer devices
    const isTouch = 
      typeof window !== 'undefined' && 
      (window.matchMedia('(pointer: coarse)').matches || 
       'ontouchstart' in window || 
       navigator.maxTouchPoints > 0);

    // 2. Disable if user prefers reduced motion
    const prefersReducedMotion = 
      typeof window !== 'undefined' && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isTouch || prefersReducedMotion) {
      return;
    }

    const dot = dotRef.current;
    const ring = ringRef.current;
    const rippleContainer = rippleContainerRef.current;

    if (!dot || !ring) return;

    // Real-time mouse coordinates (target)
    let mouseX = -100;
    let mouseY = -100;

    // Smoothed follower coordinates (interpolated)
    let ringX = -100;
    let ringY = -100;

    let isHoveringInteractive = false;
    let isHoveringText = false;
    let isClicking = false;
    let isVisible = false;
    let animationFrameId;

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        dot.style.opacity = '1';
        ring.style.opacity = '1';
        ringX = mouseX;
        ringY = mouseY;
      }

      // Check hovered element
      const target = e.target;
      if (!target) return;

      // Text input detection -> shrink & fade follower so text cursor is completely clean
      const isTextInput = target.matches(
        'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="range"]):not([type="file"]), textarea, [contenteditable="true"]'
      );

      // Interactive element detection
      const isInteractive = Boolean(
        target.closest(
          'button, a, select, input[type="checkbox"], input[type="radio"], input[type="button"], input[type="submit"], [role="button"], .cursor-pointer, [data-interactive="true"]'
        )
      );

      isHoveringText = isTextInput;
      isHoveringInteractive = isInteractive && !isTextInput;
    };

    const onMouseDown = (e) => {
      isClicking = true;
      createRipple(e.clientX, e.clientY);
    };

    const onMouseUp = () => {
      isClicking = false;
    };

    const onMouseLeave = () => {
      isVisible = false;
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    };

    const onMouseEnter = () => {
      isVisible = true;
      dot.style.opacity = '1';
      ring.style.opacity = '1';
    };

    // Click ripple creation
    const createRipple = (x, y) => {
      if (!rippleContainer) return;
      const ripple = document.createElement('div');
      ripple.className = 'cursor-click-ripple';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      rippleContainer.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 600);
    };

    // Animation loop using requestAnimationFrame and linear interpolation (lerp)
    const render = () => {
      if (isVisible) {
        // Direct zero-latency transform for small indicator dot
        const dotScale = isClicking ? '0.75' : isHoveringInteractive ? '1.3' : '1';
        dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%) scale(${dotScale})`;

        // Smooth damping for follower ring (lerp factor: 0.2)
        const lerpFactor = 0.2;
        ringX += (mouseX - ringX) * lerpFactor;
        ringY += (mouseY - ringY) * lerpFactor;

        let ringScale = 1;
        let ringOpacity = '0.65';

        if (isHoveringText) {
          ringScale = 0;
          ringOpacity = '0';
        } else if (isClicking) {
          ringScale = 0.85;
          ringOpacity = '0.9';
        } else if (isHoveringInteractive) {
          ringScale = 1.65;
          ringOpacity = '0.85';
        }

        ring.style.opacity = ringOpacity;
        ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${ringScale})`;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    window.addEventListener('mouseup', onMouseUp, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      {/* Small Core Dot Indicator */}
      <div 
        ref={dotRef} 
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[9999] opacity-0 transition-opacity duration-200"
        style={{ willChange: 'transform' }}
      >
        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
      </div>

      {/* Smooth Trailing Follower Ring */}
      <div 
        ref={ringRef} 
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[9998] opacity-0 transition-opacity duration-300 ease-out"
        style={{ willChange: 'transform' }}
      >
        <div className="w-8 h-8 rounded-full border border-emerald-500/60 bg-emerald-500/10 backdrop-blur-[0.5px] shadow-[0_0_14px_rgba(16,185,129,0.2)]" />
      </div>

      {/* Click Ripple Container */}
      <div 
        ref={rippleContainerRef} 
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[9997] overflow-hidden" 
      />
    </>
  );
}
