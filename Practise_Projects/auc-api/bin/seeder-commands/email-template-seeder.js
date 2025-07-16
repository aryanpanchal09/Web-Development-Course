const { EmailTemplate } = require("../../models"); // adjust path if needed
const { v4: uuidv4 } = require("uuid");

const emailSeeder = async () => {
  const templates = [
    {
      uuid: uuidv4(),
      name: "welcome_email",
      subject: "Welcome, {{name}}!",
      html: `<h1>Hello {{name}}</h1><p>Thanks for joining. Click <a href="{{invite_link}}">here</a> to start.</p>`,
      text: `Hello {{name}},\nThanks for joining. Go to {{invite_link}} to start.`,
      type: "welcome",
      variables: ["name", "invite_link"],
    },
    // Add more templates here if needed
  ];

  for (const template of templates) {
    await EmailTemplate.findOrCreate({
      where: { name: template.name },
      defaults: template,
    });
  }

  console.log(" Email templates seeded.");
};

module.exports = emailSeeder;
