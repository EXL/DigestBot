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

// Set current dir as working dir for script
process.chdir(__dirname);

// Requires
var TelegramBot = require('node-telegram-bot-api');
var FileSystem = require('fs');
var Http = require('http');
var Request = require('request');
var Exec = require('child_process').exec;

// Globals
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
    },
    {
        host: 'nbrb.by',
        port: 80,
        path: '/Services/XmlExRates.aspx'
    }
];
var httpMetallOptions = {
    host: 'www.cbr.ru',
    port: 80,
    path: '/hd_base/?PrtId=metall_base_new'
};

var botOptions = {
    polling: true
};

var bot = new TelegramBot(token, botOptions);

var globalCountOfMessagesWithDigest = 0;
var globalUserNameIs;
var globalBotUserName;
var globalMessageIdForReply;

var globalStackListDigestMessages = [ ];

var globalCofeeSticker = 'https://api.z-lab.me/stickers/cofe.webp';
var gameStatURL = 'https://api.z-lab.me/img/lgsl/servers_stats.png';

var globalJsonStackName = 'DigestBotStackLog.json';

readSavedStackFromFileSystem(globalJsonStackName, 0, true);

// ----- CURRENCY SECTION
var xmlContent = '';

var bankLocalCurrency = ['RUB', 'UAH', 'BYN'];

var bankCBR = 0;
var bankNBU = 1;
var bankNBRB = 2;

var globalUSD = [0.0, 0.0];
var globalCurrencyList =  {
    'USD': 0.0,
    'EUR': 0.0,
    'RUB': 0.0,
    'UAH': 0.0,
    'KZT': 0.0,
    'BYN': 0.0,
    'GBP': 0.0
};

initilizeCurrencyListAndGetUsdValue();

var globalExchangeList = {
    'mmvb': {
        desc: 'MMVB (MOEX) Index.',
        url: 'http://api.z-lab.me/charts/mmvb.png'
    },
    'usd_rub': {
        desc: 'USD/RUB from Nasdaq, Nyse.',
        url: 'http://api.z-lab.me/charts/usd_rub.png'
    },
    'usd_uah': {
        desc: 'USD/UAH from Nasdaq, Nyse.',
        url: 'http://api.z-lab.me/charts/usd_uah.png'
    },
    'eur_rub': {
        desc: 'EUR/RUB from Nasdaq, Nyse.',
        url: 'http://api.z-lab.me/charts/eur_rub.png'
    },
    'eur_uah': {
        desc: 'EUR/UAH from Nasdaq, Nyse.',
        url: 'http://api.z-lab.me/charts/eur_uah.png'
    },
    'gold': {
        desc: 'Gold from Nasdaq.',
        url: 'http://api.z-lab.me/charts/gold.png'
    },
    'palladium': {
        desc: 'Palladium from Nasdaq.',
        url: 'http://api.z-lab.me/charts/palladium.png'
    },
    'platinum': {
        desc: 'Platinum from Nasdaq.',
        url: 'http://api.z-lab.me/charts/platinum.png'
    },
    'rhodium': {
        desc: 'Rhodium from Nasdaq.',
        url: 'http://api.z-lab.me/charts/rhodium.png'
    },
    'silver': {
        desc: 'Silver from Nasdaq.',
        url: 'http://api.z-lab.me/charts/silver.png'
    },
    'rts': {
        desc: 'RTS Index from MMVB (MOEX).',
        url: 'http://api.z-lab.me/charts/rts.png'
    },
    'btc_usd': {
        desc: 'BTC/USD from BTC-E.',
        url: 'http://api.z-lab.me/btce/btc_usd.php'
    },
    'btc_rub': {
        desc: 'BTC/RUB from BTC-E.',
        url: 'http://api.z-lab.me/btce/btc_rur.php'
    },
    'forex': {
        desc: 'USD/RUB from Forex.',
        url: 'http://j1.forexpf.ru/delta/prochart?type=USDRUB&amount=335&chart_height=170&chart_width=330&grtype=2&tictype=0&iId=5'
    },
    'brent': {
        desc: 'Brent from Nasdaq, Nyse.',
        url: 'http://api.z-lab.me/charts/brent.png'
    },
    'wti': {
        desc: 'WTI from Nasdaq, Nyse.',
        url: 'http://api.z-lab.me/charts/wti.png'
    }
};

var globalExchange;
// ----- END CURRENCY SECTION

// Functions
bot.getMe().then(function(me)
{
    console.log('Hello! My name is %s!', me.first_name);
    console.log('My id is %s.', me.id);
    console.log('And my username is @%s.', me.username);
    globalBotUserName = me.username;
});

bot.on('text', function(msg)
{
    // Set main variables
    var messageChatId = msg.chat.id;
    var messageText = msg.text;
    var messageDate = msg.date;
    globalMessageIdForReply = msg.message_id;
    globalUserNameIs = msg.from.username;

    if (msg.forward_date) { // Skip All Forward Messages
        return;
    }

    // DIGEST TAG
    if (messageText.indexOf('#digest') >= 0) {
        if (messageText.length < 3000) {
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

                // Save Stack to File
                writeJSONFileToFileSystem(globalJsonStackName, messageChatId, false);
            }
        } else {
            sendMessageByBot(messageChatId,
                             catchPhrases.debugCommandMessages[5]);
        }
    }

    // DIGEST COMMAND
    else if (messageText.indexOf('/digest') === 0 || messageText.indexOf('/digest@'+globalBotUserName) === 0) {
        var bGoodCommand = false;
        var messageDelay = 0;
        var fullCommand = '/digest@' + globalBotUserName;
        var msgLength = messageText.length;
        var fullCommandLength = fullCommand.length + 2;

        messageText = messageText.trim();

        if (messageText === '/digest' || messageText === fullCommand) {
            bGoodCommand = true;
            messageDelay = getMessageDelay(1);
        }

        if (msgLength === 9 || msgLength === fullCommandLength) {
            var arg = parseInt(messageText[msgLength - 1]);
            if (arg >= 1 && arg <= 7) {
                bGoodCommand = true;
                messageDelay = getMessageDelay(arg);
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
                var countOfDigestMessagesByChat = getCountDigestMessagesOfChat(messageChatId, dayDelay);

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
                    botAnswer = trimAndRemoveAtInEachString(botAnswer);

                    // Capitalize first letter of each string
                    botAnswer = capitalizeFirstLetterOfEachString(botAnswer);

                    // Replace all line breaks by line break, digestMarker and space.
                    botAnswer = catchPhrases.digestMarker + ' '
                            + replaceLineBreaksByYourString(botAnswer, '\n' + catchPhrases.digestMarker + ' ');

                    // Add digest header
                    botAnswer = getDigestReportHeader() + botAnswer;

                    // Send botAnswer as chunks
                    sendChunksMessagesByBot(messageChatId, botAnswer, 3500);
                } else {
                    sendNoDigestMessages(messageChatId);
                }
            } else {
                sendNoDigestMessages(messageChatId);
            }
        } else {
            sendMessageByBot(messageChatId, catchPhrases.helpCommand[2]);
        }
    }

    // ROUBLE, GRIVNA AND BELRUB COMMAND
    else if (messageText === '/rouble' || messageText === '/grivna' ||  messageText === '/belrub' ||
            messageText === '/rouble@'+globalBotUserName || messageText === '/grivna@'+globalBotUserName
            || messageText === '/belrub@'+globalBotUserName ) {
        var bankID = bankCBR;

        if (messageText === '/grivna' || messageText === '/grivna@'+globalBotUserName) {
            bankID = bankNBU;
        }

        if (messageText === '/belrub' || messageText === '/belrub@'+globalBotUserName) {
            bankID = bankNBRB;
        }

        // Store last USD value.
        var lastForeignValue = globalUSD[bankID];

        // Update currency list.
        updateGlobalCurrencyList(bankID, false, lastForeignValue, messageChatId);
    }

    // CHART COMMAND
    else if (messageText.indexOf('/chart') === 0 || messageText.indexOf('/chart@'+globalBotUserName) === 0) {
        messageText = messageText.trim();
        var splitCommandList = messageText.split(' ');
        if (splitCommandList.length === 2) {
            sendChartToChat(messageChatId, splitCommandList[1]);
        } else {
            sendMessageByBot(messageChatId,
                             generateChartsHelpString());
        }
    }

    // COFFEE COMMAND
    else if (messageText === '/coffee' || messageText === '/coffee@'+globalBotUserName) {
        Request.head(globalCofeeSticker, function(aErr, aRes, aBody) {
            Request(globalCofeeSticker).pipe(FileSystem.createWriteStream('coffee.webp')).on('close', function() {
                sendSticker(messageChatId, 'coffee.webp');
            });
        });
    }

    // GAME COMMAND
    else if (messageText === '/game' || messageText === '/game@'+globalBotUserName) {
        downloadImageAndSendToChat(gameStatURL, "game.png", messageChatId, false, catchPhrases.debugCommandMessages[12]);
    }

    // METALL COMMAND
    else if (messageText === '/metall' || messageText === '/metall@'+globalBotUserName) {
        updateGlobalCurrencyList(bankID, true, lastForeignValue, messageChatId);
    }

    // HELP COMMAND
    else if (messageText === '/help' || messageText === '/help@'+globalBotUserName) {
        sendMessageByBot(messageChatId, generateHelpString());
    }

    // START COMMAND
    else if (messageText === '/start' || messageText === '/start@'+globalBotUserName) {
        sendMessageByBot(messageChatId, catchPhrases.startCommand[0]);
    }

    // ----- ADMINISTRATION COMMANDS
    // HELLO COMMAND
    else if (messageText === '/hello' || messageText === '/hi'
            || messageText === '/hello@'+globalBotUserName || messageText === '/hi@'+globalBotUserName) {
        if (getAdminRights()) {
            sendMessageByBot(messageChatId,
                             catchPhrases.helloCommand[getRandomInt(0, catchPhrases.helloCommand.length - 1)]);
        }
    }

    // SEND COMMAND
    else if (messageText.indexOf('/send') === 0) {
        if (getAdminRights()) {
            messageText = messageText.trim();
            var splitSendList = messageText.split(' ');
            if (splitSendList.length > 2) {
                var targetChatID = splitSendList[1];
                sendMessageByBot(targetChatID, getSendMessage(messageText, '/send ' + targetChatID), true);
            } else {
                sendMessageByBot(messageChatId,
                                 catchPhrases.debugCommandMessages[8]);
            }
        } else {
            sendNoAccessMessage(messageChatId);
        }
    }

    // STICKER COMMAND
    else if (messageText.indexOf('/sticker') === 0 || messageText.indexOf('/sticker@'+globalBotUserName) === 0) {
        if (getAdminRights()) {
            messageText = messageText.trim();
            var splitCommandListSticker = messageText.split(' ');
            if (splitCommandListSticker.length === 3) {
                var targetStickerChatID = splitCommandListSticker[1];
                Request.head(splitCommandListSticker[2], function(aErr, aRes, aBody) {
                    Request(splitCommandListSticker[2]).pipe(FileSystem.createWriteStream('sticker.webp')).on('close', function() {
                        sendSticker(targetStickerChatID, 'sticker.webp');
                    });
                });
            }
        } else {
            sendNoAccessMessage(messageChatId);
        }
    }

    // CLEARSTACK COMMAND
    else if (messageText === '/stackClear' || messageText === '/clearStack') {
        if (getAdminRights()) {
            globalStackListDigestMessages = [ ];
            sendMessageByBot(messageChatId,
                             catchPhrases.debugCommandMessages[1]);
        } else {
            sendNoAccessMessage(messageChatId);
        }
    }

    // COUNT COMMAND
    else if (messageText === '/count') {
        if (getAdminRights()) {
            sendMessageByBot(messageChatId,
                             catchPhrases.debugCommandMessages[4] + globalCountOfMessagesWithDigest);
        } else {
            sendNoAccessMessage(messageChatId);
        }
    }

    // DELETE COMMAND
    else if (messageText.indexOf('/delete') === 0) {
        if (getAdminRights()) {
            var stackLength = globalStackListDigestMessages.length;
            if (stackLength > 0) {
                var chunksMsg = messageText.split(' ');
                if (chunksMsg.length === 2) {
                    var delArg = parseInt(chunksMsg[1]);
                    if (delArg <= stackLength) {
                        globalStackListDigestMessages.splice(delArg - 1, 1);
                        sendMessageByBot(messageChatId, catchPhrases.debugCommandMessages[6] + ' ' + delArg + '.');
                    } else {
                        sendMessageByBot(messageChatId, catchPhrases.debugCommandMessages[7] + ' ' + delArg + '.');
                    }
                }
            } else {
                sendMessageByBot(messageChatId,
                                 catchPhrases.debugCommandMessages[2]);
            }
        } else {
            sendNoAccessMessage(messageChatId);
        }
    }

    // VIEWSTACK COMMAND
    else if (messageText === '/stackView' || messageText === '/viewStack') {
        if (getAdminRights()) {
            var stack = '\n';
            var sizeOfStack = globalStackListDigestMessages.length;
            if (sizeOfStack > 0) {
                for (var j = 0; j < sizeOfStack; ++j) {
                    stack += j + 1 + ' ';
                    stack += globalStackListDigestMessages[j].s_chatID + ' ';
                    stack += globalStackListDigestMessages[j].s_username + ' ';
                    stack += globalStackListDigestMessages[j].s_date + ' ';
                    stack += globalStackListDigestMessages[j].s_message + '\n';
                }
                sendChunksMessagesByBot(messageChatId,
                                        catchPhrases.debugCommandMessages[3] + stack, 3500);
            } else {
                sendMessageByBot(messageChatId,
                                 catchPhrases.debugCommandMessages[2]);
            }
        } else {
            sendNoAccessMessage(messageChatId);
        }
    }

    // SAVESTACK COMMAND
    else if (messageText === '/stackSave' || messageText === '/saveStack') {
        if (getAdminRights()) {
            writeJSONFileToFileSystem(globalJsonStackName, messageChatId, true);
        } else {
            sendNoAccessMessage(messageChatId);
        }
    }

    // RESTORESTACK COMMAND
    else if (messageText === '/stackRestore' || messageText === '/restoreStack') {
        if (getAdminRights()) {
            readSavedStackFromFileSystem(globalJsonStackName, messageChatId, false);
        } else {
            sendNoAccessMessage(messageChatId);
        }
    }

    // HOSTIP COMMAND
    else if (messageText === '/hostip') {
        if (getAdminRights()) {
            sendHostIpToChat(messageChatId);
        } else {
            sendNoAccessMessage(messageChatId);
        }
    }
    // ----- END ADMINISTRATION COMMANDS
});

function sendHostIpToChat(aMessageChatId) {
    Exec('hostname -i', function(err, stdout, stderr) {
        if (err) {
            sendMessageByBot(aMessageChatId, catchPhrases.debugCommandMessages[14]);
            return;
        }
        sendMessageByBot(aMessageChatId, catchPhrases.debugCommandMessages[13] + stdout);
    });
}

function generateChartsHelpString()
{
    var helpChartsAnswer = '';
    for (var i = 0; i < catchPhrases.chartHelp.length; ++i) {
        helpChartsAnswer += catchPhrases.chartHelp[i] + '\n';
    }

    // Delete last line break
    helpChartsAnswer.trim();

    return helpChartsAnswer;
}

function downloadImageAndSendToChat(aUri, aFileName, aChatId, aChart, aDesc)
{
    Request.head(aUri, function(aErr, aRes, aBody) {
        Request(aUri).pipe(FileSystem.createWriteStream(aFileName)).on('close', function() {
            if (aChart) {
                sendChartFileToChat(aChatId, aFileName);
            } else {
                bot.sendPhoto(aChatId, aFileName, { caption: aDesc, reply_to_message_id: globalMessageIdForReply });
            }
        });
    });
}

function sendSticker(aChatId, aStickerName)
{
    if (aStickerName) {
        bot.sendSticker(aChatId, aStickerName, { reply_to_message_id: globalMessageIdForReply });
    }
}

function sendChartFileToChat(aChatId, aImageName)
{
    if (aImageName) {
        bot.sendPhoto(aChatId, aImageName,
                      { caption: catchPhrases.debugCommandMessages[9] + ' ' + globalExchange.desc, reply_to_message_id: globalMessageIdForReply });
    }
}

function sendChartToChat(aChatId, aExchangeId)
{
    if (globalExchangeList[aExchangeId]) {
        globalExchange = globalExchangeList[aExchangeId];
        downloadImageAndSendToChat(globalExchangeList[aExchangeId].url,
                                   addYourStringToString('./', aExchangeId + '_image.png'),
                                   aChatId,
                                   true, null);
    } else {
        sendMessageByBot(aChatId,
                         generateChartsHelpString());
    }
}

function sendChunksMessagesByBot(aChatId, aMesssage, aChunkSize)
{
    for (var j = 0, botAnswerLength = aMesssage.length; j < botAnswerLength; j+=aChunkSize) {
        sendMessageByBot(aChatId,  aMesssage.substring(j, j + aChunkSize));
    }
}

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
    // 86 400 for 24-hours.
    return aCountOfDay * 86400;
}

function getSendMessage(aString, aTrim)
{
    return aString.replace(aTrim, '').trim();
}

function trimAndRemoveAtInEachString(aString)
{
    return aString.split('\n').map(function(aLine)
    {
        aLine = aLine.trim();

        // Remove username URI only
        aLine = splitLineToWords(aLine);

        return aLine;
    }).join('\n');
}

function splitLineToWords(aString)
{
    return aString.split(' ').map(function(aWord)
    {
        if (aWord.indexOf('@') >= 0) {
            if (!validateEmail(aWord)) {
                aWord = aWord.replace(/@/g, '');
            }
        }
        return aWord;
    }).join(' ');
}

function validateEmail(aEmail)
{
    return /\S+@\S+\.\S+/.test(aEmail);
}

function capitalizeFirstLetterOfEachString(aString)
{
    return aString.split('\n').map(function(aLine)
    {
        if (aLine && aLine.indexOf('http') !== 0) {
            aLine = aLine[0].toUpperCase() + aLine.substr(1);
        }
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

function sendMessageByBot(aChatId, aMessage, aSendMessageToAnotherChat)
{
    if (aChatId && aMessage) {
        // Replace '%username%' by userName.
        var readyMessage = aMessage.replace('%username%', '@' + globalUserNameIs);
        bot.sendMessage(aChatId, readyMessage, { disable_web_page_preview: true, reply_to_message_id: (aSendMessageToAnotherChat) ? null : globalMessageIdForReply });
    }
}

function getRandomInt(aMin, aMax)
{
    return Math.floor(Math.random() * (aMax - aMin + 1)) + aMin;
}

function getCountDigestMessagesOfChat(aChatId, aObsoleteDate)
{
    var stackSize = globalStackListDigestMessages.length;
    var countOfMessages = 0;
    for (var i = 0; i < stackSize; ++i) {
        if (globalStackListDigestMessages[i].s_chatID === aChatId) {
            if (globalStackListDigestMessages[i].s_date > aObsoleteDate) {
                countOfMessages++;
            }
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

function readSavedStackFromFileSystem(aFileName, aMessageId, aFirstRun)
{
    var dotSlashName = addYourStringToString('./', aFileName);
    FileSystem.readFile(dotSlashName, 'utf-8', function(aError, aData) {
        if (aError) {
            if (!aFirstRun) {
                sendMessageByBot(aMessageId,
                                 catchPhrases.fileCommand[3]);
            }
            return aError;
        }
        if (!aFirstRun) {
            sendMessageByBot(aMessageId,
                             catchPhrases.fileCommand[1]);
        }
        globalStackListDigestMessages = JSON.parse(aData);
    });
}

function getJSONFileFromFileSystem(aFileName)
{
    var dotSlashName = addYourStringToString('./', aFileName);
    return JSON.parse(FileSystem.readFileSync(dotSlashName, 'utf-8'));
}

function writeJSONFileToFileSystem(aFileName, aMessageChatId, aAdmin)
{
    if (globalStackListDigestMessages.length > 0) {
        var dotSlashName = addYourStringToString('./', aFileName);
        FileSystem.writeFile(dotSlashName, JSON.stringify(globalStackListDigestMessages, null, 4), function(aError) {
            if (aAdmin) {
                if (aError) {
                    sendMessageByBot(aMessageChatId,
                                     catchPhrases.fileCommand[2] + '\n' + aError);
                } else {
                    sendMessageByBot(aMessageChatId,
                                     catchPhrases.fileCommand[0]);
                }
            }
        });
    } else {
        if (aAdmin) {
            sendMessageByBot(aMessageChatId,
                             catchPhrases.debugCommandMessages[2]);
        }
    }
}

function addYourStringToString(aYourString, aString)
{
    return aYourString + aString;
}

// ----- CURRENCY SECTION
function createReportCurrencyHeader(aCatchPhrase)
{
    return aCatchPhrase + '\n' + catchPhrases.roubleCommand[0] + '\n';
}

function getCurrencyTableString(bankID)
{
    var currencyTable = '';
    currencyTable += '1 USD = ' + globalCurrencyList.USD + ' ' + bankLocalCurrency[bankID] + ';\n';
    currencyTable += '1 EUR = ' + globalCurrencyList.EUR + ' ' + bankLocalCurrency[bankID] + ';\n';
    currencyTable += '1 KZT = ' + globalCurrencyList.KZT + ' ' + bankLocalCurrency[bankID] + ';\n';
    if(bankID !== bankNBRB ) { currencyTable += '1 BYN = ' + globalCurrencyList.BYN + ' ' + bankLocalCurrency[bankID] + ';\n'; }
    if(bankID !== bankNBU  ) { currencyTable += '1 UAH = ' + globalCurrencyList.UAH + ' ' + bankLocalCurrency[bankID] + ';\n'; }
    if(bankID !== bankCBR  ) { currencyTable += '1 RUB = ' + globalCurrencyList.RUB + ' ' + bankLocalCurrency[bankID] + ';\n'; }
    currencyTable += '1 GBP = ' + globalCurrencyList.GBP + ' ' + bankLocalCurrency[bankID] + '.';
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

function shittyParseCurrencyXML(aAllXml, bankID)
{
    if (isEmpty(aAllXml)) {
        globalCurrencyList.USD = 'Error';
        globalCurrencyList.EUR = 'Error';
        globalCurrencyList.KZT = 'Error';
        if(bankID !== bankNBRB ) { globalCurrencyList.BYN = 'Error'; }
        if(bankID !== bankNBU  ) { globalCurrencyList.UAH = 'Error'; }
        if(bankID !== bankCBR  ) { globalCurrencyList.RUB = 'Error'; }
        globalCurrencyList.GBP = 'Error';
    }

    globalCurrencyList.USD = getCurrentValue('USD', aAllXml);
    globalCurrencyList.EUR = getCurrentValue('EUR', aAllXml);
    globalCurrencyList.KZT = getCurrentValue('KZT', aAllXml);
    if(bankID !== bankNBRB ) { globalCurrencyList.BYN = getCurrentValue('BYN', aAllXml); }
    if(bankID !== bankNBU  ) { globalCurrencyList.UAH = getCurrentValue('UAH', aAllXml); }
    if(bankID !== bankCBR  ) { globalCurrencyList.RUB = getCurrentValue('RUB', aAllXml); }
    globalCurrencyList.GBP = getCurrentValue('GBP', aAllXml);
    globalUSD[bankID] = getCurrentValue('USD', aAllXml);
}

function updateGlobalCurrencyList(bankID, aMetall, lastForeignValue, messageChatId)
{
    // Clear xmlContent
    if (!isEmpty(xmlContent)) {
        xmlContent = '';
    }

    var request = Http.request((!aMetall) ? httpOptions[bankID] : httpMetallOptions, function(aRes) {
        aRes.setEncoding('utf-8');
        aRes.on('data', function(aChunk) {
            xmlContent += aChunk;
        });

        aRes.on('end', function() {
            if (!aMetall) {
                shittyParseCurrencyXML(xmlContent, bankID);
                if (messageChatId) {
                    sendCurrency(bankID, lastForeignValue, globalUSD[bankID], messageChatId);
                }
            } else {
                if (messageChatId) {
                    sendMessageByBot(messageChatId, shittyParseMetallXML(xmlContent));
                }
            }
        });
    });
    request.on('error', function(error) {
        sendMessageByBot(messageChatId, catchPhrases.debugCommandMessages[11] + error.message);
    });
    request.end();
}

function shittyParseMetallXML(aAllXml)
{
    var metallList = {
        'Date': '',
        'Au': 0.0,
        'Ag': 0.0,
        'Pt': 0.0,
        'Pd': 0.0
    };

    // 9  - Date, 10 - Gold, 11 - Silver, 12 - Platinum, 13 - Palladium
    metallList.Date = getCurrentMetallValue(9, aAllXml, true);
    metallList.Au = getCurrentMetallValue(10, aAllXml, false);
    metallList.Ag = getCurrentMetallValue(11, aAllXml, false);
    metallList.Pt = getCurrentMetallValue(12, aAllXml, false);
    metallList.Pd = getCurrentMetallValue(13, aAllXml, false);

    return generateBotMetallAnswer(metallList);
}

function generateBotMetallAnswer(aCurrencyList)
{
    var metallTable = catchPhrases.metallCommand[0] + aCurrencyList.Date + ':\n';
    metallTable += catchPhrases.metallCommand[1] + aCurrencyList.Au + catchPhrases.metallCommand[5] + ';\n';
    metallTable += catchPhrases.metallCommand[2] + aCurrencyList.Ag + catchPhrases.metallCommand[5] + ';\n';
    metallTable += catchPhrases.metallCommand[3] + aCurrencyList.Pt + catchPhrases.metallCommand[5] + ';\n';
    metallTable += catchPhrases.metallCommand[4] + aCurrencyList.Pd + catchPhrases.metallCommand[5] + '.';
    return metallTable;
}

function getCurrentMetallValue(aNum, aString, aDate)
{
    // 'table class=\"data\"' - is a marker
    var marker = 'table class=\"data\"';
    if (!aDate) {
        var value = parseFloat(deleteAllSpaces(replaceCommasByDots(getStringBelow(aString.indexOf(marker), aNum, aString))));
        return value.toFixed(2);
    } else {
        return getStringBelow(aString.indexOf(marker), aNum, aString);
    }
}

function deleteAllSpaces(aString)
{
    return aString.replace(/\s/g, '');
}

function sendCurrency(bankID, lastForeignValue, newForeignValue, messageChatId)
{
    // Generate currency answer.
    var currencyAnswer = '';
    if (lastForeignValue < newForeignValue) {
        currencyAnswer += (bankID === bankCBR) ?
                    createReportCurrencyHeader(
                        catchPhrases.roubleCommandDown[
                            getRandomInt(0, catchPhrases.roubleCommandDown.length - 1)]) :
                    catchPhrases.roubleCommand[0] + '\n';
    } else if (lastForeignValue > newForeignValue) {
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
    updateGlobalCurrencyList(bankNBRB);
}
// ----- END CURRENCY SECTION
