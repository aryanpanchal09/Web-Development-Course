const Joi = require("joi");

const addClientSchema = Joi.object({
  first_name: Joi.string().min(2).trim().replace(/\s+/g, ' ').max(100).required(),
  last_name: Joi.string().allow("", null).trim().replace(/\s+/g, ' ').max(100).optional(),
  email: Joi.string().email().trim().replace(/\s+/g, ' ').required(),
  password: Joi.string().min(6).max(20).required(),
  phone: Joi.string().required(),
  address1: Joi.string().required(),
  address2: Joi.string().allow("", null).optional(),
  address3: Joi.string().allow("", null).optional(),
  town: Joi.string().required(),
  country: Joi.string().required(),
  postal_code: Joi.string().min(4).max(10).required(),
  utility_type:Joi.array().items(Joi.string().valid("Gas","Electricity","Water")).allow("", null).optional().default([]),
  logo: Joi.string().uri().optional().allow(null, '')
});

const updateClientSchema = Joi.object({
  first_name: Joi.string().min(2).trim().replace(/\s+/g, ' ').max(100).optional(),
  last_name: Joi.string().allow("", null).trim().replace(/\s+/g, ' ').max(100).optional(),
  email: Joi.string().email().trim().replace(/\s+/g, ' ').optional(),
  password: Joi.string().min(6).max(20).optional(),
  phone: Joi.string().optional(),
  address1: Joi.string().optional(),
  address2: Joi.string().allow("", null).optional(),
  address3: Joi.string().allow("", null).optional(),
  town: Joi.string().optional(),
  country: Joi.string().optional(),
  postal_code: Joi.string().min(4).max(10).optional(),
  utility_type: Joi.array().items(Joi.string().valid("Gas", "Electricity", "Water")).allow("", null).optional().default([]),
  logo: Joi.string().uri().optional().allow(null, '')
});

module.exports = { addClientSchema,updateClientSchema };
