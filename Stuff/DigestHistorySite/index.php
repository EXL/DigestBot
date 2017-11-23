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

const postsPP = 50;

$url = $_SERVER['HTTP_HOST'] . "/digest";
$page = $_GET['pg'];

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Set UTF-8 charset for DB responses
if (!$conn->set_charset("utf8")) {
    die("Set UTF-8 charset failed.");
}

// Get count of digests records in DB
$sql = "SELECT COUNT(*) FROM digests";
$result = $conn->query($sql);
if ($result->num_rows > 0) {
    $count = $result->fetch_row()[0];
} else {
    die("0 results.");
}

$pg_count = intval($count / postsPP);

// echo "Debug: " . $count . " " . $page . " " . $url . "<br>";
echo $main_append1;

if (!$page) {
    $page = $pg_count+1;
}

function pl_pager($curr, $all, $url, $p1, $p2) {
    echo $p1;
    for ($i = 0; $i < $all; ++$i) {
        if ($i == $curr-1) {
            echo '<span class="pagecurrent">';
        } else {
            echo '<span class="pagelink">';
        }
        echo "<a href=\"//" . $url . "?pg=" . strval($i+1) .
            "\" title=\"Page " . strval($i+1) . "\">" .
            strval($i+1) . "</a></span> ";
    }
    if ($all == $curr-1) {
        echo '<span class="pagecurrent">';
    } else {
        echo '<span class="pagelink">';
    }
    echo "<a href=\"//" . $url ."\"/>" . strval($all+1) . "</a></span>";
    echo $p2;
}

echo $css;
echo $header_append1 . "<a title='Новости чата MotoFan.Ru, последняя страница' href=\"//" .
    $url ."\"/>" . $header_append2 . "</a>" . $header_append3 .
    "<a title='Новости чата MotoFan.Ru, последняя страница' href=\"//" .
    $url ."\"/>" . $header_append4 . "</a>" . $header_append5;

pl_pager($page, $pg_count, $url, $pager_append1, $pager_append2);

echo $header_thread;

$sql = "SELECT num, date, username, grp, avatar, msg FROM digests LIMIT "
    . strval(($page - 1) * postsPP) . "," . postsPP;
$result = $conn->query($sql);
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        echo $post_append1 . $row["username"] . $post_append2 .
             $row["date"] . $post_append3 . $row["num"] . $post_append4 .
             $row["avatar"] . "<br><br>" . $row["grp"] . $post_append5 .
             $row["msg"] . $post_append6;
    }
} else {
    echo "0 results.";
}

pl_pager($page, $pg_count, $url, $pager_append1, $pager_append2);

echo $footer;
echo $main_append2;

$conn->close();
