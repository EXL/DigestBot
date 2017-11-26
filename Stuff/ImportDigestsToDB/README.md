ImportDigestsToDB
=================

The utility for creating a database/table from digest backups. Messages are saved with HTML markup, this is the rudiment left after generating static HTML pages.

## Install

* Install all dependencies with `$ npm install` command.

* Create database or table with `utf8mb4` and `utf8mb4_unicode_ci` charsets.

* Edit config "DataBaseConfig.json".

## Usage

1. Add digest post to DB:

```bash
$ node ImportDigestToDB.js <backup-dir> <chat-id>
```

2. Show chat ids:

```bash
$ node ImportDigestToDB.js <backup-dir> 0
```

3. Show users:

```bash
$ node ImportDigestToDB.js <backup-dir> users
```

Make sure that the database is working with UTF-8 (utf8mb4 for unicode smiles) charset.
