/*
ALTER TABLE `session`
ADD FOREIGN KEY (linked_user_id) REFERENCES `user`(user_id);

ALTER TABLE `department_role_member`
ADD FOREIGN KEY (user_id) REFERENCES `user`(user_id),
FOREIGN KEY (department_id) REFERENCES department(department_id),
FOREIGN KEY (role_id) REFERENCES `role`(role_id);

ALTER TABLE `skill_member`
ADD FOREIGN KEY (user_id) REFERENCES `user`(user_id),
FOREIGN KEY (skill_id) REFERENCES `skill`(skill_id);

ALTER TABLE `match_group_member`
ADD FOREIGN KEY (user_id) REFERENCES `user`(user_id),
FOREIGN KEY (match_group_id) REFERENCES `match_group`(match_group_id);

ALTER TABLE `user`
ADD FOREIGN KEY (office_id) REFERENCES `office`(office_id);
*/
