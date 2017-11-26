// ImportDigestToDB.js
// See README.md for Install and Usage instructions
// EXL, 23-NOV-2017

process.chdir(__dirname);

const Fs = require("fs");
const Zlib = require("zlib");
const Tar = require("tar-stream");
const MySQL = require("mysql");
const Http = require("http");

const DigestFile = "DigestBotStackLog.json";
const ConfigDB = getJSONFile("DataBaseConfig.json");
const TmpDir = "/tmp/";

var MapDB = new Map();
var UserAvs = new Map();

function main() {
    if (parseInt(process.argv.length) !== 4) {
        console.error("Usage.\n" +
            "1. Add digest post to DB:\n\t$ node ImportDigestToDB.js <backup-dir> <chat-id>\n" +
            "2. Show chat ids:\n\t$ node ImportDigestToDB.js <backup-dir> 0\n" +
            "3. Show users:\n\t$ node ImportDigestToDB.js <backup-dir> users");
        process.exit(1);
    } else {
        console.log("++++= Started at: " + getDate(parseInt(Date.now() / 1000)).toString());
        readFiles(process.argv[2], process.argv[3]); // 2 - backupDir, 3 - chatId or parameter
    }
}

function readFiles(aBackupDir, aChatId) {
    var gzFiles = [];
    Fs.readdir(aBackupDir, function(aErr, aFiles) {
        if (!aErr) {
            aFiles.forEach(function(aName) {
                if (aName.endsWith(".tar.gz")) {
                    gzFiles.push(aName);
                }
            });
            processArchiveFiles(gzFiles, aBackupDir, aChatId);
        } else {
            console.error("Cannot read " + aBackupDir + " directory!");
            process.exit(1);
        }
    });
}

function decompressTarBall(aFilename, aChatId) {
    return new Promise(function(resolve) {
        var extract = Tar.extract();
        var stream = Fs.createReadStream(aFilename).pipe(Zlib.createGunzip()).pipe(extract);
        var data = "";
        extract.on("entry", function(header, stream, cb) {
            stream.on("data", function(chunk) {
                if (header.name.toString() === DigestFile) {
                    data += chunk;
                }
            });
            stream.on("end", function() {
                cb();
            });
            stream.resume();
        });
        extract.on("finish", function() {
            process.stdout.write("Processing file " + aFilename + "... ");
            // 1. Create JSON File
            Fs.writeFileSync(TmpDir + DigestFile, data);
            // 2. Process JSON File
            processJSONFile(getJSONFile(TmpDir + DigestFile), aChatId);
            // 3. Delete JSON File
            Fs.unlinkSync(TmpDir + DigestFile);
            // 4. Done!
            resolve(stream);
            process.stdout.write("done.\n");
        });
    });
}

function toExit() {
    console.log("++++= Ended at: " + getDate(parseInt(Date.now() / 1000)).toString());
    process.exit(0);
}

function processArchiveFiles(aGzFiles, aBackupDir, aChatId) {
    var nameDir = (parseInt(aBackupDir.indexOf("/")) === -1) ? aBackupDir + "/" : aBackupDir;

    var times = aGzFiles.length;
    var current = 0;
    (function nextLapPr() {
        if (current >= times) {
            if (parseInt(aChatId) === 0) {
                // 5. Show All ChatId's
                console.log("\n===== All ChatId's:");
                showMap(MapDB);
                toExit();
            } else if (aChatId.toString() === "users") {
                // 6. Show All Users
                console.log("\n===== All Users:");
                showMap(MapDB);
                toExit();
            } else {
                // 7. Get User Avatars
                getUserAvatars(MapDB, aChatId);
            }
            return;
        }
        decompressTarBall(nameDir + aGzFiles[current], aChatId).then(function() {
            ++current;
            nextLapPr();
        });
    })();
}

function getUserAvatars(aMap, aChatId) {
    var uniqs = new Map();
    aMap.forEach(function(aValue) {
        uniqs.set(aValue.user, null);
    });
    var listUsers = [];
    uniqs.forEach(function(aValue, aKey) {
        listUsers.push(aKey);
    });

    var times = listUsers.length;
    var current = 0;
    (function nextLapUa() {
        if (current >= times) {
            // 8. Push All data to DataBase
            connectToDataBase(ConfigDB, aChatId);
            return;
        }
        process.stdout.write("Getting avatar for @" + listUsers[current] + " user... ");
        walkToProfilePages(listUsers[current]).then(function() {
            process.stdout.write("done.\n");
            ++current;
            nextLapUa();
        });
    })();
}

function walkToProfilePages(aName) {
    return new Promise(function(resolve) {
        // setTimeout(() => {
        //     resolve();
        // }, 2000); // Delay 2 sec...
        Http.request({
            host: "t.me",
            path: "/" + aName
        }, function(response) {
            var str = "";
            response.on("data", function(chunk) {
                str += chunk;
            });
            response.on("end", function() {
                UserAvs.set(aName, cutImageLink(str));
                resolve(response);
            });
        }).end();
    });
}

function cutImageLink(aPage) {
    var part1 = aPage.slice(aPage.indexOf('<meta property="og:image"'),
        aPage.indexOf('<meta property="og:site_name"'));
    return part1.slice(part1.indexOf('http'), part1.indexOf('">'));
}

function showMap(aMap) {
    aMap.forEach(function(aValue, aKey) {
        console.log(aKey);
    });
}

function getJSONFile(aFilename) {
    return JSON.parse(Fs.readFileSync(aFilename, "utf-8"));
}

function processJSONFile(aJson, aChatId) {
    aJson.forEach(function(aObject) {
        if (parseInt(aChatId) === 0) {
            MapDB.set(aObject.s_chatID, null);
        } else if (parseInt(aObject.s_chatID) === parseInt(aChatId)) {
            var struct = {
                "user": aObject.s_username,
                "msg": aObject.s_message
            };
            //if (!MAP.get(aObject.s_date)) { // Fix strange bugs with broken symbols.
            // 2.1. Generate Unique Messages by Date
            MapDB.set(aObject.s_date, struct);
            //}
        } else if (aChatId.toString() === "users") {
            MapDB.set(aObject.s_username, null);
        }
    });
}

function getDate(aDate) {
    var date = new Date(0);
    var m = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
        "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    date.setUTCSeconds(aDate);
    return "Дата: " + ('0' + date.getDate()).slice(-2) + "-" + m[date.getMonth()] + "-" + date.getFullYear() + " | Время: " +
        addLeadZeros(date.getHours()) + ":" + addLeadZeros(date.getMinutes()) + ":" + addLeadZeros(date.getSeconds());
}

function addLeadZeros(aDigit) {
    return ('0' + (aDigit + 1)).slice(-2);
}

function getUserAvatar(aUserName) {
    if (!aUserName) return "Без аватарки";
    return '<img width="128px" height="128px" title="' + aUserName + '" src="' + UserAvs.get(aUserName) + '"/>';
}

function getPostNumber(aNum) {
    return '<ins>Сообщение №' + aNum + '</ins>';
}

function getGroup(aUserName, aChatId) {
    if (!aUserName) return "Группа: Неизвестные";
    if (aChatId.toString() === "-1001045117849") {
        if (aUserName.toString() === "exlmoto") {
            return "Группа: Модераторы";
        } else if (aUserName.toString() === "ZorgeR") {
            return "Группа: Администраторы";
        }
    }
    return "Группа: Пользователи";
}

function getUserName(aName) {
    if (!aName) return "Гость";
    if (aName.toString() === "exlmoto") {
        return '<a href="https://t.me/' + aName +'" title="@' + aName + '" target="_blank"><span style="color:blue">'
            + aName + '</span></a>';
    } else if (aName.toString() === "ZorgeR") {
        return '<a href="https://t.me/' + aName +'" title="@' + aName + '" target="_blank"><span style="color:red">'
            + aName + '</span></a>';
    }
    return '<a href="https://t.me/' + aName +'" title="@' + aName + '" target="_blank">' + aName + '</a>';
}

function getUserMessage(aMsg) {
    aMsg = filterMessage(aMsg, " ");
    return filterMessage(aMsg, "\n");
}

// https://stackoverflow.com/a/7760578
function escSqlString(str) {
    return (str) ? str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function(char) {
        switch (char) {
            case "\0":
                return "\\0";
            case "\x08":
                return "\\b";
            case "\x09":
                return "\\t";
            case "\x1a":
                return "\\z";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\"":
            case "'":
            case "\\":
            case "%":
                return "\\"+char; // prepends a backslash to backslash, percent,
                                  // and double/single quotes
        }
    }) : "undefined";
}

function filterMessage(aMsg, aFilter) {
    return aMsg.split(aFilter).map(function(aWord) {
        if (parseInt(aWord.indexOf("@")) === 0) {
            aWord = getUserName(aWord.slice(1));
        } else if (parseInt(aWord.indexOf("http://")) === 0
            || parseInt(aWord.indexOf("https://")) === 0) {
            aWord = makeLink(aWord);
        }
        return aWord;
    }).join(aFilter);
}

function makeLink(aLink) {
    return '<a href="' + aLink + '" title="' + aLink + '" target="_blank">' + aLink + '</a>';
}

function connectToDataBase(aSettings, aChatId) {
    var con = MySQL.createConnection({
        host: aSettings.host,
        user: aSettings.user,
        password: aSettings.password,
        database: aSettings.database,
        charset: 'utf8mb4'
    });

    con.connect(function(err) {
        if (err) {
            throw err;
        }
        console.log("SQL: Connected to " + aSettings.host + "!");
        runSqlQuery(con, "DROP TABLE IF EXISTS digests;");
        runSqlQuery(con, "CREATE TABLE digests " +
            "(num TEXT, date TEXT, username TEXT, grp TEXT, avatar TEXT, msg TEXT) " +
            "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
        console.log("SQL: Table digests created.");

        var arr = Array.from(MapDB);
        var times = arr.length;
        var current = 0;
        (function nextLapDb() {
            if (current >= times) {
                console.log("SQL: " + current + " digests are stored to the DB.");
                con.end();
                toExit();
                return;
            }
            process.stdout.write("Commit digest #" + (current+1) + "... ");
            runSqlQuery(con, "INSERT INTO digests (num, date, username, grp, avatar, msg) VALUES ('" +
                escSqlString(getPostNumber(current+1)) + "', '" +
                escSqlString(getDate(arr[current][0])) + "', '" +
                escSqlString(getUserName(arr[current][1].user)) + "', '" +
                escSqlString(getGroup(arr[current][1].user, aChatId)) + "', '" +
                escSqlString(getUserAvatar(arr[current][1].user)) + "', '" +
                escSqlString(getUserMessage(arr[current][1].msg)) + "');").then(function() {
                    process.stdout.write("done.\n");
                    ++current;
                    nextLapDb();
            });
        })();
    });
}

function runSqlQuery(aCon, aQuery) {
    return new Promise(function(resolve) {
        aCon.query(aQuery, function(err, result) {
            if (err) {
                throw err;
            }
            if (result) {
                resolve(aCon);
            }
        });
    });
}

main();
