const { Client, Events, GatewayIntentBits } = require("discord.js");
const { token } = require("./config.json");
const { exec } = require("node:child_process");
const fs = require("node:fs");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (b) => {
  console.log(`Ready! Logged in as ${b.user.tag}`);
});

client.on(Events.TypingStart, (event) => {
  console.log(`${event.user.tag} started typing in #${event.channel.name}`);
});

client.on("message", async (message) => {
  if (message.content.startsWith("!decrypt")) {
    const args = message.content.split(" ");

    if (args.length !== 2) {
      message.channel.send("Usage: !decrypt [filename]");
      return;
    }

    // The readFile portion wasn't made in Visual Studio, rather discord. Probably works though.
    const attachmentURL = message.attachments.first()?.url;

    // Check if there are any attachments
    if (!attachmentURL) {
      message.channel.send("No attachments found.");
      return;
    }
    
    // Read the file content
    fs.readFile(attachmentURL, "utf8", (err, fileContent) => {
      if (err) {
        console.error("Error reading the file:", err);
        message.channel.send("An error occurred while reading the file.");
        return;
      }
    

      function createTemporaryFile(fileContent, fileName) {
        fs.writeFile(fileName, fileContent, (err) => {
          if (err) {
            console.error("Error creating temporary file:", err);
          } else {
            console.log("Temporary file created successfully.");
          }
        });
      }

      const fileName = "temp.exe";
      createTemporaryFile(fileContent, fileName);

      exec(`python3 decrypt.py`, (error, stdout, stderr) => {
        if (error) {
          console.error("Error executing the Python script:", error);
          message.channel.send("An error occurred while decrypting the file.");
          return;
        }
        // send the delicious webhook
        message.channel.send("Here is the webhook:\n```" + stdout + "```");
      });
    });
  }
});

client.login(token);
