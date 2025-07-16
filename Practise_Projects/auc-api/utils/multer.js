const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Ensure uploads directory exists with proper permissions
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Sanitize filename and add timestamp
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, `${Date.now()}-${sanitizedFilename}`);
  },
});

// Configure file filter for various file types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    // CSV files
    "text/csv",
    "application/vnd.ms-excel",
    "application/csv",
    "application/x-csv",
    "text/x-csv",
    "text/comma-separated-values",
    // Excel files
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
    // Other spreadsheet formats
    "application/vnd.oasis.opendocument.spreadsheet", // .ods
    "application/vnd.google-apps.spreadsheet", // Google Sheets
  ];

  const allowedExtensions = [".csv", ".xlsx", ".xls", ".ods"];

  if (
    allowedMimeTypes.includes(file.mimetype) ||
    allowedExtensions.some((ext) =>
      file.originalname.toLowerCase().endsWith(ext)
    )
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only CSV and Excel files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.sendInvalidRequest({
        error: "File size should not exceed 10MB",
      });
    }
    return res.sendInvalidRequest({
      error: err.message,
    });
  } else if (err) {
    return res.sendInvalidRequest({
      error: err.message,
    });
  }
  next();
};

module.exports = {
  upload,
  handleMulterError,
};
