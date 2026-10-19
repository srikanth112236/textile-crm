import { Request, Response } from 'express';
import Joi from 'joi';
import { Settings, DEFAULT_SETTINGS } from '../models/Settings';
import { AuditLog, AuditAction } from '../models/AuditLog';

async function getOrCreateSettings() {
  let settings = await Settings.findOne({ key: 'global' });
  if (!settings) {
    settings = await Settings.create({ ...(DEFAULT_SETTINGS as object) });
  }
  return settings;
}

// Secrets live in server .env only — never leak the stored Key ID anywhere.
function stripSecrets(settings: any) {
  const data: any = typeof settings?.toObject === 'function' ? settings.toObject() : { ...settings };
  if (data.payments) delete data.payments.razorpayKeyId;
  return data;
}

function toPublicSettings(settings: any) {  return {
    codConfirmation: {
      enabled: settings.codConfirmation.enabled,
      defaultAmount: settings.codConfirmation.defaultAmount,
      fixedOptions: settings.codConfirmation.fixedOptions,
      mode: settings.codConfirmation.mode,
      minOrderValueForCOD: settings.codConfirmation.minOrderValueForCOD,
      maxOrderValueForCOD: settings.codConfirmation.maxOrderValueForCOD,
    },
    shipping: {
      freeShippingThreshold: settings.shipping.freeShippingThreshold,
      flatShippingCost: settings.shipping.flatShippingCost,
      codShippingExtra: settings.shipping.codShippingExtra,
    },
    payments: {
      razorpayEnabled: settings.payments.razorpayEnabled,
      razorpayKeyId: settings.payments.razorpayKeyId,
      codEnabled: settings.payments.codEnabled,
      upiEnabled: settings.payments.upiEnabled,
      cardEnabled: settings.payments.cardEnabled,
      netbankingEnabled: settings.payments.netbankingEnabled,
      walletEnabled: settings.payments.walletEnabled,
    },
    shipment: {
      provider: settings.shipment.provider,
      shiprocketEnabled: settings.shipment.shiprocketEnabled,
    },
    refunds: {
      allowCustomerCancelHours: settings.refunds?.allowCustomerCancelHours ?? null,
      codAdvanceRefundable: settings.refunds?.codAdvanceRefundable !== false,
    },
    whatsapp: {
      enabled: settings.whatsapp.enabled,
      supportNumber: settings.whatsapp.supportNumber,
    },
    storefront: settings.storefront,
  };
}

// GET /api/settings — public safe subset (no secrets)
export const getPublicSettings = async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = await getOrCreateSettings();
    res.status(200).json({ success: true, data: toPublicSettings(settings) });
  } catch (error) {
    console.error('Get public settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/settings/admin — full settings for admin (still no env secrets;
// Razorpay Key ID is served via /api/payments/methods from server env)
export const getAdminSettings = async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = await getOrCreateSettings();
    res.status(200).json({ success: true, data: stripSecrets(settings) });
  } catch (error) {
    console.error('Get admin settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const slabSchema = Joi.object({
  minOrderValue: Joi.number().min(0).required(),
  maxOrderValue: Joi.number().min(0).optional().allow(null),
  amount: Joi.number().min(0).required(),
});

const updateSettingsSchema = Joi.object({
  codConfirmation: Joi.object({
    enabled: Joi.boolean().optional(),
    mode: Joi.string().valid('fixed', 'percent', 'slab').optional(),
    defaultAmount: Joi.number().min(0).max(10000).optional(),
    fixedOptions: Joi.array().items(Joi.number().min(0).max(10000)).min(1).max(10).optional(),
    percentValue: Joi.number().min(0).max(100).optional(),
    percentMaxCap: Joi.number().min(0).optional().allow(null),
    slabs: Joi.array().items(slabSchema).optional(),
    minOrderValueForCOD: Joi.number().min(0).optional(),
    maxOrderValueForCOD: Joi.number().min(0).optional().allow(null),
    pincodeMode: Joi.string().valid('none', 'block', 'allow').optional(),
    pincodes: Joi.array().items(Joi.string().trim().regex(/^\d{6}$/)).max(500).optional(),
    trustedMinDelivered: Joi.number().min(0).max(100).optional(),
    riskThreshold: Joi.number().min(0).max(1000000).optional(),
    riskAdvance: Joi.number().min(0).max(10000).optional(),
  }).optional(),
  shipping: Joi.object({
    freeShippingThreshold: Joi.number().min(0).max(100000).optional(),
    flatShippingCost: Joi.number().min(0).max(10000).optional(),
    codShippingExtra: Joi.number().min(0).max(10000).optional(),
    defaultWeightG: Joi.number().min(1).max(50000).optional(),
    defaultLengthCm: Joi.number().min(1).max(300).optional(),
    defaultWidthCm: Joi.number().min(1).max(300).optional(),
    defaultHeightCm: Joi.number().min(1).max(300).optional(),
    pickupPincode: Joi.string().trim().regex(/^\d{6}$/).optional(),
    pickupLocation: Joi.string().trim().max(100).optional(),
  }).optional(),
  payments: Joi.object({
    razorpayEnabled: Joi.boolean().optional(),
    razorpayKeyId: Joi.forbidden().messages({ 'any.unknown': 'Razorpay keys live in server .env only and cannot be stored here' }),
    codEnabled: Joi.boolean().optional(),
    upiEnabled: Joi.boolean().optional(),
    cardEnabled: Joi.boolean().optional(),
    netbankingEnabled: Joi.boolean().optional(),
    walletEnabled: Joi.boolean().optional(),
  }).optional(),
  shipment: Joi.object({
    provider: Joi.string().valid('shiprocket').optional(),
    shiprocketEnabled: Joi.boolean().optional(),
    pickupLocation: Joi.string().trim().max(100).optional(),
    channelId: Joi.string().trim().max(100).optional().allow(''),
    autoPush: Joi.boolean().optional(),
  }).optional(),
  refunds: Joi.object({
    autoRefundOnCancel: Joi.boolean().optional(),
    allowCustomerCancelHours: Joi.number().min(1).max(720).allow(null).optional(),
    codAdvanceRefundable: Joi.boolean().optional(),
  }).optional(),
  whatsapp: Joi.object({
    enabled: Joi.boolean().optional(),
    provider: Joi.string().valid('interakt', 'wati', 'gupshup', 'custom').optional(),
    supportNumber: Joi.string().trim().max(20).optional().allow(''),
    orderTemplates: Joi.object().pattern(Joi.string(), Joi.string().max(500)).optional(),
  }).optional(),
  storefront: Joi.object({
    banners: Joi.array()
      .items(
        Joi.object({
          image: Joi.string().trim().required(),
          title: Joi.string().trim().max(200).required(),
          subtitle: Joi.string().trim().max(300).optional().allow(''),
          link: Joi.string().trim().max(500).required(),
          isActive: Joi.boolean().optional(),
        })
      )
      .max(20)
      .optional(),
    announcement: Joi.string().trim().max(300).optional().allow(''),
  }).optional(),
});

// PUT /api/settings/admin — Admin/Superadmin only
export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = updateSettingsSchema.validate(req.body, { abortEarly: false });
    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map((d) => d.message),
      });
      return;
    }

    const settings = await getOrCreateSettings();
    for (const section of Object.keys(value) as Array<keyof typeof value>) {
      const sectionValue = (value as any)[section];
      if (sectionValue && typeof sectionValue === 'object' && !Array.isArray(sectionValue)) {
        (settings as any)[section] = { ...(settings as any)[section]?.toObject?.() ?? (settings as any)[section], ...sectionValue };
      } else {
        (settings as any)[section] = sectionValue;
      }
    }
    (settings as any).updatedBy = (req as any).user?.id;
    await settings.save();

    try {
      const { emitToAdmins } = await import('../config/socket');
      emitToAdmins('settingsUpdated', { updatedAt: settings.updatedAt });
    } catch {
      // socket optional
    }

    try {
      await AuditLog.create({
        userId: (req as any).user?.id,
        action: AuditAction.UPDATE,
        resource: 'settings',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'success',
        details: { sections: Object.keys(value) },
      });
    } catch {
      // audit optional
    }

    res.status(200).json({ success: true, message: 'Settings updated', data: stripSecrets(settings) });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/settings/admin/whatsapp-test { to } — Admin: verify WhatsApp provider wiring
export const testWhatsApp = async (req: Request, res: Response): Promise<void> => {
  try {
    const schema = Joi.object({ to: Joi.string().trim().required().max(20) });
    const { error, value } = schema.validate(req.body);
    if (error) {
      res.status(400).json({ error: 'Enter a destination mobile number' });
      return;
    }
    const { sendWhatsApp } = await import('../services/whatsapp');
    const result = await sendWhatsApp(value.to, 'Mentoos test: WhatsApp notifications are wired correctly.');
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('WhatsApp test error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/settings/cod-quote — { orderValue, pincode? } -> { advance, balance, codAllowed, reason }
export const getCODQuote = async (req: Request, res: Response): Promise<void> => {
  try {
    const schema = Joi.object({
      orderValue: Joi.number().min(1).max(1000000).required(),
      pincode: Joi.string().trim().regex(/^\d{6}$/).optional().allow(''),
    });
    const { error, value } = schema.validate(req.body);
    if (error) {
      res.status(400).json({ error: 'Validation error', details: error.details.map((d) => d.message) });
      return;
    }
    const { getCODQuoteDetailed } = await import('../services/codRules');
    const quote = await getCODQuoteDetailed(value.orderValue, { pincode: value.pincode, userId: req.user?.userId });
    const settings = await getOrCreateSettings();
    res.status(200).json({
      success: true,
      data: { ...quote, mode: settings.codConfirmation.mode },
    });
  } catch (err) {
    console.error('COD quote error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
