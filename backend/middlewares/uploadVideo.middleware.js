import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../uploads/raw');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Sanitize filename
        const uniqueSuffix = uuidv4();
        const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, `${uniqueSuffix}_${cleanName}`);
    },
});

const fileFilter = (req, file, cb) => {
    // Allowed MIME types
    const allowedTypes = [
        'video/mp4',
        'video/x-matroska', // .mkv
        'video/avi',
        'video/quicktime', // .mov
        'video/x-msvideo', // .avi legacy
        'video/webm'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        logger.warn(`Blocked upload of invalid mime type: ${file.mimetype}`);
        cb(new Error('Invalid file type. Only MP4, MKV, AVI, MOV, and WEBM are allowed.'), false);
    }
};

// Configure limits
const limits = {
    fileSize: 10 * 1024 * 1024 * 1024, // 10GB limit (increased for 4K)
    files: 1, // Only 1 file per request
};

const uploadVideo = multer({
    storage: storage,
    limits: limits,
    fileFilter: fileFilter,
});

export default uploadVideo;
