import { useState, useEffect } from 'react';
import { Upload, Cloud, FileVideo, Trash2, RefreshCw, CheckCircle, XCircle, AlertCircle, Download, Folder, HardDrive, Edit2, Save, X } from 'lucide-react';
import api from '../services/api';

function MyStorageManager() {
  // State
  const [miscFiles, setMiscFiles] = useState([]);
  const [selectedMiscFiles, setSelectedMiscFiles] = useState([]);
  const [cloudflareResources, setCloudflareResources] = useState([]);
  const [thumbnails, setThumbnails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMisc, setLoadingMisc] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingUrl, setEditingUrl] = useState(null);
  const [editUrlValue, setEditUrlValue] = useState('');
  const [videosWithMockUrls, setVideosWithMockUrls] = useState([]);
  const [resourceVideos, setResourceVideos] = useState({}); // Map of resource ID to videos
  const [showVideosModal, setShowVideosModal] = useState(null); // Resource ID showing videos

  // Load data
  useEffect(() => {
    loadMiscFiles();
    loadCloudflareResources();
    loadThumbnails();
    loadVideosWithMockUrls();
  }, []);

  // Load videos using mock URLs
  const loadVideosWithMockUrls = async () => {
    try {
      const response = await api.get('/cloudflare/videos-with-mock-urls');
      setVideosWithMockUrls(response.data.videos || []);
    } catch (err) {
      console.error('Failed to load videos with mock URLs:', err);
    }
  };

  // Load videos for a specific resource
  const loadVideosForResource = async (resourceUrl) => {
    try {
      const response = await api.get(`/cloudflare/videos-by-url?url=${encodeURIComponent(resourceUrl)}`);
      return response.data.videos || [];
    } catch (err) {
      console.error('Failed to load videos for resource:', err);
      return [];
    }
  };

  const loadThumbnails = async () => {
    try {
      const response = await api.get('/videos/thumbnails');
      setThumbnails(response.data.thumbnails || []);
    } catch (err) {
      console.error('Failed to load thumbnails:', err);
      setThumbnails([]);
    }
  };

  const loadMiscFiles = async () => {
    setLoadingMisc(true);
    setError('');
    try {
      const response = await api.get('/cloudflare/misc-files');
      setMiscFiles(response.data.files || []);
    } catch (err) {
      console.error('Failed to load misc files:', err);
      setError(err.response?.data?.error || 'Failed to load misc files');
    } finally {
      setLoadingMisc(false);
    }
  };

  const loadCloudflareResources = async () => {
    setLoading(true);
    try {
      const response = await api.get('/cloudflare/resources');
      const resources = response.data.resources || [];
      setCloudflareResources(resources);
      
      // Load videos for each resource
      const videosMap = {};
      for (const resource of resources) {
        if (resource.cloudflare_url) {
          const videos = await loadVideosForResource(resource.cloudflare_url);
          videosMap[resource.id] = videos;
        }
      }
      setResourceVideos(videosMap);
    } catch (err) {
      console.error('Failed to load Cloudflare resources:', err);
      setError(err.response?.data?.error || 'Failed to load Cloudflare resources');
    } finally {
      setLoading(false);
    }
  };

  // File selection
  const handleSelectMiscFile = (file) => {
    const isSelected = selectedMiscFiles.some(f => f.path === file.path);
    if (isSelected) {
      setSelectedMiscFiles(selectedMiscFiles.filter(f => f.path !== file.path));
    } else {
      setSelectedMiscFiles([...selectedMiscFiles, file]);
    }
  };

  const handleSelectAllMisc = () => {
    if (selectedMiscFiles.length === miscFiles.length) {
      setSelectedMiscFiles([]);
    } else {
      setSelectedMiscFiles([...miscFiles]);
    }
  };

  // Delete misc file
  const handleDeleteMiscFile = async (file, e) => {
    e.stopPropagation(); // Prevent file selection when clicking delete
    
    if (!window.confirm(`Are you sure you want to delete "${file.filename}"?`)) {
      return;
    }

    setLoadingMisc(true);
    setError('');
    
    try {
      await api.delete('/cloudflare/misc-files', {
        data: {
          filename: file.filename,
          path: file.path
        }
      });
      setSuccess(`File "${file.filename}" deleted successfully`);
      // Remove from selected files if it was selected
      setSelectedMiscFiles(selectedMiscFiles.filter(f => f.path !== file.path));
      // Reload misc files
      loadMiscFiles();
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.error || `Failed to delete file "${file.filename}"`);
    } finally {
      setLoadingMisc(false);
    }
  };

  // Delete selected misc files
  const handleDeleteSelectedMiscFiles = async () => {
    if (selectedMiscFiles.length === 0) {
      setError('Please select at least one file to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedMiscFiles.length} file(s)?`)) {
      return;
    }

    setLoadingMisc(true);
    setError('');
    
    try {
      const deletePromises = selectedMiscFiles.map(file =>
        api.delete('/cloudflare/misc-files', {
          data: {
            filename: file.filename,
            path: file.path
          }
        })
      );
      
      await Promise.all(deletePromises);
      setSuccess(`${selectedMiscFiles.length} file(s) deleted successfully`);
      setSelectedMiscFiles([]);
      loadMiscFiles();
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.error || 'Failed to delete files');
    } finally {
      setLoadingMisc(false);
    }
  };

  // Upload functions
  const handleUploadFromMisc = async (testMode = false) => {
    if (selectedMiscFiles.length === 0) {
      setError('Please select at least one file from misc folder');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const uploadPromises = selectedMiscFiles.map(async (file) => {
        const response = await api.post('/cloudflare/upload', {
          fileName: file.filename,
          fileSize: file.size,
          fileType: getFileType(file.filename),
          sourceType: 'misc',
          sourcePath: file.relativePath,
          testMode
        });
        return response.data;
      });

      await Promise.all(uploadPromises);
      setSuccess(`${selectedMiscFiles.length} file(s) uploaded successfully!`);
      setSelectedMiscFiles([]);
      loadCloudflareResources();
    } catch (err) {
      console.error('Upload error:', err);
      console.error('Error response:', err.response?.data);
      
      // Build comprehensive error message
      let errorMessage = 'Failed to upload files';
      let errorDetails = '';
      
      if (err.response?.data) {
        const errorData = err.response.data;
        
        // Primary error message
        errorMessage = errorData.error || errorData.message || errorMessage;
        
        // Add additional error information
        const details = [];
        
        if (errorData.message && errorData.message !== errorData.error) {
          details.push(`Details: ${errorData.message}`);
        }
        
        if (errorData.type) {
          details.push(`Error Type: ${errorData.type}`);
        }
        
        if (errorData.code) {
          details.push(`Error Code: ${errorData.code}`);
        }
        
        if (errorData.sqlError) {
          details.push(`SQL Error: ${errorData.sqlError.message || errorData.sqlError.code || 'Database error'}`);
        }
        
        if (errorData.fileName) {
          details.push(`File: ${errorData.fileName}`);
        }
        
        if (errorData.sourcePath) {
          details.push(`Source Path: ${errorData.sourcePath}`);
        }
        
        if (errorData.debug) {
          details.push(`Debug Info: ${JSON.stringify(errorData.debug, null, 2)}`);
        }
        
        if (errorData.details) {
          details.push(`Additional Details: ${JSON.stringify(errorData.details, null, 2)}`);
        }
        
        if (details.length > 0) {
          errorDetails = '\n\n' + details.join('\n');
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(`${errorMessage}${errorDetails}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFromPC = async (e, testMode = false) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const uploadPromises = files.map(async (file) => {
        // Create FormData for multipart/form-data upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', file.name);
        formData.append('fileSize', file.size.toString());
        formData.append('fileType', file.type || 'application/octet-stream');
        formData.append('sourceType', 'upload');
        formData.append('testMode', testMode.toString());
        
        // Don't set Content-Type header - axios will set it automatically with boundary for FormData
        const response = await api.post('/cloudflare/upload', formData);
        return response.data;
      });

      await Promise.all(uploadPromises);
      setSuccess(`${files.length} file(s) uploaded successfully!`);
      loadCloudflareResources();
    } catch (err) {
      console.error('Upload error:', err);
      console.error('Error response:', err.response?.data);
      
      // Build comprehensive error message
      let errorMessage = 'Failed to upload files';
      let errorDetails = '';
      
      if (err.response?.data) {
        const errorData = err.response.data;
        
        // Primary error message
        errorMessage = errorData.error || errorData.message || errorMessage;
        
        // Add additional error information
        const details = [];
        
        if (errorData.message && errorData.message !== errorData.error) {
          details.push(`Details: ${errorData.message}`);
        }
        
        if (errorData.type) {
          details.push(`Error Type: ${errorData.type}`);
        }
        
        if (errorData.code) {
          details.push(`Error Code: ${errorData.code}`);
        }
        
        if (errorData.sqlError) {
          details.push(`SQL Error: ${errorData.sqlError.message || errorData.sqlError.code || 'Database error'}`);
        }
        
        if (errorData.fileName) {
          details.push(`File: ${errorData.fileName}`);
        }
        
        if (errorData.sourcePath) {
          details.push(`Source Path: ${errorData.sourcePath}`);
        }
        
        if (errorData.debug) {
          details.push(`Debug Info: ${JSON.stringify(errorData.debug, null, 2)}`);
        }
        
        if (errorData.details) {
          details.push(`Additional Details: ${JSON.stringify(errorData.details, null, 2)}`);
        }
        
        if (details.length > 0) {
          errorDetails = '\n\n' + details.join('\n');
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(`${errorMessage}${errorDetails}`);
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleEditUrl = async (resource) => {
    setEditingUrl(resource.id);
    setEditUrlValue(resource.cloudflare_url || '');
    
    // Load videos using this resource
    if (resource.cloudflare_url) {
      const videos = await loadVideosForResource(resource.cloudflare_url);
      setResourceVideos(prev => ({
        ...prev,
        [resource.id]: videos
      }));
    }
  };

  const handleShowVideos = async (resource) => {
    if (showVideosModal === resource.id) {
      setShowVideosModal(null);
    } else {
      const videos = await loadVideosForResource(resource.cloudflare_url);
      setResourceVideos(prev => ({
        ...prev,
        [resource.id]: videos
      }));
      setShowVideosModal(resource.id);
    }
  };

  const handleCancelEdit = () => {
    setEditingUrl(null);
    setEditUrlValue('');
  };

  const handleSaveUrl = async (id, oldUrl) => {
    if (!editUrlValue.trim()) {
      setError('Streaming URL cannot be empty');
      return;
    }

    let urlToSave = editUrlValue.trim();
    
    // If user entered a mock URL, convert it to localhost URL
    if (isMockUrl(urlToSave)) {
      // Find the resource to get storage path
      const resource = cloudflareResources.find(r => r.id === id);
      if (resource && resource.cloudflare_key) {
        const storagePath = resource.cloudflare_key.replace(/^cloudflare\//, 'my-storage/');
        const videoIdMatch = storagePath.match(/(?:my-storage|cloudflare)\/([^/]+)_master\./);
        if (videoIdMatch) {
          const videoId = videoIdMatch[1];
          const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
          urlToSave = `${backendUrl}/s/${videoId}`;
          setSuccess(`Converted mock URL to localhost: ${urlToSave}`);
        } else {
          setError('Cannot convert mock URL. Please enter a valid localhost streaming URL.');
          return;
        }
      } else {
        setError('Cannot convert mock URL. Please enter a valid localhost streaming URL.');
        return;
      }
    }

    // Check if there are videos using this URL
    const videos = await loadVideosForResource(oldUrl);
    const shouldUpdateVideos = videos.length > 0 && window.confirm(
      `Found ${videos.length} video(s) using this streaming URL.\n\n` +
      `Do you want to update all these videos with the new URL?\n\n` +
      `Click OK to update videos, or Cancel to only update the resource.`
    );

    try {
      const response = await api.put(`/cloudflare/resources/${id}`, {
        cloudflare_url: urlToSave,
        updateVideos: shouldUpdateVideos
      });
      
      const message = response.data.message || 'Streaming URL updated successfully';
      setSuccess(message);
      setEditingUrl(null);
      setEditUrlValue('');
      loadCloudflareResources();
      loadVideosWithMockUrls();
    } catch (err) {
      console.error('Update error:', err);
      setError(err.response?.data?.error || 'Failed to update streaming URL');
    }
  };

  const handleDeleteResource = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) {
      return;
    }

    try {
      await api.delete(`/cloudflare/resources/${id}`);
      setSuccess('Resource deleted successfully');
      loadCloudflareResources();
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.error || 'Failed to delete resource');
    }
  };

  const isMockUrl = (url) => {
    if (!url) return false;
    return url.includes('your-account.r2.cloudflarestorage.com') ||
           url.includes('mock-cloudflare.example.com') ||
           url.includes('example.com') ||
           url.includes('test.cloudflare') ||
           url.includes('cloudflarestorage.com');
  };

  // Convert mock URL or storage path to localhost streaming URL
  const getLocalhostUrl = (resource) => {
    // If it's already a localhost URL, return it
    if (resource.cloudflare_url && (resource.cloudflare_url.includes('localhost') || resource.cloudflare_url.includes('127.0.0.1'))) {
      return resource.cloudflare_url;
    }
    
    // If it's a mock URL or we have a storage path, convert it
    if (isMockUrl(resource.cloudflare_url) || resource.cloudflare_key) {
      const storagePath = resource.cloudflare_key || '';
      // Extract video ID from storage path (format: my-storage/{videoId}_master.mp4)
      const videoIdMatch = storagePath.match(/my-storage\/([^/]+)_master\./);
      if (videoIdMatch) {
        const videoId = videoIdMatch[1];
        const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
        return `${backendUrl}/s/${videoId}`;
      }
      
      // Try to extract from old cloudflare path format
      const oldPathMatch = storagePath.match(/cloudflare\/[^/]+\/([^/]+)_master\./);
      if (oldPathMatch) {
        const videoId = oldPathMatch[1];
        const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
        return `${backendUrl}/s/${videoId}`;
      }
    }
    
    // Return original URL if we can't convert it
    return resource.cloudflare_url || '';
  };

  // Helper functions
  const getFileType = (filename) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const types = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      pdf: 'application/pdf'
    };
    return types[ext] || 'application/octet-stream';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Generate UUID for PartnerID
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Generate CSV from My Storage resources
  const generateCSVFromMyStorage = () => {
    if (cloudflareResources.length === 0) {
      setError('No storage resources available to generate CSV');
      return;
    }

    // Check for resources without file paths or URLs
    const resourcesWithoutPath = cloudflareResources.filter(r => 
      (!r.cloudflare_key || r.cloudflare_key.trim() === '') && 
      (!r.cloudflare_url || r.cloudflare_url.trim() === '')
    );
    if (resourcesWithoutPath.length > 0) {
      const proceed = window.confirm(
        `Warning: ${resourcesWithoutPath.length} resource(s) are missing file paths or URLs.\n\n` +
        `These resources will be skipped in the CSV.\n\n` +
        `Do you want to proceed anyway?`
      );
      if (!proceed) {
        return;
      }
    }

    // Note: All URLs are now localhost URLs, so no need to check for mock URLs

    // Get thumbnails - use available thumbnails from thumbnails folder
    // Format should be: thumbnails/filename.png (lowercase, no leading slash)
    const availableThumbnails = thumbnails.length > 0 
      ? thumbnails.map(t => {
          // Ensure format is thumbnails/filename.png (lowercase, no leading slash)
          let path = t.path || t.filename;
          // Remove leading slash if present
          path = path.replace(/^\/+/, '');
          // Ensure it starts with 'thumbnails/' (lowercase)
          if (!path.toLowerCase().startsWith('thumbnails/')) {
            path = `thumbnails/${path}`;
          }
          // Return with original case for filename matching
          return {
            path: path.toLowerCase(),
            filename: t.filename || path.split('/').pop(),
            name: t.name || path.split('/').pop().replace(/\.[^/.]+$/, '')
          };
        })
      : [];
    
    console.log('[CSV Generation] Available thumbnails:', availableThumbnails.map(t => t.path));
    
    // Function to get thumbnail for a resource - try to match by name, otherwise cycle
    const getThumbnailForResource = (resource, index) => {
      if (availableThumbnails.length === 0) {
        return 'thumbnails/default.png';
      }
      
      // Extract resource name without extension for matching
      const resourceName = resource.file_name.replace(/\.[^/.]+$/, '').toLowerCase();
      console.log(`[CSV] Matching thumbnail for resource: ${resourceName}`);
      
      // Try exact match first (case-insensitive)
      let matchedThumbnail = availableThumbnails.find(t => {
        const thumbName = t.name.toLowerCase();
        const thumbFilename = t.filename.toLowerCase().replace(/\.[^/.]+$/, '');
        return thumbName === resourceName || thumbFilename === resourceName;
      });
      
      // Try partial match (contains resource name or vice versa)
      if (!matchedThumbnail) {
        matchedThumbnail = availableThumbnails.find(t => {
          const thumbName = t.name.toLowerCase();
          const thumbFilename = t.filename.toLowerCase().replace(/\.[^/.]+$/, '');
          // Check if resource name contains thumbnail name or vice versa
          return thumbName.includes(resourceName) || 
                 resourceName.includes(thumbName) ||
                 thumbFilename.includes(resourceName) ||
                 resourceName.includes(thumbFilename);
        });
      }
      
      // Try matching key words (e.g., "AllAboutMyFamily" matches "AllAboutMyFamily_grade1")
      if (!matchedThumbnail) {
        const resourceWords = resourceName.split(/[_\-\s]+/).filter(w => w.length > 2);
        matchedThumbnail = availableThumbnails.find(t => {
          const thumbName = t.name.toLowerCase();
          return resourceWords.some(word => thumbName.includes(word));
        });
      }
      
      // If no match found, cycle through thumbnails
      if (!matchedThumbnail) {
        const thumbnailIndex = index % availableThumbnails.length;
        matchedThumbnail = availableThumbnails[thumbnailIndex];
        console.log(`[CSV] No match found, using thumbnail ${thumbnailIndex + 1}/${availableThumbnails.length}: ${matchedThumbnail.path}`);
      } else {
        console.log(`[CSV] ✓ Matched thumbnail: ${matchedThumbnail.path} for resource: ${resourceName}`);
      }
      
      return matchedThumbnail.path;
    };

    // Build CSV with NEW format: ID, Title, Link/Path, Thumbnail Images, Tag 1, Tag 2
    // Required: ID, Title, Link/Path
    // Optional: Thumbnail Images, Tag 1, Tag 2
    const headers = ['ID', 'Title', 'Link/Path', 'Thumbnail Images', 'Tag 1', 'Tag 2'];
    
    const rows = cloudflareResources
      .filter(resource => {
        // Filter out resources without URLs
        return true;
      })
      .map((resource, index) => {
      // Generate unique ID from resource - use videoId from storage path or generate one
      let videoId = '';
      if (resource.cloudflare_key) {
        const storagePath = resource.cloudflare_key.replace(/^cloudflare\//, 'my-storage/');
        // Extract videoId from path pattern: my-storage/{videoId}_master.ext or my-storage/{videoId}master_master.ext
        // Handle both patterns: VID_123_master.mp4 and VID123master_master.mp4
        const videoIdMatch = storagePath.match(/(?:my-storage|cloudflare)\/([^/]+?)(?:_master\.|master_master\.|_v\d+_master\.|_v\d+master_master\.)/);
        if (videoIdMatch) {
          videoId = videoIdMatch[1];
          // Remove any version suffix if present (e.g., _v02 or v02)
          videoId = videoId.replace(/_v\d+$/, '').replace(/v\d+$/, '');
          // Remove trailing "master" if present (from master_master pattern)
          videoId = videoId.replace(/master$/, '');
        }
      }
      
      // Also try to extract from streaming URL if available
      if ((!videoId || videoId.trim() === '') && resource.cloudflare_url) {
        const urlMatch = resource.cloudflare_url.match(/\/s\/([^/]+)/);
        if (urlMatch) {
          const slug = urlMatch[1];
          // Remove version suffix if present
          videoId = slug.replace(/_v\d+(_\d+)?$/, '').replace(/_master$/, '');
        }
      }
      
      // If no videoId found, generate one from filename or resource ID
      if (!videoId || videoId.trim() === '') {
        const fileName = resource.file_name.replace(/\.[^/.]+$/, '');
        // Remove _master suffix if present in filename, and handle master_master pattern
        let cleanFileName = fileName.replace(/_master$/, '').replace(/master_master$/, '').replace(/_v\d+$/, '');
        // Extract numbers from filename to use as base (e.g., VID1764763855691 -> VID_1764763855691)
        const numberMatch = cleanFileName.match(/(\d+)/);
        
        if (numberMatch && cleanFileName.toLowerCase().startsWith('vid')) {
          // If it's a VID pattern, use the number as the ID
          const vidNumber = numberMatch[1];
          videoId = `VID_${vidNumber}`;
        } else if (cleanFileName && cleanFileName.trim() !== '') {
          // Use filename as base (sanitized)
          const sanitized = cleanFileName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
          // Add resource ID and random to ensure uniqueness
          const timestamp = Date.now();
          const random = Math.random().toString(36).substring(2, 6).toUpperCase();
          videoId = `${sanitized}_${resource.id || index}_${random}`;
        } else {
          // Fallback: use resource ID and timestamp
          const timestamp = Date.now();
          const random = Math.random().toString(36).substring(2, 6).toUpperCase();
          videoId = `VID_${resource.id || index}_${timestamp}_${random}`;
        }
        // Ensure ID doesn't exceed 50 characters
        if (videoId.length > 50) {
          videoId = videoId.substring(0, 50);
        }
      }
      
      // Ensure videoId is clean and valid - remove any _master suffix that might have been included
      videoId = videoId.replace(/_master$/, '').replace(/master$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
      
      // If videoId looks like it has numbers without underscores (e.g., VID1764763855691), add underscore
      // This ensures consistency: VID1764763855691 -> VID_1764763855691
      const vidNumberMatch = videoId.match(/^VID(\d+)/);
      if (vidNumberMatch) {
        videoId = `VID_${vidNumberMatch[1]}`;
      }
      
      // Title - Extract from filename or use file name
      const title = resource.file_name.replace(/\.[^/.]+$/, '') || `Video ${index + 1}`;
      
      // Link/Path - Video file path or URL - REQUIRED
      // For My Storage, use the storage path (my-storage/filename)
      // Link/Path - Use the ACTUAL cloudflare_key from database (this is the real stored path)
      let linkPath = '';
      
      // CRITICAL: Use cloudflare_key directly from database - this is the actual stored path
      if (resource.cloudflare_key) {
        // cloudflare_key already contains the correct path (e.g., "my-storage/VID123_master.mp4" or "my-storage/VID123master_master.mp4")
        // Just normalize it to ensure it starts with my-storage/
        linkPath = resource.cloudflare_key.replace(/^cloudflare\//, 'my-storage/');
        // Ensure it starts with my-storage/ (in case it's just a filename)
        if (!linkPath.startsWith('my-storage/')) {
          linkPath = `my-storage/${linkPath}`;
        }
        console.log(`[CSV] Row ${index + 1}: Using actual database path: ${linkPath}`);
      }
      
      // Fallback: construct from videoId if cloudflare_key is missing
      if (!linkPath && videoId) {
        const fileExtension = resource.file_name.match(/\.[^/.]+$/) || ['.mp4'];
        linkPath = `my-storage/${videoId}_master${fileExtension[0]}`;
        console.log(`[CSV] Row ${index + 1}: Constructed path from videoId: ${linkPath}`);
      }
      
      // Last fallback: try to use streaming URL
      if (!linkPath && resource.cloudflare_url) {
        if (resource.cloudflare_url.includes('localhost') || resource.cloudflare_url.includes('127.0.0.1')) {
          // Extract path from localhost URL
          const urlMatch = resource.cloudflare_url.match(/\/s\/([^/]+)/);
          if (urlMatch) {
            const urlVideoId = urlMatch[1];
            linkPath = `my-storage/${urlVideoId}_master.mp4`;
          } else {
            linkPath = resource.cloudflare_url;
          }
        } else {
          linkPath = resource.cloudflare_url;
        }
        console.log(`[CSV] Row ${index + 1}: Using path from URL: ${linkPath}`);
      }
      
      // Ensure linkPath is not empty (required field)
      if (!linkPath || linkPath.trim() === '') {
        console.error(`[CSV] Resource ${resource.id} (${resource.file_name}) has no Link/Path - skipping this resource`);
        return null; // Skip resources without paths
      }
      
      // Thumbnail Images - OPTIONAL (use thumbnail from thumbnails folder if available)
      // Format: thumbnails/filename.png
      let thumbnail = '';
      if (availableThumbnails.length > 0) {
        thumbnail = getThumbnailForResource(resource, index);
      }
      // Leave empty if no thumbnail found (optional field)
      
      // Tag 1 and Tag 2 - OPTIONAL (empty for now, can be filled manually)
      const tag1 = '';
      const tag2 = '';
      
      console.log(`[CSV] Row ${index + 1}: ID="${videoId}", Title="${title}", Link/Path="${linkPath.substring(0, 50)}...", Thumbnail="${thumbnail}"`);
      
      return [
        videoId,        // ID - unique identifier (REQUIRED)
        title,          // Title - video title (REQUIRED)
        linkPath,       // Link/Path - file path or URL (REQUIRED)
        thumbnail,      // Thumbnail Images - thumbnail path (OPTIONAL)
        tag1,           // Tag 1 - first tag (OPTIONAL)
        tag2            // Tag 2 - second tag (OPTIONAL)
      ];
    })
    .filter(row => row !== null); // Remove null entries (resources without paths)

    // Validate CSV before download - ensure all rows have required fields
    const rowCount = rows.length;
    
    if (rowCount === 0) {
      setError('No valid resources to generate CSV. Please ensure resources have file paths or URLs.');
      return;
    }
    
    // Filter out invalid rows before generating CSV
    const validRows = rows.filter(row => {
      const hasId = row[0] && String(row[0]).trim() !== '';
      const hasTitle = row[1] && String(row[1]).trim() !== '';
      const hasLinkPath = row[2] && String(row[2]).trim() !== '';
      return hasId && hasTitle && hasLinkPath;
    });
    
    if (validRows.length === 0) {
      setError('No valid rows to generate CSV. All resources are missing required fields (ID, Title, or Link/Path).');
      return;
    }
    
    if (validRows.length < rowCount) {
      const skippedCount = rowCount - validRows.length;
      const proceed = window.confirm(
        `Warning: ${skippedCount} resource(s) are missing required fields and will be skipped.\n\n` +
        `Only ${validRows.length} valid row(s) will be included in the CSV.\n\n` +
        `Do you want to proceed with CSV generation?`
      );
      if (!proceed) {
        return;
      }
    }
    
    // Use only valid rows (finalRows is just an alias for clarity)
    const finalRows = validRows;

    // Escape CSV values properly
    const escapeCSV = (value) => {
      const cellStr = String(value || '').trim();
      // Always escape if it contains special characters
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n') || cellStr.includes('\r')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      // Return empty string as-is (don't wrap in quotes for empty values)
      return cellStr;
    };

    // Build CSV content with proper line endings
    // Ensure headers match exactly what backend expects
    // Use finalRows (validated rows) instead of rows
    const csvContent = [
      headers.join(','),
      ...finalRows.map(row => row.map(escapeCSV).join(','))
    ].join('\r\n'); // Use \r\n for Windows compatibility
    
    // Log CSV preview for debugging
    console.log('[CSV Generation] CSV Preview (first 500 chars):', csvContent.substring(0, 500));
    console.log('[CSV Generation] Total valid rows:', finalRows.length);
    console.log('[CSV Generation] Headers:', headers);
    console.log('[CSV Generation] Sample row:', finalRows[0]);

    // Download CSV
    try {
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel compatibility
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my_storage_resources_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setSuccess(`CSV generated successfully with ${finalRows.length} valid resource(s)! You can now upload this CSV in the Bulk Upload page.`);
      setError('');
    } catch (err) {
      console.error('CSV generation error:', err);
      setError('Failed to generate CSV file. Please try again.');
      setSuccess('');
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
      <div className="w-full h-full">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-xl shadow-lg">
                  <Cloud className="w-10 h-10 text-white" />
                </div>
                My Storage Manager
              </h1>
              <p className="text-gray-600 text-lg ml-16">Upload files from misc folder to local storage (my-storage) with localhost streaming URLs</p>
            </div>
            <button
              onClick={() => {
                loadMiscFiles();
                loadCloudflareResources();
              }}
              disabled={loading || loadingMisc}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading || loadingMisc ? 'animate-spin' : ''}`} />
              Refresh All
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold mb-1">Upload Failed</div>
              <div className="text-sm whitespace-pre-wrap font-mono bg-red-100 p-2 rounded border border-red-200 overflow-auto max-h-96">
                {error}
              </div>
            </div>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg text-green-700 flex items-start gap-3 shadow-sm">
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1 font-medium">{success}</div>
            <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700 transition-colors">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Warning for Mock URLs */}
        {cloudflareResources.some(r => isMockUrl(r.cloudflare_url)) && (
          <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg text-yellow-800 flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold mb-1">Mock/Test URLs Detected</div>
              <div className="text-sm">
                Some resources have mock/test URLs that cannot be accessed. 
                Click the edit icon next to each URL to update them with real streaming URLs.
                Videos with mock URLs will not play correctly.
              </div>
            </div>
          </div>
        )}

        {/* Two Column Layout - Full Width */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-280px)]">
          {/* Left Side - Misc Files */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <div className="p-1.5 bg-blue-600 rounded-lg">
                    <Folder className="w-5 h-5 text-white" />
                  </div>
                  Misc Folder Files
                  <span className="ml-2 px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {miscFiles.length}
                  </span>
                </h2>
                <div className="flex gap-2">
                  {selectedMiscFiles.length > 0 && (
                    <button
                      onClick={handleDeleteSelectedMiscFiles}
                      disabled={loadingMisc}
                      className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed font-medium shadow-sm flex items-center gap-1"
                      title="Delete selected files"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete ({selectedMiscFiles.length})
                    </button>
                  )}
                  <button
                    onClick={handleSelectAllMisc}
                    disabled={miscFiles.length === 0}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed font-medium shadow-sm"
                  >
                    {selectedMiscFiles.length === miscFiles.length && miscFiles.length > 0 ? 'Deselect All' : 'Select All'}
                  </button>
                  <button
                    onClick={loadMiscFiles}
                    disabled={loadingMisc}
                    className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingMisc ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Files List - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingMisc ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : miscFiles.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <FileVideo className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <div className="text-gray-500 font-medium text-lg mb-2">No files found</div>
                  <div className="text-gray-400 text-sm mb-4">Files in misc folder will appear here</div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                    <div className="text-blue-800 font-semibold text-sm mb-2">📁 Misc Folder Location:</div>
                    <div className="text-blue-600 text-xs font-mono break-all">
                      video-storage/misc/
                    </div>
                    <div className="text-blue-700 text-xs mt-2">
                      Add your video files (.mp4, .webm, etc.) to this folder, then click the refresh button above.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {miscFiles.map((file, index) => {
                    const isSelected = selectedMiscFiles.some(f => f.path === file.path);
                    return (
                      <div
                        key={index}
                        onClick={() => handleSelectMiscFile(file)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-blue-300 hover:shadow-sm bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}>
                              <FileVideo className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate text-sm mb-1">{file.filename}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-2">
                                <span>{file.sizeFormatted}</span>
                                <span>•</span>
                                <span>{new Date(file.modified).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={(e) => handleDeleteMiscFile(file, e)}
                              disabled={loadingMisc}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:text-red-300 disabled:cursor-not-allowed"
                              title="Delete file"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            {isSelected && (
                              <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Action Buttons - Fixed at Bottom */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2">
              {selectedMiscFiles.length > 0 && (
                <>
                  <button
                    onClick={() => handleUploadFromMisc(false)}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:from-blue-400 disabled:to-blue-500 font-medium shadow-md"
                  >
                    <Upload className="w-5 h-5" />
                    Upload {selectedMiscFiles.length} Selected to Local Storage
                  </button>
                  <button
                    onClick={() => handleUploadFromMisc(true)}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all disabled:from-green-400 disabled:to-green-500 font-medium shadow-md"
                  >
                    <Cloud className="w-5 h-5" />
                    Test Upload ({selectedMiscFiles.length} files)
                  </button>
                </>
              )}
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all cursor-pointer font-medium shadow-md">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">From PC</span>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => handleUploadFromPC(e, false)}
                    className="hidden"
                    disabled={loading}
                  />
                </label>
                <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all cursor-pointer font-medium shadow-md">
                  <Cloud className="w-4 h-4" />
                  <span className="text-sm">Test</span>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => handleUploadFromPC(e, true)}
                    className="hidden"
                    disabled={loading}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Right Side - My Storage */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <div className="p-1.5 bg-purple-600 rounded-lg">
                    <HardDrive className="w-5 h-5 text-white" />
                  </div>
                  My Storage
                  <span className="ml-2 px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    {cloudflareResources.length}
                  </span>
                </h2>
                {cloudflareResources.length > 0 && (
                  <button
                    onClick={generateCSVFromMyStorage}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Generate CSV
                  </button>
                )}
              </div>
            </div>

            {/* Resources Table - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
              ) : cloudflareResources.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 m-4">
                  <Cloud className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <div className="text-gray-500 font-medium text-lg mb-2">No resources uploaded yet</div>
                  <div className="text-gray-400 text-sm">Upload files to see them here</div>
                </div>
              ) : (
                <div className="p-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">File Name</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Size</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Streaming URL</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Storage Path</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {cloudflareResources.map((resource) => (
                          <tr key={resource.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-100 rounded">
                                  <FileVideo className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{resource.file_name}</div>
                                  <div className="text-xs text-gray-500 mt-0.5 capitalize">{resource.source_type}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-gray-600 font-medium">{formatFileSize(resource.file_size)}</div>
                            </td>
                            <td className="px-4 py-3">
                              {editingUrl === resource.id ? (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={editUrlValue}
                                      onChange={(e) => setEditUrlValue(e.target.value)}
                                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="Enter Streaming URL"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => handleSaveUrl(resource.id, resource.cloudflare_url)}
                                      className="text-green-600 hover:text-green-700 p-1 hover:bg-green-50 rounded"
                                      title="Save"
                                    >
                                      <Save className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      className="text-gray-600 hover:text-gray-700 p-1 hover:bg-gray-50 rounded"
                                      title="Cancel"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                  {resourceVideos[resource.id] && resourceVideos[resource.id].length > 0 && (
                                    <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                      {resourceVideos[resource.id].length} video(s) using this URL
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  {(() => {
                                    const displayUrl = getLocalhostUrl(resource);
                                    const isMock = isMockUrl(resource.cloudflare_url);
                                    return (
                                      <>
                                        <a
                                          href={displayUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`text-sm hover:underline truncate max-w-xs block flex items-center gap-1 ${
                                            isMock
                                              ? 'text-orange-600 hover:text-orange-700'
                                              : 'text-blue-600 hover:text-blue-700'
                                          }`}
                                          title={displayUrl}
                                        >
                                          <Cloud className="w-3 h-3" />
                                          {displayUrl && displayUrl.length > 40 
                                            ? displayUrl.substring(0, 40) + '...' 
                                            : displayUrl || 'No URL'}
                                        </a>
                                        {isMock && (
                                          <span className="text-xs text-orange-600 font-medium" title="Converted from mock URL to localhost">
                                            🔄
                                          </span>
                                        )}
                                      </>
                                    );
                                  })()}
                                  {resourceVideos[resource.id] && resourceVideos[resource.id].length > 0 && (
                                    <button
                                      onClick={() => handleShowVideos(resource)}
                                      className="text-xs text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded"
                                      title={`${resourceVideos[resource.id].length} video(s) using this URL`}
                                    >
                                      {resourceVideos[resource.id].length} video(s)
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-xs text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded truncate max-w-xs" title={resource.cloudflare_key || resource.object_key || 'N/A'}>
                                {resource.cloudflare_key ? resource.cloudflare_key.replace(/^cloudflare\//, 'my-storage/') : (resource.object_key || 'N/A')}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {editingUrl !== resource.id && (
                                  <>
                                    <button
                                      onClick={() => handleEditUrl(resource)}
                                      className="text-blue-600 hover:text-blue-700 transition-colors p-1.5 hover:bg-blue-50 rounded"
                                      title="Edit URL"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    {resourceVideos[resource.id] && resourceVideos[resource.id].length > 0 && (
                                      <button
                                        onClick={() => handleShowVideos(resource)}
                                        className="text-purple-600 hover:text-purple-700 transition-colors p-1.5 hover:bg-purple-50 rounded"
                                        title="View videos using this URL"
                                      >
                                        <FileVideo className="w-4 h-4" />
                                      </button>
                                    )}
                                  </>
                                )}
                                <button
                                  onClick={() => handleDeleteResource(resource.id)}
                                  className="text-red-600 hover:text-red-700 transition-colors p-1.5 hover:bg-red-50 rounded"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Videos Modal */}
        {showVideosModal && resourceVideos[showVideosModal] && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FileVideo className="w-6 h-6 text-purple-600" />
                    Videos Using This Streaming URL
                    <span className="ml-2 px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                      {resourceVideos[showVideosModal].length}
                    </span>
                  </h3>
                  <button
                    onClick={() => setShowVideosModal(null)}
                    className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {resourceVideos[showVideosModal].length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No videos found using this URL
                  </div>
                ) : (
                  <div className="space-y-3">
                    {resourceVideos[showVideosModal].map((video) => (
                      <div
                        key={video.id}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 mb-1">{video.title || 'Untitled Video'}</div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>Video ID: <code className="bg-gray-100 px-1 rounded">{video.video_id}</code></div>
                              <div className="truncate">URL: <code className="bg-gray-100 px-1 rounded text-xs">{video.streaming_url || video.file_path}</code></div>
                            </div>
                          </div>
                          <a
                            href={`/admin/videos/${video.video_id}/edit`}
                            target="_blank"
                            className="text-blue-600 hover:text-blue-700 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded text-sm font-medium transition-colors"
                          >
                            Edit Video
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Videos with Mock URLs Section */}
        {videosWithMockUrls.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <AlertCircle className="w-7 h-7 text-red-600" />
                Videos with Mock URLs
                <span className="ml-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                  {videosWithMockUrls.length}
                </span>
              </h2>
              <button
                onClick={loadVideosWithMockUrls}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Video ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mock URL</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {videosWithMockUrls.map((video) => (
                    <tr key={video.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{video.title || 'Untitled Video'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">{video.video_id}</code>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-red-600 truncate max-w-md" title={video.streaming_url || video.file_path}>
                          {video.streaming_url || video.file_path || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <a
                          href={`/admin/videos/${video.video_id}/edit`}
                          target="_blank"
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          <Edit2 className="w-4 h-4" />
                          Fix Video
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyStorageManager;
