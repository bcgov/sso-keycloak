import Sequelize, { QueryInterface, DataTypes, } from 'sequelize';

const name = '016_create_events_table';

const tableName = 'Event';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable(tableName, {
    id: {
      allowNull: false,
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    eventType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    clientId: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  });

  await queryInterface.sequelize.query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    CREATE OR REPLACE FUNCTION get_otp_wait_time(email_input text, delays json, delay_multiplier INT DEFAULT 60)
        RETURNS TABLE(
            can_request BOOLEAN,
            wait_seconds int,
            otp_count int
        )
        AS $$
    DECLARE
        otp_count int;
        last_created_at timestamp;
        current_wait_seconds int;
        resend_wait_seconds int;
    BEGIN
        SELECT
            MAX("createdAt"),
            COUNT(*)
        INTO
            last_created_at,
            otp_count
        FROM
            "Otp"
        WHERE
            email = email_input;

        IF otp_count = 0 THEN
            current_wait_seconds :=(delays ->> 0)::int * delay_multiplier;
            RETURN query
            SELECT
                true,
                current_wait_seconds,
                otp_count;
            RETURN;

        -- If at the array end, using -1 to indicate locked out
        ELSIF otp_count > json_array_length(delays) THEN
            RETURN query
            SELECT
                false,
                -1,
                otp_count;
            RETURN;
        ELSE
            current_wait_seconds :=(delays ->> otp_count - 1)::int * delay_multiplier;
            current_wait_seconds := GREATEST(0, current_wait_seconds - EXTRACT(EPOCH FROM (NOW() - last_created_at)));

            RETURN QUERY
            SELECT
                -- Can only request if there is no wait time
                current_wait_seconds = 0,
                -- Note that wait_seconds is the current wait time if in cooldown, or the resend wait time should one be created.
                -- If there is a wait time currently then return it
                -- If there is no wait time, the resend wait will be the next in the array
                CASE
                    when current_wait_seconds = 0 then (delays ->> otp_count)::int * delay_multiplier
                    else current_wait_seconds
                end,
                otp_count;
        END IF;
    END;
    $$
    LANGUAGE plpgsql;
  `);

  await queryInterface.sequelize.query(`
    CREATE OR REPLACE FUNCTION generate_otp_with_delays(
      email_input TEXT,
      delay_minutes_json JSON,
      otp_input TEXT,
      client_id TEXT,
      delay_multiplier INT DEFAULT 60
    )
    RETURNS TABLE (
      code TEXT,
      wait_time INT,
      error TEXT
    ) AS $$
    DECLARE
      otp_count INT;
      last_created_at TIMESTAMP;
      new_code TEXT;
      wait_seconds INT;
      can_request BOOLEAN;
    BEGIN
      SELECT w.can_request, w.wait_seconds, w.otp_count
      INTO can_request, wait_seconds, otp_count from get_otp_wait_time(email_input, delay_minutes_json::JSON, delay_multiplier) as w;

      IF otp_count >= json_array_length(delay_minutes_json) THEN
        INSERT INTO "Event" ("eventType", "clientId",  timestamp, email)
        VALUES ('MAX_RESENDS', client_id, NOW(), email_input);

        RETURN QUERY SELECT NULL::TEXT, NULL::INT, 'OTPS_LIMIT_REACHED';
        RETURN;
      END IF;

      IF otp_count = 0 THEN
        INSERT INTO "Event" ("eventType", "clientId", timestamp, email)
        VALUES ('REQUEST_OTP', client_id, NOW(), email_input);

        INSERT INTO "Otp" (id, email, otp)
        VALUES (gen_random_uuid(), email_input, otp_input);
        -- Newly created code will have the first delay as a wait time for resend. Note that postgres is 1-indexed not 0-indexed.
        RETURN QUERY SELECT otp_input, (delay_minutes_json ->> 0)::INT * delay_multiplier, null;
        RETURN;
      END IF;

      IF can_request THEN
        INSERT INTO "Event" ("eventType", "clientId", timestamp, email)
        VALUES ('RESEND_OTP', client_id, NOW(), email_input);

        -- Deactivate any existing otps for the email
        UPDATE "Otp" set active = false where email = email_input;

        INSERT INTO "Otp" (id, email, otp)
        VALUES (gen_random_uuid(), email_input, otp_input);

        RETURN QUERY SELECT otp_input, wait_seconds, NULL;
      ELSE
        RETURN QUERY SELECT NULL::TEXT, wait_seconds::INT, 'RESEND_TIMEOUT';
      END IF;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await queryInterface.sequelize.query(`
    CREATE OR REPLACE FUNCTION validate_otp(
      email_input TEXT,
      code_input TEXT,
      client_id TEXT,
      max_attempts INT,
      delay_minutes_json JSON,
      delay_multiplier INT DEFAULT 60
    )
    RETURNS TABLE (
      success BOOLEAN,
      wait_time INT,
      error TEXT
    ) AS $$
    DECLARE
      delays INTEGER[];
      active_otp RECORD;
      last_created_at TIMESTAMP;
      now_ts TIMESTAMP := NOW();
      wait_seconds INT;
      otp_count int;
      can_request BOOLEAN;
    BEGIN

      SELECT w.can_request, w.wait_seconds, w.otp_count
      INTO can_request, wait_seconds, otp_count from get_otp_wait_time(email_input, delay_minutes_json::JSON, delay_multiplier) as w;

      SELECT * INTO active_otp
      FROM "Otp"
      WHERE email = email_input AND active = true
      LIMIT 1;

      IF NOT FOUND THEN
        INSERT INTO "Event" (email, "clientId", "eventType", timestamp)
        VALUES (email_input, client_id, 'NO_ACTIVE_OTP', NOW());
        RETURN QUERY SELECT false, -1, 'NO_ACTIVE_OTP';
        RETURN;
      END IF;

      IF active_otp.attempts >= max_attempts THEN
        INSERT INTO "Event" (email, "clientId", "eventType", timestamp)
        VALUES (email_input, client_id, 'INVALID_OTP', NOW()), (email_input, client_id, 'MAX_ATTEMPTS', NOW());

        RETURN QUERY SELECT
          false,
          CASE WHEN can_request THEN 0 ELSE wait_seconds END,
          'EXPIRED_OTP_WITH_RESEND';
        RETURN;
      END IF;

      -- Step 3: Check if code matches
      IF active_otp.otp <> code_input THEN
        UPDATE "Otp"
        SET attempts = attempts + 1
        WHERE id = active_otp.id;

        INSERT INTO "Event" (email, "clientId", "eventType", timestamp)
        VALUES (email_input, client_id, 'INVALID_OTP', NOW());

        RETURN QUERY SELECT
          false,
          CASE WHEN can_request THEN 0 ELSE wait_seconds END,
          'INVALID_OTP';
        RETURN;
      END IF;

      -- Step 4: Code matches — check expiration
      IF now_ts - active_otp."createdAt" > INTERVAL '5 minutes' THEN
        INSERT INTO "Event" (email, "clientId", "eventType", timestamp)
        VALUES (email_input, client_id, 'EXPIRED_OTP', NOW());

        RETURN QUERY SELECT
          false,
          CASE WHEN can_request THEN 0 ELSE wait_seconds END,
          'EXPIRED_OTP';
        RETURN;
      END IF;

      -- Step 5: All checks passed — success
      DELETE FROM "Otp" WHERE email = email_input;

      INSERT INTO "Event" (email, "clientId", "eventType", timestamp)
      VALUES (email_input, client_id, 'OTP_VERIFIED', NOW());

      RETURN QUERY SELECT true, 0, NULL::TEXT;
    END;
    $$ LANGUAGE plpgsql;

  `);
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.dropTable(tableName);
  await queryInterface.sequelize.query(`DROP FUNCTION IF EXISTS get_otp_wait_time(text, json, int);`);
  await queryInterface.sequelize.query(`DROP FUNCTION IF EXISTS generate_otp_with_delays(text,json,text,text,int);`);
  await queryInterface.sequelize.query(`DROP FUNCTION IF EXISTS validate_otp(text,text,text,int,json,int);`);
};

export default { name, up, down };
