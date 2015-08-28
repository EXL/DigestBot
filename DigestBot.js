var TelegramBot = require('node-telegram-bot-api');
var FileSystem = require('fs');

var token = getTokenAccess();

var botOptions = {
    polling: true
};

var bot = new TelegramBot(token, botOptions);

var globalCountOfMessagesWithDigest = 0;
var globalUserNameIs;

var globalStackListDigestMessages = [ ];

bot.getMe().then(function (me)
{
    console.log('Hello! My name is %s!', me.first_name);
    console.log('My id is %s.', me.id);
    console.log('And my username is @%s.', me.username);
});

bot.on('text', function(msg)
{
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
        var normalMessage = normalizeMessage(messageText);
        if (!(isBlank(normalMessage))) {
            var messageInfoStruct = {
                's_chatID': messageChatId,
                's_date': messageDate,
                's_message': normalMessage,
                's_username': globalUserNameIs
            };

            globalStackListDigestMessages.push(messageInfoStruct);

            // TODO: sending message by bot
        }
    }

    if (messageText === '/digest' || messageText === '/Digest') {
        var bSendDigest = false;

        // TODO: Delay table here
        // 30 sec for DEBUG
        var hourDelay = 30;
console.log(1)
        if (globalStackListDigestMessages.length > 0) {
            // Delete all obsolete digest messages from globalStackListDigestMessages
            bSendDigest = deleteObsoleteDigestMessages(messageDate - hourDelay);
        }
console.log(2)
        // Generate Bot Answer
        if (bSendDigest) {
            var botAnswer = '';
            var endLineString = ';\n';
            var stackSize = globalStackListDigestMessages.length;
console.log(3)
            // Count of digest messages from one chat.
            var countOfDigestMessagesByChat = getCountDigestMessagesOfChat(messageChatId);
console.log(4)
            // Append answer string.
            botAnswer += 'Hola amigos!\nThere is 24-hour digest of this chat:\n';
            for (var i = 0; i < stackSize; ++i) {
                if (globalStackListDigestMessages[i].s_chatID === messageChatId) {
                    botAnswer += globalStackListDigestMessages[i].s_message + endLineString;
                }
            }
console.log(5)
            // Delete last new line and semicolon characters (;\n).
            botAnswer = botAnswer.substring(0, botAnswer.length - 2);
console.log(6)
            // Add dot to end of line.
            botAnswer += '.';
console.log(7)
            // Check countOfDigestMessagesByChat
            if (countOfDigestMessagesByChat > 0) {
                // TODO: send botAnswer
                console.log('BOT ANSWER: ' + botAnswer);
            } else {
                console.log('NO MESSAGES');
            }
        } else {
            console.log('NO MESSAGES');
        }
    }

    console.log('Stack view')
    console.log(globalStackListDigestMessages)

    //    if (msg.text === '/digest' || msg.text === '/Digest') {
    //        console.log('Digest command received, sending digest stack...');
    //        bot.sendMessage(messageChatId,
    //                        getCountOfMessageWithDigest(),
    //                        { caption: "I'm a bot!" });
    //    }

    // TODO: /stackCount command
    //    console.log(globalCountOfMessagesWithDigest);
});

function getCountDigestMessagesOfChat(aChatId) {
    var stackSize = globalStackListDigestMessages.length;
    var countOfMessages = 0;
    for (var i = 0; i < stackSize; ++i) {
        if (globalStackListDigestMessages[i].s_chatID === aChatId) {
            countOfMessages++;
        }
    }
    return countOfMessages;
}

function deleteObsoleteDigestMessages(aObsoleteDate)
{
    var stackSize = globalStackListDigestMessages.length;

    var position = 0;
    for (var i = 0; i < stackSize; ++i) {
        if (globalStackListDigestMessages[i].s_date < aObsoleteDate) {
            position++;
        }
    }

    // All stack digest messages are obsolete.
    // Drop stack.
    if (position == stackSize) {
        globalStackListDigestMessages = [ ];
        return false;
    }

    // All stack digest messages are relevant.
    // Print them.
    if (position == 0) {
        return true;
    }

    // Replace current digest stack by sliced.
    globalStackListDigestMessages = globalStackListDigestMessages.slice(position);

    // Return true if stack not empty
    return stackSize > 0;
}

function normalizeMessage(aMessage)
{
    var normalMessage = '';

    if (!isEmpty(aMessage)) {
        // Delete #digest tag from message
        normalMessage = aMessage.replace('#digest', '');

        // Ttrim all trailing spaces
        if (!(isBlank(normalMessage))) {
            normalMessage = normalMessage.trim();
        }

        // Replace multiple spaces with a single space
        if (!(isBlank(normalMessage))) {
            normalMessage = normalMessage.replace(/\s\s+/g, ' ');
        }

        // Capitalize the first letter of message
        if (!(isBlank(normalMessage))) {
            normalMessage = capitalizeFirstLetterOfString(normalMessage);
        }
    }
    return normalMessage;
}

function capitalizeFirstLetterOfString(aString)
{
    return aString.charAt(0).toUpperCase() + aString.slice(1);
}

function isEmpty(aString)
{
    return (!aString || 0 === aString.length);
}

function isBlank(aString)
{
    return (!aString || /^\s*$/.test(aString));
}

function getTokenAccess()
{
    var parsedJsonFromFile = getJSONFileFromFileSystem('BOT_TOKEN_ACCESS.json');
    var token = parsedJsonFromFile.botTokenAccess;

    if (token === 'PLEASE_WRITE_YOU_TOKEN_HERE') {
        console.error('Error: Token is empty!\nPlease write your token in \'BOT_TOKEN_ACCESS.json\' file.')
        process.exit(1);
        return false;
    }

    return token;
}

function getJSONFileFromFileSystem(aFileName)
{
    var dotSlashName = './' + aFileName
    return JSON.parse(FileSystem.readFileSync(dotSlashName, 'utf-8'));
}

function getCountOfMessageWithDigest()
{
    return 'Count of digest messages is ' + globalCountOfMessagesWithDigest;
}
