import type { Request } from "express";
import type { ParamsDictionary, Query } from "express-serve-static-core";

export interface AuthenticatedUser {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
}

export type AuthenticatedRequest<
  Params extends ParamsDictionary = ParamsDictionary,
  RequestBody = unknown,
  ResponseBody = unknown,
  RequestQuery extends Query = Query,
> = Request<Params, ResponseBody, RequestBody, RequestQuery> & {
  user: AuthenticatedUser;
};
