#!/bin/bash
# Lets the app user create databases, so `prisma migrate dev` can manage its shadow database
# (https://pris.ly/d/migrate-shadow). Runs once on first container init. LOCAL DEVELOPMENT ONLY.
set -e

mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" <<SQL
GRANT ALL PRIVILEGES ON *.* TO '${MYSQL_USER}'@'%';
FLUSH PRIVILEGES;
SQL
