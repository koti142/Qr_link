import * as redirectService from '../services/redirectService.js';

/**
 * Handle redirect
 */
export async function handleRedirect(req, res, next) {
  try {
    // Skip redirects for API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    const { slug } = req.params;
    const redirect = await redirectService.getRedirectBySlug(slug);
    
    if (!redirect) {
      return res.status(404).json({ error: 'Redirect not found' });
    }
    
    res.redirect(302, redirect.target_url);
  } catch (error) {
    console.error('Redirect error:', error);
    res.status(500).json({ error: 'Redirect failed' });
  }
}

/**
 * Get redirect info by slug (for API)
 */
export async function getRedirectInfo(req, res) {
  try {
    const { slug } = req.params;
    const redirect = await redirectService.getRedirectBySlug(slug);
    
    if (!redirect) {
      return res.status(404).json({ error: 'Redirect not found' });
    }
    
    res.json(redirect);
  } catch (error) {
    console.error('Get redirect info error:', error);
    res.status(500).json({ error: 'Failed to fetch redirect info' });
  }
}

/**
 * Get all redirects
 */
export async function getAllRedirects(req, res) {
  try {
    const redirects = await redirectService.getAllRedirects();
    res.json(redirects);
  } catch (error) {
    console.error('Get redirects error:', error);
    res.status(500).json({ error: 'Failed to fetch redirects' });
  }
}

/**
 * Delete redirect
 */
export async function deleteRedirect(req, res) {
  try {
    const { slug } = req.params;
    
    if (!slug) {
      return res.status(400).json({ error: 'Redirect slug is required' });
    }

    const deleted = await redirectService.deleteRedirect(slug);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Redirect not found' });
    }

    res.json({ message: 'Redirect deleted successfully' });
  } catch (error) {
    console.error('Delete redirect error:', error);
    res.status(500).json({ error: 'Failed to delete redirect' });
  }
}

