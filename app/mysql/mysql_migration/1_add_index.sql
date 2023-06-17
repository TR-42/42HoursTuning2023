CREATE INDEX index_user_id_on_department_role_member
ON department_role_member (user_id,belong);

CREATE INDEX index_user_id_on_match_group_member
ON match_group_member (user_id);
