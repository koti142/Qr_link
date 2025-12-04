import pool from '../config/database.js';
import * as redirectService from '../services/redirectService.js';

export async function handleRedirect(req, res) {
  try {
    const { slug } = req.params;
    
    const redirect = await redirectService.getRedirect(slug);
    
    if (!redirect) {
      return res.status(404).json({ error: 'Redirect not found' });
    }

    res.redirect(redirect.url);
  } catch (error) {
    console.error('Redirect error:', error);
    res.status(500).json({ error: 'Redirect failed' });
  }
}

export async function getAllRedirects(req, res) {
  try {
    const redirects = await redirectService.getAllRedirects();
    res.json(redirects);
  } catch (error) {
    console.error('Get redirects error:', error);
    res.status(500).json({ error: 'Failed to fetch redirects' });
  }
}

export async function createRedirect(req, res) {
  try {
    const { slug, url } = req.body;
    
    if (!slug || !url) {
      return res.status(400).json({ error: 'Slug and URL required' });
    }

    const redirect = await redirectService.createRedirect(slug, url);
    res.status(201).json(redirect);
  } catch (error) {
    console.error('Create redirect error:', error);
    res.status(500).json({ error: 'Failed to create redirect' });
  }
}

export async function deleteRedirect(req, res) {
  try {
    const { slug } = req.params;
    const success = await redirectService.deleteRedirect(slug);
    
    if (success) {
      res.json({ message: 'Redirect deleted successfully' });
    } else {
      res.status(404).json({ error: 'Redirect not found' });
    }
  } catch (error) {
    console.error('Delete redirect error:', error);
    res.status(500).json({ error: 'Failed to delete redirect' });
  }
}

