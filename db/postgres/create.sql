CREATE DATABASE customers;

DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT
      FROM   pg_catalog.pg_roles
      WHERE  rolname = 'ess') THEN

      CREATE ROLE ess LOGIN PASSWORD '12345';

      GRANT ALL PRIVILEGES ON DATABASE customers TO ess;
   END IF;

END
$do$;