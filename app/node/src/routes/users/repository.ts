import { RowDataPacket } from "mysql2";
import pool from "../../util/mysql";
import { MatchGroupConfig, SearchedUser, Session, User, UserForFilter } from "../../model/types";
import {
  convertDateToString,
  convertToSearchedUser,
  convertToUserForFilter,
  convertToUsers,
} from "../../model/utils";

export const getUserIdByMailAndPassword = async (
  mail: string,
  hashPassword: string
): Promise<[string, Session | undefined] | []> => {
  const [user] = await pool.query<RowDataPacket[]>(`
    SELECT
      user.user_id AS user_id,
      session.session_id AS session_id,
      session.created_at AS created_at
    FROM
      user
    LEFT JOIN session
      ON user.user_id = session.linked_user_id
    WHERE
      user.mail = ?
        AND
      user.password = ?
    `,
    [mail, hashPassword]
  );
  if (!user || user.length === 0) {
    return [];
  }

  const user_id = user[0].user_id;
  const createdAtDate: Date | undefined = user[0].created_at;
  const sessionId: string = user[0].session_id ?? "";
  const session: Session | undefined = sessionId == "" ? undefined : {
    sessionId: sessionId,
    userId: user[0].user_id,
    createdAt: createdAtDate ? convertDateToString(createdAtDate) : ""
  };
  return [
    user_id,
    session
  ];
};

export const getUsers = async (
  limit: number,
  offset: number
): Promise<User[]> => {
  const query = `
  SELECT
    user.user_id AS user_id,
    user.user_name AS user_name,
    office.office_name AS office_name,
    file.file_name AS file_name,
    user.user_icon_id AS user_icon_id
  FROM user
  JOIN
    \`file\` ON file.file_id = user.user_icon_id
  JOIN
    office ON office.office_id = user.office_id
  ORDER BY
    user.entry_date ASC, user.kana ASC
  LIMIT ?
  OFFSET ?`;

  const [tmp] = await pool.query<RowDataPacket[]>(query, [limit, offset]);
  return convertToUsers(tmp);
};

export const getUserByUserId = async (
  userId: string
): Promise<User | undefined> => {
  const [user] = await pool.query<RowDataPacket[]>(
    "SELECT user_id, user_name, office_id, user_icon_id FROM user WHERE user_id = ?",
    [userId]
  );
  if (user.length === 0) {
    return;
  }

  const [office] = await pool.query<RowDataPacket[]>(
    `SELECT office_name FROM office WHERE office_id = ?`,
    [user[0].office_id]
  );
  const [file] = await pool.query<RowDataPacket[]>(
    `SELECT file_name FROM file WHERE file_id = ?`,
    [user[0].user_icon_id]
  );

  return {
    userId: user[0].user_id,
    userName: user[0].user_name,
    userIcon: {
      fileId: user[0].user_icon_id,
      fileName: file[0].file_name,
    },
    officeName: office[0].office_name,
  };
};

export const getUsersByUserIds = async (
  userIds: string[]
): Promise<SearchedUser[]> => {
  let users: SearchedUser[] = [];
  for (const userId of userIds) {
    const [userRows] = await pool.query<RowDataPacket[]>(
      "SELECT user_id, user_name, kana, entry_date, office_id, user_icon_id FROM user WHERE user_id = ?",
      [userId]
    );
    if (userRows.length === 0) {
      continue;
    }

    const [officeRows] = await pool.query<RowDataPacket[]>(
      `SELECT office_name FROM office WHERE office_id = ?`,
      [userRows[0].office_id]
    );
    const [fileRows] = await pool.query<RowDataPacket[]>(
      `SELECT file_name FROM file WHERE file_id = ?`,
      [userRows[0].user_icon_id]
    );
    userRows[0].office_name = officeRows[0].office_name;
    userRows[0].file_name = fileRows[0].file_name;

    users = users.concat(convertToSearchedUser(userRows));
  }
  return users;
};

export const getUsersByUserName = async (
  userName: string
): Promise<SearchedUser[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT user_id FROM user WHERE user_name LIKE ?`,
    [`%${userName}%`]
  );
  const userIds: string[] = rows.map((row) => row.user_id);

  return getUsersByUserIds(userIds);
};

export const getUsersByKana = async (kana: string): Promise<SearchedUser[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT user_id FROM user WHERE kana LIKE ?`,
    [`%${kana}%`]
  );
  const userIds: string[] = rows.map((row) => row.user_id);

  return getUsersByUserIds(userIds);
};

export const getUsersByMail = async (mail: string): Promise<SearchedUser[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT user_id FROM user WHERE mail LIKE ?`,
    [`%${mail}%`]
  );
  const userIds: string[] = rows.map((row) => row.user_id);

  return getUsersByUserIds(userIds);
};

export const getUsersByDepartmentName = async (
  departmentName: string
): Promise<SearchedUser[]> => {
  const [departmentIdRows] = await pool.query<RowDataPacket[]>(
    `SELECT department_id FROM department WHERE department_name LIKE ? AND active = true`,
    [`%${departmentName}%`]
  );
  const departmentIds: string[] = departmentIdRows.map(
    (row) => row.department_id
  );
  if (departmentIds.length === 0) {
    return [];
  }

  const [userIdRows] = await pool.query<RowDataPacket[]>(
    `SELECT user_id FROM department_role_member WHERE department_id IN (?) AND belong = true`,
    [departmentIds]
  );
  const userIds: string[] = userIdRows.map((row) => row.user_id);

  return getUsersByUserIds(userIds);
};

export const getUsersByRoleName = async (
  roleName: string
): Promise<SearchedUser[]> => {
  const [roleIdRows] = await pool.query<RowDataPacket[]>(
    `SELECT role_id FROM role WHERE role_name LIKE ? AND active = true`,
    [`%${roleName}%`]
  );
  const roleIds: string[] = roleIdRows.map((row) => row.role_id);
  if (roleIds.length === 0) {
    return [];
  }

  const [userIdRows] = await pool.query<RowDataPacket[]>(
    `SELECT user_id FROM department_role_member WHERE role_id IN (?) AND belong = true`,
    [roleIds]
  );
  const userIds: string[] = userIdRows.map((row) => row.user_id);

  return getUsersByUserIds(userIds);
};

export const getUsersByOfficeName = async (
  officeName: string
): Promise<SearchedUser[]> => {
  const [officeIdRows] = await pool.query<RowDataPacket[]>(
    `SELECT office_id FROM office WHERE office_name LIKE ?`,
    [`%${officeName}%`]
  );
  const officeIds: string[] = officeIdRows.map((row) => row.office_id);
  if (officeIds.length === 0) {
    return [];
  }

  const [userIdRows] = await pool.query<RowDataPacket[]>(
    `SELECT user_id FROM user WHERE office_id IN (?)`,
    [officeIds]
  );
  const userIds: string[] = userIdRows.map((row) => row.user_id);

  return getUsersByUserIds(userIds);
};

export const getUsersBySkillName = async (
  skillName: string
): Promise<SearchedUser[]> => {
  const [skillIdRows] = await pool.query<RowDataPacket[]>(
    `SELECT skill_id FROM skill WHERE skill_name LIKE ?`,
    [`%${skillName}%`]
  );
  const skillIds: string[] = skillIdRows.map((row) => row.skill_id);
  if (skillIds.length === 0) {
    return [];
  }

  const [userIdRows] = await pool.query<RowDataPacket[]>(
    `SELECT user_id FROM skill_member WHERE skill_id IN (?)`,
    [skillIds]
  );
  const userIds: string[] = userIdRows.map((row) => row.user_id);

  return getUsersByUserIds(userIds);
};

export const getUsersByGoal = async (goal: string): Promise<SearchedUser[]> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT user_id FROM user WHERE goal LIKE ?`,
    [`%${goal}%`]
  );
  const userIds: string[] = rows.map((row) => row.user_id);

  return getUsersByUserIds(userIds);
};

export const getUserForFilterWith = async (
  matchGroupConfig: MatchGroupConfig,
  owner: UserForFilter
) => {
  let userRows: RowDataPacket[];
  matchGroupConfig = matchGroupConfig;
  let queryStr = [];
  if (matchGroupConfig.departmentFilter !== "none")
  {
    const op = matchGroupConfig.departmentFilter === "onlyMyDepartment"
      ? '=' : '!=';
    queryStr.push(`\`department_name\` ${op} '${owner.departmentName}'`);
  }

  [userRows] = await pool.query<RowDataPacket[]>(`
  SELECT
    user.user_id AS user_id,
    user.user_name AS user_name,
    (SELECT office_name FROM office WHERE user.office_id = office.office_id) AS office_name,
    user.user_icon_id AS user_icon_id,
    (SELECT file_name FROM file WHERE file.file_id = user.user_icon_id) AS file_name,
    (SELECT department_name FROM department WHERE department.department_id = (
      SELECT
        department_id
      FROM
        department_role_member
      WHERE
        department.department_id = department_role_member.department_id
          AND
        user.user_id = department_role_member.user_id
          AND
        department_role_member.belong = true
    )) AS department_name
  FROM
    user
  WHERE
    user_id_int >= (
      SELECT id_int_max FROM save_user_id_int_max
    ) * RAND()
  ${0 < queryStr.length ? "HAVING" : ""}
      ${queryStr.join(" AND ")}
  LIMIT 1;
  `);

  const user = userRows[0];

  const [skillNameRows] = await pool.query<RowDataPacket[]>(`
    SELECT
      skill_name
    FROM
      skill
    WHERE
      skill_id IN (
        SELECT
          skill_id
        FROM
          skill_member
        WHERE
          user_id = ?
      )
    `,
    [user.user_id]
  );

  user.skill_names = skillNameRows.map((row) => row.skill_name);

  return convertToUserForFilter(user);
}

export const getUserForFilter = async (
  userId?: string
): Promise<UserForFilter> => {
  let userRows: RowDataPacket[];
  if (!userId) {
    [userRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        user.user_id AS user_id,
        user.user_name AS user_name,
        (SELECT office_name FROM office WHERE user.office_id = office.office_id) AS office_name,
        user.user_icon_id AS user_icon_id,
        (SELECT file_name FROM file WHERE file.file_id = user.user_icon_id) AS file_name,
        (SELECT department_name FROM department WHERE department.department_id = (
          SELECT
            department_id
          FROM
            department_role_member
          WHERE
            department.department_id = department_role_member.department_id
              AND
            user.user_id = department_role_member.user_id
              AND
            department_role_member.belong = true
        )) AS department_name
      FROM
        user
      WHERE
        user_id_int >= (
          SELECT id_int_max FROM save_user_id_int_max
        ) * RAND()
      LIMIT 1;
`
    );
  } else {
    [userRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        user.user_id AS user_id,
        user.user_name AS user_name,
        (SELECT office_name FROM office WHERE user.office_id = office.office_id) AS office_name,
        user.user_icon_id AS user_icon_id,
        (SELECT file_name FROM file WHERE file.file_id = user.user_icon_id) AS file_name,
        (SELECT department_name FROM department WHERE department.department_id = (
          SELECT
            department_id
          FROM
            department_role_member
          WHERE
            department.department_id = department_role_member.department_id
              AND
            user.user_id = department_role_member.user_id
              AND
            department_role_member.belong = true
        )) AS department_name
      FROM
        user
      WHERE
        user.user_id = ?
      ;`,
      [userId]
    );
  }
  const user = userRows[0];

  const [skillNameRows] = await pool.query<RowDataPacket[]>(
    `SELECT
      skill_name
    FROM
      skill
    WHERE
      skill_id IN (
        SELECT
          skill_id
        FROM
          skill_member
        WHERE user_id = ?
      )
    `,
    [user.user_id]
  );

  user.skill_names = skillNameRows.map((row) => row.skill_name);

  return convertToUserForFilter(user);
};
