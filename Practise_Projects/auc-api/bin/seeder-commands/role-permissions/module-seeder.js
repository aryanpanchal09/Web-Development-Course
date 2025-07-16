"use strict";
const { Module, SequalizeSeederMeta } = require("./../../../models");
const { readFileSync, existsSync } = require("fs");
const path = require("path");
const moduleDataPath = path.join(
  process.cwd(),
  "resources",
  "seeder-data",
  "modules.json"
);

const filesArr = [];

const getModulePromises = async () => {
  try {
    if (!existsSync(moduleDataPath)) {
      console.error("module data file does not exist at:", moduleDataPath);
      return [];
    }
    const fileContent = readFileSync(moduleDataPath, "utf8");
    const modulesArray = JSON.parse(fileContent);
    console.log("Parsed countries:", modulesArray.length);

    await SequalizeSeederMeta.findOrCreate({
      where: { file_path: moduleDataPath },
      defaults: { is_modified: true },
    });

    const promises = modulesArray.map(async (moduleElm) => {
      const moduleData = {
        module_name: moduleElm.module_name,
        module_key: moduleElm.module_key,
        created_by: 1,
      };
      const [module, created] = await Module.findOrCreate({
        where: { module_key: moduleElm.module_key },
        defaults: moduleData,
      }).catch((err) => {
        throw err;
      });

      if (created) {
        console.log(
          "New module created successfully Module :",
          module.module_name
        );
      }
    });
    return promises;
  } catch (error) {
    console.log("Error : Error while seeding modules data :", error);
  }
};

const modulesSeeder = async () => {
  try {
    const promises = await getModulePromises();
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
    console.log(error);
  }
};

module.exports = modulesSeeder;
