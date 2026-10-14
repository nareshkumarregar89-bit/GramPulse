import { useRef, useEffect } from 'react';

/**
 * TiltCard Component
 * Provides subtle, SaaS-grade 3D tilt effects using CSS transforms & requestAnimationFrame.
 * Automatically disables on touch screens and prefers-reduced-motion devices.
 */
export function TiltCard({
  children,
  className = '',
  maxTilt = 6, // Subtle tilt in degrees
  perspective = 1000,
  scale = 1.015, // Gentle elevation on hover
  glare = true,
  glareOpacity = 0.12,
  onClick,
  ...props
}) {
  const cardRef = useRef(null);
  const glareRef = useRef(null);
  const isTouchRef = useRef(false);
  const prefersReducedMotionRef = useRef(false);

  useEffect(() => {
    isTouchRef.current =
      typeof window !== 'undefined' &&
      (window.matchMedia('(pointer: coarse)').matches ||
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0);

    prefersReducedMotionRef.current =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const handleMouseMove = (e) => {
    if (isTouchRef.current || prefersReducedMotionRef.current) return;
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Mouse coordinates relative to card center [-1 to 1]
    const mouseX = (e.clientX - rect.left) / width - 0.5;
    const mouseY = (e.clientY - rect.top) / height - 0.5;

    // Calculate rotation angles (tilt toward pointer)
    const rotateY = mouseX * (maxTilt * 2);
    const rotateX = -mouseY * (maxTilt * 2);

    // Apply transform with smooth responsive easing
    card.style.transition = 'transform 0.08s ease-out, box-shadow 0.2s ease-out';
    card.style.transform = `perspective(${perspective}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`;

    // Dynamic specular glare calculation
    if (glare && glareRef.current) {
      const glareEl = glareRef.current;
      const glareX = ((e.clientX - rect.left) / width) * 100;
      const glareY = ((e.clientY - rect.top) / height) * 100;

      glareEl.style.opacity = `${glareOpacity}`;
      glareEl.style.background = `radial-gradient(circle 240px at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.45), transparent 75%)`;
    }
  };

  const handleMouseEnter = () => {
    if (isTouchRef.current || prefersReducedMotionRef.current) return;
    const card = cardRef.current;
    if (!card) return;
    card.style.willChange = 'transform';
  };

  const handleMouseLeave = () => {
    if (isTouchRef.current || prefersReducedMotionRef.current) return;
    const card = cardRef.current;
    if (!card) return;

    // Return naturally and smoothly to neutral resting position
    card.style.transition = 'transform 0.55s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.55s cubic-bezier(0.16, 1, 0.3, 1)';
    card.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;

    if (glare && glareRef.current) {
      glareRef.current.style.opacity = '0';
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`relative tilt-card transition-all duration-300 preserve-3d ${className}`}
      style={{
        transformStyle: 'preserve-3d',
        transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`
      }}
      {...props}
    >
      {/* Dynamic Specular Glare Layer */}
      {glare && (
        <div
          ref={glareRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 z-20 overflow-hidden mix-blend-overlay"
        />
      )}
      {children}
    </div>
  );
}
