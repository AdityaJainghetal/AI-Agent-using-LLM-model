const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuid } = require('uuid');

function makeStorage(folder) {
  const dir = path.join(__dirname, '..', 'uploads', folder);
  fs.mkdirSync(dir, { recursive: true });
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${uuid()}${ext}`);
    },
  });
}

const fileFilter = (allowed) => (_req, file, cb) => {
  if (!allowed || allowed.length === 0) return cb(null, true);
  const ok = allowed.some((t) => file.mimetype.startsWith(t) || file.originalname.toLowerCase().endsWith(t));
  if (!ok) return cb(new Error(`File type not allowed: ${file.mimetype}`));
  cb(null, true);
};

module.exports = {
  uploadProfile: multer({
    storage: makeStorage('profiles'),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter(['image/']),
  }),
  uploadCourse: multer({
    storage: makeStorage('courses'),
    limits: { fileSize: 200 * 1024 * 1024 },
  }),
  uploadNote: multer({
    storage: makeStorage('notes'),
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: fileFilter(['application/pdf', '.pdf', '.docx', '.txt']),
  }),
  uploadAssignment: multer({
    storage: makeStorage('assignments'),
    limits: { fileSize: 25 * 1024 * 1024 },
  }),
  uploadSubmission: multer({
    storage: makeStorage('submissions'),
    limits: { fileSize: 25 * 1024 * 1024 },
  }),
  uploadResource: multer({
    storage: makeStorage('resources'),
    limits: { fileSize: 50 * 1024 * 1024 },
  }),
};
