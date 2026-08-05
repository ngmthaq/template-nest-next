#!/bin/bash
# Grant the application user permission to create databases so Prisma Migrate can
# create and drop its temporary shadow database during `prisma migrate dev`.
# See https://pris.ly/d/migrate-shadow.
#
# The official mysql image runs every *.sh / *.sql in /docker-entrypoint-initdb.d
# once, on first container init (empty data dir). Local development only — do not
# reuse this grant in staging/production.
set -e

mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" <<SQL
GRANT ALL PRIVILEGES ON *.* TO '${MYSQL_USER}'@'%';
FLUSH PRIVILEGES;
SQL
