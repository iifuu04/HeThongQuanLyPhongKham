USE MedSys;

SET @db_name = DATABASE();

SET @has_old_index = (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = @db_name
    AND table_name = 'Appointments'
    AND index_name = 'uq_Appointments_schedule_start'
);

SET @sql_drop_old = IF(
  @has_old_index > 0,
  'ALTER TABLE Appointments DROP INDEX uq_Appointments_schedule_start',
  'SELECT "Old unique index uq_Appointments_schedule_start not found, skip" AS message'
);

PREPARE stmt FROM @sql_drop_old;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_active_col = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = @db_name
    AND table_name = 'Appointments'
    AND column_name = 'active_slot_key'
);

SET @sql_add_col = IF(
  @has_active_col = 0,
  'ALTER TABLE Appointments ADD COLUMN active_slot_key VARCHAR(100) GENERATED ALWAYS AS (IF(status = ''CANCELLED'', NULL, CONCAT(doctor_id, ''#'', work_schedule_id, ''#'', start_time))) STORED',
  'SELECT "active_slot_key already exists, skip" AS message'
);

PREPARE stmt FROM @sql_add_col;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_active_index = (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = @db_name
    AND table_name = 'Appointments'
    AND index_name = 'uq_active_appointment_slot'
);

SET @sql_add_index = IF(
  @has_active_index = 0,
  'CREATE UNIQUE INDEX uq_active_appointment_slot ON Appointments(active_slot_key)',
  'SELECT "uq_active_appointment_slot already exists, skip" AS message'
);

PREPARE stmt FROM @sql_add_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SHOW INDEX FROM Appointments;