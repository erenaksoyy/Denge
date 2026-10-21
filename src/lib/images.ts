import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export interface PreparedImage {
  /** JPEG data sent to the AI. Kept in memory only. */
  base64: string;
  mimeType: 'image/jpeg';
  /** A persistent copy (native file) or a small thumbnail data URI (web). */
  storedUri: string | null;
}

export class PermissionDeniedError extends Error {
  constructor() {
    super('permission-denied');
  }
}

const MAX_SIDE = 1280;
const isWeb = Platform.OS === 'web';

export async function pickPhoto(source: 'camera' | 'library'): Promise<PreparedImage | null> {
  let result: ImagePicker.ImagePickerResult;
  if (source === 'camera') {
    if (!isWeb) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) throw new PermissionDeniedError();
    }
    result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 });
  } else {
    result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
  }
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  return prepareImage(asset.uri, asset.width, asset.height);
}

/** Downscales to at most 1280 px, re-encodes as JPEG and keeps a copy for the log. */
export async function prepareImage(uri: string, width?: number, height?: number): Promise<PreparedImage> {
  const context = ImageManipulator.manipulate(uri);
  if (width && height && Math.max(width, height) > MAX_SIDE) {
    context.resize(width >= height ? { width: MAX_SIDE } : { height: MAX_SIDE });
  } else if (!width || !height) {
    context.resize({ width: MAX_SIDE });
  }
  const rendered = await context.renderAsync();
  const output = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true });
  if (!output.base64) throw new Error('encode-failed');
  const storedUri = isWeb ? await webThumbnail(output.uri) : await persistFile(output.uri);
  return { base64: output.base64, mimeType: 'image/jpeg', storedUri };
}

async function persistFile(uri: string): Promise<string | null> {
  try {
    const dir = new Directory(Paths.document, 'meal-images');
    dir.create({ intermediates: true, idempotent: true });
    const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const destination = new File(dir, name);
    await new File(uri).copy(destination);
    return destination.uri;
  } catch {
    return uri;
  }
}

async function webThumbnail(uri: string): Promise<string | null> {
  try {
    const context = ImageManipulator.manipulate(uri);
    context.resize({ width: 320 });
    const rendered = await context.renderAsync();
    const output = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.6, base64: true });
    return output.base64 ? `data:image/jpeg;base64,${output.base64}` : null;
  } catch {
    return null;
  }
}

/** Reads a stored meal photo back for a retry. Not available on web. */
export async function readImageBase64(uri: string): Promise<string | null> {
  if (isWeb || !uri.startsWith('file:')) return null;
  try {
    return await new File(uri).base64();
  } catch {
    return null;
  }
}

export function deleteImage(uri: string | null | undefined) {
  if (!uri || isWeb || !uri.startsWith('file:')) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // The file may already be gone; nothing else to clean up.
  }
}
