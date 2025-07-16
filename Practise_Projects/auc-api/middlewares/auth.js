/**
 * This function is used for check access
 * @param {String} access 
 * @returns callback function
 */
const logger = require("../utils/logger");
const jwt = require("jsonwebtoken");
const { blacklisttoken, User } = require("../models");


const verifyAuthToken = async function (req, res, next) {
  if (req.headers.authorization) {
    let { 1: token } = req.headers.authorization.split(" ");

    try {
      const blacklisted = await blacklisttoken.findOne({ where: { token } });
      if (blacklisted) {
        logger.error("Token is blacklisted.");
        return res.sendLogin("Token has been revoked. Please log in again.");
      }

      jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err) {
          logger.error("Token verification failed.");
          return res.tokenNotValid();
        }

        if (user) {
          req.user = user;
          console.log("User data from token:", user);
          // return
          return next();
        } else {
          logger.error("Token user data not found.");
          return res.sendLogin();
        }
      });
    } catch (error) {
      logger.error("Error in token verification:", error);
      return res.sendError("Token verification error");
    }
  } else {
    logger.error("Token not found.");
    return res.sendLogin();
  }
};

// Roles are admin, client,debt_head, debt_collector, super_admin

const roleAccess = function (access) {
  return function (req, res, next) {

    if (Array.isArray(access)) {
      if (access.some((acs) => req.user.role.includes(acs))) {
        return next();
      } else {
        return res.sendUnauthorized();
      }
    };

    //check user has access or not
    if (req.user.role.includes(access)) {
      //if user has access
      next();
    } else {
      //if user has not access
      res.sendUnauthorized();
    }
  };
};

// middlewares/checkUserStatus
const checkIfUserActive= async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || user.status !== 1) {
      return res.sendUnauthorized("Your account is deactivated. Please contact admin.");
    }
    next();
  } catch (error) {
    return res.sendError("Error verifying user status.");
  }
};


module.exports = {
  verifyAuthToken,
  roleAccess,
  checkIfUserActive,
};
