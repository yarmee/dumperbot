/* eslint-disable no-unused-vars */
import { Client, Events, GatewayIntentBits } from "discord.js";
import { spawn } from "child_process";
import fs from "fs";
import fetch from "node-fetch";
import { v4 as uuidv4 } from 'uuid';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages] });

client.once(Events.ClientReady, (b) => {
  console.log(`Ready! Logged in as ${b.user.tag}`);
});

client.on(Events.TypingStart, (event) => {
  console.log(`${event.user.tag} started typing in #${event.channel.name}`);
});

client.on("messageCreate", async (message) => {
  if (message.content.startsWith('!decrypt')) {
    const requestId = uuidv4();
    console.log('I can see the message');

    const attachment = message.attachments.first();
    if (!attachment) {
      message.reply('No attachments found.');
      return;
    }

    const attachmentURL = attachment.url;
    const fileName = attachment.name;
   
    if (!attachment) {
      message.reply('No attachments found.');
      return;
    }

    try {
        
      // Download the file from the URL
      const response = await fetch(attachmentURL);

      const fileBuffer = await response.arrayBuffer();

      // Save the file temporarily
      const tempFilePath = `./temp/${requestId}_${fileName}`;
      await fs.promises.writeFile(tempFilePath, fileBuffer);

      // Rename the temporary file to grabber.exe
      const renamedFilePath = `./temp/grabber.exe`;
      await fs.rename(tempFilePath, renamedFilePath);

      // Run the decrypt.py script
      const decryptProcess = spawn('python3', ['./temp/decrypt.py']);

      decryptProcess.stdout.on('data', (data) => {
        const output = data.toString();
        
        // Define a regex pattern to match the webhook link.
        const webhookPattern = /https?:\/\/(canary|ptb|www)?\.?discord(app)?\.com\/api\/webhooks\/(\d+)\/([\w-]+)/g;
        const webhookMatch = output.match(webhookPattern);
        
        if (webhookMatch) {
          const webhookURL = webhookMatch[1];
          console.log(`Sent: ${webhookURL}`);
          message.channel.send(`Webhook URL: ${webhookURL}`)
        }
        if (!webhookMatch) {
          message.channel.send('A webhook wasn\'t found in this file')
        }
      });

      decryptProcess.stderr.on('data', (data) => {
        console.error(`decrypt.py error: ${data}`);
        // Handle errors if needed
      });

      decryptProcess.on('close', (code) => {
        console.log(`decrypt.py process exited with code ${code}`);
        // Clean up by deleting the temporary file
        fs.unlink(renamedFilePath)
          .then(() => console.log(`Temporary file ${renamedFilePath} deleted.`))
          .catch((error) => console.error(`Error deleting file: ${error}`));
      });

      message.reply('File decryption process initiated.');
    } catch (error) {
      console.error('Error:', error);
      message.reply('An error occurred while processing the file.');
    }
  }
});
client.login("your-bot-token-here");
