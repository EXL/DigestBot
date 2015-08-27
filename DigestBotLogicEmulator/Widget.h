#ifndef WIDGET_H
#define WIDGET_H

#include <QWidget>
#include <QList>

namespace Ui {
class Widget;
}

class QTimerEvent;
class GadgetHackwrench;

class Widget : public QWidget
{
    Q_OBJECT

    bool discussion1;
    bool discussion2;

    GadgetHackwrench *gadgetHackwrench;

public:
    static QString getUnixTime();

public:
    explicit Widget(QWidget *parent = 0);
    ~Widget();

private slots:
    void on_pushButton_clicked();
    void on_pushButton_2_clicked();
    void on_pushButton_3_clicked();
    void on_pushButton_4_clicked();

public slots:
    void reciveMsg(int, QString);

protected:
    void timerEvent(QTimerEvent *event);

private:
    Ui::Widget *ui;
};

class GadgetHackwrench : public QObject
{
    Q_OBJECT

    int countOfMessageWithDigest;

    struct MessageInfo {
        int chatId;
        long long date;
        QString message;
    };

    QList<MessageInfo> stackList;

signals:
    void sendMessageToChat(int, QString);

private:
    void sendMessageByGH(int chatId, const QString &msg);
    void noMessages(int chatId);
    QString getMessageText(const QString &msg, bool date) const;
    int getCountOfChatDigestMessages(int chatID) const;
    QString normalizeMessage(QString &msg) const;
    bool deleteObsolotteDigestMessages(long long dateObsolette);

public:
    void getMessageFromChat(int i_chatID, const QString &msg);

public:
    explicit GadgetHackwrench(QObject *parent = 0);
    ~GadgetHackwrench();
};

#endif // WIDGET_H
