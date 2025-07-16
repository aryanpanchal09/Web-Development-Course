const express = require("express");
const router = express.Router();
const { Client, Sequelize } = require("../models");
const logger = require("../utils/logger");
const { Op, literal } = require("sequelize");
const validate = require("../middlewares/validate");
const { addClientSchema, updateClientSchema } = require("../validations/client.validation");
const { paginationQuery, generateNextId, activityTracking, parseCustomerFile, generateHash } = require("../utils/helper");
const { User, Role, ClientCsvFormat } = require("../models");
const { upload, handleMulterError } = require("../utils/multer");
const { roleAccess } = require("../middlewares/auth");


Client.hasOne(User, { foreignKey: 'client_id', sourceKey: 'id', as: 'user' });
router.get("/list", roleAccess(["admin"]), async (req, res) => {
  try {
    const search = req.query.search || "";
    const pagination = paginationQuery(req);

    if (pagination.type === "Error") {
      return res.sendInvalidRequest(pagination.message);
    }

    const { count, rows: clients } = await Client.findAndCountAll({
      where: {
        [Op.or]: [
          { first_name: { [Op.iLike]: `%${search}%` } },
          { '$user.email$': { [Op.iLike]: `%${search}%` } }
        ],
      },
      attributes: {
        exclude: ["id", "uuid"],
        include: [
          [literal(`"Client"."uuid"`), "client_id"],
          [literal(`"user"."email"`), "email"],
          [literal(`"user"."phone_no"`), "phone_no"],
          [literal(`"user"."uuid"`), "uuid"],
        ]
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: [],
          required: false
        }
      ],
      order: pagination.order,
      limit: pagination.limit,
      offset: pagination.offset,
    });


    return res.sendSuccess(
      clients, // directly return the array here
      "Clients fetched successfully",
      {
        pagination: {
          total: count,
          page: pagination.page,
          limit: pagination.limit,
          pages: Math.ceil(count / pagination.limit),
        },
      }
    );

  } catch (error) {
    logger.error(error);
    return res.sendError(error, "Error while listing clients");
  }
});

router.get("/list/:client_id", roleAccess(["admin", "client"]), async (req, res) => {
  try {
    const client = await Client.findOne({
      where: { uuid: req.params.client_id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: { exclude: ["id"] },
        }
      ],
      attributes: { exclude: ["id"] },
    });

    if (!client) {
      return res.sendResourceNotFound("Client not found");
    }

    return res.sendSuccess(client, "Client fetched successfully");
  } catch (error) {
    logger.error(error);
    return res.sendError(error, "Error while fetching client");
  }
});

router.post("/add", roleAccess(["admin"]), validate(addClientSchema), async (req, res) => {
  try {
    const data = req.body;

    const existingClient = await User.findOne({
      where: { email: data.email },
      attributes: { exclude: ["id"] },
    });

    if (existingClient) {
      return res.sendDuplicate("Email already exists");
    }

    const oldClientId = await Client.findOne({
      attributes: ['unique_id'],
      order: [['unique_id', 'DESC']],
      limit: 1
    });

    const nextClientId = generateNextId(oldClientId ? oldClientId.unique_id : null, "client");

    data.unique_id = nextClientId;
    const { email, password, phone, ...rest } = data;
    if (existingClient == null) {

      const client = await Client.create(rest);
      const { id, ...clientData } = client.get({ plain: true });
      const adminRole = await Role.findOne({ where: { role_key: "client" } });
      if (!adminRole) {
        return res.sendError("Admin role not exists");
      }

      const userTblObject = {
        email,
        password,
        phone_no: phone,
        client_id: client.id,
        role_id: adminRole.id,
        user_type: "client"
      };
      const user = await User.create(userTblObject);
      activityTracking(req, "Client Created");
      return res.sendSuccess(clientData, "Client created successfully");

    }

  } catch (error) {
    logger.error(error);
    return res.sendError(error, "Error while creating client");
  }
});

router.put("/update/:client_id", roleAccess(["admin"]), validate(updateClientSchema), async (req, res) => {
  try {
    const client_id = req.params.client_id;
    const data = req.body;

    const client = await Client.findOne({
      where: { uuid: client_id },
    });

    if (!client) {
      return res.sendResourceNotFound("Client not found");
    }
    const user = await User.findOne({ where: { client_id: client.id } });
    if (!user) {
      return res.sendResourceNotFound(" client not found");
    }
    if (data?.password || data?.phone) {
      if (data?.password) {
        user.password = data.password;
        user.changed("password", true);
      }
      if (data?.phone) {
        user.phone_no = data.phone;
      }
      await user.save();
    }
    delete data.password;
    delete data.phone;
    delete data.email;
    
    await client.update(data);
    const clientData = client.get({ plain: true });
    delete clientData.id;
    activityTracking(req, "Client Updated");
    return res.sendSuccess(clientData, "Client updated successfully");
  } catch (error) {
    logger.error("Error in client update route:", error);
    return res.sendError(error.message, "Error while updating client");
  }
});

router.delete("/delete/:client_id", roleAccess(["admin"]), async (req, res) => {
  try {
    const { client_id } = req.params;

   const deletedCount = await Client.destroy({
      where: { uuid: client_id },
    });

    if (deletedCount === 0) {
      return res.sendResourceNotFound("Client not found");
    }
   
    activityTracking(req, "Client Deleted");
    return res.sendSuccess(null, "Client deleted successfully");
  } catch (error) {
    logger.error("Error in client delete route:", error);
    return res.sendError(error.message, "Error while deleting client");
  }
});

router.post("/csv-format/add", roleAccess(["client"]), upload.single("file"), handleMulterError, async (req, res) => {
  try {
    if (!req.file) {
      return res.sendInvalidRequest("Please upload a file");
    }

    const client_id = req.body.client_id;
    const is_update = req.body.is_update === "true";

    if (!client_id) {
      return res.sendInvalidRequest("client_id (UUID) is required in body");
    }

    logger.info(`Processing file upload for client_id: ${client_id}`);

    const client = await Client.findOne({ where: { uuid: client_id } });

    logger.info(`Client lookup result: ${client ? "Found" : "Not found"}`);

    if (!client) {
      return res.sendResourceNotFound("Client does not exist");
    }

    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    let headers = [];
    try {
      ({ headers } = await parseCustomerFile(req.file.path, fileExtension));
    } catch (error) {
      return res.sendInvalidRequest(error.message);
    }

    if (!headers || headers.length === 0) {
      return res.sendInvalidRequest("Headers field is empty");
    }

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    const existingFormat = await ClientCsvFormat.findOne({
      where: { client_id },
    });

    if (!existingFormat) {
      await ClientCsvFormat.create({
        client_id,
        header_mapping: headers,
      });

      return res.sendCreated({}, "CSV format created successfully");
    }

    if (is_update) {
      await existingFormat.update({ header_mapping: headers });
      return res.sendSuccess({}, "CSV format updated successfully");
    } else {
      return res.sendDuplicate(
        "CSV format already exists for this client"
      );
    }
  } catch (error) {
    logger.error("File upload error:", error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.sendError("Error uploading file: " + error.message);
  }
}
);

router.get("/csv-format/list", roleAccess(["admin", "client"]), async (req, res) => {
  try {
    const search = req.query.search || "";
    const where = search
      ? {
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { phone: { [Op.iLike]: `%${search}%` } },
        ],
      }
      : {};

    const client_csv_format = await ClientCsvFormat.findAll({
      where,
      attributes: { exclude: ["id"] },
      order: [["created_at", "DESC"]],
    });

    if (client_csv_format.length === 0) {
      return res.sendResourceNotFound([], "No client CSV format records found");
    }

    return res.sendSuccess(
      client_csv_format,
      "Clients csv format fetched successfully"
    );
  } catch (error) {
    logger.error(error);
    return res.sendError(error, "Error while listing clients csv format");
  }
});

router.delete("/csv-format/delete/:client_id", roleAccess(["client"]), async (req, res) => {
  try {
    const client_id = req.params.client_id;

    if (!client_id) {
      return res.sendInvalidRequest("client_id is required");
    }

    const record = await ClientCsvFormat.findOne({ where: { client_id } });

    if (!record) {
      return res.sendResourceNotFound("CSV format record not found for this client_id");
    }

    await record.destroy({ force: true });
    activityTracking(req, `Deleted CSV format for client ${client_id}`);
    return res.sendSuccess(null, "CSV format deleted successfully");
  } catch (error) {
    logger.error("CSV format delete error:", error);
    return res.sendError(error, "Error while deleting CSV format");
  }
});

module.exports = router;
