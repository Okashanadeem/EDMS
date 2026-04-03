const sharp = require('sharp');

/**
 * Normalizes the already-cleaned signature from the frontend.
 */
const processSignature = async (inputBuffer) => {
  try {
    // The frontend already removed the background.
    // We just trim any extra space and standardize the height for consistency.
    const processed = await sharp(inputBuffer)
      .trim() 
      .resize({ 
        height: 150, 
        width: 300, 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .png()
      .toBuffer();

    return processed;
  } catch (error) {
    console.error('Signature Normalization Error:', error);
    throw new Error('Failed to normalize signature: ' + error.message);
  }
};

module.exports = {
  processSignature
};
