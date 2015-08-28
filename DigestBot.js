var TelegramBot = require('node-telegram-bot-api');
var FileSystem = require('fs');

var token = getTokenAccess();
var catchPhrases = getCatchPhrases();

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
    // console.log(msg);
    // END DEBUG SECTION

    // DIGEST TAG
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

            // Send message by bot.
            sendMessageByBot(messageChatId,
                             catchPhrases.digestTag[getRandomInt(0, 5)]);
        }
    }

    // DIGEST COMMAND
    if (messageText === '/digest' || messageText === '/Digest') {
        // Digest delay.
        // 45 sec for debug.
        // 43 200 for 12-hours.
        // 86 400 for 24-hours.
        // 172 800 for 48-hours.
        var hourDelay = 86400;

        var bSendDigest = false;

        if (globalStackListDigestMessages.length > 0) {
            // Delete all obsolete digest messages from globalStackListDigestMessages
            bSendDigest = deleteObsoleteDigestMessages(messageDate - hourDelay);
        }

        // Generate Bot Answer
        if (bSendDigest) {
            var botAnswer = '';
            var endLineString = ';\n';
            var stackSize = globalStackListDigestMessages.length;

            // Count of digest messages from one chat.
            var countOfDigestMessagesByChat = getCountDigestMessagesOfChat(messageChatId);

            // Append answer string.
            // botAnswer += 'Hola amigos!\nThere is 24-hour digest of this chat:\n';
            for (var i = 0; i < stackSize; ++i) {
                if (globalStackListDigestMessages[i].s_chatID === messageChatId) {
                    botAnswer += catchPhrases.digestMarker + globalStackListDigestMessages[i].s_message + endLineString;
                }
            }

            // Delete last new line and semicolon characters (;\n).
            botAnswer = botAnswer.substring(0, botAnswer.length - 2);

            // Add dot to end of line.
            if (botAnswer.substr(botAnswer.length - 1) !== '.') {
                botAnswer += '.';
            }

            // Check countOfDigestMessagesByChat.
            if (countOfDigestMessagesByChat > 0) {
                // Send botAnswer to chat with catchPhrases chunks.
                sendMessageByBot(messageChatId, getDigestReportHeader() + botAnswer);
            } else {
                sendNoDigestMessages(messageChatId);
            }
        } else {
            sendNoDigestMessages(messageChatId);
        }
    }

    console.log('Stack view')
    console.log(globalStackListDigestMessages)

    // DEBUG SECTION
    // CLEARSTACK COMMAND
    if (messageText === '/stackClear') {
        if (getAdminRights()) {
            globalStackListDigestMessages = [ ];
            sendMessageByBot(messageChatId,
                             catchPhrases.debugCommandMessages[1]);
        } else {
            sendMessageByBot(messageChatId,
                             catchPhrases.debugCommandMessages[0]);
        }
    }

    // HELLO COMMAND
    if (messageText === '/hello') {
        if (getAdminRights()) {
            sendMessageByBot(messageChatId,
                             catchPhrases.helloCommand[getRandomInt(0, 5)]);
        }
    }

    // DIGESTCOUNT COMMAND
    if (messageText === '/digestCount') {
        if (getAdminRights()) {
            sendMessageByBot(messageChatId,
                             catchPhrases.debugCommandMessages[4] + globalCountOfMessagesWithDigest);
        }
    }

    // STACK COMMAND
    if (messageText === '/stack') {
        if (getAdminRights()) {
            var stack = '\n';
            var sizeOfStack = globalStackListDigestMessages.length;
            if (sizeOfStack > 0) {
                for (var j = 0; j < sizeOfStack; ++j) {
                    stack += globalStackListDigestMessages[j].s_chatID + ' ';
                    stack += globalStackListDigestMessages[j].s_username + ' ';
                    stack += globalStackListDigestMessages[j].s_date + ' ';
                    stack += globalStackListDigestMessages[j].s_message + '\n';
                }
                sendMessageByBot(messageChatId,
                                 catchPhrases.debugCommandMessages[3] + stack);
            } else {
                sendMessageByBot(messageChatId,
                                 catchPhrases.debugCommandMessages[2]);
            }
        } else {
            sendMessageByBot(messageChatId,
                             catchPhrases.debugCommandMessages[0]);
        }
    }
    // END DEBUG SECTION
});

function getAdminRights()
{
    return globalUserNameIs === 'exlmoto';
}

function getDigestReportHeader()
{
    return catchPhrases.digestCommandHello[getRandomInt(0, 5)]
            + '\n'
            + catchPhrases.digestCommandHeader[getRandomInt(0, 5)]
            + '\n';
}

function sendNoDigestMessages(aChatId)
{
    sendMessageByBot(aChatId, catchPhrases.digestCommandNoMessages[getRandomInt(0, 5)]);
}

function sendMessageByBot(aChatId, aMessage)
{
    // Replace '%username%' by userName.
    var readyMessage = aMessage.replace('%username%', '@' + globalUserNameIs);
    bot.sendMessage(aChatId, readyMessage, { caption: 'I\'m a cute bot!' });
}

function getRandomInt(aMin, aMax)
{
    return Math.floor(Math.random() * (aMax - aMin + 1)) + aMin;
}

function getCountDigestMessagesOfChat(aChatId)
{
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

        // Delete %username% variable
        if (!(isBlank(normalMessage))) {
            normalMessage = normalMessage.replace('%username%', '');
        }

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

function getCatchPhrases()
{
    return getJSONFileFromFileSystem('CatchPhrases.json');
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
