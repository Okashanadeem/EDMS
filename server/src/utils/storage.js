const fs = require('fs/promises');
const path = require('path');
require('dotenv').config();

// __dirname is in server/src/utils, so ../../uploads points to server/uploads
const uploadDir = path.resolve(__dirname, '../../uploads');

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

/**
 * Renames an existing file to a new filename.
 * @param {string} oldFilename 
 * @param {string} newBaseName - The outward number or base name.
 * @returns {Promise<string>} - The new filename with original extension.
 */
const renameFile = async (oldFilename, newBaseName) => {
  if (!oldFilename) return null;
  
  const ext = path.extname(oldFilename);
  // Sanitize filename: replace / with _ to avoid path issues
  const safeBaseName = newBaseName.replace(/\//g, '_');
  const newFilename = `${safeBaseName}${ext}`;
  
  const oldPath = path.join(uploadDir, oldFilename);
  const newPath = path.join(uploadDir, newFilename);

  try {
    await fs.rename(oldPath, newPath);
    return newFilename;
  } catch (error) {
    console.error(`Failed to rename file from ${oldFilename} to ${newFilename}:`, error.message);
    return oldFilename; // Fallback to old name if rename fails
  }
};

module.exports = {
  saveFile,
  deleteFile,
  renameFile
};

