
export const securityService = {
  // Generate or retrieve a master key for encryption
  // In a real app, this could be derived from a user's PIN
  getMasterKey: async () => {
    let keyData = localStorage.getItem('app_vault_seed');
    if (!keyData) {
      const newSeed = crypto.getRandomValues(new Uint8Array(32));
      keyData = btoa(String.fromCharCode(...newSeed));
      localStorage.setItem('app_vault_seed', keyData);
    }
    
    const rawKey = new Uint8Array(atob(keyData).split("").map(c => c.charCodeAt(0)));
    return await crypto.subtle.importKey(
      "raw",
      rawKey,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );
  },

  encrypt: async (data: string): Promise<string> => {
    const key = await securityService.getMasterKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(data);
    
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoded
    );

    // Bundle IV + Ciphertext
    const bundle = new Uint8Array(iv.length + ciphertext.byteLength);
    bundle.set(iv, 0);
    bundle.set(new Uint8Array(ciphertext), iv.length);
    
    return btoa(String.fromCharCode(...bundle));
  },

  decrypt: async (encryptedData: string): Promise<string> => {
    try {
      const key = await securityService.getMasterKey();
      const bundle = new Uint8Array(atob(encryptedData).split("").map(c => c.charCodeAt(0)));
      
      const iv = bundle.slice(0, 12);
      const data = bundle.slice(12);
      
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        data
      );
      
      return new TextDecoder().decode(decrypted);
    } catch (e) {
      console.error("Decryption failed", e);
      return "[]"; // Return empty array string on failure
    }
  }
};
