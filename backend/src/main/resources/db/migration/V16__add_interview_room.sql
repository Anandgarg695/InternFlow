ALTER TABLE interviews ADD COLUMN room_code VARCHAR(64);
UPDATE interviews SET room_code = 'room-' || id WHERE room_code IS NULL;
ALTER TABLE interviews ALTER COLUMN room_code SET NOT NULL;
ALTER TABLE interviews ADD CONSTRAINT uq_interviews_room_code UNIQUE (room_code);
