#!/bin/bash
DAYMONTH=`date +"%Y%M%d_%H%M%S"`
/bin/tar -czf /root/digestbot/BackUpDigestLog/backup_digest_log_$DAYMONTH.tar.gz -C /root/digestbot/DigestBot/ DigestBotStackLog.json

# Backup rotation, default 100 files
FILES=100
ls -1 /root/digestbot/BackUpDigestLog/backup_* | sort -r | tail -n +$(($FILES+1)) | xargs rm > /dev/null 2>&1
