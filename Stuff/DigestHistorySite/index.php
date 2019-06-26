<?php
/**
 * Created by IntelliJ IDEA.
 * User: exl
 * Date: 11/22/17
 * Time: 10:32 AM
 * See README.md for instructions and usage
 */

include_once 'config.php';
include_once 'templates.php';

const postsPP = 20;
const paginPP = 5;

date_default_timezone_set("Europe/Moscow");
$date = date_create();

$url = filter_input(INPUT_SERVER, 'HTTP_HOST') . $upath;
$page = filter_input(INPUT_GET, 'pg');

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Set UTF-8 charset for DB responses
if (!$conn->set_charset("utf8mb4")) {
    die("Set UTF-8 charset failed.");
}

// Get count of digests records in DB
$sql = "SELECT COUNT(*) FROM digests";
$result_c = $conn->query($sql);
if ($result_c->num_rows > 0) {
    $count = $result_c->fetch_row()[0];
} else {
    die("0 results.");
}

$pg_count = intval(($count - 1) / postsPP);

echo $main_append1;

if (!$page) {
    $page = $pg_count+1;
}
// echo "Debug: " . $count . " " . $page . " " . $url . " " . $pg_count . " " . "<br>";

function pl_pager($curr, $all, $url, $p1, $p2) {
    if ($all < 1) {
        echo '<br>';
        return;
    }
    echo $p1;

    $all++;
    $start = $curr - (floor(paginPP / 2) + 1);
    if ($start < 0) {
        $start = 0;
    }
    $end = $curr + floor(paginPP / 2);
    if ($end > $all) {
        $end = $all;
    }

    echo '<span class="pagelink" id="page-jump-1">' . strval($all) . " страниц:" . '</span>&nbsp;';
    if ($start > 0) {
        echo '<span class="pagelink">' . "<a href=\"//" . $url . "?pg=1\" title=\"Page 1\">" .
            "«" . "</a></span>&nbsp;";
    }
    if ($curr > 1) {
        echo '<span class="pagelink">' . "<a href=\"//" . $url . "?pg=" . strval($curr-1) .
            "\" title=\"Page " . strval($curr-1) . "\">" .
            "<" . "</a></span>&nbsp;";
    }
    for ($i = $start; $i < $end; ++$i) {
        if ($i == $curr-1) {
            echo '<span class="pagecurrent">';
        } else {
            echo '<span class="pagelink">';
        }
        echo "<a href=\"//" . $url . "?pg=" . strval($i+1) .
            "\" title=\"Page " . strval($i+1) . "\">" .
            strval($i+1) . "</a></span>&nbsp;";
    }
    if ($curr < $all) {
        echo '<span class="pagelink">' . "<a href=\"//" . $url . "?pg=" . strval($curr+1) .
            "\" title=\"Page " . strval($curr+1) . "\">" .
            ">" . "</a></span>&nbsp;";
    }
    if ($end < $all) {
        echo '<span class="pagelink">' . "<a href=\"//" . $url . "?pg=" . strval($all) .
            "\" title=\"Page " . strval($all) . "\">" .
            "»" . "</a></span>&nbsp;";
    }

    echo $p2;
}

function filter_avatars($a_link, $a_name) {
    if ($a_link === "0" || $a_name === "0") {
        return "Без аватарки";
    }
    return '<img width="128px" height="128px" title="' . $a_name . '" src="' . $a_link . '"/>';
}

function filter_group($a_name) {
    if ($a_name === "0") {
        return "Группа: Неизвестные";
    }
    if (in_array($a_name, $GLOBALS["admins"])) {
        return "Группа: Администраторы";
    }
    if (in_array($a_name, $GLOBALS["moders"])) {
        return "Группа: Модераторы";
    }
    if (in_array($a_name, $GLOBALS["coords"])) {
        return "Группа: Координаторы";
    }
    return "Группа: Пользователи";
}

function filter_username($a_name) {
    if ($a_name === "0") {
        return "Гость";
    }
    if (in_array($a_name, $GLOBALS["admins"])) {
        return '<a href="https://t.me/' . $a_name . '" title="@' . $a_name . '" target="_blank"><span style="color:red">'
            . $a_name . '</span></a>';
    }
    if (in_array($a_name, $GLOBALS["moders"])) {
        return '<a href="https://t.me/' . $a_name . '" title="@' . $a_name . '" target="_blank"><span style="color:blue">'
            . $a_name . '</span></a>';
    }
    if (in_array($a_name, $GLOBALS["coords"])) {
        return '<a href="https://t.me/' . $a_name . '" title="@' . $a_name . '" target="_blank"><span style="color:purple">'
            . $a_name . '</span></a>';
    }
    return '<a href="https://t.me/' . $a_name . '" title="@' . $a_name . '" target="_blank">' . $a_name . '</a>';
}

function filter_username_non_links($a_name) {
    $name_f = substr($a_name, 1);
    if ($a_name === "0") {
        return "Гость";
    }
    if (in_array($name_f, $GLOBALS["admins"])) {
        return '<span style="color:red">' . $a_name . '</span>';
    }
    if (in_array($name_f, $GLOBALS["moders"])) {
        return '<span style="color:blue">' . $a_name . '</span>';
    }
    if (in_array($name_f, $GLOBALS["coords"])) {
        return '<span style="color:purple">' . $a_name . '</span>';
    }
    return $a_name;
}

function filter_num($a_num) {
    return "<a href=\"//" . $GLOBALS["url"] . "?pg=" . strval($GLOBALS["page"]) . "#" . $a_num .
    "\" id=\"" . $a_num . "\" title=\"Сообщение №" . strval($a_num) . "\">" .
    "Сообщение №" . $a_num . "</a>";
}

function filter_message($a_msg) {
    // Move this to JavaScript Import script.
    // $a_msg = make_links_clickable($a_msg);
    // And this one for colorizing nicknames:
    $a_msg = make_users_clickable($a_msg);
    return $a_msg;
}

// https://stackoverflow.com/a/5341330
function make_links_clickable($text) {
    return preg_replace('!(((f|ht)tp(s)?://)[-a-zA-Zа-яА-Я()0-9@:%_+.~#?&;//=]+)!i',
        '<a href="$1" title="$1" target="_blank">$1</a>', $text);
}

function make_users_clickable($text) {
    return preg_replace_callback('/>(\B\@\w+\b)</',
        function ($matches) {
            return replace_at_to_link_aux($matches[0]);
        },
        $text);
}

function replace_at_to_link_aux($username) {
    $username = substr($username, 1);
    $username = substr($username, 0, strlen($username) - 1);
    return '>' . filter_username_non_links($username) . '<';
}

function filter_date($a_date) {
    date_timestamp_set($GLOBALS["date"], $a_date);
    return date_format($GLOBALS["date"], 'Дата: d-M-Y | Время: H:i:s');
}

function get_base64_image($a_username) {
    global $conn, $url;
    $a_sql = "SELECT avatar FROM digests_users WHERE username ='" . $a_username . "'";
    $a_result = $conn->query($a_sql);
    if($row = $a_result->fetch_assoc()) {
        return $row['avatar'];
    }
    return "//" . $url . "/img/t_logo.png";
}

echo $css;
echo $header_append1 . "<a title='Новости чата MotoFan.Ru, последняя страница' href=\"//" .
    $url ."\"/>" . $header_append2 . "</a>" . $header_append3 .
    "<a title='Новости чата MotoFan.Ru, последняя страница' href=\"//" .
    $url ."\"/>" . $header_append4 . "</a>" . $header_append5;

pl_pager($page, $pg_count, $url, $pager_append1, $pager_append2);

echo str_replace("%chat_id%", $chat_id, $header_thread);

$sql = "SELECT date, username, msg FROM digests LIMIT "
    . strval(($page - 1) * postsPP) . "," . postsPP;
$result = $conn->query($sql);
if ($result->num_rows > 0) {
    $start_cnt = ($page - 1) * postsPP + 1;
    while ($row = $result->fetch_assoc()) {
        $t_username = $row["username"];
        echo $post_append1 .
             filter_username($t_username) .
             $post_append2 .
             filter_date($row["date"]) .
             $post_append3 .
             filter_num($start_cnt++) .
             $post_append4 .
             filter_avatars(get_base64_image($t_username), $t_username) . "<br><br>" .
             filter_group($t_username) .
             $post_append5 .
             filter_message($row["msg"]) . $post_append6;
    }
} else {
    echo "0 results.";
}

pl_pager($page, $pg_count, $url, $pager_append1, $pager_append2);

echo str_replace("%year_c%", date("Y"), $footer);
echo $main_append2;

$conn->close();
