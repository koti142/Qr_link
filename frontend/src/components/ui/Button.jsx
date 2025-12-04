import { Loader2 } from 'lucide-react';

/**
 * Button Component with Loading States
 * 
 * Features:
 * - Multiple variants (primary, secondary, outline, ghost)
 * - Loading state with spinner
 * - Full width option
 * - Accessible button element
 */
function Button({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  fullWidth = false,
  className = '',
  disabled,
  ...props 
}) {
  const baseStyles = "inline-flex items-center justify-center px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm hover:shadow-md active:bg-blue-800",
    secondary: "bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-500 shadow-sm",
    outline: "border-2 border-slate-300 text-slate-700 bg-white hover:bg-slate-50 focus:ring-blue-500",
    ghost: "text-slate-600 hover:text-blue-600 hover:bg-blue-50",
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
}

export default Button;

