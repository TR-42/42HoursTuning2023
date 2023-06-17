ALTER TABLE user ADD user_id_int int;
ALTER TABLE user ADD INDEX idx_user(user_id_int);
ALTER TABLE user MODIFY user_id_int int NOT NULL AUTO_INCREMENT;

CREATE TABLE save_user_id_int_max (id_int_max int NOT NULL);
INSERT INTO save_user_id_int_max(id_int_max) (
  SELECT MAX(user_id_int) from user
);
