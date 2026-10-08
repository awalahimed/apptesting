/**
 * File upload utility using ORPC
 * Handles chunked uploads for large files
 */

import * as FileSystem from 'expo-file-system/legacy';
import { orpc } from '@/hooks/orpc';

const CHUNK_SIZE = 1024 * 1024; // 1MB chunks

interface UploadOptions {
  onProgress?: (progress: number) => void;
  userId?: string;
  documentType?: string;
}

/**
 * Upload an image file using chunked upload
 * @param uri - Local file URI (from ImagePicker)
 * @param options - Upload options including progress callback
 * @returns File ID that can be stored in database
 */
export async function uploadImage(
  uri: string,
  options: UploadOptions = {}
): Promise<string> {
  try {
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(uri);
    const size = fileInfo.exists ? fileInfo.size || 0 : 0;
    const filename = uri.split('/').pop() || 'image.jpg';
    const mimeType = getMimeType(filename);

    console.log('[uploadImage] Starting upload:', { uri, filename, mimeType, size });

    // Read entire file as base64
    const base64Content = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log('[uploadImage] File read, original size:', size, 'base64 length:', base64Content.length);

    // Calculate chunk count based on base64 length
    const chunkCount = Math.ceil(base64Content.length / CHUNK_SIZE);

    // Step 1: Initiate upload - use base64 size since that's what we're actually sending
    const initiateResult = await orpc.upload.initiate({
      filename,
      mimeType,
      size: base64Content.length, // Use base64 size for consistency
      userId: options.userId,
      documentType: options.documentType,
    });

    console.log('[uploadImage] Upload initiated:', initiateResult.uploadId);
    const uploadId = initiateResult.uploadId;

    // Step 2: Upload chunks
    for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, base64Content.length);

      // Get chunk from base64 string
      const chunkBase64 = base64Content.substring(start, end);
      console.log('[uploadImage] Uploading chunk:', { index: chunkIndex, start, end, chunkLength: chunkBase64.length });

      // Upload chunk
      await orpc.upload.chunk({
        uploadId,
        chunk: chunkBase64,
        index: chunkIndex,
      });

      // Report progress
      if (options.onProgress) {
        const progress = ((chunkIndex + 1) / chunkCount) * 100;
        options.onProgress(Math.round(progress));
      }
    }

    console.log('[uploadImage] All chunks uploaded, completing...');

    // Step 3: Complete upload
    const completeResult = await orpc.upload.complete({
      uploadId,
    });

    console.log('[uploadImage] Upload complete:', completeResult);

    if (!completeResult.success) {
      throw new Error('Upload failed');
    }

    // Return the file ID
    return completeResult.fileId;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

/**
 * Get MIME type from filename
 */
function getMimeType(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    pdf: 'application/pdf',
  };

  return mimeTypes[extension || ''] || 'application/octet-stream';
}

/**
 * Cancel an ongoing upload
 */
export async function cancelUpload(uploadId: string): Promise<void> {
  try {
    await orpc.upload.cancel({ uploadId });
  } catch (error) {
    console.error('Cancel upload error:', error);
    throw error;
  }
}

/**
 * Get upload status
 */
export async function getUploadStatus(uploadId: string) {
  try {
    return await orpc.upload.status({ uploadId });
  } catch (error) {
    console.error('Get upload status error:', error);
    throw error;
  }
}

/**
 * Delete a file from the server
 * @param filePath - Relative path from upload directory (e.g., 'profile_photo/uuid.png')
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    console.log('[deleteFile] Deleting:', filePath);
    await orpc.upload.delete({ filePath });
    console.log('[deleteFile] File deleted successfully');
  } catch (error) {
    console.error('Delete file error:', error);
    throw error;
  }
}

/**
 * Upload an image and replace/delete the old one if it exists
 * @param uri - Local file URI (from ImagePicker)
 * @param oldFilePath - Optional old file path to delete before uploading
 * @param options - Upload options including progress callback
 * @returns File ID that can be stored in database
 */
export async function uploadImageWithReplace(
  uri: string,
  oldFilePath: string | null | undefined,
  options: UploadOptions = {}
): Promise<string> {
  try {
    // Delete old file if it exists
    if (oldFilePath) {
      console.log('[uploadImageWithReplace] Deleting old file:', oldFilePath);
      try {
        await deleteFile(oldFilePath);
      } catch (error) {
        // Log but continue - old file might not exist
        console.log('[uploadImageWithReplace] Old file not found or already deleted');
      }
    }

    // Upload new file
    return await uploadImage(uri, options);
  } catch (error) {
    console.error('Upload with replace error:', error);
    throw error;
  }
}
