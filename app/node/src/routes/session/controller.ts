import express from "express";
import { createHash } from "crypto";
import { ResultSetHeader } from "mysql2";
import { Session } from "../../model/types";
import { convertDateToString } from "../../model/utils";
import { v4 as uuidv4 } from "uuid";
import { getUserIdByMailAndPassword } from "../users/repository";
import {
  createSession,
  deleteSessions,
} from "./repository";

export const sessionRouter = express.Router();

// ログインAPI
sessionRouter.post(
  "/",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (
      !req.body.mail ||
      typeof req.body.mail !== "string" ||
      !req.body.password ||
      typeof req.body.password !== "string"
    ) {
      res.status(400).json({
        message: "メールアドレスとパスワードを文字列で入力してください。",
      });
      console.warn("email or password is empty or not string");
      return;
    }

    const { mail, password }: { mail: string; password: string } = req.body;
    const hashPassword = createHash("sha256").update(password).digest("hex");

    try {
      const [userId, session] = await getUserIdByMailAndPassword(mail, hashPassword);
      if (!userId) {
        res.status(401).json({
          message: "メールアドレスまたはパスワードが正しくありません。",
        });
        console.warn("email or password is invalid");
        return;
      }
      if (session !== undefined) {
        res.cookie("SESSION_ID", session.sessionId, {
          httpOnly: true,
          path: "/",
        });
        res.json(session);
        console.log("user already logged in");
        return;
      }

      const sessionId = uuidv4();
      const createdAt = new Date()
      const [insertResult] = (await createSession(sessionId, userId, createdAt)) as [ResultSetHeader, any];
      const createdSession: Session = {
        sessionId: sessionId,
        userId: userId,
        createdAt: convertDateToString (createdAt)
      };
      if (!insertResult.affectedRows || insertResult.affectedRows <= 0) {
        res.status(500).json({
          message: "ログインに失敗しました。",
        });
        console.error("failed to insert session");
        return;
      }

      res.cookie("SESSION_ID", createdSession.sessionId, {
        httpOnly: true,
        path: "/",
      });
      res.status(201).json(createdSession);
      console.log("successfully logged in");
    } catch (e) {
      next(e);
    }
  }
);

// ログアウトAPI
sessionRouter.delete(
  "/",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const userId = req.headers["X-DA-USER-ID"] as string;

      await deleteSessions(userId);
      res.clearCookie("SESSION_ID", { httpOnly: true, path: "/" });
      res.status(204).send();
      console.log("successfully logged out");
    } catch (e) {
      next(e);
    }
  }
);
