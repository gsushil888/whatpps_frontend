import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64ToBytes(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

function bytesToB64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

async function deriveKey(secret: string, usage: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', enc.encode(secret).slice(0, 32), 'AES-CBC', false, usage);
}

async function deriveHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

@Injectable({ providedIn: 'root' })
export class CryptoService {

  private get key(): string {
    return (environment as any).encryptionKey as string;
  }

  isEnabled(): boolean {
    return environment.production && !!this.key;
  }

  async encrypt(plaintext: string): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKey(this.key, ['encrypt']);
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, key, enc.encode(plaintext));
    const combined = new Uint8Array(16 + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), 16);
    return bytesToB64(combined);
  }

  async decrypt(b64: string): Promise<string> {
    const combined = b64ToBytes(b64);
    const iv = combined.slice(0, 16);
    const ciphertext = combined.slice(16);
    const key = await deriveKey(this.key, ['decrypt']);
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, key, ciphertext);
    return dec.decode(plaintext);
  }

  async hmacSign(payload: string): Promise<string> {
    const key = await deriveHmacKey(this.key);
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
    return bytesToB64(new Uint8Array(sig));
  }

  async encryptToken(token: string): Promise<string> {
    return this.encrypt(token);
  }

  async decryptToken(encrypted: string): Promise<string> {
    return this.decrypt(encrypted);
  }
}
