import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Input Component with Floating Label
 * 
 * Features:
 * - Floating label animation
 * - Password visibility toggle
 * - Error state styling
 * - Accessible form inputs
 */
function Input({ label, type = 'text', error, className = '', ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`w-full ${className}`}>
      <div className="relative group">
        <input
          type={inputType}
          placeholder=" "
          className={`
            peer w-full px-4 py-3 bg-white border-2 rounded-lg outline-none transition-all duration-200
            placeholder-transparent
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 text-red-900' 
              : 'border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 text-slate-900 hover:border-slate-300'
            }
          `}
          {...props}
        />
        <label className={`
          absolute left-4 -top-2.5 px-1 bg-white text-xs font-medium transition-all duration-200
          peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-500 peer-placeholder-shown:top-3.5 
          peer-focus:-top-2.5 peer-focus:text-xs
          ${error ? 'text-red-500 peer-focus:text-red-500' : 'text-slate-500 peer-focus:text-brand-600'}
        `}>
          {label}
        </label>

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-sm text-red-500 animate-slide-up">{error}</p>}
    </div>
  );
}

export default Input;

