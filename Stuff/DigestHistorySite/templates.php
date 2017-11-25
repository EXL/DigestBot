<?php
/**
 * Created by IntelliJ IDEA.
 * User: exl
 * Date: 11/22/17
 * Time: 1:47 PM
 */

$main_append1 = '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta property="og:title" content="MotoFan.Ru в конференции Telegram!">
    <meta property="og:image" content="img/logo4.gif">
    <meta property="og:site_name" content="MotoFan.Ru в конференции Telegram!">
    <meta property="og:description" content="Вы можете прочитать здесь все новости и сообщения конференции с тегом #digest.">
    <title>Новости MotoFan.Ru в конференции Telegram</title>
</head>
<body>';
$main_append2 = '</body>
</html>';

$header_append1 = '<table cellspacing="0" cellpadding="0" border="0" width="100%">
<tbody><tr>
    <td rowspan="3" class="nopad" align="left" valign="top" width="370">';
$header_append2 = '<img src="img/logo4.gif" style="vertical-align:top" border="0" width="370" height="200">';
$header_append3 = '</td>
<td rowspan="3" class="nopad" align="left" valign="top" width="141">';
$header_append4 = '<img src="img/header_2.gif" style="vertical-align:top" border="0" width="141" height="200">';
$header_append5 = '</td>
    <td class="nopad" align="left" valign="top" width="52" height="103">
<img src="img/header_3.gif" style="vertical-align:top" border="0" width="52" height="103"></td>
    <td class="nopad" align="left" valign="top" width="335" height="103">
<img src="img/header_5.gif" style="vertical-align:top" border="0" width="335" height="103"></td>
    <td class="nopad" align="left" valign="top" width="100%" height="103">
<img src="img/header_6.gif" style="vertical-align:top" border="0" width="100%" height="103"></td>
  </tr>
  <tr>
    <td colspan="3" height="47">
    </td>
  </tr>
  <tr>
    <td colspan="3" height="50">
<div id="submenu_">
<p class="home">
<b>
•
<a href="http://motofan.ru" target="_blank">Сайт</a> •
<a href="http://forum.motofan.ru/index.php?act=Search&amp;f=197">Поиск</a> •
<a href="http://forum.motofan.ru/index.php?act=Members">Пользователи</a> •
<a href="http://wiki.motofan.ru" target="_blank">MotoWiki</a> •
<a href="http://forum.motofan.ru/index.php?act=announce&amp;f=70&amp;id=17">Правила форума</a> •
<a href="http://twitter.com/MotoFanRu" target="_blank">Twitter</a> •
<a href="http://motofan.ru/rss_feed.php" target="_blank">RSS</a> •
<a href="http://forum.motofan.ru/index.php?act=rating&amp;CODE=show">Журнал рейтинга</a>&nbsp;•
<a href="http://forum.motofan.ru/index.php?showforum=12" target="_blank">Магазин</a> •
</b>
</p>
</div>
    </td>
  </tr>
</tbody></table>';

$header_thread = '<div class="maintitle" style="padding:4px">
   <table style="padding:0px; height: 35px;" cellspacing="0" cellpadding="0" width="100%">
    <tbody>
        <tr>
            <td style="word-wrap:break-word;" \'="" width="98%">
                <div>
                    <img src="img/nav_m.gif" title="Вперёд!" alt=">" border="0" width="8" height="8">&nbsp;
                    <b>Новости конференции MotoFan.Ru в Telegram</b>, Собранные сообщения с тегом <i>#digest</i>
                    <span style="float:right;">
                        Chat ID: -1001045117849,
                        <a href="http://t.me/motofan_ru" style="color:darkred" target="_blank" title="Чат MotoFan.Ru в Telegram"><ins>@motofan_ru</ins></a>
                    </span>
                </div>
            </td>
        </tr>
    </tbody>
  </table>
</div>';

$footer = '<div class="copyright" align="center">
    <div>Создано при помощи <a href="http://t.me/Digest_bot" style="text-decoration:none" target="_blank" title="@Digest_bot в Telegram">@Digest_bot</a></div>
         © <a href="http://exlmoto.ru" style="text-decoration:none" target="_blank" title="EXL\'s Developer Blog">EXL</a>, 2017.
         Telegram: <a href="http://t.me/exlmoto" style="text-decoration:none" target="_blank" title="@exlmoto в Telegram">@exlmoto</a>
</div>';

$pager_append1 = '<table class="ipbtable" cellspacing="0">
    <tbody>
        <tr>
            <td style="padding-left:0px" valign="middle" width="30%">
                <div>';
$pager_append2 = '</div>
            </td>
        </tr>
    </tbody>
</table>';

$post_append1 = '<table class="ipbtable" cellspacing="0">
    <tr>
        <td class="row2" style="border-right:1px solid white;border-top:1px solid white;" valign="middle" width="1%">
            <span class="normalname">';
$post_append2 = '</span>
        </td>
        <td class="row2" style="border-top:1px solid white;" valign="top" width="99%">
            <div style="float: left;">
                <span class="postdetails"><img src="img/to_post_off.gif" style="padding-bottom:2px" border="0"> ';
$post_append3 = '</span>
            </div>
            <div align="right">
                <span class="postdetails" style="color:black">';
$post_append4 = '</span>
            </div>
        </td>
    </tr>
    <tr>
        <td class="post1" rowspan="2" style="border:1px solid white;border-left:none;min-width:128px;" valign="top">
            <span class="postdetails">';
$post_append5 = '</span>
        </td>
        <td class="post1" style="border-top:1px solid white;" valign="top" width="100%">
            <div class="post"><div class="postcolor">';
$post_append6 = '</div></div>
        </td>
    </tr>
    <tr></tr>
    <tr>
        <td class="catend" colspan="2">
        </td>
    </tr>
</table>';

$css = '<style type="text/css">
html
{
    overflow-x: auto;
}

body
{
    background-attachment: fixed;
    background-color: #FFF;
    color: #222;
    font-family: Verdana, Tahoma, Arial, Trebuchet MS, Sans-Serif, Georgia, Courier, Times New Roman, Serif;
    font-size: 11px;
    line-height: 135%;
}

table,
tr,
td
{
    background: transparent;
    color: #222;
    font-size: 11px;
    line-height: 135%;
}

table
{
    width: 100%;
}

td,
.divpad
{
    padding: 5px;
}

td.nopad
{
    padding: 0;
}

form
{
    display: inline;
}

img
{
    vertical-align: middle;
}

#logostrip
{
    background: #F3AE01 url(img/tile_back.gif);
    border: 1px solid #FFF;
    height: 68px;
}

#logographic
{
    background: transparent url(00000000.txt) no-repeat left;
    cursor: pointer;
    height: 68px;
}

#logostripinner
{
    background: transparent url(00000000.txt);
    background-position: right;
    background-repeat: no-repeat;
    height: 68px;
}

a:link,
a:visited,
a:active
{
    background: transparent;
    color: #222;
    text-decoration: underline;
}

a:hover
{
    background: transparent;
    color: #FF6600;
    text-decoration: underline;
}

#ipbwrapper
{
    margin: 0px auto 0px auto;
    text-align: left;
    width: 99%;
}

.pagelink,
.pagelinklast,
.pagecurrent,
.minipagelink,
.minipagelinklast
{
    background: #FFF5E0;
    border: 1px solid #FF6600;
    padding: 1px 3px 1px 3px;
    line-height: 25px;
}

.pagelinklast,
.minipagelinklast
{
    background: #FFEFD4;
}

.pagecurrent
{
    background: #C9A5FF;
}

.minipagelink,
.minipagelinklast
{
    border: 1px solid #FFD37D;
    font-size: 10px;
    margin: 0 1px 0 0;
}

.pagelink a:active,
.pagelink a:visited,
.pagelink a:link,
.pagelinklast a:active,
.pagelinklast a:visited,
.pagelinklast a:link,
.pagecurrent a:active,
.pagecurrent a:visited,
.pagecurrent a:link,
.minipagelink a:active,
.minipagelink a:visited,
.minipagelink a:link,
.minipagelinklast a:active,
.minipagelinklast a:visited,
.minipagelinklast a:link
{
    text-decoration: none;
}

.fauxbutton
{
    background: #FAB486F;
    border: 1px solid #FE9855;
    font-size: 11px;
    font-weight: bold;
    padding: 4px;
}

.fauxbutton a:link,
.fauxbutton a:visited,
.fauxbutton a:active
{
    color: #222 !important;
    text-decoration: none;
}

.forumdesc,
.forumdesc a:link,
.forumdesc a:visited,
.forumdesc a:active
{
    background: transparent;
    font-size: 10px;
    color: #666;
    line-height: 135%;
    margin: 2px 0 0 0;
}

.searchlite
{
    background-color: yellow;
    font-weight: bold;
    color: red;
}

.activeusers
{
    background: #FFF;
    border: 1px solid #FF6600;
    color: #000;
    margin: 0px;
    padding: 1px;
}

.activeuserposting a:link,
.activeuserposting a:visited,
.activeuserposting a:active,
.activeuserposting
{
    font-style: italic;
    text-decoration: none;
    border-bottom: 1px dotted black;
}

fieldset.search
{
    line-height: 150%;
    padding: 6px;
}

label
{
    cursor: pointer;
}

img.attach
{
    background: #808080 url(style_images/madmoto/click2enlarge.gif) no-repeat top right;
    border: 1px solid #808080;
    margin: 0 2px 0 0;
    padding: 11px 2px 2px 2px;
}

.thumbwrap,
.thumbwrapp,
.fullimagewrap
{
    border: 1px solid #FF6600;
    margin: 2px;
}

.thumbwrapp
{
    border: 2px solid #070766;
}

.fullimagewrap
{
    background: #FFF9EC;
    text-align: center;
    margin: 5px 0 5px 0;
    padding: 5px;
}

.thumbwrap h4,
.thumbwrapp h4
{
    background: #E6F2DD;
    border: 0 !important;
    border-bottom: 1px solid #FF822F !important;
    color: #FF822F;
    font-size: 12px;
    font-weight: bold;
    padding: 5px;
}

.thumbwrap p,
.thumbwrapp p
{
    background: #FFF5E0 !important;
    border: 0 !important;
    border-top: 1px solid #FF822F !important;
    margin: 0 !important;
    padding: 5px !important;
    text-align: left;
}

.thumbwrap p.alt,
.thumbwrapp p.alt
{
    background: #FFEFD4 !important;
    margin: 0 !important;
    padding: 5px !important;
    text-align: left;
}

.thumbwrapp p.pin
{
    background: #DFDFEF !important;
    text-align: center !important;
}

.thumbwrap img.galattach,
.thumbwrapp img.galattach
{
    background: #FFF url(style_images/madmoto/img_larger.gif) no-repeat bottom right;
    border: 1px solid #FF6600;
    margin: 5px;
    padding: 2px 2px 10px 2px;
}

li.helprow
{
    margin: 0 0 10px 0;
}

ul#help
{
    padding: 0 0 0 15px;
}

.warngood,
.warnbad
{
    color: #95000B;
    font-weight: bold;
}

.warnbad
{
    color: #0000DD;
}

#padandcenter
{
    margin: 0 auto 0 auto;
    padding: 14px 0 14px 0;
    text-align: center;
}

#profilename
{
    font-size: 28px;
    font-weight: bold;
}

#photowrap
{
    padding: 6px;
}

#phototitle
{
    border-bottom: 1px solid #000;
    font-size: 24px;
}

#photoimg
{
    margin: 15px 0 0 0;
    text-align: center;
}

#ucpmenu,
#ucpcontent
{
    background: #FFF9EC;
    border: 1px solid #548734;
    line-height: 150%;
}

#ucpmenu p
{
    padding: 2px 5px 6px 9px;
}

#ucpmenu a:link,
#ucpmenu a:active,
#ucpmenu a:visited
{
    text-decoration: none;
}

#ucpcontent
{
    width: auto;
}

#ucpcontent p
{
    padding: 10px;
}

.activeuserstrip
{
    background: #FFDFA7;
    padding: 6px;
}

.signature
{
    background: transparent;
    color: #FF7810;
    font-size: 10px;
    line-height: 150%;
}

.postdetails
{
    font-size: 10px;
    line-height: 140%;
}

.postcolor
{
    font-size: 12px;
    line-height: 160%;
}

.normalname
{
    color: #003;
    font-size: 12px;
    font-weight: bold;
}

.normalname a:link,
.normalname a:visited,
.normalname a:active
{
    font-size: 12px;
}

.post1,
.bg1
{
    background: #FFF9EC;
}

.post2,
.bg3
{
    background: #FFF5E0;
}

.post
{
    min-height: 200px;
}

.row2shaded,
.post1shaded
{
    background-color: #DBE4DE;
}

.row4shaded,
.post2shaded
{
    background-color: #DFE7E3;
}

.row1
{
    background: #FFEFD4;
}

.row2
{
    background: #FFEFD4;
}

.row3
{
    background: #FFEFD4;
}

.darkrow1
{
    background: #FFDFA7;
    color: #C00101;
}

.darkrow3
{
    background: #FFE7BD;
    color: #C00101;
}

.plainborder,
.tablefill,
.tablepad
{
    background: #FFF9EC;
    border: 1px solid #548734;
}

.tablefill,
.tablepad
{
    padding: 6px;
}

.tablepad
{
    border: 0 !important;
}

.wrapmini
{
    float: left;
    line-height: 1.5em;
    width: 25%;
}

.pagelinks
{
    float: left;
    line-height: 1.2em;
    width: 35%;
}

td span,
.desc
{
    font-size: 11px;
    color: #495143;
}

.lastaction
{
    font-size: 10px;
    color: #494349;
}

.edit
{
    font-size: 9px;
}

.thin
{
    border: 1px solid #FFF;
    line-height: 150%;
    margin: 2px 0 2px 0;
    padding: 6px 0 6px 0;
}

.calmonths
{
    background: #FFF5E0;
    border: 1px solid #FFD37D;
    font-size: 18px;
    font-weight: bold;
    margin: 5px 0 5px 0;
    padding: 8px;
    text-align: center;
}

.weekday
{
    font-size: 14px;
    font-weight: bold;
}

.calmonths a
{
    text-decoration: none;
}

.calday,
.calweekday
{
    background: #FFEFD4;
    color: #666;
    font-size: 11px;
    font-weight: bold;
    padding: 4px;
    text-align: right;
}

.calweekday
{
    border-right: 1px solid #AAA;
    color: #222;
    font-size: 14px;
    padding: 6px;
    text-align: center;
}

.cellblank,
.celldate,
.celltoday,
.mcellblank,
.mcelldate,
.mcelltoday
{
    background: #FFF5E0;
    height: 100px;
    vertical-align: top;
}

.mcellblank,
.mcelldate,
.mcelltoday
{
    height: auto;
}

.cellblank,
.mcellblank
{
    background: #FFD37D;
}

.celltoday,
.mcelltoday
{
    border: 2px solid #00008B;
}

input,
textarea,
select
{
    background: #FFF;
    border: 1px solid #FE9855;
    color: #000;
    font-family: verdana, helvetica, sans-serif;
    font-size: 11px;
    margin: 5px;
    padding: 2px;
    vertical-align: middle;
}

select
{
    font-family: verdana, helvetica, sans-serif;
    font-size: 12px;
}

input.button
{
    width: auto;
}

optgroup option
{
    font-family: verdana, helvetica, sans-serif;
    font-size: 12px;
}

.codebuttons
{
    font-family: Verdana, Helvetica, Sans-Serif;
    font-size: 10px;
    vertical-align: middle;
    margin: 2px;
}

.textarea,
.searchinput,
.button,
.gobutton
{
    background: #FFF;
    border: 1px solid #FE9855;
    color: #000;
    font-family: Verdana, Helvetica, Sans-Serif;
    font-size: 11px;
    padding: 2px;
    vertical-align: middle;
}

.button
{
    background: #FFEFD4;
}

.gobutton
{
    background: transparent;
    color: #FF6600;
    vertical-align: middle;
}

.radiobutton,
.checkbox,
.helpbox
{
    vertical-align: middle;
}

.formtable
{
    background: transparent;
}

.formtable td,
.pformleft,
.pformleftw,
.pformright
{
    background: #FFF9EC;
    border: 1px solid #FFD37D;
    font-weight: bold;
    margin: 1px 0 0 0;
    padding: 6px;
    width: 25%;
}

.formtable td.wider,
.pformleftw,
.pformright
{
    width: 40%;
}

.formtable td.formright,
.pformright
{
    font-weight: normal;
    width: auto;
}

.formtable td.formtitle,
.formsubtitle
{
    background: #FFE7BD;
    border: 1px solid #B9D49F;
    font-weight: normal;
}

.formsubtitle
{
    color: #C00101;
    font-weight: bold;
    padding: 5px;
}

.formtable td.formstrip
{
    background: #E8F2DD;
    border: 1px solid #B9D49F;
    font-weight: normal;
}

.quotetop
{
    background: #ffe7bd url(style_images/madmoto/css_img_quote.png) no-repeat right;
    margin: 1px auto 0 auto;
    padding: 1px 1px 1px 5px;
    border-top: 2px solid #ffe7bd;
    border-bottom: 0px ;
    border-left: 2px solid #ffe7bd;
    border-right: 2px solid #ffe7bd;
    -moz-border-radius:3px 3px 0px 0px;
    -moz-border-top-left-radius: 3px;
    -moz-border-top-right-radius: 3px;
    -moz-border-bottom-right-radius: 0px;
    -moz-border-bottom-left-radius: 0px;
    -webkit-border-top-left-radius: 3px;
    -webkit-border-top-right-radius: 3px;
    -webkit-border-bottom-right-radius: 0px;
    -webkit-border-bottom-left-radius: 0px;
    font-weight: bold;
    font-size: 9px;
}

.quotemain
{
    background: #FFF9EC;
    margin: 0 auto 1px auto;
    padding: 1px 1px 1px 10px;
    border-top: 0px ;
    border-bottom: 2px solid #ffe7bd;
    border-left: 2px solid #ffe7bd;
    border-right: 2px solid #ffe7bd;
    -moz-border-radius: 0px 0px 3px 3px;
    -moz-border-top-left-radius: 0px;
    -moz-border-top-right-radius: 0px;
    -moz-border-bottom-right-radius: 3px;
    -moz-border-bottom-left-radius: 3px;
    -webkit-border-top-left-radius: 0px;
    -webkit-border-top-right-radius: 0px;
    -webkit-border-bottom-right-radius: 3px;
    -webkit-border-bottom-left-radius: 3px;
    color: #FF822F;
    font-size: 11px;
}

.codetop,
.sqltop,
.htmltop
{
    background: #DBCCFD url(style_images/madmoto/css_img_code.gif) no-repeat right;
    color: #000;
    font-weight: bold;
    margin: 0 auto 0 auto;
    padding: 3px;
    width: 98%;
}

.codemain,
.sqlmain,
.htmlmain
{
    background: #FFF9EC;
    border: 1px dotted #000;
    color: #FF822F;
    font-family: Courier, Courier New, Verdana, Arial;
    margin: 0 auto 0 auto;
    padding: 2px;
    width: 98%;
}

#QUOTE,
#CODE
{
    background: #FFF9EC;
    border: 1px solid #000;
    color: #FF822F;
    font-family: Verdana, Arial;
    font-size: 11px;
    padding: 2px;
    white-space: normal;
}

#CODE
{
    font-family: Courier, Courier New, Verdana, Arial;
}

.cleared
{
    clear: both;
}

.borderwrap,
.borderwrapm
{
    background: #FFF;
    border: 0;
}

.borderwrapm
{
    margin: 5px;
}

.borderwrap h3,
.maintitle,
.maintitlecollapse
{
    background: transparent url(img/tile_cat.gif);
    border: 1px solid #FFF;
    border-bottom: 1px solid #FF822F;
    color: #FFF;
    font-size: 12px;
    font-weight: bold;
    padding: 8px 8px 8px 8px;
}

.maintitlecollapse
{
    border: 1px solid #FFF;
}

.maintitle p,
.maintitlecollapse p,
.formsubtitle p
{
    background: transparent !important;
    border: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
}

.maintitle p.expand,
.maintitle p.goto,
.maintitlecollapse p.expand,
.formsubtitle p.members
{
    float: right;
    width: auto !important;
}

.maintitle a:link,
.maintitle a:visited,
.maintitlecollapse a:link,
.maintitlecollapse a:visited
{
    background: transparent;
    color: #FFF;
    text-decoration: none;
}

.maintitle a:hover,
.maintitle a:active,
.maintitlecollapse a:hover,
.maintitlecollapse a:active
{
    background: transparent;
    color: #F1F1F1;
}

table th,
.borderwrap table th,
.subtitle,
.subtitlediv,
.postlinksbar
{
    background: transparent url(style_images/madmoto/tile_sub.gif);
    border-bottom: 1px solid #FF822F;
    color: #C00101;
    font-size: 10px;
    font-weight: bold;
    letter-spacing: 1px;
    padding: 5px;
}

.subtitlediv
{
    border: 1px solid #FFF;
    border-bottom: 1px solid #FF822F;
    text-align: right;
}

.borderwrap table th a:link,
.subtitle a:link,
.subtitlediv a:link,
.borderwrap table th a:visited,
.subtitle a:visited,
.subtitlediv a:visited,
.borderwrap table th a:active,
.subtitle a:active,
.subtitlediv a:active,
.borderwrap table th a:hover,
.subtitle a:hover,
.subtitlediv a:hover
{
    background: transparent;
    color: #C00101;
    text-decoration: none;
}

.borderwrap h4
{
    background: #E6F2DD;
    border: 1px solid #FFF;
    border-bottom: 1px solid #FF822F;
    border-top: 1px solid #FF822F;
    color: #FF822F;
    font-size: 12px;
    font-weight: bold;
    padding: 5px;
}

.borderwrap p
{
    background: #FFFFFF;
    border: 1px solid #FFFFFF;
    margin: 5px;
    padding: 10px;
    text-align: left;
}

td.formbuttonrow,
.borderwrap p.formbuttonrow,
.borderwrap p.formbuttonrow1
{
    background: #FFE7BD !important;
    border: 1px solid #FFF;
    border-top: 1px solid #FF822F;
    margin: 0px !important;
    padding: 5px !important;
    text-align: center;
}

.borderwrap p.formbuttonrow1
{
    background: #F9F9F9 !important;
    border-top: 1px solid #CCC;
}

.bar,
.barb,
.barc
{
    background: #FFEFD4;
    border: 1px solid #FFF;
}

.bar p,
.barb p,
.barc p
{
    background: transparent;
    color: #222;
    font-size: 11px;
    padding: 5px;
    text-align: left;
}

.barb p
{
    text-align: right;
}

.bar p.over,
.bar p.overs,
.barc p.over,
.barc p.overs
{
    float: right;
}

.barb p.over,
.barb p.overs
{
    float: left;
}

.bar p.overs,
.barb p.overs,
.barc p.overs
{
    position: relative;
    top: 5px;
}

.catend
{
    background: #E6AD00;
    color: #000;
    font-size: 1px;
    height: 5px;
}

.newslink
{
    background: #FFF5E0;
    border: 1px solid #FFD37D;
    width: 100%;
}

.newslink td
{
    color: #222;
    font-size: 10px;
    padding: 5px 5px 5px 10px;
}

.newslink span
{
    background: transparent;
    color: #FF6600;
    font-style: italic;
    font-weight: normal;
}

.newslink input
{
    background: #FFF;
    border: 1px solid #999;
    color: #FF6600;
    font-size: 10px;
    padding: 3px;
    vertical-align: middle;
    width: auto;
}

.newslink input.button
{
    background: transparent;
    border: 0;
    color: #FF6600;
    vertical-align: middle;
}

.fieldwrap
{
    background: #F9F9F9;
    border: 1px solid #CCC;
    margin: 5px;
    text-align: left;
}

.fieldwrap h4
{
    background: #EEE;
    border: 1px solid #CCC;
    color: #444;
    font-size: 12px;
    font-weight: bold;
    padding: 5px;
}

.errorwrap,
#pmnotewrap
{
    background: #DDDDF2;
    border: 1px solid #2A2A99;
    margin: 5px;
}

#pmnotewrap
{
    line-height: 135%;
    margin: 0 0 5px 0;
}

.errorwrap h4,
#pmnotewrap h4
{
    background: #C0C0E3 url(00000000.txt);
    border: 1px solid #2A2A99;
    color: #2A2A99;
    font-size: 12px;
    font-weight: bold;
    padding: 5px;
}

.errorwrap p,
#pmnotewrap p
{
    background: transparent;
    color: #2A2A99;
    padding: 8px;
}

#pmnotewrap p.pmavatar
{
    float: left;
}

#pmnotewrap p.pmnotefoot
{
    background: #C0C0E3 url(00000000.txt);
    border-top: 1px solid #2A2A99;
    text-align: right;
}

#pmnotewrap a:link,
#pmnotewrap  a:visited
{
    background: transparent;
    color: #2A2A99;
    text-decoration: underline;
}

#pmnotewrap a:hover,
#pmnotewrap a:active
{
    background: transparent;
    color: #2A2A99;
    text-decoration: none;
}

.ruleswrap
{
    background: #DDDDF2;
    border: 1px solid #2A2A99;
    color: #2A2A99;
    margin: 5px 0 5px 0;
    padding: 5px;
}

#redirectwrap
{
    background: #FFF5E0;
    border: 1px solid #FFD37D;
    margin: 200px auto 0 auto;
    text-align: left;
    width: 500px;
}

#redirectwrap h4
{
    background: #DDEAD0;
    border-bottom: 1px solid #FFD37D;
    color: #C00101;
    font-size: 14px;
    padding: 5px;
}

#redirectwrap p
{
    padding: 5px;
}

#redirectwrap p.redirectfoot
{
    background: #EBF4E3;
    border-top: 1px solid #FFD37D;
    text-align: center;
}

#gfooter
{
    background: #E6AD00;
    margin: 5px 0 5px 0;
    width: 100%;
}

#gfooter td
{
    color: #FFF;
    font-size: 10px;
    padding: 4px;
}

#gfooter a:link,
#gfooter a:visited
{
    color: #FFF;
}

#submenu
{
    background: transparent url(style_images/madmoto/tile_sub.gif);
    border: 1px solid #FFF;
    color: #C00101;
}

#userlinks,
#userlinksguest
{
    background: #FFF5E0;
    border: 1px solid #FFD37D;
    margin: 5px 0 5px 0;
    padding: 0 5px 0 5px;
}

#userlinksguest
{
    background: #FFDFA7;
    border: 1px solid #FFDFA7;
}

#submenu p,
#userlinks p,
#userlinksguest p
{
    background: transparent !important;
    border: 0 !important;
    font-size: 10px;
    font-weight: bold;
    letter-spacing: 1px;
    margin: 0 !important;
    padding: 7px 0 7px 0;
    text-align: right;
}

#userlinks p,
#userlinksguest p
{
    font-weight: normal;
}

#submenu p.home,
#userlinks p.home,
#userlinksguest p.home
{
    float: left;
}

#userlinksguest p.pcen
{
    text-align: center;
}

#submenu a:link,
#submenu  a:visited
{
    background: transparent;
    color: #C00101;
    padding: 0 6px 0 6px;
    text-decoration: none;
}

#submenu a:hover,
#submenu a:active
{
    background: transparent;
    color: #FF822F;
}

.toplinks
{
    background: transparent;
    color: #000;
    padding: 0 0 5px 0;
    text-align: right;
}

.toplinks span
{
    background: #FFF5E0;
    border: 1px solid #FFD37D;
    color: #000;
    font-size: 10px;
    font-weight: bold;
    margin: 0 10px 0 0;
    padding: 5px;
}

.copyright
{
    background: #EEE;
    font-size: 11px;
    margin: 0 0 5px 0;
    padding: 8px;
}
</style>';
