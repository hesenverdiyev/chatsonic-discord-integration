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

client.on("messageCreate", async function (message) {
  if (message.author.bot) return;

  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'X-API-KEY': process.env.CHATSONIC_API_KEY
    },
    body: JSON.stringify({
      enable_google_results: 'true',
      enable_memory: false,
      input_text: message.content
    })
  };

  const url = 'https://api.writesonic.com/v2/business/content/chatsonic?engine=premium&language=en';

  fetch(url, options)
    .then(response => response.json())
    .then(response => {
      const content = response.message;
      const markdown = turndownService.turndown(content);
      if (message.channel.id === process.env.BOT_CHANNEL_ID) {
        return message.reply(markdown);
      }
    })
    .catch(err => console.error(err));
});

client.login(process.env.BOT_TOKEN);
