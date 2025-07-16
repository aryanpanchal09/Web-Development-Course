"use strict";
const { readdirSync, statSync } = require("fs");
const { join } = require("path");
const process = require("process");
const { SequalizeSeederMeta } = require("../../models");
const allFilesAndSubdirectories = [];

const readTargetDir = (directory) => {
  const absolutePath = join(process.cwd(), directory);
  readdirSync(absolutePath).forEach((file) => {
    const absoluteFilepath = join(absolutePath, file);
    if (statSync(absoluteFilepath).isDirectory()) {
      return readTargetDir(join(directory, file));
    } else {
      return allFilesAndSubdirectories.push(absoluteFilepath);
    }
  });
};

readTargetDir("resources/seeder-data");
let counter = 1;
const getSequalizeMetaPromises = async () => {
  try {
    const promises = allFilesAndSubdirectories.map(async (file) => {
      let updated = false;
      const fileState = statSync(file);
      const SeederFileInfo = {
        file_path: file,
        file_size: fileState.size,
        file_created_at: fileState.birthtime,
        file_modified_at: fileState.mtime,
        file_modified_at_ms: fileState.mtimeMs,
      };
      const [sequalizeMeta, created] = await SequalizeSeederMeta.findOrCreate({
        where: { file_path: file },
        defaults: SeederFileInfo,
      });
      if (sequalizeMeta.file_modified_at_ms !== fileState.mtimeMs.toString()) {
        sequalizeMeta.is_modified = true;
        updated = true;
        await sequalizeMeta.save();
      }
      if (created || updated) {
        console.log(
          `File: '${file}' is going to proceed during this seeder run`
        );
      }
    });
    return promises;
  } catch (error) {
    console.error(error);
  }
};

const SequalizeSeeder = async () => {
  const refreshAllSeeder = process.env.REFRESH_ALL_SEEDER || 0;
  if (refreshAllSeeder == 1) {
    await SequalizeSeederMeta.destroy({
      where: {},
      truncate: true,
    });
  }
  const promises = await getSequalizeMetaPromises();
  const result = await Promise.all(promises);
  return result;
};

module.exports = SequalizeSeeder;
