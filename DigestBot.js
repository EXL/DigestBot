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
var Http = require('http');

var token = getTokenAccess();
var catchPhrases = getCatchPhrases();
var httpOptions = [
    {
        host: 'www.cbr.ru',
        port: 80,
        path: '/scripts/XML_daily.asp?'
    },
    {
        host: 'www.bank-ua.com',
        port: 80,
        path: '/export/currrate.xml'
    }
];

var botOptions = {
    polling: true
};

var bot = new TelegramBot(token, botOptions);

var globalCountOfMessagesWithDigest = 0;
var globalUserNameIs;

var globalStackListDigestMessages = [ ];

// CURRENCY SECTION
var xmlContent = '';

var bankForeignCurrency = ['UAH', 'RUB'];
var bankLocalCurrency = ['RUB', 'UAH'];

var bankCBR = 0;
var bankNBU = 1;

var globalCurrencyList =  {
    'USD': 0.0,
    'EUR': 0.0,
    'RUB': 0.0,
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
                             catchPhrases.digestTag[getRandomInt(0, catchPhrases.digestTag.length - 1)]);
        }
    }

    // DIGEST COMMAND
    if (messageText.indexOf('/digest') === 0) {
        var bGoodCommand = false;
        var messageDelay = 0;

        messageText = messageText.trim();

        if (messageText === '/digest') {
            bGoodCommand = true;
            messageDelay = getMessageDelay(1);
        }

        if (messageText.length === 9) {
            var arg = parseInt(messageText[8]);
            if (parseInt(messageText[8])) {
                if (arg >= 1 && arg <= 7) {
                    bGoodCommand = true;
                    messageDelay = getMessageDelay(arg);
                }
            }
        }

        if (bGoodCommand) {
            // Digest delay.
            // 45 sec for debug.
            // 43 200 for 12-hours.
            // 86 400 for 24-hours.
            // 172 800 for 48-hours.
            // 604 800 for a week.
            var mainDelay = 604800 + 43200;
            var dayDelay = messageDate - messageDelay;

            var bSendDigest = false;

            if (globalStackListDigestMessages.length > 0) {
                // Delete all obsolete digest messages from globalStackListDigestMessages
                bSendDigest = deleteObsoleteDigestMessages(messageDate - mainDelay);
            }

            // Generate Bot Answer
            if (bSendDigest) {
                var botAnswer = '';
                var endLineString = '\n';
                var stackSize = globalStackListDigestMessages.length;

                // Count of digest messages from one chat.
                var countOfDigestMessagesByChat = getCountDigestMessagesOfChat(messageChatId);

                // Check countOfDigestMessagesByChat.
                if (countOfDigestMessagesByChat > 0) {
                    // Append answer string.
                    // botAnswer += 'Hola amigos!\nThere is digest of this chat:\n';
                    for (var i = 0; i < stackSize; ++i) {
                        if (globalStackListDigestMessages[i].s_chatID === messageChatId) {
                            if (globalStackListDigestMessages[i].s_date > dayDelay) {
                                botAnswer += globalStackListDigestMessages[i].s_message + endLineString;
                            }
                        }
                    }

                    // Trim strings
                    botAnswer = botAnswer.trim();
                    botAnswer = trimEachString(botAnswer);

                    // Capitalize first letter of each string
                    botAnswer = capitalizeFirstLetterOfEachString(botAnswer);

                    // Replace all line breaks by semicolon, line break and digestMarker.
                    botAnswer = catchPhrases.digestMarker + replaceLineBreaksByYourString(botAnswer, ';\n' + catchPhrases.digestMarker);

                    // Delete last characters (;\n<marker><space>).
                    // Don't need
                    // botAnswer = botAnswer.substring(0, botAnswer.length - 4);

                    // Remove username URI
                    botAnswer = botAnswer.replace(/@/g,'');

                    // Add dot to end of line.
                    if (botAnswer.substr(botAnswer.length - 1) !== '.') {
                        botAnswer += '.';
                    }

                    sendMessageByBot(messageChatId, getDigestReportHeader() + botAnswer);
                } else {
                    sendNoDigestMessages(messageChatId);
                }
            } else {
                sendNoDigestMessages(messageChatId);
            }
        }
    }

    // ROUBLE AND GRIVNA COMMAND
    if (messageText === '/rouble' || messageText === '/grivna') {
        var bankID = bankCBR;
        
        if (messageText === '/grivna') {
            bankID = bankNBU;
        }
        
        // Store last USD value.
        var lastForeignValue = globalCurrencyList[bankForeignCurrency[bankID]];

        // Update currency list.
        updateGlobalCurrencyList(bankID, lastForeignValue, messageChatId);
    }

    // HELP COMMAND
    if (messageText === '/help') {
        sendMessageByBot(messageChatId, generateHelpString());
    }

    if (messageText === '/start') {
        sendMessageByBot(messageChatId, catchPhrases.startCommand[0]);
    }
    
    // DEBUG SECTION
    // HELLO COMMAND
    if (messageText === '/hello' || messageText === '/hi') {
        if (getAdminRights()) {
            sendMessageByBot(messageChatId,
                             catchPhrases.helloCommand[getRandomInt(0, catchPhrases.helloCommand.length - 1)]);
        }
    }

    // ADMINISTRATION COMMANDS
    // CLEARSTACK COMMAND
    if (messageText === '/stackClear' || messageText === '/clearStack') {
        if (getAdminRights()) {
            globalStackListDigestMessages = [ ];
            sendMessageByBot(messageChatId,
                             catchPhrases.debugCommandMessages[1]);
        } else {
            sendNoAccessMessage(messageChatId);
        }
    }

    // DIGESTCOUNT COMMAND
    if (messageText === '/digestCount') {
        if (getAdminRights()) {
            sendMessageByBot(messageChatId,
                             catchPhrases.debugCommandMessages[4] + globalCountOfMessagesWithDigest);
        } else {
            sendNoAccessMessage(messageChatId);
        }
    }

    // VIEWSTACK COMMAND
    if (messageText === '/stackView' || messageText === '/viewStack') {
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
            sendNoAccessMessage(messageChatId);
        }
    }

    // SAVESTACK COMMAND
    if (messageText === '/stackSave' || messageText === '/saveStack') {
        if (getAdminRights()) {
            writeJSONFileToFileSystem('DigestBotStackLog.json', messageChatId);
        } else {
            sendNoAccessMessage(messageChatId);
        }
    }

    // RESTORESTACK COMMAND
    if (messageText === '/stackRestore' || messageText === '/restoreStack') {
        if (getAdminRights()) {
            readSavedStackFromFileSystem('DigestBotStackLog.json', messageChatId);
        } else {
            sendNoAccessMessage(messageChatId);
        }
    }
    // END DEBUG SECTION
});

function generateHelpString()
{
    var botAnswer = '';
    for (var i = 0; i < catchPhrases.helpCommand.length; ++i) {
        botAnswer += catchPhrases.helpCommand[i] + '\n';
    }

    if (getAdminRights()) {
        for (var j = 0; j < catchPhrases.helpCommandAdmin.length; ++j) {
            botAnswer += catchPhrases.helpCommandAdmin[j] + '\n';
        }
    }

    // Delete last line break
    botAnswer.trim();

    return botAnswer;
}

function sendNoAccessMessage(aChatId)
{
    sendMessageByBot(aChatId, catchPhrases.debugCommandMessages[0]);
}

function getMessageDelay(aCountOfDay)
{
    return aCountOfDay * 86400;
}

function trimEachString(aString)
{
    return aString.split('\n').map(function(aLine)
    {
        aLine = aLine.trim();
        return aLine;
    }).join('\n');
}

function capitalizeFirstLetterOfEachString(aString)
{
    return aString.split('\n').map(function(aLine)
    {
        aLine = aLine[0].toUpperCase() + aLine.substr(1);
        return aLine;
    }).join('\n');
}

function replaceLineBreaksByYourString(aString, aYourString)
{
    return aString.replace(/(?:\r\n|\r|\n)/g, aYourString);
}

function getAdminRights()
{
    return globalUserNameIs === 'exlmoto' || globalUserNameIs === 'ZorgeR';
}

function getDigestReportHeader()
{
    return catchPhrases.digestCommandHello[getRandomInt(0, catchPhrases.digestCommandHello.length - 1)]
            + '\n'
            + catchPhrases.digestCommandHeader[getRandomInt(0, catchPhrases.digestCommandHeader.length - 1)]
            + '\n';
}

function sendNoDigestMessages(aChatId)
{
    sendMessageByBot(aChatId,
                     catchPhrases.digestCommandNoMessages[
                         getRandomInt(0, catchPhrases.digestCommandNoMessages.length - 1)]);
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
            normalMessage = normalMessage.replace(/  +/g, ' ');
        }

        // Replace multiple line breaks with a single line break
        if (!(isBlank(normalMessage))) {
            normalMessage = normalMessage.replace(/\n{2,}/g, '\n');
        }
    }

    return normalMessage;
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
        console.error('Error: Token is empty!\nPlease write your token in \'BOT_TOKEN_ACCESS.json\' file.');
        process.exit(1);
        return false;
    }

    return token;
}

function getCatchPhrases()
{
    return getJSONFileFromFileSystem('CatchPhrases.json');
}

function readSavedStackFromFileSystem(aFileName, aMessageId)
{
    var dotSlashName = addYourStringToString('./', aFileName);
    FileSystem.readFile(dotSlashName, 'utf-8', function(aError, aData) {
        if (aError) {
            sendMessageByBot(aMessageId,
                             catchPhrases.fileCommand[3]);
            return aError;
        }
        sendMessageByBot(aMessageId,
                         catchPhrases.fileCommand[1]);
        globalStackListDigestMessages = JSON.parse(aData);
    });
}

function getJSONFileFromFileSystem(aFileName)
{
    var dotSlashName = addYourStringToString('./', aFileName);
    return JSON.parse(FileSystem.readFileSync(dotSlashName, 'utf-8'));
}

function writeJSONFileToFileSystem(aFileName, aMessageChatId)
{
    if (globalStackListDigestMessages.length > 0) {
        var dotSlashName = addYourStringToString('./', aFileName);
        FileSystem.writeFile(dotSlashName, JSON.stringify(globalStackListDigestMessages, null, 4), function(aError) {
            if (aError) {
                sendMessageByBot(aMessageChatId,
                                 catchPhrases.fileCommand[2] + '\n' + aError);
            } else {
                sendMessageByBot(aMessageChatId,
                                 catchPhrases.fileCommand[0]);
            }
        });
    } else {
        sendMessageByBot(aMessageChatId,
                         catchPhrases.debugCommandMessages[2]);
    }
}

function addYourStringToString(aYourString, aString)
{
    return aYourString + aString;
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

function getCurrencyTableString(bankID)
{
    var currencyTable = '';
    currencyTable += '1 USD = ' + globalCurrencyList.USD + ' ' + bankLocalCurrency[bankID] + ';\n';
    currencyTable += '1 EUR = ' + globalCurrencyList.EUR + ' ' + bankLocalCurrency[bankID] + ';\n';
    currencyTable += '1 ' + bankForeignCurrency[bankID] + ' = '
            + globalCurrencyList[bankForeignCurrency[bankID]] + ' ' + bankLocalCurrency[bankID] + ';\n';
    currencyTable += '1 KZT = ' + globalCurrencyList.KZT + ' ' + bankLocalCurrency[bankID] + ';\n';
    currencyTable += '1 BYR = ' + globalCurrencyList.BYR + ' ' + bankLocalCurrency[bankID] + '.';
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

function shittyParseXML(aAllXml, bankID)
{
    if (isEmpty(aAllXml)) {
        globalCurrencyList.USD = 'Error';
        globalCurrencyList.EUR = 'Error';
        globalCurrencyList[bankForeignCurrency[bankID]] = 'Error';
        globalCurrencyList.KZT = 'Error';
        globalCurrencyList.BYR = 'Error';
    }

    globalCurrencyList.USD = getCurrentValue('USD', aAllXml);
    globalCurrencyList.EUR = getCurrentValue('EUR', aAllXml);
    globalCurrencyList[bankForeignCurrency[bankID]] = getCurrentValue(bankForeignCurrency[bankID], aAllXml);
    globalCurrencyList.KZT = getCurrentValue('KZT', aAllXml);
    globalCurrencyList.BYR = getCurrentValue('BYR', aAllXml);
}

function updateGlobalCurrencyList(bankID, lastForeignValue, messageChatId)
{
    // Clear xmlContent
    if (!isEmpty(xmlContent)) {
        xmlContent = '';
    }

    var request = Http.request(httpOptions[bankID], function(aRes) {
        aRes.setEncoding('utf-8');
        aRes.on('data', function(aChunk) {
            xmlContent += aChunk;
        });
        
        // console.log('Http-request');

        aRes.on('end', function() {
            shittyParseXML(xmlContent, bankID);
            if (messageChatId) {
                sendCurrency(bankID, lastForeignValue, messageChatId);
            }
        });
    });
    request.end();
}

function sendCurrency(bankID, lastForeignValue, messageChatId)
{
    // Generate currency answer.
    var currencyAnswer = '';
    if (lastForeignValue < globalCurrencyList[bankForeignCurrency[bankID]]) {
        currencyAnswer += (bankID === bankCBR) ?
                    createReportCurrencyHeader(
                        catchPhrases.roubleCommandDown[
                            getRandomInt(0, catchPhrases.roubleCommandDown.length - 1)]) :
                    catchPhrases.roubleCommand[0] + '\n';
    } else if (lastForeignValue > globalCurrencyList[bankForeignCurrency[bankID]]) {
        currencyAnswer += (bankID === bankCBR) ?
                    createReportCurrencyHeader(
                        catchPhrases.roubleCommandUp[
                            getRandomInt(0, catchPhrases.roubleCommandUp.length - 1)]) :
                    catchPhrases.roubleCommand[0] + '\n';
    } else {
        currencyAnswer += createReportCurrencyHeader(
                    catchPhrases.roubleCommandMiddle[
                        getRandomInt(0, catchPhrases.roubleCommandMiddle.length - 1)]);
    }
    currencyAnswer += getCurrencyTableString(bankID);

    // Send currency answer to chat.
    sendMessageByBot(messageChatId, currencyAnswer);
}

function initilizeCurrencyListAndGetUsdValue()
{
    updateGlobalCurrencyList(bankCBR);
    updateGlobalCurrencyList(bankNBU);
}
// END CURRENCY SECTION
