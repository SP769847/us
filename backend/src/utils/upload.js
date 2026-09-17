import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getSupabase, isSupabaseStorageConfigured, SUPABASE_STORAGE_BUCKET } from '../config/supabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

const SUBFOLDERS = ['avatars', 'chat', 'love-notes', 'memories', 'timeline'];

// Local disk is only a dev-time fallback: Render's (and most PaaS) web
// service filesystems are ephemeral and get wiped on every restart/redeploy,
// silently orphaning any avatarUrl/attachmentUrl/etc. already saved in the
// database. When SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set (see
// .env.example), uploads go to Supabase Storage instead, which persists.
if (!isSupabaseStorageConfigured()) {
  for (const sub of SUBFOLDERS) {
    const dir = path.join(UPLOADS_DIR, sub);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function randomFilename(originalname) {
  const ext = path.extname(originalname).toLowerCase();
  return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
}

function diskStorageFor(subfolder) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(UPLOADS_DIR, subfolder)),
    filename: (req, file, cb) => cb(null, randomFilename(file.originalname)),
  });
}

// A multer storage engine (see multer's StorageEngine interface) that
// streams the upload straight into a Supabase Storage bucket instead of
// disk, and stamps the resulting public URL onto req.file(s) as `.cloudUrl`.
function supabaseStorageFor(subfolder) {
  return {
    _handleFile(req, file, cb) {
      const chunks = [];
      file.stream.on('data', (chunk) => chunks.push(chunk));
      file.stream.on('error', cb);
      file.stream.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          const filename = randomFilename(file.originalname);
          const storagePath = `${subfolder}/${filename}`;
          const supabase = getSupabase();
          const { error } = await supabase.storage
            .from(SUPABASE_STORAGE_BUCKET)
            .upload(storagePath, buffer, { contentType: file.mimetype, upsert: false });
          if (error) return cb(error);
          const { data } = supabase.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(storagePath);
          cb(null, { filename, path: storagePath, size: buffer.length, cloudUrl: data.publicUrl });
        } catch (err) {
          cb(err);
        }
      });
    },
    _removeFile(req, file, cb) {
      const supabase = getSupabase();
      supabase.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .remove([file.path])
        .then(() => cb(null))
        .catch(cb);
    },
  };
}

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, WEBP, and GIF images are allowed'));
  }
  cb(null, true);
}

export function makeUploader(subfolder) {
  return multer({
    storage: isSupabaseStorageConfigured() ? supabaseStorageFor(subfolder) : diskStorageFor(subfolder),
    fileFilter,
    limits: { fileSize: 8 * 1024 * 1024 },
  });
}

// Storage-agnostic: returns a Supabase public URL when cloud storage is
// active, or the local "/uploads/<subfolder>/<file>" path otherwise — either
// way the frontend's mediaUrl() helper handles the result unchanged (it only
// prefixes relative paths; absolute URLs pass through as-is).
export function fileUrl(file, subfolder) {
  if (!file) return null;
  return file.cloudUrl || `/uploads/${subfolder}/${file.filename}`;
}
