# AMZTECH full backup restore

Backup id: amz-next-full-20260607-034246

Contents:
- app/: full /var/www/amz-next runtime directory, including source, .env.production, .next, node_modules, public uploads.
- db/amz-postgres.dump: PostgreSQL custom-format dump, portable restore.
- db/amz-schema.sql: schema-only SQL reference.
- db/table-counts.tsv: row count estimates captured at backup time.
- config/amz-next.service: systemd service.
- config/nginx-site-amz-next.conf or nginx-full.conf: nginx config reference.
- metadata/: manifest and checksums.

Typical restore on a fresh Ubuntu server:

1. Install Node.js, npm, PostgreSQL 16, nginx.
2. Create database and user, then update app/.env.production DATABASE_URL for the new server.
3. Restore DB:
   createdb amz_next
   pg_restore --clean --if-exists --no-owner --no-privileges -d "postgresql://USER:PASSWORD@HOST:PORT/amz_next" db/amz-postgres.dump
4. Copy app directory:
   rsync -a app/ /var/www/amz-next/
5. Rebuild if Node version differs:
   cd /var/www/amz-next && npm ci && npm run build
6. Install service/nginx configs, then:
   systemctl daemon-reload
   systemctl enable --now amz-next
   nginx -t && systemctl reload nginx

Security note: app/.env.production contains production secrets. Keep this archive private.
