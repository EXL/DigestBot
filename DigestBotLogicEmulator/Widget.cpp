#include "Widget.h"
#include "ui_Widget.h"

#include <QDebug>
#include <QTimer>
#include <QDateTime>

// ChatId
// 1 - 10001
// 2 - 10010

enum Chats {
    first = 10001,
    second = 10010
};

QString GadgetHackwrench::getMessageText(const QString &msg, bool date) const
{
    return (date) ? msg.split(" : ")[0] : msg.split(" : ")[1];
}

int GadgetHackwrench::getCountOfChatDigestMessages(int chatID) const
{
    int countOfMessage = 0;
    for (int i = 0; i < stackList.size(); ++i) {
        if (stackList.at(i).chatId == chatID) {
            countOfMessage++;
        }
    }
    return countOfMessage;
}

void GadgetHackwrench::sendMessageByGH(int chatId, const QString &msg)
{
    emit sendMessageToChat(chatId, QString("-> Bot: %1%2").arg(Widget::getUnixTime()).arg(msg));
}

void GadgetHackwrench::noMessages(int chatId)
{
    sendMessageByGH(chatId, "There are no digest messages. Sorry for that.");
}

QString GadgetHackwrench::normalizeMessage(QString &msg) const
{
    msg.remove("#digest");

    if (!msg.isEmpty()) {
        int countOfTrailingSpace = 0;
        for (int i = 0; i < msg.length(); ++i) {
            if (msg.at(i).isSpace()) {
                countOfTrailingSpace++;
            } else {
                break;
            }
        }

        int countOfEndingSpace = 0;
        for (int i = msg.length() - 1; i >= 0; --i) {
            if (msg.at(i).isSpace()) {
                countOfEndingSpace++;
            } else {
                break;
            }
        }

        if (!msg.isEmpty()) {
            msg.remove(0, countOfTrailingSpace);
        }

        if (!msg.isEmpty()) {
            msg.chop(countOfEndingSpace);
        }

        if (!msg.isEmpty()) {
            msg[0] = msg.at(0).toUpper(); // Returns the uppercase equivalent
        }
    }
    return msg;
}

bool GadgetHackwrench::deleteObsolotteDigestMessages(long long dateObsolette)
{
    int size = stackList.size();

    int pos = 0;
    for (int i = 0; i < size; ++i) {
        if (stackList.at(i).date < dateObsolette) {
            pos++;
        }
    }

    if (pos == size) {
        stackList.clear();
        return false;
    }

    if (pos == 0) {
        return true;
    }

    stackList = stackList.mid(pos);

    return stackList.size() > 0;
}

void GadgetHackwrench::getMessageFromChat(int i_chatID, const QString &msg)
{
    QString messageText = getMessageText(msg, 0);
    QString date = getMessageText(msg, 1);

    if (messageText.indexOf("#digest") != -1) {
        countOfMessageWithDigest++;
        QString normalMessage = normalizeMessage(messageText);
        if (!normalMessage.isEmpty()) {
            MessageInfo messageChunks;
            messageChunks.chatId = i_chatID;
            messageChunks.date = date.toLongLong();
            messageChunks.message = normalMessage;
            stackList.append(messageChunks);
            //sendMessageByGH(i_chatID, QString("I recive message with #digest tag. All #digest messages: %1.").arg(countOfMessageWithDigest));
        }
    }

    if (messageText == "/digest" || messageText == "/Digest") {
        bool qSendMessage = false;
        long long delay = 50000; // There is delay

        if (stackList.size() > 0) {
            // delete all obsolotte digest messages
            qSendMessage = deleteObsolotteDigestMessages(date.toLongLong() - delay);
        }

        if (qSendMessage) {
            // Generate Bot Answer
            QString botAnswer;
            // Count of digest messages from chat
            int countOfMessage = getCountOfChatDigestMessages(i_chatID);
            botAnswer = "Hola, amigos!\nThere is 24-hour digest of this chat:\n"; // To Catch phrase
            for (int i = 0; i < stackList.size(); ++i) {
                if (stackList.at(i).chatId == i_chatID) {
                    QString endLine = ";\n";
                    botAnswer += stackList.at(i).message + endLine;
                }
            }

            botAnswer.chop(1); // Delete new line
            botAnswer.replace(botAnswer.length() -  1, 1, '.');

            if (countOfMessage > 0) {
                sendMessageByGH(i_chatID, botAnswer);
            } else {
                noMessages(i_chatID);
            }
        } else {
            noMessages(i_chatID);
        }
    }

    // DEBUG SECTION
    if (messageText == "/stack") { // Show messages in all chats!
        QString stack = "\n";
        int sizeStack = stackList.size();
        if (sizeStack) {
            for (int i = 0; i < sizeStack; ++i) {
                stack += QString::number(stackList.at(i).chatId) + ' ';
                stack += QString::number(stackList.at(i).date) + ' ';
                stack += stackList.at(i).message + '\n';
            }
            sendMessageByGH(i_chatID, stack);
        } else {
            sendMessageByGH(i_chatID, "Sorry: no stack!");
        }
    }
    // clearStack
    // hello
    // END DEBUG SECTION
}

GadgetHackwrench::GadgetHackwrench(QObject *parent) :
    QObject(parent),
    countOfMessageWithDigest(0)
{ }

GadgetHackwrench::~GadgetHackwrench()
{ }

QString Widget::getUnixTime()
{
    return QString::number(QDateTime::currentMSecsSinceEpoch()) + " : ";
}

Widget::Widget(QWidget *parent) :
    QWidget(parent),
    discussion1(false),
    discussion2(false),
    ui(new Ui::Widget)
{
    ui->setupUi(this);

    gadgetHackwrench = new GadgetHackwrench;

    startTimer(300);

    connect(gadgetHackwrench, SIGNAL(sendMessageToChat(int, QString)), this, SLOT(reciveMsg(int, QString)));
}

void Widget::on_pushButton_clicked()
{
    QString plainText = ui->textEdit->toPlainText();
    if (!QString(plainText).isEmpty()) {
        QString message = getUnixTime() + plainText;
        ui->listWidget->addItem(QString("-> Me: %1").arg(message));
        ui->listWidget->scrollToBottom();
        gadgetHackwrench->getMessageFromChat(first, message);
    }
    ui->textEdit->clear();
}

void Widget::on_pushButton_2_clicked()
{
    discussion1 = !discussion1;
}

void Widget::on_pushButton_3_clicked()
{
    QString plainText = ui->textEdit_2->toPlainText();
    if (!QString(plainText).isEmpty()) {
        QString message = getUnixTime() + plainText;
        ui->listWidget_2->addItem(QString("-> Me: %1").arg(message));
        ui->listWidget_2->scrollToBottom();
        gadgetHackwrench->getMessageFromChat(second, message);
    }
    ui->textEdit_2->clear();
}

void Widget::on_pushButton_4_clicked()
{
    discussion2 = !discussion2;
}

void Widget::reciveMsg(int chatId, QString msg)
{
    if (chatId == first) {
        ui->listWidget->addItem(msg);
        ui->listWidget->scrollToBottom();
    } else if (chatId == second) {
        ui->listWidget_2->addItem(msg);
        ui->listWidget_2->scrollToBottom();
    }
}

void Widget::timerEvent(QTimerEvent */*event*/)
{
    int randomNumber = rand();

    if (discussion1) {
        QString message = getUnixTime() + QString::number(randomNumber);
        if (!(randomNumber % 10)) {
            message += " #digest";
        }
        ui->listWidget->addItem(QString("-> System: %1").arg(message));
        ui->listWidget->scrollToBottom();
        gadgetHackwrench->getMessageFromChat(first, message);
    }

    if (discussion2) {
        QString message = getUnixTime() + QString::number(randomNumber);
        if (!(randomNumber % 15)) {
            message += " #digest";
        }
        ui->listWidget_2->addItem(QString("-> System: %1").arg(message));
        ui->listWidget_2->scrollToBottom();
        gadgetHackwrench->getMessageFromChat(second, message);
    }
}

Widget::~Widget()
{
    delete ui;
}
