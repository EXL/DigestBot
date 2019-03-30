#!/bin/bash
DAYMONTH=`date +"%Y%m%d_%H%M%S"`
/bin/tar -czf /srv/digestbot/BackUpDigestLog/backup_digest_log_$DAYMONTH.tar.gz -C /srv/digestbot/DigestBot/ DigestBotStackLog.json

# Backup rotation, default 100 files
# FILES=100
# ls -1 /srv/digestbot/BackUpDigestLog/backup_* | sort -r | tail -n +$(($FILES+1)) | xargs rm > /dev/null 2>&1
