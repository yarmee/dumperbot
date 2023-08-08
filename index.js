/* eslint-disable no-unused-vars */
const { Client, Events, GatewayIntentBits } = require("discord.js");
const { token } = require("./config.json");
const { spawn } = require("child_process");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once(Events.ClientReady, (b) => {
  console.log(`Ready! Logged in as ${b.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.content.startsWith('!decrypt')) {
    const requestId = uuidv4(); // I have no idea why I did this but now the code won't work without it

    // Make sure the attachment exists
    const attachment = message.attachments.first();
    if (!attachment) {
      message.reply('No attachments found.');
      return;
    }

    const attachmentURL = attachment.url;
    const fileName = attachment.name;

    try {
      // Download the file from the URL
      const response = await fetch(attachmentURL);
      const fileArrayBuffer = await response.arrayBuffer();
      const fileBuffer = Buffer.from(fileArrayBuffer);

      // Save the file temporarily
      const tempFilePath = `./${requestId}_${fileName}`;
      await fs.promises.writeFile(tempFilePath, fileBuffer);
      const renamedFilePath = `./grabber.exe`;
      fs.promises.rename(tempFilePath, renamedFilePath)
      // Run the decrypt.py script
      const decryptProcess = spawn("python3", ["decrypt.py", "grabber.exe"]);

      decryptProcess.stdout.on("data", (data) => {
        const output = data.toString();

        // Define a regular expression pattern to match the webhook information
        const webhookPattern =
          /https?:\/\/(canary|ptb|www)?\.?discord(app)?\.com\/api\/webhooks\/(\d+)\/([\w-]+)/g;
        const webhookMatch = output.match(webhookPattern);

        if (webhookMatch) {
          const webhookURL = webhookMatch[0];
          console.log(`Webhook URL: ${webhookURL}`);
          message.channel.send(`Webhook: ${webhookURL}`)
        }
      });

      decryptProcess.stderr.on("data", (data) => {
        console.error(`decrypt.py error: ${data}`);
        // Handle errors if needed
      });

      decryptProcess.on("close", async (code) => {
        console.log(`decrypt.py process exited with code ${code}`);
        
        try {
          await fs.promises.unlink(renamedFilePath);
          console.log(`Temporary file ${renamedFilePath} deleted.`);
        } catch (error) {
          console.error(`Error deleting file: ${error}`);
        }
      });           

      message.reply("File decryption process initiated.");
    } catch (error) {
      console.error("Error:", error);
      message.reply("An error occurred while processing the file.");
    }
  }
});
client.login(token);
