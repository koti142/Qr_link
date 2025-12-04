import multer from 'multer';
import * as captionService from '../services/captionService.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/vtt' || file.originalname.endsWith('.vtt')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only VTT files are allowed.'));
    }
  }
});

/**
 * Upload caption
 */
export const uploadCaption = [
  upload.single('caption'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Caption file required' });
      }
      
      const { videoId, language } = req.body;
      
      if (!videoId || !language) {
        return res.status(400).json({ error: 'Video ID and language required' });
      }
      
      const captionPath = await captionService.uploadCaption(
        videoId,
        language,
        req.file.buffer,
        req.file.originalname
      );
      
      res.status(201).json({
        message: 'Caption uploaded successfully',
        path: captionPath
      });
    } catch (error) {
      console.error('Upload caption error:', error);
      res.status(500).json({ error: error.message || 'Upload failed' });
    }
  }
];

/**
 * Get captions for video
 */
export async function getCaptions(req, res) {
  try {
    const { videoId } = req.params;
    const captions = await captionService.getCaptionsByVideoId(videoId);
    res.json(captions);
  } catch (error) {
    console.error('Get captions error:', error);
    res.status(500).json({ error: 'Failed to fetch captions' });
  }
}

/**
 * Delete caption
 */
export async function deleteCaption(req, res) {
  try {
    const { id } = req.params;
    const success = await captionService.deleteCaption(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Caption not found' });
    }
    
    res.json({ message: 'Caption deleted successfully' });
  } catch (error) {
    console.error('Delete caption error:', error);
    res.status(500).json({ error: 'Failed to delete caption' });
  }
}





