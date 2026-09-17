/**
 * ==============================================================================
 * LETON COFFEE DUMAI - SCRIPT EKSTRAKSI ASSET GAMBAR BASE64 KE FILE BINARY
 * ==============================================================================
 * File: data_migration/extract_images.ts
 *
 * Fungsi:
 * - Membaca data website lama dari data_migration/leton_content.json.
 * - Mengambil seluruh string data:image/jpeg;base64,... asli.
 * - Mengonversinya menjadi file binary fisik (JPEG/PNG).
 * - Menyimpannya ke folder data_migration/extracted_images/ dengan struktur subfolder:
 *   - logo/
 *   - menu/
 *   - cabang/
 *   - barista/
 *   - cerita/
 *   - open-booth/
 *   - other/
 * ==============================================================================
 */

import fs from 'fs';
import path from 'path';

interface AssetMappingItem {
  index: number;
  sourcePath: string;
  type: string;
  mime: string;
  sizeKb: number;
  storagePath: string;
  dbTarget: string;
  status: string;
}

function getNestedValue(obj: any, pathStr: string): any {
  const parts = pathStr.replace(/\[(\d+)\]/g, '.$1').split('.');
  let curr = obj;
  for (const p of parts) {
    if (curr == null) return null;
    curr = curr[p];
  }
  return curr;
}

export function extractAllImages(): { totalExtracted: number; totalMapped: number } {
  const contentPath = path.resolve(process.cwd(), 'data_migration/leton_content.json');
  const mappingPath = path.resolve(process.cwd(), 'data_migration/asset_mapping.json');
  const outputDir = path.resolve(process.cwd(), 'data_migration/extracted_images');

  if (!fs.existsSync(contentPath)) {
    throw new Error(`File sumber leton_content.json tidak ditemukan: ${contentPath}`);
  }
  if (!fs.existsSync(mappingPath)) {
    throw new Error(`File mapping asset_mapping.json tidak ditemukan: ${mappingPath}`);
  }

  const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
  const mapping: AssetMappingItem[] = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

  let extractedCount = 0;

  for (const item of mapping) {
    const rawVal = getNestedValue(content, item.sourcePath);
    if (!rawVal) {
      console.warn(`[SKIP] Nilai tidak ditemukan pada path: ${item.sourcePath}`);
      continue;
    }

    if (typeof rawVal === 'string' && rawVal.startsWith('data:image')) {
      const matches = rawVal.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches[2]) {
        const buffer = Buffer.from(matches[2], 'base64');
        const targetFile = path.join(outputDir, item.storagePath);
        fs.mkdirSync(path.dirname(targetFile), { recursive: true });
        fs.writeFileSync(targetFile, buffer);
        extractedCount++;
      }
    } else {
      console.log(`[INFO] Bukan Base64 atau sudah berupa path: ${item.sourcePath}`);
    }
  }

  return { totalExtracted: extractedCount, totalMapped: mapping.length };
}

// Jalankan jika dieksekusi langsung
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Memulai proses ekstraksi 50 foto asli dari Base64 ke binary...');
  const result = extractAllImages();
  console.log(`✓ Selesai! ${result.totalExtracted} dari ${result.totalMapped} foto berhasil diekstrak.`);
}
