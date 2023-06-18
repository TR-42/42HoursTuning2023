CREATE INDEX index_user_id_on_department_role_member
ON department_role_member (user_id,belong);

CREATE INDEX index_user_id_on_match_group_member
ON match_group_member (user_id);

CREATE INDEX idx_match_group_gr_id_status
ON match_group(match_group_id,status);

CREATE INDEX idx_user_user_icon_id
ON user (user_icon_id);

CREATE INDEX idx_user_mail_passwd
ON user (mail,password);

CREATE INDEX idx_user_office_id
ON user (office_id);

CREATE INDEX idx_user_entry_date_and_kana
ON user (entry_date,kana);

CREATE FULLTEXT INDEX idx_user_kana
ON user (kana);

CREATE FULLTEXT INDEX idx_user_mail
ON user (mail);

CREATE FULLTEXT INDEX idx_user_goal
ON user (goal);

CREATE INDEX idx_user_entry_date
ON user (entry_date);

CREATE INDEX idx_department_role_member_role_id_belong
ON department_role_member (role_id,belong);

CREATE UNIQUE INDEX idx_skill_skill_name
ON skill (skill_name);

CREATE INDEX idx_skill_member_user_id
ON skill_member (user_id);

CREATE UNIQUE INDEX idx_session_user_id
ON session (linked_user_id);
