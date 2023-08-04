const { Client, Events, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');
const { exec } = require('child_process');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, b => {
	console.log(`Ready! Logged in as ${b.user.tag}`);
});

client.on(Events.TypingStart, typing => console.log(`${typing.user.tag} started typing in #${typing.channel.name}`));

const fs = require('fs')
client.on('message', async (message) => {
  if (message.content.startsWith('!decrypt')) {
    const args = message.content.split(' ');
    if (args.length !== 2) {
      message.channel.send('Usage: !decrypt [filename]');
      return;
    }
    const filename = args[1];

    

    


    // Read the file content
    fs.readFile(filename, 'utf8', (err, fileContent) => {
      if (err) {
        console.error('Error reading the file:', err);
        message.channel.send('An error occurred while reading the file.');
        return;
      }

      function sendDataToPython(data) {
      const command = `python varconvert.py "${data}"`;
    
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error: ${error.message}`);
          return;
        }
        console.log(`Python script output: ${stdout}`);
      });
    }
fileContent = "test"

    sendDataToPython(fileContent)

      exec(`echo "${fileContent}" | python3 decrypt.py`, (error, stdout, stderr) => {
        if (error) {
          console.error('Error executing the Python script:', error);
          message.channel.send('An error occurred while decrypting the file.');
          return;
        }
        // Send the output of the python script.
        message.channel.send('Here is the webhook:\n```' + stdout + '```');
      });
    });
  }
});



client.login(token);