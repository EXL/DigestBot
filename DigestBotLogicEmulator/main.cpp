#include "Widget.h"
#include <QApplication>

#include <cstdlib>
#include <ctime>

int main(int argc, char *argv[])
{
    QApplication a(argc, argv);
    srand(time(0));
    Widget w;
    w.show();

    return a.exec();
}
