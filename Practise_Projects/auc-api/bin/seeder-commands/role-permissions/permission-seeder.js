"use strict";
const {
  Module,
  Permission,
  SequalizeSeederMeta,
} = require("./../../../models");
const { readFileSync, existsSync } = require("fs");
const path = require("path");
const moduleDataPath = path.join(
  process.cwd(),
  "resources",
  "seeder-data",
  "permissions.json"
);

const filesArr = [];
const modulesData = [];

const getModuleId = async (moduleKey) => {
  if (modulesData.indexOf(moduleKey) !== -1) {
    return modulesData[moduleKey];
  }
  const modules = await Module.findAll();
  modules.forEach((module) => {
    modulesData[module.module_key] = module.id;
  });
  return modulesData[moduleKey] || null;
};

const getPermissionPromises = async () => {
  try {
    if (!existsSync(moduleDataPath)) {
      return [];
    }
    const fileContent = readFileSync(moduleDataPath, "utf8");
    const permissionsArray = JSON.parse(fileContent);

    await SequalizeSeederMeta.findOrCreate({
      where: { file_path: moduleDataPath },
      defaults: { is_modified: true },
    });

    const promises = permissionsArray.map(async (permissionElm) => {
      const moduleId = await getModuleId(permissionElm.module_key);
      if (!moduleId) {
        console.log("Invalid permission key provided :");
        throw new Error(
          `Invalid permission key provided: ${permissionElm.module_key}`
        );
      }
      const permissionData = {
        permission_name: permissionElm.permission_name,
        permission_key: permissionElm.permission_key,
        module_id: moduleId,
        created_by: 1,
      };
      const [permission, created] = await Permission.findOrCreate({
        where: { permission_key: permissionElm.permission_key },
        defaults: permissionData,
      }).catch((err) => {
        throw err;
      });

      
    });
    return promises;
  } catch (error) {
    console.error("Error : Error while seeding permissions data :", error);
  }
};

const permissionsSeeder = async () => {
  try {
    const promises = await getPermissionPromises();
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
  } catch (error) {
    console.error(error);
  }
};

module.exports = permissionsSeeder;
