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
 */
const syncUploadSchema = Joi.object({
  meters: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      name: Joi.string().required(),
      unit: Joi.string().required(),
      type: Joi.string().valid('water', 'electricity', 'gas', 'heating', 'other').required(),
      location: Joi.string().allow('', null),
      notes: Joi.string().allow('', null),
      createdAt: Joi.date().iso().required(),
      updatedAt: Joi.date().iso().required()
    })
  ).required(),
  readings: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      meterId: Joi.string().required(),
      value: Joi.number().required(),
      date: Joi.date().iso().required(),
      notes: Joi.string().allow('', null),
      photoPath: Joi.string().allow('', null),
      createdAt: Joi.date().iso().required(),
      updatedAt: Joi.date().iso().required()
    })
  ).required()
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
