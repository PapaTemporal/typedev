import { defaultErrorMap, getErrorMap } from "./errors";
import { enumUtil } from "./helpers/enumUtil";
import { errorUtil } from "./helpers/errorUtil";
import {
  addIssueToContext,
  AsyncParseReturnType,
  DIRTY,
  INVALID,
  isAborted,
  isAsync,
  isDirty,
  isValid,
  makeIssue,
  OK,
  ParseContext,
  ParseInput,
  ParseParams,
  ParsePath,
  ParseReturnType,
  ParseStatus,
  SyncParseReturnType,
} from "./helpers/parseUtil";
import { partialUtil } from "./helpers/partialUtil";
import { Primitive } from "./helpers/typeAliases";
import { getParsedType, objectUtil, util, ZodParsedType } from "./helpers/util";
import type { StandardSchemaV1 } from "./standard-schema";
import {
  IssueData,
  StringValidation,
  ZodCustomIssue,
  ZodError,
  ZodErrorMap,
  ZodIssue,
  ZodIssueCode,
} from "./ZodError";

///////////////////////////////////////
///////////////////////////////////////
//////////                   //////////
//////////      ZodType      //////////
//////////                   //////////
///////////////////////////////////////
///////////////////////////////////////

export interface RefinementCtx {
  addIssue: (arg: IssueData) => void;
  path: (string | number)[];
}
export type ZodRawShape = { [k: string]: ZodTypeAny };
export type ZodTypeAny = ZodType<any, any, any>;
export type TypeOf<T extends ZodType<any, any, any>> = T["_output"];
export type input<T extends ZodType<any, any, any>> = T["_input"];
export type output<T extends ZodType<any, any, any>> = T["_output"];
export type { TypeOf as infer };

export type CustomErrorParams = Partial<util.Omit<ZodCustomIssue, "code">>;
export interface ZodTypeDef {
  errorMap?: ZodErrorMap;
  description?: string;
}

class ParseInputLazyPath implements ParseInput {
  parent: ParseContext;
  data: any;
  _path: ParsePath;
  _key: string | number | (string | number)[];
  _cachedPath: ParsePath = [];
  constructor(
    parent: ParseContext,
    value: any,
    path: ParsePath,
    key: string | number | (string | number)[]
  ) {
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (this._key instanceof Array) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }

    return this._cachedPath;
  }
}

const handleResult = <Input, Output>(
  ctx: ParseContext,
  result: SyncParseReturnType<Output>
):
  | { success: true; data: Output }
  | { success: false; error: ZodError<Input> } => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }

    return {
      success: false,
      get error() {
        if ((this as any)._error) return (this as any)._error as Error;
        const error = new ZodError(ctx.common.issues);
        (this as any)._error = error;
        return (this as any)._error;
      },
    };
  }
};

export type RawCreateParams =
  | {
      errorMap?: ZodErrorMap;
      invalid_type_error?: string;
