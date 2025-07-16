const { ValidationError, UniqueConstraintError, DatabaseError } = require("sequelize");

module.exports = function (express) {
  global.HTTP_STATUS_CODES = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_BODY: 204,
    PARTIAL_SUCCESS: 206,
    NO_MODIFIED: 304,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    UNSUPPORTED_TYPE: 415,
    LOCKED: 423,
    ILLEGAL_ACCESS: 451,
    SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    NOT_ACCEPTABLE: 406,
    LARGE_PAYLOAD: 413,
    TOO_MANY_REQUEST: 429,
  };

  // Request is not acceptable as some thing is missing
  express.response.sendNotAcceptable = function (message) {
    this.status(HTTP_STATUS_CODES.NOT_ACCEPTABLE).json({
      status: HTTP_STATUS_CODES.NOT_ACCEPTABLE,
      message: message,
      messageType: "warning",
    });
  };
  // Not able to connect third party service or other service.
  express.response.sendBadGateway = function (message) {
    this.status(HTTP_STATUS_CODES.BAD_GATEWAY).json({
      status: HTTP_STATUS_CODES.BAD_GATEWAY,
      message: message,
    });
  };
  //Too many Request
  express.response.sendTooManyRequest = function (message) {
    this.status(HTTP_STATUS_CODES.TOO_MANY_REQUEST).json({
      status: HTTP_STATUS_CODES.TOO_MANY_REQUEST,
      message: message,
    });
  };

  // For send data, message
  express.response.sendSuccess = function (data = {}, customMessage,meta = {}) {
    this.status(HTTP_STATUS_CODES.OK).send({
      status: HTTP_STATUS_CODES.OK,
      data: data,
      message: customMessage || undefined,
      ...meta,
    });
  };
  // For send data, message
  express.response.sendInvalidIdForList = function (customMessage) {
    this.status(HTTP_STATUS_CODES.OK).send({
      status: HTTP_STATUS_CODES.OK,
      data: { list: [], recordsTotal: 0, recordsFiltered: 0 },
      message: customMessage || undefined,
    });
  };
  // Duplicate, Already identity available
  express.response.sendDuplicate = function (message) {
    this.status(HTTP_STATUS_CODES.CONFLICT).send({
      status: HTTP_STATUS_CODES.CONFLICT,
      message: message,
    });
  };
  // 200 = Resource exists, 404 = Resource does not exit
  express.response.sendIsExists = function (response) {
    const code = response ? HTTP_STATUS_CODES.OK : HTTP_STATUS_CODES.NOT_FOUND;

    this.status(code).send();
  };
  // Resource Created
  express.response.sendCreated = function (data = {},message ) {
    this.status(HTTP_STATUS_CODES.CREATED).json({
      status: HTTP_STATUS_CODES.CREATED,
      data: data,
      message: message,
    });
  };
  // Update, delete request accepted
  express.response.sendUpdated = function (message, data = {}) {
    this.status(HTTP_STATUS_CODES.ACCEPTED).json({
      status: HTTP_STATUS_CODES.ACCEPTED,
      data: data,
      message: message,
    });
  };
  // Update, delete request accepted
  express.response.sendDeleted = function (message) {
    this.status(HTTP_STATUS_CODES.ACCEPTED).json({
      status: HTTP_STATUS_CODES.ACCEPTED,
      message: message,
    });
  };
  // Validation failed
  express.response.sendInvalidRequest = function (message, field) {
    this.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
      status: HTTP_STATUS_CODES.BAD_REQUEST,
      message: message,
      ...(field && { field }),
    });
  };
  // We've set code 200 to send response message in body,
  express.response.sendMessage = function (title, message) {
    // No content
    this.status(HTTP_STATUS_CODES.OK).json({
      status: HTTP_STATUS_CODES.NO_BODY,
      messageOnly: true,
      title: title,
      message: message,
    });
  };
  // URL, Route, Page not found
  express.response.sendResourceNotFound = function (message) {
    this.status(HTTP_STATUS_CODES.NOT_FOUND).json({
      status: HTTP_STATUS_CODES.NOT_FOUND,
      message: message,
    });
  };
  // Access without login/Unauthenticate
  express.response.sendLogin = function (message) {
    this.status(HTTP_STATUS_CODES.NOT_FOUND).json({
      status: HTTP_STATUS_CODES.NOT_FOUND,
      title: "Login Failed",
      message: message || "You are not authorize to access.",
    });
  };
  // Access without login/Unauthenticate
  express.response.tokenNotValid = function (message) {
    this.status(HTTP_STATUS_CODES.UNAUTHORIZED).json({
      status: HTTP_STATUS_CODES.UNAUTHORIZED,
      title: "Token not valid",
      tokenExpired: true,
      message:
        message || "Your session has expired. Please log in again to continue",
    });
  };
  // Forbidden
  express.response.sendUnauthorized = function (message) {
    this.status(HTTP_STATUS_CODES.FORBIDDEN).json({
      status: HTTP_STATUS_CODES.FORBIDDEN,
      message: message || "You are not allowed to access.",
    });
  };

  // eslint-disable-next-line complexity
  express.response.sendError = function (err) {
    try {
      if (err.name === "MulterError") {
        // Multer Error
        if (err.code === "LIMIT_FILE_SIZE") {
          // Payload Too Large
          this.status(HTTP_STATUS_CODES.LARGE_PAYLOAD).json({
            status: HTTP_STATUS_CODES.LARGE_PAYLOAD,
            message: err.message,
          });
        }
      } else if (
        err instanceof SyntaxError &&
        err.status === 400 &&
        "body" in err
      ) {
        // JSON validation field
        this.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: "JSON validation failed.",
        });
      } else if (err.type === "StripeCardError") {
        const code =
          err.statusCode || err.code || HTTP_STATUS_CODES.SERVER_ERROR;
        // Stripe Card Error
        this.status(code).json({
          status: code,
          message: err.message,
        });
      } else if (err.code === "ERR_TLS_CERT_ALTNAME_INVALID") {
        // DNS issue in POST request
        this.status(503).json({
          status: 503,
          message: err.message,
        });
      } else if (err instanceof ValidationError) {
        // Handles both ValidationError and UniqueConstraintError (as it's a subclass)
        const message = [];
        const fields = [];


        if (Array.isArray(err.errors)) {
          err.errors.forEach((e) => {
            fields.push({ field: e.path, message: e.message });
            message.push(`Field '${e.path}': ${e.message}`);
          });
        }

        const isUnique = err instanceof UniqueConstraintError;
      
        this.status(isUnique ? HTTP_STATUS_CODES.CONFLICT : HTTP_STATUS_CODES.BAD_REQUEST).json({
          data: err.data || undefined,
          status: isUnique ? HTTP_STATUS_CODES.CONFLICT : HTTP_STATUS_CODES.BAD_REQUEST,
          message: message.join(", ")
        });
      }
      else if (err instanceof DatabaseError) {
        // General database error (e.g., invalid input syntax)
        this.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          data: err.data || undefined,
          status: HTTP_STATUS_CODES.BAD_REQUEST,
          message: err.message || "Invalid input provided."
        });
      } else {
        const code =
          err.statusCode || err.code || HTTP_STATUS_CODES.SERVER_ERROR;
        if (code === HTTP_STATUS_CODES.SERVER_ERROR) {
          console.error(err);
        }

        this.status(code).json({
          data: err.data || undefined,
          status: code,
          message: "Internal Server Error",
        });
      }
    } catch (error) {
      this.status(500).json({
        status: 500,
        message: "Something went wrong",
      });
    }
  };

  // Block customer response
  express.response.sendBlockedResponse = function (message) {
    this.status(HTTP_STATUS_CODES.FORBIDDEN).json({
      status: HTTP_STATUS_CODES.FORBIDDEN,
      message: message || "Access Forbidden, Please contact support team.",
    });
  };
};
