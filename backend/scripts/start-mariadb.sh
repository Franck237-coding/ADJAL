#!/usr/bin/env bash
set -euo pipefail

data_dir="${ADJAL_MARIADB_DATA_DIR:-$HOME/.local/share/adjal-mariadb}"
port="${DB_PORT:-3306}"
database="${DB_NAME:-adjal}"
username="${DB_USERNAME:-root}"
password="${DB_PASSWORD:-}"
socket_path="${data_dir}/mariadb.sock"
pid_file="${data_dir}/mariadb.pid"
log_file="${data_dir}/mariadb.log"

mkdir -p "$data_dir"

if [[ ! -d "${data_dir}/mysql" ]]; then
  mariadb-install-db \
    --datadir="$data_dir" \
    --auth-root-authentication-method=normal \
    --skip-test-db >/dev/null
fi

if ! mariadb-admin --protocol=tcp --host=127.0.0.1 --port="$port" \
  --user="$username" ${password:+--password="$password"} ping >/dev/null 2>&1; then
  mariadbd \
    --datadir="$data_dir" \
    --user="$(id -un)" \
    --bind-address=127.0.0.1 \
    --port="$port" \
    --socket="$socket_path" \
    --pid-file="$pid_file" \
    --log-error="$log_file" \
    --skip-name-resolve >/dev/null 2>&1 &
fi

for attempt in {1..30}; do
  if mariadb-admin --protocol=tcp --host=127.0.0.1 --port="$port" \
    --user="$username" ${password:+--password="$password"} ping >/dev/null 2>&1; then
    break
  fi
  if [[ "$attempt" == 30 ]]; then
    echo "MariaDB did not become ready on 127.0.0.1:${port}" >&2
    exit 1
  fi
  sleep 1
done

mariadb --protocol=tcp --host=127.0.0.1 --port="$port" \
  --user="$username" ${password:+--password="$password"} \
  -e "CREATE DATABASE IF NOT EXISTS \`${database}\`;"

echo "MariaDB ready on 127.0.0.1:${port}/${database}"