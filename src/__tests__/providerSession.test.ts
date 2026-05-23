import { encrypt, decrypt, getProviderConfig, ProviderConfig } from '../lib/providerSession';
import { NextRequest } from 'next/server';

describe('providerSession encryption', () => {
  const secretText = 'my-super-secret-api-key-12345';

  it('should encrypt and decrypt back to the original text', () => {
    const cipher = encrypt(secretText);
    expect(cipher).not.toBe(secretText);
    expect(cipher.split(':').length).toBe(3); // iv:ciphertext:authTag
    
    const plain = decrypt(cipher);
    expect(plain).toBe(secretText);
  });

  it('should generate different ciphertexts for the same plaintext due to random IV', () => {
    const cipher1 = encrypt(secretText);
    const cipher2 = encrypt(secretText);
    expect(cipher1).not.toBe(cipher2);
  });

  it('should throw an error when decrypting an invalid format', () => {
    expect(() => {
      decrypt('invalid-format-without-colons');
    }).toThrow('Invalid encrypted session cookie format');
  });

  it('should throw an error when decrypting tampered data or invalid hex', () => {
    const cipher = encrypt(secretText);
    const parts = cipher.split(':');
    // Tamper with the ciphertext part
    const tamperedParts = [parts[0], parts[1] + 'a', parts[2]];
    const tamperedCipher = tamperedParts.join(':');
    
    expect(() => {
      decrypt(tamperedCipher);
    }).toThrow();
  });
});

describe('getProviderConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should parse cookie and return decrypted config if present', () => {
    const config: ProviderConfig = {
      provider: 'openai',
      apiKey: 'sk-test-key-from-cookie',
    };
    const encrypted = encrypt(JSON.stringify(config));

    const mockReq = {
      cookies: {
        get: (name: string) => {
          if (name === 'wfd_provider_cfg') {
            return { value: encrypted };
          }
          return undefined;
        },
      },
    } as unknown as NextRequest;

    const result = getProviderConfig(mockReq);
    expect(result).toEqual(config);
  });

  it('should fall back to environment variables when cookie is missing', () => {
    process.env.OPENAI_API_KEY = 'sk-env-key';
    
    const mockReq = {
      cookies: {
        get: () => undefined,
      },
    } as unknown as NextRequest;

    const result = getProviderConfig(mockReq);
    expect(result).toEqual({
      provider: 'openai',
      apiKey: 'sk-env-key',
    });
  });

  it('should return mock provider when both cookie and env-vars are missing', () => {
    // Delete keys
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.DEEPSEEK_API_KEY;

    const mockReq = {
      cookies: {
        get: () => undefined,
      },
    } as unknown as NextRequest;

    const result = getProviderConfig(mockReq);
    expect(result.provider).toBe('mock');
    expect(result.apiKey).toBe('mock-key-for-simulation-mode');
  });
});
