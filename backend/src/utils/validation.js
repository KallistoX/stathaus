/**
 * Validation Schemas
 *
 * Joi schemas for input validation.
 */

const Joi = require('joi');

/**
 * Validation schema for OAuth code exchange
 */
const tokenExchangeSchema = Joi.object({
  code: Joi.string().required(),
  code_verifier: Joi.string().required()
});

/**
 * Validation schema for sync data upload
 * Accepts full data structure from frontend including meterTypes and settings
 */
const syncUploadSchema = Joi.object({
  version: Joi.string().allow('', null),
  meterTypes: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      name: Joi.string().required(),
      unit: Joi.string().required(),
      icon: Joi.string().allow('', null),
      createdAt: Joi.string().allow('', null)
    })
  ).default([]),
  meters: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      name: Joi.string().required(),
      typeId: Joi.string().allow('', null),
      meterNumber: Joi.string().allow('', null),
      location: Joi.string().allow('', null),
      isContinuous: Joi.boolean().default(false),
      groupId: Joi.string().allow('', null),
      tariffId: Joi.string().allow('', null),
      // Legacy fields (for backwards compatibility)
      unit: Joi.string().allow('', null),
      type: Joi.string().allow('', null),
      notes: Joi.string().allow('', null),
      createdAt: Joi.string().allow('', null),
      updatedAt: Joi.string().allow('', null)
    })
  ).default([]),
  readings: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      meterId: Joi.string().required(),
      value: Joi.number().required(),
      timestamp: Joi.string().allow('', null),
      note: Joi.string().allow('', null),
      photo: Joi.string().allow('', null),
      // Legacy fields (for backwards compatibility)
      date: Joi.string().allow('', null),
      notes: Joi.string().allow('', null),
      photoPath: Joi.string().allow('', null),
      createdAt: Joi.string().allow('', null),
      updatedAt: Joi.string().allow('', null)
    })
  ).default([]),
  groups: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      name: Joi.string().required(),
      description: Joi.string().allow('', null),
      icon: Joi.string().allow('', null),
      color: Joi.string().allow('', null),
      createdAt: Joi.string().allow('', null)
    })
  ).default([]),
  tariffs: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      name: Joi.string().required(),
      meterTypeId: Joi.string().allow('', null),
      pricePerUnit: Joi.number().required(),
      baseCharge: Joi.number().default(0),
      validFrom: Joi.string().allow('', null),
      validTo: Joi.string().allow('', null),
      createdAt: Joi.string().allow('', null)
    })
  ).default([]),
  settings: Joi.object({
    storageMode: Joi.string().allow('', null),
    currency: Joi.string().allow('', null),
    theme: Joi.string().allow('', null),
    dashboardWidgets: Joi.array().items(Joi.any()).default([])
  }).default({}),
  lastModified: Joi.string().allow('', null),
  createdAt: Joi.string().allow('', null)
});

/**
 * Validate data against schema
 * @param {any} data Data to validate
 * @param {Joi.Schema} schema Joi schema
 * @returns {Object} Validation result with error or value
 */
function validate(data, schema) {
  const result = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });

  if (result.error) {
    return {
      valid: false,
      errors: result.error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    };
  }

  return {
    valid: true,
    value: result.value
  };
}

module.exports = {
  tokenExchangeSchema,
  syncUploadSchema,
  validate
};
