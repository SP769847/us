import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

for (const sub of ['avatars', 'chat', 'love-notes', 'memories', 'timeline']) {
  const dir = path.join(UPLOADS_DIR, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function storageFor(subfolder) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(UPLOADS_DIR, subfolder)),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
    },
  });
}

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, WEBP, and GIF images are allowed'));
  }
  cb(null, true);
}

export function makeUploader(subfolder) {
  return multer({
    storage: storageFor(subfolder),
    fileFilter,
    limits: { fileSize: 8 * 1024 * 1024 },
  });
}

export function publicUrlFor(subfolder, filename) {
  return `/uploads/${subfolder}/${filename}`;
}
