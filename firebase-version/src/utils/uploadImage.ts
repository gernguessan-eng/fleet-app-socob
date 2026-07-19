import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

/**
 * Importe une image (photo véhicule ou document administratif) dans Firebase Storage et
 * renvoie son URL de téléchargement — c'est cette URL (une simple chaîne courte) qui est
 * ensuite stockée sur le véhicule dans Firestore, jamais l'image elle-même en base64.
 *
 * @param vehicleId identifiant du véhicule (utilisé comme dossier de rangement)
 * @param docKey    clé du document, ex: "carte_grise", "patente", "photo"…
 */
export async function uploadVehicleImage(vehicleId: string, docKey: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `vehicles/${vehicleId}/${docKey}_${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 Mo

export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'Veuillez sélectionner une image (JPG, PNG, WEBP…).';
  if (file.size > MAX_IMAGE_SIZE_BYTES) return "L'image ne doit pas dépasser 10 Mo.";
  return null;
}
