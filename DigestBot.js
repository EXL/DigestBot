/************************************************************************************
** The MIT License (MIT)
**
** Copyright (c) 2015 Serg "EXL" Koles
**
** Permission is hereby granted, free of charge, to any person obtaining a copy
** of this software and associated documentation files (the "Software"), to deal
** in the Software without restriction, including without limitation the rights
** to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
** copies of the Software, and to permit persons to whom the Software is
** furnished to do so, subject to the following conditions:
**
** The above copyright notice and this permission notice shall be included in all
** copies or substantial portions of the Software.
**
** THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
** IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
** FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
** AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
** LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
** OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
** SOFTWARE.
************************************************************************************/

var TelegramBot = require('node-telegram-bot-api');
var FileSystem = require('fs');
var Http = require("http");

var token = getTokenAccess();
var catchPhrases = getCatchPhrases();

var httpOptions = {
    host: "www.cbr.ru",
    port: 80,
    path: "/scripts/XML_daily.asp?"
};

var botOptions = {
    polling: true
};

var bot = new TelegramBot(token, botOptions);

var globalCountOfMessagesWithDigest = 0;
var globalUserNameIs;

var globalStackListDigestMessages = [ ];

// CURRENCY SECTION
var xmlContent = "";
var globalUsdCurrencyValue = 0.0;
var globalCurrencyList = {
    'USD': 0.0,
    'EUR': 0.0,
    'UAH': 0.0,
    'KZT': 0.0,
    'BYR': 0.0
};
initilizeCurrencyListAndGetUsdValue();
// END CURRENCY SECTION

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

    // ROUBLE COMMAND
    if (messageText === '/rouble') {
        // Store last USD value.
        var lastUsdValue = globalUsdCurrencyValue;

        // Update currency list.
        updateGlobalCurrencyList();

        // Generate answer.
        var currencyAnswer = '';
        if (lastUsdValue < globalUsdCurrencyValue) {
            currencyAnswer = createReportCurrencyHeader(catchPhrases.roubleCommandDown[getRandomInt(0, 4)]);
        } else if (lastUsdValue > globalUsdCurrencyValue) {
            currencyAnswer = createReportCurrencyHeader(catchPhrases.roubleCommandUp[getRandomInt(0, 4)]);
        } else {
            currencyAnswer = createReportCurrencyHeader(catchPhrases.roubleCommandMiddle[getRandomInt(0, 2)]);
        }
        currencyAnswer += getCurrencyTableString();

        // Send currency to chat
        sendMessageByBot(messageChatId, currencyAnswer);
    }

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

// CURRENCY SECTION
function createReportCurrencyHeader(aCatchPhrase)
{
    return aCatchPhrase + '\n' + catchPhrases.roubleCommand[0] + '\n';
}

function getCurrencyTableString()
{
    var currencyTable = '';
    currencyTable += '1 USD = ' + globalCurrencyList.USD + ' RUB;\n';
    currencyTable += '1 EUR = ' + globalCurrencyList.EUR + ' RUB;\n';
    currencyTable += '1 UAH = ' + globalCurrencyList.UAH + ' RUB;\n';
    currencyTable += '1 KZT = ' + globalCurrencyList.KZT + ' RUB;\n';
    currencyTable += '1 BYR = ' + globalCurrencyList.BYR + ' RUB.';
    return currencyTable;
}

function removeTags(aString)
{
    return aString.replace(/(<([^>]+)>)/ig, '');
}

function getLineFromXml(aStart, aString)
{
    var textSize = aString.length;
    var targetString = '';
    for (var i = aStart; i < textSize; ++i) {
        if (aString[i] === '\n') {
            break;
        }
        targetString += aString[i];
    }

    return removeTags(targetString.trim());
}

function getStringBelow(aStart, aBelow, aString)
{
    var textSize = aString.length;
    var countOfLineEndings = 0;
    var getLineWith = 0;

    for (var i = aStart; i < textSize; ++i) {
        if (countOfLineEndings === aBelow) {
            getLineWith = i;
            break;
        }
        if (aString[i] === '\n') {
            countOfLineEndings++;
        }
    }

    return getLineFromXml(getLineWith, aString);
}

function replaceCommasByDots(aString)
{
    return aString.replace(',', '.');
}

function getCurrentValue(aCurrency, aString)
{
    var nominal = parseFloat(replaceCommasByDots(getStringBelow(aString.indexOf(aCurrency), 1, aString)));
    var value = parseFloat(replaceCommasByDots(getStringBelow(aString.indexOf(aCurrency), 3, aString)));

    return (value / nominal).toFixed(4);
}

function shittyParseXML(aAllXml)
{
    if (isEmpty(aAllXml)) {
        globalCurrencyList.USD = 'Error';
        globalCurrencyList.EUR = 'Error';
        globalCurrencyList.UAH = 'Error';
        globalCurrencyList.KZT = 'Error';
        globalCurrencyList.BYR = 'Error';
    }

    globalCurrencyList.USD = getCurrentValue('USD', aAllXml);
    globalCurrencyList.EUR = getCurrentValue('EUR', aAllXml);
    globalCurrencyList.UAH = getCurrentValue('UAH', aAllXml);
    globalCurrencyList.KZT = getCurrentValue('KZT', aAllXml);
    globalCurrencyList.BYR = getCurrentValue('BYR', aAllXml);

    globalUsdCurrencyValue = globalCurrencyList.USD;
}

function updateGlobalCurrencyList()
{
    var request = Http.request(httpOptions, function(aRes) {
        aRes.setEncoding("utf8");
        aRes.on("data", function(aChunk) {
            xmlContent += aChunk;
        });

        console.log('Req');

        aRes.on("end", function() {
            shittyParseXML(xmlContent);
        });
    });
    request.end();
}

function initilizeCurrencyListAndGetUsdValue()
{
    updateGlobalCurrencyList();
}
// END CURRENCY SECTION
