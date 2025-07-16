"use strict";
const { Role, SequalizeSeederMeta, Sequelize } = require("./../../../models");
const { readFileSync, existsSync } = require("fs");
const path = require("path");
const rolesDataPath = path.join(
  process.cwd(),
  "resources",
  "seeder-data",
  "roles.json"
);

const filesArr = [];

const getRolePromises = async () => {
  try {
    if (!existsSync(rolesDataPath)) {
      throw new Error(`Roles data file not found at ${rolesDataPath}`);
    }

    const fileContent = readFileSync(rolesDataPath, "utf8");
    const rolesArray = JSON.parse(fileContent);
    filesArr.push(rolesDataPath);

    const promises = rolesArray.map(async (roleElm) => {
      const roleData = {
        role_name: roleElm.role_name,
        role_key: roleElm.role_key,
        created_by: 1,
      };
      const [role, created] = await Role.findOrCreate({
        where: { role_key: roleElm.role_key },
        defaults: roleData,
      }).catch((err) => {
        throw err;
      });

      if (created) {
        console.log("New role created successfully Role :", role.role_name);
      }
    });
    return promises;
  } catch (error) {
    console.error("Error : Error while seeding roles data :", error);
    throw error;
  }
};

const rolesSeeder = async () => {
  try {
    const promises = await getRolePromises();
    const result = await Promise.all(promises);
    await SequalizeSeederMeta.update(
      { is_modified: false },
      {
        where: {
          file_path: filesArr,
        },
      }
    );
    return result;
  } catch (err) {
    console.error("Error : Error while seeding roles data :", err);
  }
};

module.exports = rolesSeeder;
