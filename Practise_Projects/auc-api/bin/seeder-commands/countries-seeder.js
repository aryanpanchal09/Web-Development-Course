"use strict";

const { Country, SequalizeSeederMeta } = require("./../../models");
const { readFileSync, existsSync } = require("fs");
const path = require("path");
const countryDataPath = path.join(
  process.cwd(),
  "resources",
  "seeder-data",
  "countries.json"
);
console.log("countryDataPath", countryDataPath);

const filesArr = [];

const getCountryPromises = async () => {
  try {
    if (!existsSync(countryDataPath)) {
      console.error("Country data file does not exist at:", countryDataPath);
      return [];
    }

    const fileContent = readFileSync(countryDataPath, "utf8");
    const countryArray = JSON.parse(fileContent);
    console.log("Parsed countries:", countryArray.length);

    await SequalizeSeederMeta.findOrCreate({
      where: { file_path: countryDataPath },
      defaults: { is_modified: true },
    });

    const promises = countryArray.map(async (countryElm) => {
      const countryData = {
        name: countryElm.name,
        country_code: countryElm.country_code,
        phone_code: countryElm.phone_code,
        created_by: 1,
      };
      const [country, created] = await Country.findOrCreate({
        where: { country_code: countryElm.country_code },
        defaults: countryData,
      });
      if (created) {
        console.log(`Created new country: ${countryElm.name}`);
      }
    });
    return promises;
  } catch (error) {
    console.error("Error in getCountryPromises:", error);
    return [];
  }
};

const countrySeeder = async () => {
  try {
    const promises = await getCountryPromises();
    const result = await Promise.all(promises);
    await SequalizeSeederMeta.update(
      { is_modified: false },
      {
        where: {
          file_path: filesArr,
        },
      }
    );
    console.log("New countries completed successfully");
    return result;
  } catch (error) {
    console.error(error);
  }
};

module.exports = countrySeeder;
