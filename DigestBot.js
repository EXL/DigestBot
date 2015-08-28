var TelegramBot = require('node-telegram-bot-api');
var FileSystem = require("fs");

var token = getTokenAccess();

var botOptions = {
    polling: true
};

var bot = new TelegramBot(token, botOptions);

var countOfMessageWithDigest = 0;

bot.getMe().then(function (me) {
    console.log('Hello! My name is %s!', me.first_name);
    console.log('My id is %s.', me.id)
    console.log('And my username is @%s.', me.username);
});

bot.on('text', function(msg) {
    var chatId = msg.chat.id

    console.log(msg);
    console.log(msg.text);
    console.log(msg.text.indexOf('#digest'))

    if (msg.text.indexOf('#digest') !== -1) {
        console.log('Get message with #digest tag, save to stack');
        countOfMessageWithDigest++;
    }

    if (msg.text === '/digest' || msg.text === '/Digest') {
        console.log('Digest command received, sending digest stack...');
        bot.sendMessage(chatId,
                        getCountOfMessageWithDigest(),
                        { caption: "I'm a bot!" });
    }

    console.log(countOfMessageWithDigest);
});

function getTokenAccess() {
    var parsedJsonFromFile = getJSONFileFromFileSystem('BOT_TOKEN_ACCESS.json');
    var token = parsedJsonFromFile.botTokenAccess;

    if (token === 'PLEASE_WRITE_YOU_TOKEN_HERE') {
        console.error('Error: Token is empty!\nPlease write your token in \'BOT_TOKEN_ACCESS.json\' file.')
        process.exit(1);
        return false;
    }

    return token;
}

function getJSONFileFromFileSystem(aFileName) {
    var dotSlashName = './' + aFileName
    return JSON.parse(FileSystem.readFileSync(dotSlashName, 'utf-8'));
}

function getCountOfMessageWithDigest() {
    return 'Count of digest messages is ' + countOfMessageWithDigest;
}
