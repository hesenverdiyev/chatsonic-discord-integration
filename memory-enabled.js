import dotenv from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";
import fetch from "node-fetch";
import TurndownService from 'turndown';

const customTurndownRule = {
  filter: 'a',
  replacement: (content, node) => {
    const href = node.getAttribute('href');
    return href ? `<${href}>` : content;
  },
};

const turndownService = new TurndownService();
turndownService.addRule('link', customTurndownRule);

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let history_data = []; // Create an empty array to store history data

const sendAPIRequest = (message) => {
  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'X-API-KEY': process.env.CHATSONIC_API_KEY
    },
    body: JSON.stringify({
      enable_google_results: 'true',
      enable_memory: true,
      input_text: message.content,
      history_data: history_data // Include the history_data array in the request body
    })
  };

  const url = 'https://api.writesonic.com/v2/business/content/chatsonic?engine=premium&language=en';

  fetch(url, options)
    .then(response => response.json())
    .then(response => {
      const content = response.message;
      const markdown = turndownService.turndown(content);

      // Add the sent message to the history_data array
      history_data.push({
        is_sent: true,
        message: message.content,
      });

      // Add the markdown to the history_data array
      history_data.push({
        is_sent: false,
        message: markdown,
      });

      // Check if the message was sent in the specific channel
      if (message.channel.id !== specificChannelID) return;

      // Reply to the message with the generated markdown
      message.reply(markdown);
    })
    .catch(err => console.error(err));
};

const specificChannelID = process.env.BOT_CHANNEL_ID; // The ID of the specific channel

client.on("messageCreate", async function (message) {
  if (message.author.bot) return;

  // Check if the message was sent in the specific channel
  if (message.channel.id !== specificChannelID) return;

  sendAPIRequest(message); // Call the function to handle the API request
});

client.login(process.env.BOT_TOKEN);