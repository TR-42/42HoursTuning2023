ALTER TABLE user
  MODIFY COLUMN user_id CHAR(36),
    MODIFY COLUMN user_name CHAR(50),
    MODIFY COLUMN kana CHAR(50),
    MODIFY COLUMN mail CHAR(200),
    MODIFY COLUMN password CHAR(100),
    MODIFY COLUMN office_id CHAR(36),
    MODIFY COLUMN user_icon_id CHAR(36);

ALTER TABLE session
  MODIFY
    COLUMN session_id CHAR(36),
    MODIFY COLUMN linked_user_id CHAR(36);

ALTER TABLE department
  MODIFY COLUMN department_id CHAR(36),
    MODIFY COLUMN department_name CHAR(50);

ALTER TABLE role
  MODIFY COLUMN role_id CHAR(36),
    MODIFY COLUMN role_name CHAR(50);

ALTER TABLE department_role_member
  MODIFY COLUMN department_id CHAR(36),
    MODIFY COLUMN role_id CHAR(36),
    MODIFY COLUMN user_id CHAR(36);

ALTER TABLE office
  MODIFY COLUMN office_id CHAR(36),
    MODIFY COLUMN office_name CHAR(50);

ALTER TABLE file
  MODIFY COLUMN file_id CHAR(36),
    MODIFY COLUMN file_name CHAR(120);

ALTER TABLE skill
  MODIFY COLUMN skill_id CHAR(36),
    MODIFY COLUMN skill_name CHAR(36);

ALTER TABLE skill_member
  MODIFY COLUMN skill_id CHAR(36),
    MODIFY COLUMN user_id CHAR(36);

ALTER TABLE match_group
  MODIFY COLUMN match_group_id CHAR(36),
    MODIFY COLUMN match_group_name CHAR(50),
    MODIFY COLUMN description CHAR(120),
    MODIFY COLUMN status CHAR(10),
    MODIFY COLUMN created_by CHAR(36);

ALTER TABLE match_group_member
  MODIFY COLUMN match_group_id CHAR(36),
    MODIFY COLUMN user_id CHAR(36);
