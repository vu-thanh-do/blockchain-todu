/**
 * Các tiện ích để chuyển đổi dữ liệu giữa chuỗi và byte sử dụng TextEncoder thay vì Buffer
 */

// Chuyển chuỗi thành mảng byte sử dụng TextEncoder
export function stringToBytes(text: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(text);
}

// Chuyển dữ liệu hex thành mảng byte
export function hexToBytes(hex: string): Uint8Array {
  hex = hex.startsWith('0x') ? hex.substring(2) : hex;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Chuyển mảng byte thành chuỗi hex
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Chuyển mảng byte thành chuỗi UTF-8
export function bytesToString(bytes: Uint8Array): string {
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

// Hàm tương tự concat của Buffer
export function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((acc, value) => acc + value.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const array of arrays) {
    result.set(array, offset);
    offset += array.length;
  }
  return result;
}

