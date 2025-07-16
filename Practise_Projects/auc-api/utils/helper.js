"use strict";
const bcrypt = require("bcryptjs");
const { User, Role } = require("../models");
const fs = require("fs");
const { parse } = require("csv-parse");
const XLSX = require("xlsx");
const crypto = require("crypto");
require("dotenv").config();
const moment = require("moment");
const { UserActivityTracking } = require("../models");
const generateHash = (str) => bcrypt.hash(str, 10);

const formatDate = (dateString) => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    return null;
  }
};

const generateNextId = (lastId, type) => {
  if (type === 'user') {
    if (!lastId) return 'AUC001';
    const numPart = lastId.substring(3);
    const nextNum = parseInt(numPart) + 1;
    return `AUC${nextNum.toString().padStart(3, '0')}`;
  }
  if (type === 'client') {
    if (!lastId) return 'CL1001';
    const numPart = lastId.substring(2);
    const nextNum = parseInt(numPart) + 1;
    return `CL${nextNum.toString().padStart(4, '0')}`;
  }
  if (type === "customer") {
    if (!lastId) return 'CT1001';
    const numPart = lastId.substring(2);
    const nextNum = parseInt(numPart) + 1;
    return `CT${nextNum.toString().padStart(4, '0')}`;
  }
  return null;
};

const activityTracking = async (req, message) => {
  try {
    const { UserActivityTracking } = require("../models");
    const user = req.user;
    if (!user) return;

    const activity = {
      logged_in_user: user.role === 'client' ? user.client_id : user.id,
      message: message,
      api_name: req.originalUrl,
      payload: req.body || {},
      switch_user_id: user.original_role == 'admin' ? user.original_id : null,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'] || '',
      created_at: new Date(),
      updated_at: new Date(),
    };
    await UserActivityTracking.create(activity);
  } catch (error) {
    console.error("Error logging activity:", error);
  } 
};

function matchesRule(record, rule) {

  const amount = parseFloat(record.total_outstanding_balance?.toString().replace(/[^0-9.-]+/g,"")) || 0;
  const min = rule.min_amount !== null && rule.min_amount !== undefined ? parseFloat(rule.min_amount) : null;
  const max = rule.max_amount !== null && rule.max_amount !== undefined ? parseFloat(rule.max_amount) : null;

  if (min !== null && amount < min) return false;
  if (max !== null && amount > max) return false;

  if (rule.aging) {
    try {
      const ruleAging = typeof rule.aging === "string" ? JSON.parse(rule.aging) : rule.aging;
      for (const key in ruleAging) {
        if (ruleAging[key] && record[key] !== undefined) {
          if (!record[key] || record[key] === "0" || record[key] === false) return false;
        }
      }
    } catch (e) {
      return false;
    }
  }

  return true;
}

const dummyCustomers = {
  "Account Id": "233701",
  "Group Id": "0",
  "Business Name": "Ghetia Limited T/A  Mina Stores",
  "Group Name": "",
  "Collecting Agent": "Field Force",
  "Pending_15": "0",
  "Pending 30 / 1 Month / Next Invoice due?": "236.72",
  "Pending 60 / 2 Month": "1018.88",
  "Pending 90 / 3 Months": "1543.36",
  "Pending 120 / 4 Months": "1635.85",
  "Pending 180 / Process for Disconnection": "1435.91",
  "Pending 181 / Disconnection": "27213.92",
  "Total Outstanding balance": "£33,084.64",
  "OnlyPayment": "4169.96",
  "Next Invoice Amount": "971.01",
  "Next Invoice Due Date": "7/13/2025",
  "Agreed PP Amount": "",
  "Last Payment Date": "03/01/2025",
  "Last Payment Amount": "405",
  "Mode of Payment": "BACS",
  "ChargeAmount": "",
  "ChargeDate": "",
  "MPAN": "8818762007",
  "MPRN": "GTM",
  "MOP/MAM": "",
  "Electricity Meter Type": "S",
  "Gas Meter Type": "",
  "Last Reading EC": "197658.00",
  "Actual/Estimate EC": "A",
  "Last Reading Gas": "07/03/2022",
  "Actual/Estimate Gas": "Active",
  "Live Date": "",
  "Customer Status": "",
  "Elec Loss Date": "",
  "Gas Loss Date": "",
  "Contact Person Name": "Bipin Ghetia",
  "Contact Number": "02085535455",
  "Email": "bipin@ghetia.co.uk",
  "Site Address1": "772 776 Romford Road",
  "Site Address2": "",
  "Site Address3": "",
  "Site Address4": "London",
  "Site Postcode": "E12 6BU",
  "Supply Address": "772 776 Romford Road , London , E12 6BU",
  "Billing Address1": "772/ 776 Romford Road, Manor Park",
  "Billing Address2": "",
  "Billing Address3": "",
  "Billing Address4": "London",
  "Billing PostCode": "E12 6BU",
  "Billing Address": "772/ 776 Romford Road, Manor Park,,,London,E12 6BU",
  "First Letter Sent Date": "45302.53739",
  "Second Letter Sent Date": "45310.05316",
  "Notice Letter Sent Date": "45442.68369",
  "Isolation Letter Sent": "",
  "Disconnection Date": "",
  "CNG Customer": "No",
  "Last Bill Date": "45777",
  "Last Bill Amount": "236.72",
  "Reconciled Amount": "2093.24",
  "Profile Class": "",
  "EC TotalEAC": "0",
  "Gas TotalEAC": "75765",
  "Energisation_status": "",
  "CT/WC": "",
  "Meter Location J0419": "FAR R/H SIDE OF PROPERTY DOORWAY",
  "Meter Serial Number": "M065K1421915D6",
  "Mandate Status": "",
  "Pending Days": "1147",
  "Agent Assign date": "",
  "RegionCode": "12",
  "RegionName": "London",
  "isAging": "Yes",
  "isDebt": "No",
  "isForceStop": "No",
  "isQueryOpen": "NO",
  "Customer Status1": "Active",
  "COT Date": "",
  "Validated": "Yes"
};
 

const sampleCSVHeaders = [
  "Account Id",
  "Group Id",
  "Business Name",
  "Group Name",
  "Collecting Agent",
  "Pending_15",
  "Pending 30 / 1 Month / Next Invoice due?",
  "Pending 60 / 2 Month",
  "Pending 90 / 3 Months",
  "Pending 120 / 4 Months",
  "Pending 180 / Process for Disconnection",
  "Pending 181 / Disconnection",
  "Total Outstanding balance",
  "OnlyPayment",
  "Next Invoice Amount",
  "Next Invoice Due Date",
  "Agreed PP Amount",
  "Last Payment Date",
  "Last Payment Amount",
  "Mode of Payment",
  "ChargeAmount",
  "ChargeDate",
  "MPAN",
  "MPRN",
  "MOP/MAM",
  "Electricity Meter Type",
  "Gas Meter Type",
  "Last Reading EC",
  "Actual/Estimate EC",
  "Last Reading Gas",
  "Actual/Estimate Gas",
  "Live Date",
  "Customer Status",
  "Elec Loss Date",
  "Gas Loss Date",
  "Contact Person Name",
  "Contact Number",
  "Email",
  "Site Address1",
  "Site Address2",
  "Site Address3",
  "Site Address4",
  "Site Postcode",
  "Supply Address",
  "Billing Address1",
  "Billing Address2",
  "Billing Address3",
  "Billing Address4",
  "Billing PostCode",
  "Billing Address",
  "First Letter Sent Date",
  "Second Letter Sent Date",
  "Notice Letter Sent Date",
  "Isolation Letter Sent",
  "Disconnection Date",
  "CNG Customer",
  "Last Bill Date",
  "Last Bill Amount",
  "Reconciled Amount",
  "Profile Class",
  "EC TotalEAC",
  "Gas TotalEAC",
  "Energisation_status",
  "CT/WC",
  "Meter Location J0419",
  "Meter Serial Number",
  "Mandate Status",
  "Pending Days",
  "Agent Assign date",
  "RegionCode",
  "RegionName",
  "isAging",
  "isDebt",
  "isForceStop",
  "isQueryOpen",
  "Customer Status1",
  "COT Date",
  "Validated"
];
 
const validatePostalCode = (postalCode) => {
  if (!postalCode || typeof postalCode !== "string") return false;
  // Remove any spaces and hyphens
  const cleanedCode = postalCode.replace(/[\s-]/g, "");
  // Check if it's a valid length (between 5 and 10 characters)
  if (cleanedCode.length < 5 || cleanedCode.length > 10) {
    return false;
  }
  // Check if it contains only letters and numbers
  if (!/^[A-Za-z0-9]+$/.test(cleanedCode)) {
    return false;
  }

  return cleanedCode;
};

const sanitizeCurrencyString = (value) => {
  if (!value || typeof value !== "string") return "0.00";  // empty or null = zero
  const cleaned = value.replace(/[^0-9.]/g, "").replace(/,/g, "");
  const floatValue = parseFloat(cleaned);
  return isNaN(floatValue) ? "0.00" : floatValue.toFixed(2);
};


const parsePostalCodes = (postalCode) => {
  if (postalCode === "") return "";
  if (Array.isArray(postalCode)) {
    return postalCode
      .map((code) => validatePostalCode(code.toUpperCase()))
      .filter(Boolean);
  }

  if (typeof postalCode === "string") {
    const trimmed = postalCode.trim();
    if (trimmed === "") return "";

    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        const cleanedStr = trimmed
          .replace(/'/g, '"')
          .replace(/(\w+):/g, '"$1":')
          .replace(/(\w+),/g, '"$1",')
          .replace(/,(\s*[}\]])/g, "$1");

        const parsed = JSON.parse(cleanedStr);

        if (Array.isArray(parsed)) {
          return parsed
            .map((code) => validatePostalCode(code.toUpperCase()))
            .filter(Boolean);
        }
        return [];
      } catch (error) {
        logger.warn(
          `Failed to parse postal code as JSON, falling back to comma-separated: ${error.message}`
        );
      }
    }

    const parts = trimmed
      .split(",")
      .map((p) => validatePostalCode(p.trim().toUpperCase()))
      .filter(Boolean);

    return parts.length === 1 ? parts[0] : parts;
  }

  return [];
};

const parseCustomerFile = async (filePath, extension) => {
  const records = [];
  const errors = [];
  let headers = [];


  const normalizeHeaders = (headerRow) =>
    headerRow.map((col) => {
      let normalized = col
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[ \/\\\?\(\)\-]/g, "_") // replaces spaces, slashes, etc.
        .replace(/_+/g, "_")              // collapses multiple underscores
        .replace(/^_+|_+$/g, "");         // trims leading/trailing underscores

      if (normalized.includes("pending_15")) return "pending_15";
      if (normalized.includes("pending_30") || normalized.includes("1_month")) return "pending_30";
      if (normalized.includes("pending_60") || normalized.includes("2_month")) return "pending_60";
      if (normalized.includes("pending_90") || normalized.includes("3_month")) return "pending_90";
      if (normalized.includes("pending_120") || normalized.includes("4_month")) return "pending_120";
      if (normalized.includes("pending_180") || normalized.includes("process_for_disconnection")) return "pending_180";
      if (normalized.includes("pending_181"))return "pending_181";
      if (normalized.includes("ec_totaleac") || normalized.includes("ec_total_eac")) return "ec_total_eac";
      if (normalized.includes("gas_totaleac") || normalized.includes("gas_total_eac")) return "gas_total_eac";
      if (normalized === "isaging" || normalized === "is_aging") return "is_aging";
      if (normalized === "isdebt" || normalized === "is_debt") return "is_debt";
      if (normalized === "isforcestop" || normalized === "is_force_stop") return "is_force_stop";
      if (normalized === "isqueryopen" || normalized === "is_query_open") return "is_query_open";
      if (normalized === "regioncode" || normalized === "region_code") return "region_code";
      if (normalized === "regionname" || normalized === "region_name") return "region_name";
      if (normalized === "chargeamount" || normalized === "charge_amount") return "charge_amount";
      if (normalized === "nextinvoiceduedate" || normalized === "next_invoice_due_date" ||
        normalized.includes("next_invoice_due") || normalized.includes("next_invoice_date") ||
        normalized.includes("invoice_due_date") || normalized.includes("invoice_due") ||
        normalized.includes("next_invoice") || normalized.includes("invoice_due") ||
        normalized.includes("next_due_date") || normalized.includes("due_date"))
        return "next_invoice_due_date";
      if (normalized === "onlypayment" || normalized === "only_payment") return "only_payment";

      return normalized;
    });
  const isValidRow = (data) => {
    return data.email && data.business_name;
  };

  if (extension === ".csv") {
    const parser = parse({
      columns: (headerRow) => {
        headers = normalizeHeaders(headerRow);
        return headers;
      },
      skip_empty_lines: true,
      trim: true,
    });

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(parser)
        .on("data", (data) => {
          try {
            if (!isValidRow(data)) {
              errors.push(`Missing required fields: ${JSON.stringify(data)}`);
              return;
            }
            records.push(data);
          } catch (err) {
            errors.push(`Row error: ${err.message}`);
          }
        })
        .on("end", resolve)
        .on("error", reject);
    });
  } else if (extension === ".xls" || extension === ".xlsx") {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (data.length === 0) {
      errors.push("Excel sheet is empty");
      return { records, errors, headers };
    }

    headers = normalizeHeaders(data[0]);

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const record = {};

      headers.forEach((header, index) => {
        record[header] = row[index]?.toString().trim() || "";
      });

      if (!isValidRow(record)) {
        errors.push(`Row ${i + 1} missing fields: ${JSON.stringify(record)}`);
        continue;
      }

      records.push(record);
    }
  } else {
    throw new Error("Unsupported file type");
  }

  return { records, errors, headers };
};

const parseDate = (dateString) => {
  if (!dateString) {
    return null;
  }

  try {
    // Try parsing as ISO string first
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }

    // Try parsing common date formats
    const formats = [
      'DD/MM/YYYY',
      'MM/DD/YYYY',
      'YYYY-MM-DD',
      'DD-MM-YYYY',
      'MM-DD-YYYY'
    ];

    for (const format of formats) {
      const parsed = moment(dateString, format, true);
      if (parsed.isValid()) {
        return parsed.toDate();
      }
    }
    return null;
  } catch (error) {
    return null;
  }
};

const paginationQuery = function (req, advancedPagination = false) {
  try {
    const isGet = req.method === "GET";
    const source = isGet ? req.query : req.body;

    const limit = parseInt(source.limit, 10) || 10;
    const page = parseInt(source.page, 10) || 1;
    const offset = advancedPagination
      ? parseInt(source.skip, 10) || 0
      : limit * (page - 1);

    if (limit < 0 || offset < 0 || isNaN(limit) || isNaN(offset)) {
      return {
        type: "Error",
        message: "Invalid pagination parameters",
      };
    }

    const sortField = source.sortField || "created_at";
    const sortOrder = source.sortOrder === "desc" ? "DESC" : "ASC";

    return {
      limit,
      offset,
      order: [[sortField, sortOrder]],
      page,
    };
  } catch (error) {
    return {
      type: "Error",
      message: "Pagination processing failed",
    };
  }
};

const algorithm = "aes-256-cbc";

const key = Buffer.from(process.env.KEY, "hex");
const iv = Buffer.from(process.env.IV, "hex");

const encrypt = (text) => {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf-8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
};

const decrypt = (encryptedText) => {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf-8");
  decrypted += decipher.final("utf-8");
  return decrypted;
};

const parseUserFile = async (filePath, extension) => {
  const records = [];
  const errors = [];
  let headers = [];

  const normalizeHeaders = (headerRow) =>
    headerRow.map((col) => {
      let normalized = col
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[ \/\\\?\(\)\-]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");
      return normalized;
    });

  const isValidRow = (data) => {
    return data.email && data.password && data.first_name;
  };

  if (extension === ".csv") {
    const parser = parse({
      columns: (headerRow) => {
        headers = normalizeHeaders(headerRow);
        return headers;
      },
      skip_empty_lines: true,
      trim: true,
    });

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(parser)
        .on("data", (data) => {
          try {
            if (!isValidRow(data)) {
              errors.push(`Missing required fields: ${JSON.stringify(data)}`);
              return;
            }
            records.push(data);
          } catch (err) {
            errors.push(`Row error: ${err.message}`);
          }
        })
        .on("end", resolve)
        .on("error", reject);
    });
  } else if (extension === ".xls" || extension === ".xlsx") {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (data.length === 0) {
      errors.push("Excel sheet is empty");
      return { records, errors, headers };
    }

    headers = normalizeHeaders(data[0]);

    for (let i = 1; i < data.length; i++) {
      const row = data[i]; 
      const record = {};

      headers.forEach((header, index) => {
        record[header] = row[index]?.toString().trim() || "";
      });

      if (!isValidRow(record)) {
        errors.push(`Row ${i + 1} missing fields: ${JSON.stringify(record)}`);
        continue;
      }

      records.push(record);
    }
  } else {
    throw new Error("Unsupported file type");
  }

  return { records, errors, headers };
};

module.exports = {
  generateHash,
  dummyCustomers,
  parsePostalCodes,
  parseCustomerFile,
  paginationQuery,
  encrypt,
  decrypt,
  parseDate,
  sanitizeCurrencyString,
  formatDate,
  sampleCSVHeaders,
  generateNextId,
  activityTracking,
  parseUserFile,
  matchesRule,
};












