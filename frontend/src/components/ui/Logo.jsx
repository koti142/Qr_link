/**
 * Logo Component
 * 
 * Features:
 * - Light and dark variants
 * - Video delivery branding
 * - Responsive sizing
 */
function Logo({ className = '', variant = 'dark' }) {
  const color = variant === 'light' ? 'text-white' : 'text-brand-900';
  const iconColor = variant === 'light' ? 'text-brand-300' : 'text-brand-600';

  return (
    <div className={`flex items-center gap-2 font-bold text-2xl tracking-tight ${color} ${className}`}>
      <div className={`relative flex items-center justify-center w-8 h-8 rounded-lg bg-current opacity-10`}>
        {/* Background opacity layer */}
      </div>
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={`w-8 h-8 absolute ${iconColor}`}
      >
        {/* Video/Play icon */}
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
      <span>Video Delivery</span>
    </div>
  );
}

export default Logo;

