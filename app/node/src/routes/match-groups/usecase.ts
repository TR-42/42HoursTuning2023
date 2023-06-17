import { v4 as uuidv4 } from "uuid";
import {
  MatchGroupDetail,
  MatchGroupConfig,
  UserForFilter,
} from "../../model/types";
import {
  getRegisteredSkillNames,
  getUserIdsBeforeMatched,
  insertMatchGroup,
} from "./repository";
import { getUserForFilter } from "../users/repository";
import { convertDateToString } from "../../model/utils";

export const checkSkillsRegistered = async (
  skillNames: string[]
): Promise<string | undefined> => {
  if (skillNames.length <= 0)
    return undefined;
  const registeredSkillNames = await getRegisteredSkillNames(skillNames);
  for (const skillName of skillNames) {
    if (!registeredSkillNames.includes(skillName)) {
      return skillName;
    }
  }
  return undefined;
};

export const createMatchGroup = async (
  matchGroupConfig: MatchGroupConfig,
  timeout?: number
): Promise<MatchGroupDetail | undefined> => {
  const owner = await getUserForFilter(matchGroupConfig.ownerId);
  let members: UserForFilter[] = [owner];
  const startTime = Date.now();
  while (members.length < matchGroupConfig.numOfMembers) {
    // デフォルトは50秒でタイムアウト
    if (Date.now() - startTime > (!timeout ? 50000 : timeout)) {
      console.error("not all members found before timeout");
      return;
    }
    const candidate = await getUserForFilter();
    if (
      matchGroupConfig.departmentFilter !== "none" &&
      !isPassedDepartmentFilter(
        matchGroupConfig.departmentFilter,
        owner.departmentName,
        candidate.departmentName
      )
    ) {
      console.log(`${candidate.userId} is not passed department filter`);
      continue;
    } else if (
      matchGroupConfig.officeFilter !== "none" &&
      !isPassedOfficeFilter(
        matchGroupConfig.officeFilter,
        owner.officeName,
        candidate.officeName
      )
    ) {
      console.log(`${candidate.userId} is not passed office filter`);
      continue;
    } else if (
      matchGroupConfig.skillFilter.length > 0 &&
      !matchGroupConfig.skillFilter.some((skill) =>
        candidate.skillNames.includes(skill)
      )
    ) {
      console.log(`${candidate.userId} is not passed skill filter`);
      continue;
    } else if (
      matchGroupConfig.neverMatchedFilter &&
      !(await isPassedMatchFilter(matchGroupConfig.ownerId, candidate.userId))
    ) {
      console.log(`${candidate.userId} is not passed never matched filter`);
      continue;
    } else if (members.some((member) => member.userId === candidate.userId)) {
      console.log(`${candidate.userId} is already added to members`);
      continue;
    }
    members = members.concat(candidate);
    console.log(`${candidate.userId} is added to members`);
  }

  const createdAt = new Date();
  const matchGroupId = uuidv4();
  const matchGroupDetail: MatchGroupDetail = {
    matchGroupId,
    matchGroupName: matchGroupConfig.matchGroupName,
    description: matchGroupConfig.description,
    members,
    status: "open",
    createdBy: matchGroupConfig.ownerId,
    createdAt: createdAt,
  };
  await insertMatchGroup(matchGroupDetail);

  matchGroupDetail.createdAt = convertDateToString(createdAt);
  return matchGroupDetail;
};

const isPassedDepartmentFilter = (
  departmentFilter: string,
  ownerDepartment: string,
  candidateDepartment: string
) => {
  return departmentFilter === "onlyMyDepartment"
    ? ownerDepartment === candidateDepartment
    : ownerDepartment !== candidateDepartment;
};

const isPassedOfficeFilter = (
  officeFilter: string,
  ownerOffice: string,
  candidateOffice: string
) => {
  return officeFilter === "onlyMyOffice"
    ? ownerOffice === candidateOffice
    : ownerOffice !== candidateOffice;
};

const isPassedMatchFilter = async (ownerId: string, candidateId: string) => {
  const userIdsBeforeMatched = await getUserIdsBeforeMatched(ownerId);
  return userIdsBeforeMatched.every(
    (userIdBeforeMatched) => userIdBeforeMatched !== candidateId
  );
};
