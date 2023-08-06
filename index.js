const { Client, Events, GatewayIntentBits } = require("discord.js");
const { token } = require("./config.json");
const { exec } = require("child_process"); // Corrected the import for child_process
const fs = require("fs");
const fetch = require("node-fetch");
const { MessageAttachment } = require("discord.js");

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
      message.channel.send("Usage: !decrypt [attach the file]");
      return;
    }

    // make sure the attachment exists
    const attachment = message.attachments.first();
    if (!attachment) {
      message.channel.send("No attachments found.");
      return;
    }

    const attachmentURL = attachment.url;
    // Get the downloaded file name (for deletion later on)
    const fileName = attachment.name;

    try {
      // download the file from the url
      const response = await fetch(attachmentURL);

      // create a write stream to save the file
      const fileStream = fs.createWriteStream(fileName);

      // Pipe the response body (stream) to the file stream
      response.body.pipe(fileStream);

      // make sure the file actually finished downloading fine
      fileStream.on("finish", () => {
        console.log("File saved successfully.");
        fs.readFile(fileName, "utf8", (err, fileContent) => {
          if (err) {
            console.error("Error reading the file:", err);
            message.channel.send("An error occurred while reading the file.");
            return;
          }

          // this will be used to save the file name in a temp file so the python script knows what file to delete
          function createTemporaryFile(tempFileName, fileName) {
            fs.writeFile(fileName, fileContent, (err) => {
              if (err) {
                console.error("Error creating temporary file:", err);
              } else {
                console.log("Temporary file created successfully.");
              }
            });
          }
          tempFileName = "deletelater.txt"
          // create the actual file for deletion
          createTemporaryFile(tempFileName, fileName)
          // process the file content here (make sure it works. might be deleted later)
          console.log("File content:", fileContent);

          // execute the Python script
          exec(`python3 decrypt.py`, (error, stdout, stderr) => {
            if (error) {
              console.error("Error executing the Python script:", error);
              message.channel.send("An error occurred while extracting the webhook.");
              return;
            }
            // send the succulent webhook
            // filter it tho
            const regexPattern = /https?:\/\/(canary|ptb|www)?\.?discord(app)?\.com\/api\/webhooks\/(\d+)\/([\w-]+)/g; // i actually want to kill myself
            const matches = stdout.match(regexPattern);

            // send the filtered message :godwhy:
            if (matches && matches.length > 0) {
              const resultMessage = "Here is the webhook:\n```" + matches.join("\n") + "```";
              message.channel.send(resultMessage);
            } else {
              message.channel.send("No webhook found.");
            }
          });
        });
      });

      // something wrong on file write? it'll be here.
      fileStream.on("error", (err) => {
        console.error("Error saving the file:", err);
        message.channel.send("An error occurred while saving the file.");
      });
    } catch (error) {
      console.error("Error downloading the file:", error);
      message.channel.send("An error occurred while downloading the file.");
    }
  }
});

client.login(token);
