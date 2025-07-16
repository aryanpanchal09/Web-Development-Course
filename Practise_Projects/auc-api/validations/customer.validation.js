const Joi = require("joi");

const addCustomerSchema = Joi.object({
  first_name: Joi.string().trim().replace(/\s+/g, ' ').min(3).max(100).required(),
  last_name: Joi.string().trim().replace(/\s+/g, ' ').min(3).max(100).required(),
  email: Joi.string().email().required(),
  phone_no: Joi.string().required(),
  address1: Joi.string().required(),
  address2: Joi.string().allow("", null).optional(),
  address3: Joi.string().allow("", null).optional(),
  town: Joi.string().required(),
  country: Joi.string().required(),
  postal_code: Joi.string().required(),
  due_date: Joi.date().allow("", null).optional(),
  aging: Joi.string().allow("", null).optional(),
  debt_amount: Joi.string().allow("", null).optional(),
  client_id: Joi.string().uuid().allow("", null).optional(),
});

module.exports = { addCustomerSchema };
