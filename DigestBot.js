var TelegramBot = require('node-telegram-bot-api');
var FileSystem = require("fs");

var token = getTokenAccess();

var botOptions = {
    polling: true
};

var bot = new TelegramBot(token, botOptions);

var globalCountOfMessagesWithDigest = 0;
var globalUserNameIs;

var globalStackListDigestMessages = [ ];

bot.getMe().then(function (me) {
    console.log('Hello! My name is %s!', me.first_name);
    console.log('My id is %s.', me.id);
    console.log('And my username is @%s.', me.username);
});

bot.on('text', function(msg) {
    // Set main variables
    var messageChatId = msg.chat.id;
    var messageText = msg.text;
    var messageDate = msg.date;
    globalUserNameIs = msg.from.username;

    // DEBUG SECTION
    console.log(msg);
    // END DEBUG SECTION

    if (messageText.indexOf('#digest') >= 0) {
        globalCountOfMessagesWithDigest++;
        console.log('Message before normalization:' + messageText)
        var normalMessage = normalizeMessage(messageText);
        console.log('Message after normalization:' + normalMessage)
        if (!(isBlank(normalMessage))) {
            var messageInfoStruct = {
                's_chatID': messageChatId,
                's_date': messageDate,
                's_message': messageText,
                's_username': globalUserNameIs
            };

            globalStackListDigestMessages.push(messageInfoStruct);

            // TODO: sending message by bot
        }
    }

    console.log("Stack view")
    console.log(globalStackListDigestMessages)

    //    if (msg.text === '/digest' || msg.text === '/Digest') {
    //        console.log('Digest command received, sending digest stack...');
    //        bot.sendMessage(messageChatId,
    //                        getCountOfMessageWithDigest(),
    //                        { caption: "I'm a bot!" });
    //    }

    //    console.log(globalCountOfMessagesWithDigest);
});

function normalizeMessage(aMessage) {
    var normalMessage = "";

    if (!isEmpty(aMessage)) {
        // Delete #digest tag from message
        normalMessage = aMessage.replace('#digest', '');

        // Ttrim all trailing spaces
        if (!(isBlank(normalMessage))) {
            normalMessage = normalMessage.trim();
        }

        // Capitalize the first letter of message
        if (!(isBlank(normalMessage))) {
            normalMessage = capitalizeFirstLetterOfString(normalMessage);
        }
    }
    return normalMessage;
}

function capitalizeFirstLetterOfString(aString) {
    return aString.charAt(0).toUpperCase() + aString.slice(1);
}

function isEmpty(aString) {
    return (!str || 0 === str.length);
}

function isBlank(aString) {
    return (!aString || /^\s*$/.test(aString));
}

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
    return 'Count of digest messages is ' + globalCountOfMessagesWithDigest;
}
