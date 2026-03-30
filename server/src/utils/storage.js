const fs = require('fs/promises');
const path = require('path');
require('dotenv').config();

const uploadDir = process.env.UPLOAD_DIR || './uploads';

/**
 * Saves a file buffer to local disk.
 * @param {Buffer} fileBuffer 
 * @param {string} originalName 
 * @returns {Promise<{filename: string, path: string}>}
 */
const saveFile = async (fileBuffer, originalName) => {
  const ext = path.extname(originalName);
  const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
  const filePath = path.join(uploadDir, filename);

  await fs.writeFile(filePath, fileBuffer);

  return {
    filename,
    path: filePath
  };
};

/**
 * Deletes a file from local disk.
 * @param {string} filename 
 */
const deleteFile = async (filename) => {
  const filePath = path.join(uploadDir, filename);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.warn(`Failed to delete file: ${filePath}`);
  }
};

module.exports = {
  saveFile,
  deleteFile
};
