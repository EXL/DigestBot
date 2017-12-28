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
var ExecSync = require('child_process').execSync;

// Globals
var token = getTokenAccess();
var catchPhrases = getCatchPhrases();
var httpOptions = [
    {
        host: 'www.cbr-xml-daily.ru',
        port: 80,
        path: '/daily.xml'
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
    path: '/hd_base/metall/metall_base_new/'
};

var botOptions = {
    polling: true
};

var bot = new TelegramBot(token, botOptions);

var globalCountOfMessagesWithDigest = 0;
var globalBotUserName;

var globalStackListDigestMessages = [ ];

var coolDownSec = 5;
var globalCallbackQueriesStack = [ ];

var globalCofeeSticker = 'CAADAgADzAEAAhGoNAVFRRJu94qe3gI';
var gameStatURL = 'https://api.z-lab.me/img/lgsl/servers_stats.png';

var globalJsonStackName = 'DigestBotStackLog.json';
readSavedStackFromFileSystem(globalJsonStackName, 0, true);

// ----- CURRENCY SECTION
var globalExchangeList = getChartsList();

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

var globalRatesKeyboard = {
    inline_keyboard: [ [
            { text: catchPhrases.buttons[0], callback_data: 'rub' },
            { text: catchPhrases.buttons[1], callback_data: 'uah' },
            { text: catchPhrases.buttons[2], callback_data: 'byn' },
            { text: catchPhrases.buttons[3], callback_data: 'met' }
        ] ]
};
// ----- END CURRENCY SECTION

// Bot Functions
bot.getMe().then(function(me)
{
    console.log('Hello! My name is %s!', me.first_name);
    console.log('My id is %s.', me.id);
    console.log('And my username is @%s.', me.username);
    globalBotUserName = me.username;
});

bot.on('inline_query', function(msg)
{
    var q_id = msg.id;
    var q_query = msg.query;
    var results = [];
    var ind = 0;
    for (k in globalExchangeList) {
        if (k.toLowerCase().indexOf(q_query) >= 0) {
            results.push(generateInlineChartsResult(k));
            ind++;
        }
    }
    if (!ind) {
        for (k in globalExchangeList) {
            results.push(generateInlineChartsResult(k));
        }
    }
    bot.answerInlineQuery(q_id, results);
});

bot.on('callback_query', function onCallbackQuery(callbackQuery)
{
    // console.log(callbackQuery);
    var msg = callbackQuery.message;
    var text = '';

    var cooldwn = coolDownStep(callbackQuery.from.id, msg.chat.id);
    if (cooldwn <= 0) {
        var action = callbackQuery.data;
        if (action === 'rub') {
            text += catchPhrases.buttons[4] + catchPhrases.buttons[0];
            updateGlobalCurrencyList(bankCBR, false, globalUSD[bankCBR], msg.chat.id, callbackQuery.from.username, msg.message_id, true);
        } else if (action === 'uah') {
            text += catchPhrases.buttons[4] + catchPhrases.buttons[1];
            updateGlobalCurrencyList(bankNBU, false, globalUSD[bankNBU], msg.chat.id, callbackQuery.from.username, msg.message_id, true);
        } else if (action === 'byn') {
            text += catchPhrases.buttons[4] + catchPhrases.buttons[2];
            updateGlobalCurrencyList(bankNBRB, false, globalUSD[bankNBRB], msg.chat.id, callbackQuery.from.username, msg.message_id, true);
        } else if (action === 'met') {
            text += catchPhrases.buttons[4] + catchPhrases.buttons[3];
            updateGlobalCurrencyList(null, true, null, msg.chat.id, callbackQuery.from.username, msg.message_id, true);
        } else if (action.indexOf('data.') === 0) {
            var arg = action.replace('data.', '').replace('.', '_');
            text += catchPhrases.buttons[4] + arg;
            sendChartToChat(msg.chat.id, arg, callbackQuery.from.username, msg.message_id);
        } else if (action.indexOf('digest.') === 0) {
            var page = parseInt(action.replace('digest.', ''));
            var dayDelay = msg.date - getMessageDelay(7);
            text += catchPhrases.buttons[6] + page;
            bot.editMessageText(generateDigestAnswer(
                                        globalStackListDigestMessages.length,
                                        msg.chat.id,
                                        dayDelay, 8, page
                                    ).replace('%username%',
                                                '@' + callbackQuery.from.username
                                ),
                                { chat_id: msg.chat.id,
                                  message_id: msg.message_id,
                                  reply_markup: {
                                        inline_keyboard: generateDigestKeyboard(
                                                             getDigestPages(
                                                                    globalStackListDigestMessages.length,
                                                                    msg.chat.id, dayDelay, 8
                                                                 ).length
                                                             )
                                    },
                                  parse_mode: 'HTML',
                                  disable_web_page_preview: true,
                                  disable_notification: true
                                });
        }
    } else {
        text = catchPhrases.buttons[8] + cooldwn + catchPhrases.buttons[9];
    }

    bot.answerCallbackQuery( { callback_query_id: callbackQuery.id, text: text, show_alert: false } );
});

bot.on('new_chat_members', function(msg)
{
    sendMessageByBot(msg.chat.id,
                     catchPhrases.newMember[getRandomInt(0, catchPhrases.newMember.length - 1)]
                        .replace('%username%',
                                 (msg.from.last_name) ? msg.from.first_name + ' ' + msg.from.last_name : msg.from.first_name),
                     msg.from.username, msg.message_id);
});

bot.on('left_chat_member', function(msg)
{
    sendMessageByBot(msg.chat.id,
                     catchPhrases.leftMember[getRandomInt(0, catchPhrases.leftMember.length - 1)]
                        .replace('%username%',
                                 (msg.from.last_name) ? msg.from.first_name + ' ' + msg.from.last_name : msg.from.first_name),
                     msg.from.username, msg.message_id);
});

bot.on('text', function(msg)
{
    // Set main variables
    var messageChatId = msg.chat.id;
    var messageText = msg.text;
    var messageDate = msg.date;
    var messsageId = msg.message_id;
    var messageUserName = msg.from.username;

    // console.log(msg);

    if (msg.forward_date) { // Skip All Forward Messages
        return;
    }

    // DIGEST TAG
    if (messageText.indexOf('#digest') >= 0) {
        if (messageText.length < 400) {
            globalCountOfMessagesWithDigest++;
            var normalMessage = normalizeMessage(messageText);
            if (!(isBlank(normalMessage))) {
                var messageInfoStruct = {
                    's_chatID': messageChatId,
                    's_date': messageDate,
                    's_message': normalMessage,
                    's_username': messageUserName
                };

                globalStackListDigestMessages.push(messageInfoStruct);

                // Send message by bot.
                sendMessageByBot(messageChatId,
                                 catchPhrases.digestTag[getRandomInt(0, catchPhrases.digestTag.length - 1)],
                                 messageUserName, messsageId);

                // Save Stack to File
                writeJSONFileToFileSystem(globalJsonStackName, messageChatId, false, messageUserName, messsageId);
            }
        } else {
            sendMessageByBot(messageChatId,
                             catchPhrases.debugCommandMessages[5],
                             messageUserName, messsageId);
        }
    }

    // DIGEST COMMAND
    else if (messageText === '/digest' || messageText === '/digest@'+globalBotUserName) {
        var bGoodCommand = true;
        var messageDelay = getMessageDelay(7);

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
            // Count of digest messages from one chat.
            var countOfDigestMessagesByChat = getCountDigestMessagesOfChat(messageChatId, dayDelay);
            // Check countOfDigestMessagesByChat.
            if (countOfDigestMessagesByChat > 0) {
                sendMessageByBot(messageChatId,
                                 generateDigestAnswer(globalStackListDigestMessages.length, messageChatId, dayDelay, 8, 1),
                                 messageUserName, messsageId, {
                                     inline_keyboard: generateDigestKeyboard(getDigestPages(globalStackListDigestMessages.length,
                                                                                            messageChatId, dayDelay, 8).length) } );
            } else {
                sendNoDigestMessages(messageChatId, messageUserName, messsageId);
            }
        } else {
            sendNoDigestMessages(messageChatId, messageUserName, messsageId);
        }
    }

    // RATES COMMAND
    else if (messageText === '/rates' || messageText === '/rates@'+globalBotUserName) {
        updateGlobalCurrencyList(bankCBR, false, globalUSD[bankCBR], messageChatId, messageUserName, messsageId);
    }

    // CHARTS COMMAND
    else if (messageText === '/charts' || messageText === '/charts@'+globalBotUserName) {
        sendMessageByBot(messageChatId,
                         catchPhrases.buttons[5] + '<code>' + generateChartsHelpString() + '</code>',
                         messageUserName, messsageId, { inline_keyboard: generateChartsKeyboard() });
    }

    // COFFEE COMMAND
    else if (messageText === '/coffee' || messageText === '/coffee@'+globalBotUserName) {
        sendSticker(messageChatId, globalCofeeSticker, messsageId);
    }

    // GAME COMMAND
    else if (messageText === '/game' || messageText === '/game@'+globalBotUserName) {
        downloadImageAndSendToChat(gameStatURL, 'game.png', messageChatId, false, catchPhrases.debugCommandMessages[12], messsageId);
    }

    // HELP COMMAND
    else if (messageText === '/help' || messageText === '/help@'+globalBotUserName) {
        sendMessageByBot(messageChatId, generateHelpString(messageUserName), messageUserName, messsageId);
    }

    // START COMMAND
    else if (messageText === '/start' || messageText === '/start@'+globalBotUserName) {
        sendMessageByBot(messageChatId, catchPhrases.startCommand[0], messageUserName, messsageId);
    }

    // ----- ADMINISTRATION COMMANDS
    // HELLO COMMAND
    else if (messageText === '/hello' || messageText === '/hi') {
        if (getAdminRights(messageUserName)) {
            sendMessageByBot(messageChatId,
                             catchPhrases.helloCommand[getRandomInt(0, catchPhrases.helloCommand.length - 1)],
                             messageUserName, messsageId);
        }
    }

    // SEND COMMAND
    else if (messageText.indexOf('/send') === 0) {
        if (getAdminRights(messageUserName)) {
            messageText = messageText.trim();
            var splitSendList = messageText.split(' ');
            if (splitSendList.length > 2) {
                var targetChatID = splitSendList[1];
                sendMessageByBot(targetChatID, getSendMessage(messageText, '/send ' + targetChatID), messageUserName, null);
            } else {
                sendMessageByBot(messageChatId,
                                 catchPhrases.debugCommandMessages[8], messageUserName, messsageId);
            }
        } else {
            sendNoAccessMessage(messageChatId, messageUserName, messsageId);
        }
    }

    // EVAL COMMAND
    else if (messageText.indexOf('/eval') === 0) {
        if (getAdminRights(messageUserName)) {
            eval(messageText.replace('/eval', '').trim());
        }
    }

    // STICKER COMMAND
    else if (messageText.indexOf('/sticker') === 0) {
        if (getAdminRights(messageUserName)) {
            messageText = messageText.trim();
            var splitCommandListSticker = messageText.split(' ');
            if (splitCommandListSticker.length === 3) {
                sendSticker(splitCommandListSticker[1], splitCommandListSticker[2], null);
            }
        } else {
            sendNoAccessMessage(messageChatId, messageUserName, messsageId);
        }
    }

    // CLEARSTACK COMMAND
    else if (messageText === '/stackClear' || messageText === '/clearStack') {
        if (getAdminRights(messageUserName)) {
            globalStackListDigestMessages = [ ];
            sendMessageByBot(messageChatId,
                             catchPhrases.debugCommandMessages[1], messageUserName, messsageId);
        } else {
            sendNoAccessMessage(messageChatId, messageUserName, messsageId);
        }
    }

    // COUNT COMMAND
    else if (messageText === '/count') {
        if (getAdminRights(messageUserName)) {
            sendMessageByBot(messageChatId,
                             catchPhrases.debugCommandMessages[4] + globalCountOfMessagesWithDigest, messageUserName, messsageId);
        } else {
            sendNoAccessMessage(messageChatId, messageUserName, messsageId);
        }
    }

    // DELETE COMMAND
    else if (messageText.indexOf('/delete') === 0) {
        if (getAdminRights(messageUserName)) {
            var stackLength = globalStackListDigestMessages.length;
            if (stackLength > 0) {
                var chunksMsg = messageText.split(' ');
                if (chunksMsg.length === 2) {
                    var delArg = parseInt(chunksMsg[1]);
                    if (delArg <= stackLength) {
                        globalStackListDigestMessages.splice(delArg - 1, 1);
                        sendMessageByBot(messageChatId, catchPhrases.debugCommandMessages[6] + ' ' + delArg + '.', messageUserName, messsageId);
                    } else {
                        sendMessageByBot(messageChatId, catchPhrases.debugCommandMessages[7] + ' ' + delArg + '.', messageUserName, messsageId);
                    }
                }
            } else {
                sendMessageByBot(messageChatId,
                                 catchPhrases.debugCommandMessages[2], messageUserName, messsageId);
            }
        } else {
            sendNoAccessMessage(messageChatId, messageUserName, messsageId);
        }
    }

    // VIEWSTACK COMMAND
    else if (messageText === '/stackView' || messageText === '/viewStack') {
        if (getAdminRights(messageUserName)) {
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
                                        catchPhrases.debugCommandMessages[3] + stack, 3500, messageUserName, messsageId);
            } else {
                sendMessageByBot(messageChatId,
                                 catchPhrases.debugCommandMessages[2], messageUserName, messsageId);
            }
        } else {
            sendNoAccessMessage(messageChatId, messageUserName, messsageId);
        }
    }

    // SAVESTACK COMMAND
    else if (messageText === '/stackSave' || messageText === '/saveStack') {
        if (getAdminRights(messageUserName)) {
            writeJSONFileToFileSystem(globalJsonStackName, messageChatId, true, messageUserName, messsageId);
        } else {
            sendNoAccessMessage(messageChatId, messageUserName, messsageId);
        }
    }

    // RESTORESTACK COMMAND
    else if (messageText === '/stackRestore' || messageText === '/restoreStack') {
        if (getAdminRights(messageUserName)) {
            readSavedStackFromFileSystem(globalJsonStackName, messageChatId, false, messageUserName, messsageId);
        } else {
            sendNoAccessMessage(messageChatId, messageUserName, messsageId);
        }
    }

    // HOSTIP COMMAND
    else if (messageText === '/hostip') {
        if (getAdminRights(messageUserName)) {
            sendHostIpToChat(messageChatId, messageUserName, messsageId);
        } else {
            sendNoAccessMessage(messageChatId, messageUserName, messsageId);
        }
    }
    // ----- END ADMINISTRATION COMMANDS
});

// Subs Functions
function generateInlineChartsResult(aKey)
{
    return {
        'type': 'article',
        'id': '08142017/' + aKey,
        'title': globalExchangeList[aKey].desc,
        'input_message_content': { 'message_text' : globalExchangeList[aKey].desc + '\n' + globalExchangeList[aKey].url },
        'thumb_url': globalExchangeList[aKey].thumb,
        'thumb_width': 64,
        'thumb_height': 64
    };
}

function getDateTgFormat()
{
    return ~~(Date.now() / 1000);
}

function deleteObsoleteCallbackQueries(aObsoleteDate)
{
    var stackSize = globalCallbackQueriesStack.length;
    var position = 0;
    for (var i = 0; i < stackSize; ++i) {
        if (globalCallbackQueriesStack[i].date < aObsoleteDate) {
            position++;
        }
    }
    if (position == stackSize) {
        globalCallbackQueriesStack = [ ];
        return;
    }
    if (position == 0) {
        return;
    }
    globalCallbackQueriesStack = globalCallbackQueriesStack.slice(position);
}

function coolDownStep(aUserId, aChatId)
{
    var time = 0;

    var datePrev = getDateTgFormat();
    deleteObsoleteCallbackQueries(datePrev - coolDownSec);

    if (globalCallbackQueriesStack.length > 0) {
        for (var i = 0; i < globalCallbackQueriesStack.length; ++i) {
            if (globalCallbackQueriesStack[i].chat === aChatId) {
                time = datePrev - globalCallbackQueriesStack[i].date;
            }
        }
        if (time >= coolDownSec) {
            globalCallbackQueriesStack.push( { user_id: aUserId, date: datePrev, chat: aChatId } );
        }
    } else {
        globalCallbackQueriesStack.push( { user_id: aUserId, date: datePrev, chat: aChatId } );
        time = coolDownSec + 1;
    }

    return coolDownSec - time;
}

function generateDigestKeyboard(aPagesCount)
{
    if (aPagesCount <= 1) {
        return [];
    }
    var keyboard = [];
    var row = [];
    var ind = 0;
    for (var i = 0; i < aPagesCount; ++i) {
        ind++;
        row.push( { text: '' + (i+1), callback_data: 'digest.' + (i+1) } );
        if (ind == 7) {
            ind = 0;
            keyboard.push(row);
            row = [];
        }
    }
    keyboard.push(row);
    return keyboard;
}

function getDigestPages(stackSize, messageChatId, dayDelay, aCountOnPage)
{
    var endLineString = '\n';
    var pageStack = [];
    var pageRow = [];
    var count = 0;
    // Append answer string.
    for (var i = stackSize - 1; i >= 0; --i) {
        if (globalStackListDigestMessages[i].s_chatID === messageChatId) {
            if (globalStackListDigestMessages[i].s_date > dayDelay) {
                count++;
                pageRow.push(globalStackListDigestMessages[i].s_message + endLineString);
                if (count === aCountOnPage) {
                    count = 0;
                    pageStack.push(pageRow.reverse());
                    pageRow = [];
                }
            }
        }
    }
    if (pageRow.length > 0) {
        pageStack.push(pageRow.reverse());
    }
    return pageStack;
}

function generateDigestAnswer(stackSize, messageChatId, dayDelay, aCountOnPage, aPage)
{
    var botAnswer = '';
    var page = getDigestPages(stackSize, messageChatId, dayDelay, aCountOnPage);
    var pageNum = aPage - 1;

    if (pageNum > page.length) {
        return catchPhrases.buttons[7] + aPage + '.';
    }

    for (var i = 0; i < page[pageNum].length; ++i) {
        botAnswer += page[pageNum][i];
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
    botAnswer = getDigestReportHeader(aPage) + botAnswer;
    return botAnswer;
}

function sendHostIpToChat(aMessageChatId, aUserName, aMsgId)
{
    ExecSync('curl http://ipecho.net/plain', function(err, stdout, stderr) {
        if (err) {
            sendMessageByBot(aMessageChatId, catchPhrases.debugCommandMessages[14], aUserName, aMsgId);
            return;
        }
        sendMessageByBot(aMessageChatId, catchPhrases.debugCommandMessages[13] + stdout, aUserName, aMsgId);
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

    return '\n\n' + helpChartsAnswer;
}

function downloadImageAndSendToChat(aUri, aFileName, aChatId, aChart, aDesc, aMsgId)
{
    Request.head(aUri, function(aErr, aRes, aBody) {
        Request(aUri).pipe(FileSystem.createWriteStream(aFileName)).on('close', function() {
            if (aChart) {
                sendChartFileToChat(aChatId, aFileName, aDesc, aMsgId);
            } else {
                bot.sendPhoto(aChatId, aFileName, { caption: aDesc, reply_to_message_id: aMsgId });
            }
        });
    });
}

function sendSticker(aChatId, aStickerId, aMsgId)
{
    if (aStickerId) {
        bot.sendSticker(aChatId, aStickerId, { reply_to_message_id: aMsgId });
    }
}

function generateChartsKeyboard()
{
    var keyboard = [];
    var row = [];
    var ind = 0;
    for (k in globalExchangeList) {
        ind++;
        row.push( { text: k, callback_data: 'data.' + k.replace('_', '.')} );
        if (ind == 4) {
            ind = 0;
            keyboard.push(row);
            row = [];
        }
    }
    keyboard.push(row);
    return keyboard;
}

function sendChartFileToChat(aChatId, aImageName, aDesc, aMsgId)
{
    if (aImageName) {
        bot.sendPhoto(aChatId, aImageName,
                      { caption: catchPhrases.debugCommandMessages[9] + ' ' + aDesc, reply_to_message_id: aMsgId });
    }
}

function sendChartToChat(aChatId, aExchangeId, aUserName, aMsgId)
{
    if (globalExchangeList[aExchangeId]) {
        downloadImageAndSendToChat(globalExchangeList[aExchangeId].url,
                                   addYourStringToString('./', aExchangeId + '_image.png'),
                                   aChatId,
                                   true, globalExchangeList[aExchangeId].desc, aMsgId);
    } else {
        sendMessageByBot(aChatId,
                         generateChartsHelpString(), aUserName, aMsgId);
    }
}

function sendChunksMessagesByBot(aChatId, aMesssage, aChunkSize, aUserName, aMsgId)
{
    var times = parseInt(aMesssage.length / aChunkSize) + 1; // +1 for last chunk
    var current = 0;
    var chunkOffset = 0;

    (function nextLap() {
        if (current >= times) {
            return;
        }
        ++current;
        sendMessageByBot(aChatId, aMesssage.substring(chunkOffset, chunkOffset + aChunkSize), aUserName, aMsgId).then(function() {
            chunkOffset += aChunkSize;
            nextLap();
        });
    })();
}

function generateHelpString(aUserName)
{
    var botAnswer = '';
    for (var i = 0; i < catchPhrases.helpCommand.length; ++i) {
        botAnswer += catchPhrases.helpCommand[i] + '\n';
    }

    if (getAdminRights(aUserName)) {
        for (var j = 0; j < catchPhrases.helpCommandAdmin.length; ++j) {
            botAnswer += catchPhrases.helpCommandAdmin[j] + '\n';
        }
    }

    // Delete last line break
    botAnswer.trim();

    return botAnswer;
}

function sendNoAccessMessage(aChatId, aUserName, aMsgId)
{
    sendMessageByBot(aChatId, catchPhrases.debugCommandMessages[0], aUserName, aMsgId);
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
        aLine = removeUsernameUri(aLine);

        return aLine;
    }).join('\n');
}

function removeUsernameUri(aString)
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

function getAdminRights(aUserName)
{
    return aUserName === 'exlmoto' || aUserName === 'ZorgeR';
}

function getDigestReportHeader(aPage)
{
    return catchPhrases.digestCommandHello[getRandomInt(0, catchPhrases.digestCommandHello.length - 1)]
            + '\n'
            + catchPhrases.digestCommandHeader[getRandomInt(0, catchPhrases.digestCommandHeader.length - 1)]
            + aPage + ':\n\n';
}

function sendNoDigestMessages(aChatId, aUserName, aMsgId)
{
    sendMessageByBot(aChatId,
                     catchPhrases.digestCommandNoMessages[
                         getRandomInt(0, catchPhrases.digestCommandNoMessages.length - 1)], aUserName, aMsgId);
}

function sendMessageByBot(aChatId, aMessage, aUserName, aMsgId, aKey)
{
    if (aChatId && aMessage) {
        // Replace '%username%' by userName.
        var readyMessage = aMessage.replace('%username%', '@' + aUserName);

        // Return Promise
        return new Promise(function(resolve) {
            return bot.sendMessage(aChatId, readyMessage, {
                    disable_web_page_preview: true,
                    disable_notification: true,
                    reply_to_message_id: aMsgId,
                    reply_markup: (aKey) ? aKey : null,
                    parse_mode: (aKey) ? 'HTML' : null
                }).delay(1000).then(function(response) { // 1 sec delay
                    resolve(response);
                })
            // TODO: Make error handling
        });
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

function getChartsList()
{
    return getJSONFileFromFileSystem('ChartsList.json');
}

function getCatchPhrases()
{
    return getJSONFileFromFileSystem('CatchPhrases.json');
}

function readSavedStackFromFileSystem(aFileName, aMessageId, aFirstRun, aUserName, aMsgId)
{
    var dotSlashName = addYourStringToString('./', aFileName);
    FileSystem.readFile(dotSlashName, 'utf-8', function(aError, aData) {
        if (aError) {
            if (!aFirstRun) {
                sendMessageByBot(aMessageId,
                                 catchPhrases.fileCommand[3], aUserName, aMsgId);
            }
            return aError;
        }
        if (!aFirstRun) {
            sendMessageByBot(aMessageId,
                             catchPhrases.fileCommand[1], aUserName, aMsgId);
        }
        globalStackListDigestMessages = JSON.parse(aData);
    });
}

function getJSONFileFromFileSystem(aFileName)
{
    var dotSlashName = addYourStringToString('./', aFileName);
    return JSON.parse(FileSystem.readFileSync(dotSlashName, 'utf-8'));
}

function writeJSONFileToFileSystem(aFileName, aMessageChatId, aAdmin, aUserName, aMsgId)
{
    if (globalStackListDigestMessages.length > 0) {
        var dotSlashName = addYourStringToString('./', aFileName);
        FileSystem.writeFile(dotSlashName, JSON.stringify(globalStackListDigestMessages, null, 4), function(aError) {
            if (aAdmin) {
                if (aError) {
                    sendMessageByBot(aMessageChatId,
                                     catchPhrases.fileCommand[2] + '\n' + aError, aUserName, aMsgId);
                } else {
                    sendMessageByBot(aMessageChatId,
                                     catchPhrases.fileCommand[0], aUserName, aMsgId);
                }
            }
        });
    } else {
        if (aAdmin) {
            sendMessageByBot(aMessageChatId,
                             catchPhrases.debugCommandMessages[2], aUserName, aMsgId);
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

function addZerosToRate(aRate, aSuff, aZero)
{
    var str = aRate.toString();
    var start = str.length;
    for (var i = start; i < aSuff; ++i) {
        str += aZero;
    }
    return str;
}

function getCurrencyTableString(bankID)
{
    var currencyTable = '';
    currencyTable += '1 USD = ' + addZerosToRate(globalCurrencyList.USD, 8, '0') + ' ' + bankLocalCurrency[bankID] + ';\n';
    currencyTable += '1 EUR = ' + addZerosToRate(globalCurrencyList.EUR, 8, '0') + ' ' + bankLocalCurrency[bankID] + ';\n';
    currencyTable += '1 KZT = ' + addZerosToRate(globalCurrencyList.KZT, 8, '0') + ' ' + bankLocalCurrency[bankID] + ';\n';
    if(bankID !== bankNBRB ) { currencyTable += '1 BYN = ' + addZerosToRate(globalCurrencyList.BYN, 8, '0') + ' ' + bankLocalCurrency[bankID] + ';\n'; }
    if(bankID !== bankNBU  ) { currencyTable += '1 UAH = ' + addZerosToRate(globalCurrencyList.UAH, 8, '0') + ' ' + bankLocalCurrency[bankID] + ';\n'; }
    if(bankID !== bankCBR  ) { currencyTable += '1 RUB = ' + addZerosToRate(globalCurrencyList.RUB, 8, '0') + ' ' + bankLocalCurrency[bankID] + ';\n'; }
    currencyTable += '1 GBP = ' + addZerosToRate(globalCurrencyList.GBP, 8, '0') + ' ' + bankLocalCurrency[bankID] + '.';
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

function updateGlobalCurrencyList(bankID, aMetall, lastForeignValue, messageChatId, aUserName, aMsgId, aEditText)
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
                    sendCurrency(bankID, lastForeignValue, globalUSD[bankID], messageChatId, aUserName, aMsgId, aEditText);
                }
            } else {
                if (messageChatId) {
                    var msgTxt = shittyParseMetallXML(xmlContent);
                    if (!aEditText) {
                        sendMessageByBot(messageChatId, msgTxt, aUserName, aMsgId, globalRatesKeyboard);
                    } else {
                        bot.editMessageText(msgTxt,
                                            { chat_id: messageChatId, message_id: aMsgId,
                                              reply_markup: globalRatesKeyboard, parse_mode: 'HTML' });
                    }
                }
            }
        });
    });
    request.on('error', function(error) {
        var msgTxt = '<code>' + catchPhrases.debugCommandMessages[11] + error.message + '</code>';
        if (!aEditText) {
            sendMessageByBot(messageChatId, msgTxt, aUserName, aMsgId, globalRatesKeyboard);
        } else {
            bot.editMessageText(msgTxt,
                                { chat_id: messageChatId, message_id: aMsgId,
                                  reply_markup: globalRatesKeyboard, parse_mode: 'HTML' });
        }
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
    var metallTable = catchPhrases.metallCommand[0] + aCurrencyList.Date + ':\n<code>';
    metallTable += catchPhrases.metallCommand[1] + addZerosToRate(aCurrencyList.Au, 7, '0') + catchPhrases.metallCommand[5] + ';\n';
    metallTable += catchPhrases.metallCommand[2] + addZerosToRate(aCurrencyList.Ag, 7, '0') + catchPhrases.metallCommand[5] + ';\n';
    metallTable += catchPhrases.metallCommand[3] + addZerosToRate(aCurrencyList.Pt, 7, '0') + catchPhrases.metallCommand[5] + ';\n';
    metallTable += catchPhrases.metallCommand[4] + addZerosToRate(aCurrencyList.Pd, 7, '0') + catchPhrases.metallCommand[5] + '.</code>';
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

function sendCurrency(bankID, lastForeignValue, newForeignValue, messageChatId, aUserName, aMsgId, aEditText)
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
    currencyAnswer += '<code>' + getCurrencyTableString(bankID) + '</code>';

    // Send currency answer to chat.
    if (!aEditText) {
        sendMessageByBot(messageChatId, currencyAnswer, aUserName, aMsgId, globalRatesKeyboard);
    } else {
        bot.editMessageText(currencyAnswer.replace('%username%', '@' + aUserName),
                            { chat_id: messageChatId, message_id: aMsgId, reply_markup: globalRatesKeyboard, parse_mode: 'HTML' });
    }
}

function initilizeCurrencyListAndGetUsdValue()
{
    updateGlobalCurrencyList(bankCBR);
    updateGlobalCurrencyList(bankNBU);
    updateGlobalCurrencyList(bankNBRB);
}
// ----- END CURRENCY SECTION
