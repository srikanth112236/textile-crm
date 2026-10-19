import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

const MFA_ISSUER = process.env.MFA_ISSUER || 'E-Commerce Platform';

export interface MFASecret {
  secret: string;
  qrCodeUrl: string;
}

/**
 * Generate MFA secret and QR code
 */
export const generateMFASecret = async (email: string): Promise<MFASecret> => {
  const secret = speakeasy.generateSecret({
    name: `${MFA_ISSUER} (${email})`,
    issuer: MFA_ISSUER,
  });

  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

  return {
    secret: secret.base32!,
    qrCodeUrl,
  };
};

/**
 * Verify MFA token
 */
export const verifyMFAToken = (secret: string, token: string): boolean => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps (60 seconds) before/after current time
  });
};

