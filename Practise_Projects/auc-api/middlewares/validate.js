module.exports = (schema, property="body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], { abortEarly: false });

    if (error) {
      return res.sendInvalidRequest(error.details[0].message);
    }
    req[property] = value; // Apply to body, query or params
    next();
  };
};
