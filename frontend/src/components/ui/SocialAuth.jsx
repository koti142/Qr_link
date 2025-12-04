/**
 * Social Authentication Buttons
 * 
 * Features:
 * - Google and Microsoft sign-in options
 * - Hover effects
 * - Accessible buttons
 */
function SocialAuth() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <button 
        type="button"
        className="flex items-center justify-center px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-200"
      >
        <img 
          src="https://www.svgrepo.com/show/475656/google-color.svg" 
          alt="Google" 
          className="w-5 h-5 mr-2" 
        />
        <span className="text-sm font-medium text-slate-700">Google</span>
      </button>
      <button 
        type="button"
        className="flex items-center justify-center px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-200"
      >
        <img 
          src="https://www.svgrepo.com/show/448239/microsoft.svg" 
          alt="Microsoft" 
          className="w-5 h-5 mr-2" 
        />
        <span className="text-sm font-medium text-slate-700">Microsoft</span>
      </button>
    </div>
  );
}

export default SocialAuth;

