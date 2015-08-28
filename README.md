Digest Bot
=============

![Bot Screen](https://raw.github.com/EXL/DigestBot/master/Screens/DigestBot.png)

Telegram digest bot for group chats.
Bot records all messages with the #digest tag and displays them on the /digest command.
Thanks to the creators of node-telegram-bot-api and the creators of powerful and awesome JavaScript framework — Node.js.

## Install instructions

For example, GNU/Linux:

1. Install the "Node.js" and Node.js package manager, the "npm";

```sh
sudo apt-get install nodejs
sudo apt-get install npm
```

2. Clone repository into deploy directory;

```sh
cd ~/Deploy/
git clone https://github.com/EXL/DigestBot DigestBotDeploy
```

3. Install "node-telegram-bot-api" module into deploy directory;

```sh
cd ~/Deploy/DigestBotDeploy/
npm install node-telegram-bot-api
```

4. Write your token in "BOT_TOKEN_ACCESS.json" file.

5. Run and enjoy!

```sh
nodejs DigestBot
```
