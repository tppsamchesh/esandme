import * as z from "zod/v3";
import { ClosedEnum } from "../types/enums.js";
import { Result as SafeParseResult } from "../types/fp.js";
import { Flag, Flag$Outbound } from "./flag.js";
import { SDKValidationError } from "./sdkvalidationerror.js";
export type UpdateFlagValue = string | number | boolean;
export type UpdateFlagVariants = {
    /**
     * The id of the variant
     */
    id: string;
    /**
     * A label for the variant
     */
    label?: string | undefined;
    /**
     * A description of the variant
     */
    description?: string | undefined;
    value: string | number | boolean;
};
/**
 * Allows linking this environment to another environment so this flag will be evaluated with the other flag's configuration
 */
export type UpdateFlagReuse = {
    /**
     * Whether the reuse is active or not
     */
    active: boolean;
    /**
     * The environment to link to
     */
    environment: string;
};
export type UpdateFlagTargets = {
    note?: string | undefined;
    value: string;
};
export type UpdateFlagPausedOutcome = {
    type?: any | undefined;
    variantId: string;
};
export type UpdateFlagLhs2 = {
    type?: any | undefined;
    kind: string;
    attribute: string;
};
export type UpdateFlagLhs1 = {
    type?: any | undefined;
};
export type UpdateFlagLhs = UpdateFlagLhs2 | UpdateFlagLhs1;
export declare const UpdateFlagCmp: {
    readonly Eq: "eq";
    readonly NotEq: "!eq";
    readonly OneOf: "oneOf";
    readonly NotOneOf: "!oneOf";
    readonly ContainsAllOf: "containsAllOf";
    readonly ContainsAnyOf: "containsAnyOf";
    readonly ContainsNoneOf: "containsNoneOf";
    readonly StartsWith: "startsWith";
    readonly NotStartsWith: "!startsWith";
    readonly EndsWith: "endsWith";
    readonly NotEndsWith: "!endsWith";
    readonly Ex: "ex";
    readonly NotEx: "!ex";
    readonly Gt: "gt";
    readonly Gte: "gte";
    readonly Lt: "lt";
    readonly Lte: "lte";
    readonly Regex: "regex";
    readonly NotRegex: "!regex";
    readonly Before: "before";
    readonly After: "after";
};
export type UpdateFlagCmp = ClosedEnum<typeof UpdateFlagCmp>;
export type UpdateFlagRhs2 = {
    type?: any | undefined;
    pattern: string;
    flags: string;
};
export declare const UpdateFlagRhsType: {
    readonly ListInline: "list/inline";
    readonly List: "list";
};
export type UpdateFlagRhsType = ClosedEnum<typeof UpdateFlagRhsType>;
export type UpdateFlagItems2 = {
    label?: string | undefined;
    note?: string | undefined;
    value: string;
};
export type UpdateFlagItems1 = {
    label?: string | undefined;
    note?: string | undefined;
    value: number;
};
export type UpdateFlagRhsItems = UpdateFlagItems1 | UpdateFlagItems2;
export type UpdateFlagRhs1 = {
    type: UpdateFlagRhsType;
    items: Array<UpdateFlagItems1 | UpdateFlagItems2>;
};
export type UpdateFlagRhs = UpdateFlagRhs2 | UpdateFlagRhs1 | string | number | boolean;
export type UpdateFlagConditions = {
    lhs: UpdateFlagLhs2 | UpdateFlagLhs1;
    cmp: UpdateFlagCmp;
    rhs?: UpdateFlagRhs2 | UpdateFlagRhs1 | string | number | boolean | undefined;
};
export type UpdateFlagOutcomeBase = {
    type?: any | undefined;
    kind: string;
    attribute: string;
};
export type UpdateFlagOutcome2 = {
    type?: any | undefined;
    base: UpdateFlagOutcomeBase;
    /**
     * The distribution for each variant
     */
    weights: {
        [k: string]: number;
    };
    /**
     * This variant will be used when the base attribute does not exist
     */
    defaultVariantId: string;
};
export type UpdateFlagOutcome1 = {
    type?: any | undefined;
    variantId: string;
};
export type UpdateFlagOutcome = UpdateFlagOutcome2 | UpdateFlagOutcome1;
export type UpdateFlagRules = {
    id: string;
    conditions: Array<UpdateFlagConditions>;
    outcome: UpdateFlagOutcome2 | UpdateFlagOutcome1;
};
export type UpdateFlagFallthroughBase = {
    type?: any | undefined;
    kind: string;
    attribute: string;
};
export type UpdateFlagFallthrough2 = {
    type?: any | undefined;
    base: UpdateFlagFallthroughBase;
    /**
     * The distribution for each variant
     */
    weights: {
        [k: string]: number;
    };
    /**
     * This variant will be used when the base attribute does not exist
     */
    defaultVariantId: string;
};
export type UpdateFlagFallthrough1 = {
    type?: any | undefined;
    variantId: string;
};
export type UpdateFlagFallthrough = UpdateFlagFallthrough2 | UpdateFlagFallthrough1;
export type UpdateFlagEnvironments = {
    active: boolean;
    /**
     * Allows linking this environment to another environment so this flag will be evaluated with the other flag's configuration
     */
    reuse?: UpdateFlagReuse | undefined;
    /**
     * Allows assigning targets to variants while bypassing the flag's rules
     */
    targets?: {
        [k: string]: {
            [k: string]: {
                [k: string]: Array<UpdateFlagTargets>;
            };
        };
    } | undefined;
    pausedOutcome: UpdateFlagPausedOutcome;
    rules: Array<UpdateFlagRules>;
    fallthrough: UpdateFlagFallthrough2 | UpdateFlagFallthrough1;
    /**
     * The revision of the environment config
     */
    revision?: number | undefined;
};
export declare const UpdateFlagState: {
    readonly Active: "active";
    readonly Archived: "archived";
};
export type UpdateFlagState = ClosedEnum<typeof UpdateFlagState>;
export type UpdateFlagRequestBody = {
    /**
     * The user who created this patch
     */
    createdBy?: string | undefined;
    /**
     * Additional message for this version
     */
    message?: string | undefined;
    /**
     * The variants of the flag
     */
    variants?: Array<UpdateFlagVariants> | undefined;
    /**
     * The configuration for the flag in different environments
     */
    environments?: {
        [k: string]: UpdateFlagEnvironments;
    } | undefined;
    /**
     * A random seed to prevent split points in different flags from having the same targets
     */
    seed?: number | undefined;
    /**
     * A description of the flag
     */
    description?: string | undefined;
    state?: UpdateFlagState | undefined;
};
export type UpdateFlagRequest = {
    /**
     * The project id or name
     */
    projectIdOrName: string;
    /**
     * The flag id or name
     */
    flagIdOrSlug: string;
    /**
     * Etag to match, can be used interchangeably with the `if-match` header
     */
    ifMatch?: string | undefined;
    /**
     * Whether to include metadata in the response
     */
    withMetadata?: boolean | undefined;
    /**
     * The Team identifier to perform the request on behalf of.
     */
    teamId?: string | undefined;
    /**
     * The Team slug to perform the request on behalf of.
     */
    slug?: string | undefined;
    requestBody?: UpdateFlagRequestBody | undefined;
};
export type ResponseBodyValue = string | number | boolean;
export type ResponseBodyVariants = {
    description?: string | undefined;
    label?: string | undefined;
    value: string | number | boolean;
    id: string;
};
export type ResponseBodyReuse = {
    active: boolean;
    environment: string;
};
export type UpdateFlagResponseBodyTargets = {
    note?: string | undefined;
    value: string;
};
export declare const UpdateFlagResponseBodyType: {
    readonly Variant: "variant";
};
export type UpdateFlagResponseBodyType = ClosedEnum<typeof UpdateFlagResponseBodyType>;
export type ResponseBodyPausedOutcome = {
    type: UpdateFlagResponseBodyType;
    variantId: string;
};
export declare const UpdateFlagFallthroughFeatureFlagsResponseType: {
    readonly Entity: "entity";
};
export type UpdateFlagFallthroughFeatureFlagsResponseType = ClosedEnum<typeof UpdateFlagFallthroughFeatureFlagsResponseType>;
export type UpdateFlagFallthroughFeatureFlagsBase = {
    type: UpdateFlagFallthroughFeatureFlagsResponseType;
    kind: string;
    attribute: string;
};
export type UpdateFlagFallthroughFeatureFlags2 = {
    type: "split";
    base: UpdateFlagFallthroughFeatureFlagsBase;
    weights: {
        [k: string]: number;
    };
    defaultVariantId: string;
};
export type UpdateFlagFallthroughFeatureFlags1 = {
    type: "variant";
    variantId: string;
};
export type ResponseBodyFallthrough = UpdateFlagFallthroughFeatureFlags1 | UpdateFlagFallthroughFeatureFlags2;
export declare const UpdateFlagOutcomeFeatureFlagsResponseType: {
    readonly Entity: "entity";
};
export type UpdateFlagOutcomeFeatureFlagsResponseType = ClosedEnum<typeof UpdateFlagOutcomeFeatureFlagsResponseType>;
export type UpdateFlagOutcomeFeatureFlagsBase = {
    type: UpdateFlagOutcomeFeatureFlagsResponseType;
    kind: string;
    attribute: string;
};
export type UpdateFlagOutcomeFeatureFlags2 = {
    type: "split";
    base: UpdateFlagOutcomeFeatureFlagsBase;
    weights: {
        [k: string]: number;
    };
    defaultVariantId: string;
};
export type UpdateFlagOutcomeFeatureFlags1 = {
    type: "variant";
    variantId: string;
};
export type ResponseBodyOutcome = UpdateFlagOutcomeFeatureFlags1 | UpdateFlagOutcomeFeatureFlags2;
export declare const UpdateFlagRhsFeatureFlagsResponseType: {
    readonly Regex: "regex";
};
export type UpdateFlagRhsFeatureFlagsResponseType = ClosedEnum<typeof UpdateFlagRhsFeatureFlagsResponseType>;
export type UpdateFlagRhs4 = {
    type: UpdateFlagRhsFeatureFlagsResponseType;
    pattern: string;
    flags: string;
};
export declare const UpdateFlagRhsFeatureFlagsType: {
    readonly ListInline: "list/inline";
    readonly List: "list";
};
export type UpdateFlagRhsFeatureFlagsType = ClosedEnum<typeof UpdateFlagRhsFeatureFlagsType>;
export type UpdateFlagItemsFeatureFlags2 = {
    label?: string | undefined;
    note?: string | undefined;
    value: string;
};
export type UpdateFlagItemsFeatureFlags1 = {
    label?: string | undefined;
    note?: string | undefined;
    value: number;
};
export type UpdateFlagRhsFeatureFlagsItems = UpdateFlagItemsFeatureFlags1 | UpdateFlagItemsFeatureFlags2;
export type UpdateFlagRhs3 = {
    type: UpdateFlagRhsFeatureFlagsType;
    items: Array<UpdateFlagItemsFeatureFlags1 | UpdateFlagItemsFeatureFlags2>;
};
export type ResponseBodyRhs = UpdateFlagRhs4 | UpdateFlagRhs3 | string | number | boolean;
export type UpdateFlagLhsFeatureFlags2 = {
    type: "entity";
    kind: string;
    attribute: string;
};
export type UpdateFlagLhsFeatureFlags1 = {
    type: "segment";
};
export type ResponseBodyLhs = UpdateFlagLhsFeatureFlags1 | UpdateFlagLhsFeatureFlags2;
export declare const ResponseBodyCmp: {
    readonly Eq: "eq";
    readonly NotEq: "!eq";
    readonly OneOf: "oneOf";
    readonly NotOneOf: "!oneOf";
    readonly ContainsAllOf: "containsAllOf";
    readonly ContainsAnyOf: "containsAnyOf";
    readonly ContainsNoneOf: "containsNoneOf";
    readonly StartsWith: "startsWith";
    readonly NotStartsWith: "!startsWith";
    readonly EndsWith: "endsWith";
    readonly NotEndsWith: "!endsWith";
    readonly Ex: "ex";
    readonly NotEx: "!ex";
    readonly Gt: "gt";
    readonly Gte: "gte";
    readonly Lt: "lt";
    readonly Lte: "lte";
    readonly Regex: "regex";
    readonly NotRegex: "!regex";
    readonly Before: "before";
    readonly After: "after";
};
export type ResponseBodyCmp = ClosedEnum<typeof ResponseBodyCmp>;
export type ResponseBodyConditions = {
    rhs?: UpdateFlagRhs4 | UpdateFlagRhs3 | string | number | boolean | undefined;
    lhs: UpdateFlagLhsFeatureFlags1 | UpdateFlagLhsFeatureFlags2;
    cmp: ResponseBodyCmp;
};
export type ResponseBodyRules = {
    id: string;
    outcome: UpdateFlagOutcomeFeatureFlags1 | UpdateFlagOutcomeFeatureFlags2;
    conditions: Array<ResponseBodyConditions>;
};
export type ResponseBodyEnvironments = {
    reuse?: ResponseBodyReuse | undefined;
    targets?: {
        [k: string]: {
            [k: string]: {
                [k: string]: Array<UpdateFlagResponseBodyTargets>;
            };
        };
    } | undefined;
    revision?: number | undefined;
    pausedOutcome: ResponseBodyPausedOutcome;
    fallthrough: UpdateFlagFallthroughFeatureFlags1 | UpdateFlagFallthroughFeatureFlags2;
    active: boolean;
    rules: Array<ResponseBodyRules>;
};
export declare const ResponseBodyKind: {
    readonly String: "string";
    readonly Number: "number";
    readonly Boolean: "boolean";
};
export type ResponseBodyKind = ClosedEnum<typeof ResponseBodyKind>;
export declare const ResponseBodyState: {
    readonly Active: "active";
    readonly Archived: "archived";
};
export type ResponseBodyState = ClosedEnum<typeof ResponseBodyState>;
export declare const ResponseBodyTypeName: {
    readonly Flag: "flag";
};
export type ResponseBodyTypeName = ClosedEnum<typeof ResponseBodyTypeName>;
export type UpdateFlagResponseBody1 = {
    description?: string | undefined;
    variants: Array<ResponseBodyVariants>;
    id: string;
    environments: {
        [k: string]: ResponseBodyEnvironments;
    };
    kind: ResponseBodyKind;
    revision: number;
    seed: number;
    state: ResponseBodyState;
    slug: string;
    createdAt: number;
    updatedAt: number;
    createdBy: string;
    ownerId: string;
    projectId: string;
    typeName: ResponseBodyTypeName;
};
export type UpdateFlagResponseBody = UpdateFlagResponseBody1 | Flag;
/** @internal */
export declare const UpdateFlagValue$inboundSchema: z.ZodType<UpdateFlagValue, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagValue$Outbound = string | number | boolean;
/** @internal */
export declare const UpdateFlagValue$outboundSchema: z.ZodType<UpdateFlagValue$Outbound, z.ZodTypeDef, UpdateFlagValue>;
export declare function updateFlagValueToJSON(updateFlagValue: UpdateFlagValue): string;
export declare function updateFlagValueFromJSON(jsonString: string): SafeParseResult<UpdateFlagValue, SDKValidationError>;
/** @internal */
export declare const UpdateFlagVariants$inboundSchema: z.ZodType<UpdateFlagVariants, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagVariants$Outbound = {
    id: string;
    label?: string | undefined;
    description?: string | undefined;
    value: string | number | boolean;
};
/** @internal */
export declare const UpdateFlagVariants$outboundSchema: z.ZodType<UpdateFlagVariants$Outbound, z.ZodTypeDef, UpdateFlagVariants>;
export declare function updateFlagVariantsToJSON(updateFlagVariants: UpdateFlagVariants): string;
export declare function updateFlagVariantsFromJSON(jsonString: string): SafeParseResult<UpdateFlagVariants, SDKValidationError>;
/** @internal */
export declare const UpdateFlagReuse$inboundSchema: z.ZodType<UpdateFlagReuse, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagReuse$Outbound = {
    active: boolean;
    environment: string;
};
/** @internal */
export declare const UpdateFlagReuse$outboundSchema: z.ZodType<UpdateFlagReuse$Outbound, z.ZodTypeDef, UpdateFlagReuse>;
export declare function updateFlagReuseToJSON(updateFlagReuse: UpdateFlagReuse): string;
export declare function updateFlagReuseFromJSON(jsonString: string): SafeParseResult<UpdateFlagReuse, SDKValidationError>;
/** @internal */
export declare const UpdateFlagTargets$inboundSchema: z.ZodType<UpdateFlagTargets, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagTargets$Outbound = {
    note?: string | undefined;
    value: string;
};
/** @internal */
export declare const UpdateFlagTargets$outboundSchema: z.ZodType<UpdateFlagTargets$Outbound, z.ZodTypeDef, UpdateFlagTargets>;
export declare function updateFlagTargetsToJSON(updateFlagTargets: UpdateFlagTargets): string;
export declare function updateFlagTargetsFromJSON(jsonString: string): SafeParseResult<UpdateFlagTargets, SDKValidationError>;
/** @internal */
export declare const UpdateFlagPausedOutcome$inboundSchema: z.ZodType<UpdateFlagPausedOutcome, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagPausedOutcome$Outbound = {
    type?: any | undefined;
    variantId: string;
};
/** @internal */
export declare const UpdateFlagPausedOutcome$outboundSchema: z.ZodType<UpdateFlagPausedOutcome$Outbound, z.ZodTypeDef, UpdateFlagPausedOutcome>;
export declare function updateFlagPausedOutcomeToJSON(updateFlagPausedOutcome: UpdateFlagPausedOutcome): string;
export declare function updateFlagPausedOutcomeFromJSON(jsonString: string): SafeParseResult<UpdateFlagPausedOutcome, SDKValidationError>;
/** @internal */
export declare const UpdateFlagLhs2$inboundSchema: z.ZodType<UpdateFlagLhs2, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagLhs2$Outbound = {
    type?: any | undefined;
    kind: string;
    attribute: string;
};
/** @internal */
export declare const UpdateFlagLhs2$outboundSchema: z.ZodType<UpdateFlagLhs2$Outbound, z.ZodTypeDef, UpdateFlagLhs2>;
export declare function updateFlagLhs2ToJSON(updateFlagLhs2: UpdateFlagLhs2): string;
export declare function updateFlagLhs2FromJSON(jsonString: string): SafeParseResult<UpdateFlagLhs2, SDKValidationError>;
/** @internal */
export declare const UpdateFlagLhs1$inboundSchema: z.ZodType<UpdateFlagLhs1, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagLhs1$Outbound = {
    type?: any | undefined;
};
/** @internal */
export declare const UpdateFlagLhs1$outboundSchema: z.ZodType<UpdateFlagLhs1$Outbound, z.ZodTypeDef, UpdateFlagLhs1>;
export declare function updateFlagLhs1ToJSON(updateFlagLhs1: UpdateFlagLhs1): string;
export declare function updateFlagLhs1FromJSON(jsonString: string): SafeParseResult<UpdateFlagLhs1, SDKValidationError>;
/** @internal */
export declare const UpdateFlagLhs$inboundSchema: z.ZodType<UpdateFlagLhs, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagLhs$Outbound = UpdateFlagLhs2$Outbound | UpdateFlagLhs1$Outbound;
/** @internal */
export declare const UpdateFlagLhs$outboundSchema: z.ZodType<UpdateFlagLhs$Outbound, z.ZodTypeDef, UpdateFlagLhs>;
export declare function updateFlagLhsToJSON(updateFlagLhs: UpdateFlagLhs): string;
export declare function updateFlagLhsFromJSON(jsonString: string): SafeParseResult<UpdateFlagLhs, SDKValidationError>;
/** @internal */
export declare const UpdateFlagCmp$inboundSchema: z.ZodNativeEnum<typeof UpdateFlagCmp>;
/** @internal */
export declare const UpdateFlagCmp$outboundSchema: z.ZodNativeEnum<typeof UpdateFlagCmp>;
/** @internal */
export declare const UpdateFlagRhs2$inboundSchema: z.ZodType<UpdateFlagRhs2, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagRhs2$Outbound = {
    type?: any | undefined;
    pattern: string;
    flags: string;
};
/** @internal */
export declare const UpdateFlagRhs2$outboundSchema: z.ZodType<UpdateFlagRhs2$Outbound, z.ZodTypeDef, UpdateFlagRhs2>;
export declare function updateFlagRhs2ToJSON(updateFlagRhs2: UpdateFlagRhs2): string;
export declare function updateFlagRhs2FromJSON(jsonString: string): SafeParseResult<UpdateFlagRhs2, SDKValidationError>;
/** @internal */
export declare const UpdateFlagRhsType$inboundSchema: z.ZodNativeEnum<typeof UpdateFlagRhsType>;
/** @internal */
export declare const UpdateFlagRhsType$outboundSchema: z.ZodNativeEnum<typeof UpdateFlagRhsType>;
/** @internal */
export declare const UpdateFlagItems2$inboundSchema: z.ZodType<UpdateFlagItems2, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagItems2$Outbound = {
    label?: string | undefined;
    note?: string | undefined;
    value: string;
};
/** @internal */
export declare const UpdateFlagItems2$outboundSchema: z.ZodType<UpdateFlagItems2$Outbound, z.ZodTypeDef, UpdateFlagItems2>;
export declare function updateFlagItems2ToJSON(updateFlagItems2: UpdateFlagItems2): string;
export declare function updateFlagItems2FromJSON(jsonString: string): SafeParseResult<UpdateFlagItems2, SDKValidationError>;
/** @internal */
export declare const UpdateFlagItems1$inboundSchema: z.ZodType<UpdateFlagItems1, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagItems1$Outbound = {
    label?: string | undefined;
    note?: string | undefined;
    value: number;
};
/** @internal */
export declare const UpdateFlagItems1$outboundSchema: z.ZodType<UpdateFlagItems1$Outbound, z.ZodTypeDef, UpdateFlagItems1>;
export declare function updateFlagItems1ToJSON(updateFlagItems1: UpdateFlagItems1): string;
export declare function updateFlagItems1FromJSON(jsonString: string): SafeParseResult<UpdateFlagItems1, SDKValidationError>;
/** @internal */
export declare const UpdateFlagRhsItems$inboundSchema: z.ZodType<UpdateFlagRhsItems, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagRhsItems$Outbound = UpdateFlagItems1$Outbound | UpdateFlagItems2$Outbound;
/** @internal */
export declare const UpdateFlagRhsItems$outboundSchema: z.ZodType<UpdateFlagRhsItems$Outbound, z.ZodTypeDef, UpdateFlagRhsItems>;
export declare function updateFlagRhsItemsToJSON(updateFlagRhsItems: UpdateFlagRhsItems): string;
export declare function updateFlagRhsItemsFromJSON(jsonString: string): SafeParseResult<UpdateFlagRhsItems, SDKValidationError>;
/** @internal */
export declare const UpdateFlagRhs1$inboundSchema: z.ZodType<UpdateFlagRhs1, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagRhs1$Outbound = {
    type: string;
    items: Array<UpdateFlagItems1$Outbound | UpdateFlagItems2$Outbound>;
};
/** @internal */
export declare const UpdateFlagRhs1$outboundSchema: z.ZodType<UpdateFlagRhs1$Outbound, z.ZodTypeDef, UpdateFlagRhs1>;
export declare function updateFlagRhs1ToJSON(updateFlagRhs1: UpdateFlagRhs1): string;
export declare function updateFlagRhs1FromJSON(jsonString: string): SafeParseResult<UpdateFlagRhs1, SDKValidationError>;
/** @internal */
export declare const UpdateFlagRhs$inboundSchema: z.ZodType<UpdateFlagRhs, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagRhs$Outbound = UpdateFlagRhs2$Outbound | UpdateFlagRhs1$Outbound | string | number | boolean;
/** @internal */
export declare const UpdateFlagRhs$outboundSchema: z.ZodType<UpdateFlagRhs$Outbound, z.ZodTypeDef, UpdateFlagRhs>;
export declare function updateFlagRhsToJSON(updateFlagRhs: UpdateFlagRhs): string;
export declare function updateFlagRhsFromJSON(jsonString: string): SafeParseResult<UpdateFlagRhs, SDKValidationError>;
/** @internal */
export declare const UpdateFlagConditions$inboundSchema: z.ZodType<UpdateFlagConditions, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagConditions$Outbound = {
    lhs: UpdateFlagLhs2$Outbound | UpdateFlagLhs1$Outbound;
    cmp: string;
    rhs?: UpdateFlagRhs2$Outbound | UpdateFlagRhs1$Outbound | string | number | boolean | undefined;
};
/** @internal */
export declare const UpdateFlagConditions$outboundSchema: z.ZodType<UpdateFlagConditions$Outbound, z.ZodTypeDef, UpdateFlagConditions>;
export declare function updateFlagConditionsToJSON(updateFlagConditions: UpdateFlagConditions): string;
export declare function updateFlagConditionsFromJSON(jsonString: string): SafeParseResult<UpdateFlagConditions, SDKValidationError>;
/** @internal */
export declare const UpdateFlagOutcomeBase$inboundSchema: z.ZodType<UpdateFlagOutcomeBase, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagOutcomeBase$Outbound = {
    type?: any | undefined;
    kind: string;
    attribute: string;
};
/** @internal */
export declare const UpdateFlagOutcomeBase$outboundSchema: z.ZodType<UpdateFlagOutcomeBase$Outbound, z.ZodTypeDef, UpdateFlagOutcomeBase>;
export declare function updateFlagOutcomeBaseToJSON(updateFlagOutcomeBase: UpdateFlagOutcomeBase): string;
export declare function updateFlagOutcomeBaseFromJSON(jsonString: string): SafeParseResult<UpdateFlagOutcomeBase, SDKValidationError>;
/** @internal */
export declare const UpdateFlagOutcome2$inboundSchema: z.ZodType<UpdateFlagOutcome2, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagOutcome2$Outbound = {
    type?: any | undefined;
    base: UpdateFlagOutcomeBase$Outbound;
    weights: {
        [k: string]: number;
    };
    defaultVariantId: string;
};
/** @internal */
export declare const UpdateFlagOutcome2$outboundSchema: z.ZodType<UpdateFlagOutcome2$Outbound, z.ZodTypeDef, UpdateFlagOutcome2>;
export declare function updateFlagOutcome2ToJSON(updateFlagOutcome2: UpdateFlagOutcome2): string;
export declare function updateFlagOutcome2FromJSON(jsonString: string): SafeParseResult<UpdateFlagOutcome2, SDKValidationError>;
/** @internal */
export declare const UpdateFlagOutcome1$inboundSchema: z.ZodType<UpdateFlagOutcome1, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagOutcome1$Outbound = {
    type?: any | undefined;
    variantId: string;
};
/** @internal */
export declare const UpdateFlagOutcome1$outboundSchema: z.ZodType<UpdateFlagOutcome1$Outbound, z.ZodTypeDef, UpdateFlagOutcome1>;
export declare function updateFlagOutcome1ToJSON(updateFlagOutcome1: UpdateFlagOutcome1): string;
export declare function updateFlagOutcome1FromJSON(jsonString: string): SafeParseResult<UpdateFlagOutcome1, SDKValidationError>;
/** @internal */
export declare const UpdateFlagOutcome$inboundSchema: z.ZodType<UpdateFlagOutcome, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagOutcome$Outbound = UpdateFlagOutcome2$Outbound | UpdateFlagOutcome1$Outbound;
/** @internal */
export declare const UpdateFlagOutcome$outboundSchema: z.ZodType<UpdateFlagOutcome$Outbound, z.ZodTypeDef, UpdateFlagOutcome>;
export declare function updateFlagOutcomeToJSON(updateFlagOutcome: UpdateFlagOutcome): string;
export declare function updateFlagOutcomeFromJSON(jsonString: string): SafeParseResult<UpdateFlagOutcome, SDKValidationError>;
/** @internal */
export declare const UpdateFlagRules$inboundSchema: z.ZodType<UpdateFlagRules, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagRules$Outbound = {
    id: string;
    conditions: Array<UpdateFlagConditions$Outbound>;
    outcome: UpdateFlagOutcome2$Outbound | UpdateFlagOutcome1$Outbound;
};
/** @internal */
export declare const UpdateFlagRules$outboundSchema: z.ZodType<UpdateFlagRules$Outbound, z.ZodTypeDef, UpdateFlagRules>;
export declare function updateFlagRulesToJSON(updateFlagRules: UpdateFlagRules): string;
export declare function updateFlagRulesFromJSON(jsonString: string): SafeParseResult<UpdateFlagRules, SDKValidationError>;
/** @internal */
export declare const UpdateFlagFallthroughBase$inboundSchema: z.ZodType<UpdateFlagFallthroughBase, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagFallthroughBase$Outbound = {
    type?: any | undefined;
    kind: string;
    attribute: string;
};
/** @internal */
export declare const UpdateFlagFallthroughBase$outboundSchema: z.ZodType<UpdateFlagFallthroughBase$Outbound, z.ZodTypeDef, UpdateFlagFallthroughBase>;
export declare function updateFlagFallthroughBaseToJSON(updateFlagFallthroughBase: UpdateFlagFallthroughBase): string;
export declare function updateFlagFallthroughBaseFromJSON(jsonString: string): SafeParseResult<UpdateFlagFallthroughBase, SDKValidationError>;
/** @internal */
export declare const UpdateFlagFallthrough2$inboundSchema: z.ZodType<UpdateFlagFallthrough2, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagFallthrough2$Outbound = {
    type?: any | undefined;
    base: UpdateFlagFallthroughBase$Outbound;
    weights: {
        [k: string]: number;
    };
    defaultVariantId: string;
};
/** @internal */
export declare const UpdateFlagFallthrough2$outboundSchema: z.ZodType<UpdateFlagFallthrough2$Outbound, z.ZodTypeDef, UpdateFlagFallthrough2>;
export declare function updateFlagFallthrough2ToJSON(updateFlagFallthrough2: UpdateFlagFallthrough2): string;
export declare function updateFlagFallthrough2FromJSON(jsonString: string): SafeParseResult<UpdateFlagFallthrough2, SDKValidationError>;
/** @internal */
export declare const UpdateFlagFallthrough1$inboundSchema: z.ZodType<UpdateFlagFallthrough1, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagFallthrough1$Outbound = {
    type?: any | undefined;
    variantId: string;
};
/** @internal */
export declare const UpdateFlagFallthrough1$outboundSchema: z.ZodType<UpdateFlagFallthrough1$Outbound, z.ZodTypeDef, UpdateFlagFallthrough1>;
export declare function updateFlagFallthrough1ToJSON(updateFlagFallthrough1: UpdateFlagFallthrough1): string;
export declare function updateFlagFallthrough1FromJSON(jsonString: string): SafeParseResult<UpdateFlagFallthrough1, SDKValidationError>;
/** @internal */
export declare const UpdateFlagFallthrough$inboundSchema: z.ZodType<UpdateFlagFallthrough, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagFallthrough$Outbound = UpdateFlagFallthrough2$Outbound | UpdateFlagFallthrough1$Outbound;
/** @internal */
export declare const UpdateFlagFallthrough$outboundSchema: z.ZodType<UpdateFlagFallthrough$Outbound, z.ZodTypeDef, UpdateFlagFallthrough>;
export declare function updateFlagFallthroughToJSON(updateFlagFallthrough: UpdateFlagFallthrough): string;
export declare function updateFlagFallthroughFromJSON(jsonString: string): SafeParseResult<UpdateFlagFallthrough, SDKValidationError>;
/** @internal */
export declare const UpdateFlagEnvironments$inboundSchema: z.ZodType<UpdateFlagEnvironments, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagEnvironments$Outbound = {
    active: boolean;
    reuse?: UpdateFlagReuse$Outbound | undefined;
    targets?: {
        [k: string]: {
            [k: string]: {
                [k: string]: Array<UpdateFlagTargets$Outbound>;
            };
        };
    } | undefined;
    pausedOutcome: UpdateFlagPausedOutcome$Outbound;
    rules: Array<UpdateFlagRules$Outbound>;
    fallthrough: UpdateFlagFallthrough2$Outbound | UpdateFlagFallthrough1$Outbound;
    revision?: number | undefined;
};
/** @internal */
export declare const UpdateFlagEnvironments$outboundSchema: z.ZodType<UpdateFlagEnvironments$Outbound, z.ZodTypeDef, UpdateFlagEnvironments>;
export declare function updateFlagEnvironmentsToJSON(updateFlagEnvironments: UpdateFlagEnvironments): string;
export declare function updateFlagEnvironmentsFromJSON(jsonString: string): SafeParseResult<UpdateFlagEnvironments, SDKValidationError>;
/** @internal */
export declare const UpdateFlagState$inboundSchema: z.ZodNativeEnum<typeof UpdateFlagState>;
/** @internal */
export declare const UpdateFlagState$outboundSchema: z.ZodNativeEnum<typeof UpdateFlagState>;
/** @internal */
export declare const UpdateFlagRequestBody$inboundSchema: z.ZodType<UpdateFlagRequestBody, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagRequestBody$Outbound = {
    createdBy?: string | undefined;
    message?: string | undefined;
    variants?: Array<UpdateFlagVariants$Outbound> | undefined;
    environments?: {
        [k: string]: UpdateFlagEnvironments$Outbound;
    } | undefined;
    seed?: number | undefined;
    description?: string | undefined;
    state?: string | undefined;
};
/** @internal */
export declare const UpdateFlagRequestBody$outboundSchema: z.ZodType<UpdateFlagRequestBody$Outbound, z.ZodTypeDef, UpdateFlagRequestBody>;
export declare function updateFlagRequestBodyToJSON(updateFlagRequestBody: UpdateFlagRequestBody): string;
export declare function updateFlagRequestBodyFromJSON(jsonString: string): SafeParseResult<UpdateFlagRequestBody, SDKValidationError>;
/** @internal */
export declare const UpdateFlagRequest$inboundSchema: z.ZodType<UpdateFlagRequest, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagRequest$Outbound = {
    projectIdOrName: string;
    flagIdOrSlug: string;
    ifMatch?: string | undefined;
    withMetadata?: boolean | undefined;
    teamId?: string | undefined;
    slug?: string | undefined;
    RequestBody?: UpdateFlagRequestBody$Outbound | undefined;
};
/** @internal */
export declare const UpdateFlagRequest$outboundSchema: z.ZodType<UpdateFlagRequest$Outbound, z.ZodTypeDef, UpdateFlagRequest>;
export declare function updateFlagRequestToJSON(updateFlagRequest: UpdateFlagRequest): string;
export declare function updateFlagRequestFromJSON(jsonString: string): SafeParseResult<UpdateFlagRequest, SDKValidationError>;
/** @internal */
export declare const ResponseBodyValue$inboundSchema: z.ZodType<ResponseBodyValue, z.ZodTypeDef, unknown>;
/** @internal */
export type ResponseBodyValue$Outbound = string | number | boolean;
/** @internal */
export declare const ResponseBodyValue$outboundSchema: z.ZodType<ResponseBodyValue$Outbound, z.ZodTypeDef, ResponseBodyValue>;
export declare function responseBodyValueToJSON(responseBodyValue: ResponseBodyValue): string;
export declare function responseBodyValueFromJSON(jsonString: string): SafeParseResult<ResponseBodyValue, SDKValidationError>;
/** @internal */
export declare const ResponseBodyVariants$inboundSchema: z.ZodType<ResponseBodyVariants, z.ZodTypeDef, unknown>;
/** @internal */
export type ResponseBodyVariants$Outbound = {
    description?: string | undefined;
    label?: string | undefined;
    value: string | number | boolean;
    id: string;
};
/** @internal */
export declare const ResponseBodyVariants$outboundSchema: z.ZodType<ResponseBodyVariants$Outbound, z.ZodTypeDef, ResponseBodyVariants>;
export declare function responseBodyVariantsToJSON(responseBodyVariants: ResponseBodyVariants): string;
export declare function responseBodyVariantsFromJSON(jsonString: string): SafeParseResult<ResponseBodyVariants, SDKValidationError>;
/** @internal */
export declare const ResponseBodyReuse$inboundSchema: z.ZodType<ResponseBodyReuse, z.ZodTypeDef, unknown>;
/** @internal */
export type ResponseBodyReuse$Outbound = {
    active: boolean;
    environment: string;
};
/** @internal */
export declare const ResponseBodyReuse$outboundSchema: z.ZodType<ResponseBodyReuse$Outbound, z.ZodTypeDef, ResponseBodyReuse>;
export declare function responseBodyReuseToJSON(responseBodyReuse: ResponseBodyReuse): string;
export declare function responseBodyReuseFromJSON(jsonString: string): SafeParseResult<ResponseBodyReuse, SDKValidationError>;
/** @internal */
export declare const UpdateFlagResponseBodyTargets$inboundSchema: z.ZodType<UpdateFlagResponseBodyTargets, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagResponseBodyTargets$Outbound = {
    note?: string | undefined;
    value: string;
};
/** @internal */
export declare const UpdateFlagResponseBodyTargets$outboundSchema: z.ZodType<UpdateFlagResponseBodyTargets$Outbound, z.ZodTypeDef, UpdateFlagResponseBodyTargets>;
export declare function updateFlagResponseBodyTargetsToJSON(updateFlagResponseBodyTargets: UpdateFlagResponseBodyTargets): string;
export declare function updateFlagResponseBodyTargetsFromJSON(jsonString: string): SafeParseResult<UpdateFlagResponseBodyTargets, SDKValidationError>;
/** @internal */
export declare const UpdateFlagResponseBodyType$inboundSchema: z.ZodNativeEnum<typeof UpdateFlagResponseBodyType>;
/** @internal */
export declare const UpdateFlagResponseBodyType$outboundSchema: z.ZodNativeEnum<typeof UpdateFlagResponseBodyType>;
/** @internal */
export declare const ResponseBodyPausedOutcome$inboundSchema: z.ZodType<ResponseBodyPausedOutcome, z.ZodTypeDef, unknown>;
/** @internal */
export type ResponseBodyPausedOutcome$Outbound = {
    type: string;
    variantId: string;
};
/** @internal */
export declare const ResponseBodyPausedOutcome$outboundSchema: z.ZodType<ResponseBodyPausedOutcome$Outbound, z.ZodTypeDef, ResponseBodyPausedOutcome>;
export declare function responseBodyPausedOutcomeToJSON(responseBodyPausedOutcome: ResponseBodyPausedOutcome): string;
export declare function responseBodyPausedOutcomeFromJSON(jsonString: string): SafeParseResult<ResponseBodyPausedOutcome, SDKValidationError>;
/** @internal */
export declare const UpdateFlagFallthroughFeatureFlagsResponseType$inboundSchema: z.ZodNativeEnum<typeof UpdateFlagFallthroughFeatureFlagsResponseType>;
/** @internal */
export declare const UpdateFlagFallthroughFeatureFlagsResponseType$outboundSchema: z.ZodNativeEnum<typeof UpdateFlagFallthroughFeatureFlagsResponseType>;
/** @internal */
export declare const UpdateFlagFallthroughFeatureFlagsBase$inboundSchema: z.ZodType<UpdateFlagFallthroughFeatureFlagsBase, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagFallthroughFeatureFlagsBase$Outbound = {
    type: string;
    kind: string;
    attribute: string;
};
/** @internal */
export declare const UpdateFlagFallthroughFeatureFlagsBase$outboundSchema: z.ZodType<UpdateFlagFallthroughFeatureFlagsBase$Outbound, z.ZodTypeDef, UpdateFlagFallthroughFeatureFlagsBase>;
export declare function updateFlagFallthroughFeatureFlagsBaseToJSON(updateFlagFallthroughFeatureFlagsBase: UpdateFlagFallthroughFeatureFlagsBase): string;
export declare function updateFlagFallthroughFeatureFlagsBaseFromJSON(jsonString: string): SafeParseResult<UpdateFlagFallthroughFeatureFlagsBase, SDKValidationError>;
/** @internal */
export declare const UpdateFlagFallthroughFeatureFlags2$inboundSchema: z.ZodType<UpdateFlagFallthroughFeatureFlags2, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagFallthroughFeatureFlags2$Outbound = {
    type: "split";
    base: UpdateFlagFallthroughFeatureFlagsBase$Outbound;
    weights: {
        [k: string]: number;
    };
    defaultVariantId: string;
};
/** @internal */
export declare const UpdateFlagFallthroughFeatureFlags2$outboundSchema: z.ZodType<UpdateFlagFallthroughFeatureFlags2$Outbound, z.ZodTypeDef, UpdateFlagFallthroughFeatureFlags2>;
export declare function updateFlagFallthroughFeatureFlags2ToJSON(updateFlagFallthroughFeatureFlags2: UpdateFlagFallthroughFeatureFlags2): string;
export declare function updateFlagFallthroughFeatureFlags2FromJSON(jsonString: string): SafeParseResult<UpdateFlagFallthroughFeatureFlags2, SDKValidationError>;
/** @internal */
export declare const UpdateFlagFallthroughFeatureFlags1$inboundSchema: z.ZodType<UpdateFlagFallthroughFeatureFlags1, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagFallthroughFeatureFlags1$Outbound = {
    type: "variant";
    variantId: string;
};
/** @internal */
export declare const UpdateFlagFallthroughFeatureFlags1$outboundSchema: z.ZodType<UpdateFlagFallthroughFeatureFlags1$Outbound, z.ZodTypeDef, UpdateFlagFallthroughFeatureFlags1>;
export declare function updateFlagFallthroughFeatureFlags1ToJSON(updateFlagFallthroughFeatureFlags1: UpdateFlagFallthroughFeatureFlags1): string;
export declare function updateFlagFallthroughFeatureFlags1FromJSON(jsonString: string): SafeParseResult<UpdateFlagFallthroughFeatureFlags1, SDKValidationError>;
/** @internal */
export declare const ResponseBodyFallthrough$inboundSchema: z.ZodType<ResponseBodyFallthrough, z.ZodTypeDef, unknown>;
/** @internal */
export type ResponseBodyFallthrough$Outbound = UpdateFlagFallthroughFeatureFlags1$Outbound | UpdateFlagFallthroughFeatureFlags2$Outbound;
/** @internal */
export declare const ResponseBodyFallthrough$outboundSchema: z.ZodType<ResponseBodyFallthrough$Outbound, z.ZodTypeDef, ResponseBodyFallthrough>;
export declare function responseBodyFallthroughToJSON(responseBodyFallthrough: ResponseBodyFallthrough): string;
export declare function responseBodyFallthroughFromJSON(jsonString: string): SafeParseResult<ResponseBodyFallthrough, SDKValidationError>;
/** @internal */
export declare const UpdateFlagOutcomeFeatureFlagsResponseType$inboundSchema: z.ZodNativeEnum<typeof UpdateFlagOutcomeFeatureFlagsResponseType>;
/** @internal */
export declare const UpdateFlagOutcomeFeatureFlagsResponseType$outboundSchema: z.ZodNativeEnum<typeof UpdateFlagOutcomeFeatureFlagsResponseType>;
/** @internal */
export declare const UpdateFlagOutcomeFeatureFlagsBase$inboundSchema: z.ZodType<UpdateFlagOutcomeFeatureFlagsBase, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagOutcomeFeatureFlagsBase$Outbound = {
    type: string;
    kind: string;
    attribute: string;
};
/** @internal */
export declare const UpdateFlagOutcomeFeatureFlagsBase$outboundSchema: z.ZodType<UpdateFlagOutcomeFeatureFlagsBase$Outbound, z.ZodTypeDef, UpdateFlagOutcomeFeatureFlagsBase>;
export declare function updateFlagOutcomeFeatureFlagsBaseToJSON(updateFlagOutcomeFeatureFlagsBase: UpdateFlagOutcomeFeatureFlagsBase): string;
export declare function updateFlagOutcomeFeatureFlagsBaseFromJSON(jsonString: string): SafeParseResult<UpdateFlagOutcomeFeatureFlagsBase, SDKValidationError>;
/** @internal */
export declare const UpdateFlagOutcomeFeatureFlags2$inboundSchema: z.ZodType<UpdateFlagOutcomeFeatureFlags2, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagOutcomeFeatureFlags2$Outbound = {
    type: "split";
    base: UpdateFlagOutcomeFeatureFlagsBase$Outbound;
    weights: {
        [k: string]: number;
    };
    defaultVariantId: string;
};
/** @internal */
export declare const UpdateFlagOutcomeFeatureFlags2$outboundSchema: z.ZodType<UpdateFlagOutcomeFeatureFlags2$Outbound, z.ZodTypeDef, UpdateFlagOutcomeFeatureFlags2>;
export declare function updateFlagOutcomeFeatureFlags2ToJSON(updateFlagOutcomeFeatureFlags2: UpdateFlagOutcomeFeatureFlags2): string;
export declare function updateFlagOutcomeFeatureFlags2FromJSON(jsonString: string): SafeParseResult<UpdateFlagOutcomeFeatureFlags2, SDKValidationError>;
/** @internal */
export declare const UpdateFlagOutcomeFeatureFlags1$inboundSchema: z.ZodType<UpdateFlagOutcomeFeatureFlags1, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagOutcomeFeatureFlags1$Outbound = {
    type: "variant";
    variantId: string;
};
/** @internal */
export declare const UpdateFlagOutcomeFeatureFlags1$outboundSchema: z.ZodType<UpdateFlagOutcomeFeatureFlags1$Outbound, z.ZodTypeDef, UpdateFlagOutcomeFeatureFlags1>;
export declare function updateFlagOutcomeFeatureFlags1ToJSON(updateFlagOutcomeFeatureFlags1: UpdateFlagOutcomeFeatureFlags1): string;
export declare function updateFlagOutcomeFeatureFlags1FromJSON(jsonString: string): SafeParseResult<UpdateFlagOutcomeFeatureFlags1, SDKValidationError>;
/** @internal */
export declare const ResponseBodyOutcome$inboundSchema: z.ZodType<ResponseBodyOutcome, z.ZodTypeDef, unknown>;
/** @internal */
export type ResponseBodyOutcome$Outbound = UpdateFlagOutcomeFeatureFlags1$Outbound | UpdateFlagOutcomeFeatureFlags2$Outbound;
/** @internal */
export declare const ResponseBodyOutcome$outboundSchema: z.ZodType<ResponseBodyOutcome$Outbound, z.ZodTypeDef, ResponseBodyOutcome>;
export declare function responseBodyOutcomeToJSON(responseBodyOutcome: ResponseBodyOutcome): string;
export declare function responseBodyOutcomeFromJSON(jsonString: string): SafeParseResult<ResponseBodyOutcome, SDKValidationError>;
/** @internal */
export declare const UpdateFlagRhsFeatureFlagsResponseType$inboundSchema: z.ZodNativeEnum<typeof UpdateFlagRhsFeatureFlagsResponseType>;
/** @internal */
export declare const UpdateFlagRhsFeatureFlagsResponseType$outboundSchema: z.ZodNativeEnum<typeof UpdateFlagRhsFeatureFlagsResponseType>;
/** @internal */
export declare const UpdateFlagRhs4$inboundSchema: z.ZodType<UpdateFlagRhs4, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagRhs4$Outbound = {
    type: string;
    pattern: string;
    flags: string;
};
/** @internal */
export declare const UpdateFlagRhs4$outboundSchema: z.ZodType<UpdateFlagRhs4$Outbound, z.ZodTypeDef, UpdateFlagRhs4>;
export declare function updateFlagRhs4ToJSON(updateFlagRhs4: UpdateFlagRhs4): string;
export declare function updateFlagRhs4FromJSON(jsonString: string): SafeParseResult<UpdateFlagRhs4, SDKValidationError>;
/** @internal */
export declare const UpdateFlagRhsFeatureFlagsType$inboundSchema: z.ZodNativeEnum<typeof UpdateFlagRhsFeatureFlagsType>;
/** @internal */
export declare const UpdateFlagRhsFeatureFlagsType$outboundSchema: z.ZodNativeEnum<typeof UpdateFlagRhsFeatureFlagsType>;
/** @internal */
export declare const UpdateFlagItemsFeatureFlags2$inboundSchema: z.ZodType<UpdateFlagItemsFeatureFlags2, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagItemsFeatureFlags2$Outbound = {
    label?: string | undefined;
    note?: string | undefined;
    value: string;
};
/** @internal */
export declare const UpdateFlagItemsFeatureFlags2$outboundSchema: z.ZodType<UpdateFlagItemsFeatureFlags2$Outbound, z.ZodTypeDef, UpdateFlagItemsFeatureFlags2>;
export declare function updateFlagItemsFeatureFlags2ToJSON(updateFlagItemsFeatureFlags2: UpdateFlagItemsFeatureFlags2): string;
export declare function updateFlagItemsFeatureFlags2FromJSON(jsonString: string): SafeParseResult<UpdateFlagItemsFeatureFlags2, SDKValidationError>;
/** @internal */
export declare const UpdateFlagItemsFeatureFlags1$inboundSchema: z.ZodType<UpdateFlagItemsFeatureFlags1, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagItemsFeatureFlags1$Outbound = {
    label?: string | undefined;
    note?: string | undefined;
    value: number;
};
/** @internal */
export declare const UpdateFlagItemsFeatureFlags1$outboundSchema: z.ZodType<UpdateFlagItemsFeatureFlags1$Outbound, z.ZodTypeDef, UpdateFlagItemsFeatureFlags1>;
export declare function updateFlagItemsFeatureFlags1ToJSON(updateFlagItemsFeatureFlags1: UpdateFlagItemsFeatureFlags1): string;
export declare function updateFlagItemsFeatureFlags1FromJSON(jsonString: string): SafeParseResult<UpdateFlagItemsFeatureFlags1, SDKValidationError>;
/** @internal */
export declare const UpdateFlagRhsFeatureFlagsItems$inboundSchema: z.ZodType<UpdateFlagRhsFeatureFlagsItems, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagRhsFeatureFlagsItems$Outbound = UpdateFlagItemsFeatureFlags1$Outbound | UpdateFlagItemsFeatureFlags2$Outbound;
/** @internal */
export declare const UpdateFlagRhsFeatureFlagsItems$outboundSchema: z.ZodType<UpdateFlagRhsFeatureFlagsItems$Outbound, z.ZodTypeDef, UpdateFlagRhsFeatureFlagsItems>;
export declare function updateFlagRhsFeatureFlagsItemsToJSON(updateFlagRhsFeatureFlagsItems: UpdateFlagRhsFeatureFlagsItems): string;
export declare function updateFlagRhsFeatureFlagsItemsFromJSON(jsonString: string): SafeParseResult<UpdateFlagRhsFeatureFlagsItems, SDKValidationError>;
/** @internal */
export declare const UpdateFlagRhs3$inboundSchema: z.ZodType<UpdateFlagRhs3, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagRhs3$Outbound = {
    type: string;
    items: Array<UpdateFlagItemsFeatureFlags1$Outbound | UpdateFlagItemsFeatureFlags2$Outbound>;
};
/** @internal */
export declare const UpdateFlagRhs3$outboundSchema: z.ZodType<UpdateFlagRhs3$Outbound, z.ZodTypeDef, UpdateFlagRhs3>;
export declare function updateFlagRhs3ToJSON(updateFlagRhs3: UpdateFlagRhs3): string;
export declare function updateFlagRhs3FromJSON(jsonString: string): SafeParseResult<UpdateFlagRhs3, SDKValidationError>;
/** @internal */
export declare const ResponseBodyRhs$inboundSchema: z.ZodType<ResponseBodyRhs, z.ZodTypeDef, unknown>;
/** @internal */
export type ResponseBodyRhs$Outbound = UpdateFlagRhs4$Outbound | UpdateFlagRhs3$Outbound | string | number | boolean;
/** @internal */
export declare const ResponseBodyRhs$outboundSchema: z.ZodType<ResponseBodyRhs$Outbound, z.ZodTypeDef, ResponseBodyRhs>;
export declare function responseBodyRhsToJSON(responseBodyRhs: ResponseBodyRhs): string;
export declare function responseBodyRhsFromJSON(jsonString: string): SafeParseResult<ResponseBodyRhs, SDKValidationError>;
/** @internal */
export declare const UpdateFlagLhsFeatureFlags2$inboundSchema: z.ZodType<UpdateFlagLhsFeatureFlags2, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagLhsFeatureFlags2$Outbound = {
    type: "entity";
    kind: string;
    attribute: string;
};
/** @internal */
export declare const UpdateFlagLhsFeatureFlags2$outboundSchema: z.ZodType<UpdateFlagLhsFeatureFlags2$Outbound, z.ZodTypeDef, UpdateFlagLhsFeatureFlags2>;
export declare function updateFlagLhsFeatureFlags2ToJSON(updateFlagLhsFeatureFlags2: UpdateFlagLhsFeatureFlags2): string;
export declare function updateFlagLhsFeatureFlags2FromJSON(jsonString: string): SafeParseResult<UpdateFlagLhsFeatureFlags2, SDKValidationError>;
/** @internal */
export declare const UpdateFlagLhsFeatureFlags1$inboundSchema: z.ZodType<UpdateFlagLhsFeatureFlags1, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagLhsFeatureFlags1$Outbound = {
    type: "segment";
};
/** @internal */
export declare const UpdateFlagLhsFeatureFlags1$outboundSchema: z.ZodType<UpdateFlagLhsFeatureFlags1$Outbound, z.ZodTypeDef, UpdateFlagLhsFeatureFlags1>;
export declare function updateFlagLhsFeatureFlags1ToJSON(updateFlagLhsFeatureFlags1: UpdateFlagLhsFeatureFlags1): string;
export declare function updateFlagLhsFeatureFlags1FromJSON(jsonString: string): SafeParseResult<UpdateFlagLhsFeatureFlags1, SDKValidationError>;
/** @internal */
export declare const ResponseBodyLhs$inboundSchema: z.ZodType<ResponseBodyLhs, z.ZodTypeDef, unknown>;
/** @internal */
export type ResponseBodyLhs$Outbound = UpdateFlagLhsFeatureFlags1$Outbound | UpdateFlagLhsFeatureFlags2$Outbound;
/** @internal */
export declare const ResponseBodyLhs$outboundSchema: z.ZodType<ResponseBodyLhs$Outbound, z.ZodTypeDef, ResponseBodyLhs>;
export declare function responseBodyLhsToJSON(responseBodyLhs: ResponseBodyLhs): string;
export declare function responseBodyLhsFromJSON(jsonString: string): SafeParseResult<ResponseBodyLhs, SDKValidationError>;
/** @internal */
export declare const ResponseBodyCmp$inboundSchema: z.ZodNativeEnum<typeof ResponseBodyCmp>;
/** @internal */
export declare const ResponseBodyCmp$outboundSchema: z.ZodNativeEnum<typeof ResponseBodyCmp>;
/** @internal */
export declare const ResponseBodyConditions$inboundSchema: z.ZodType<ResponseBodyConditions, z.ZodTypeDef, unknown>;
/** @internal */
export type ResponseBodyConditions$Outbound = {
    rhs?: UpdateFlagRhs4$Outbound | UpdateFlagRhs3$Outbound | string | number | boolean | undefined;
    lhs: UpdateFlagLhsFeatureFlags1$Outbound | UpdateFlagLhsFeatureFlags2$Outbound;
    cmp: string;
};
/** @internal */
export declare const ResponseBodyConditions$outboundSchema: z.ZodType<ResponseBodyConditions$Outbound, z.ZodTypeDef, ResponseBodyConditions>;
export declare function responseBodyConditionsToJSON(responseBodyConditions: ResponseBodyConditions): string;
export declare function responseBodyConditionsFromJSON(jsonString: string): SafeParseResult<ResponseBodyConditions, SDKValidationError>;
/** @internal */
export declare const ResponseBodyRules$inboundSchema: z.ZodType<ResponseBodyRules, z.ZodTypeDef, unknown>;
/** @internal */
export type ResponseBodyRules$Outbound = {
    id: string;
    outcome: UpdateFlagOutcomeFeatureFlags1$Outbound | UpdateFlagOutcomeFeatureFlags2$Outbound;
    conditions: Array<ResponseBodyConditions$Outbound>;
};
/** @internal */
export declare const ResponseBodyRules$outboundSchema: z.ZodType<ResponseBodyRules$Outbound, z.ZodTypeDef, ResponseBodyRules>;
export declare function responseBodyRulesToJSON(responseBodyRules: ResponseBodyRules): string;
export declare function responseBodyRulesFromJSON(jsonString: string): SafeParseResult<ResponseBodyRules, SDKValidationError>;
/** @internal */
export declare const ResponseBodyEnvironments$inboundSchema: z.ZodType<ResponseBodyEnvironments, z.ZodTypeDef, unknown>;
/** @internal */
export type ResponseBodyEnvironments$Outbound = {
    reuse?: ResponseBodyReuse$Outbound | undefined;
    targets?: {
        [k: string]: {
            [k: string]: {
                [k: string]: Array<UpdateFlagResponseBodyTargets$Outbound>;
            };
        };
    } | undefined;
    revision?: number | undefined;
    pausedOutcome: ResponseBodyPausedOutcome$Outbound;
    fallthrough: UpdateFlagFallthroughFeatureFlags1$Outbound | UpdateFlagFallthroughFeatureFlags2$Outbound;
    active: boolean;
    rules: Array<ResponseBodyRules$Outbound>;
};
/** @internal */
export declare const ResponseBodyEnvironments$outboundSchema: z.ZodType<ResponseBodyEnvironments$Outbound, z.ZodTypeDef, ResponseBodyEnvironments>;
export declare function responseBodyEnvironmentsToJSON(responseBodyEnvironments: ResponseBodyEnvironments): string;
export declare function responseBodyEnvironmentsFromJSON(jsonString: string): SafeParseResult<ResponseBodyEnvironments, SDKValidationError>;
/** @internal */
export declare const ResponseBodyKind$inboundSchema: z.ZodNativeEnum<typeof ResponseBodyKind>;
/** @internal */
export declare const ResponseBodyKind$outboundSchema: z.ZodNativeEnum<typeof ResponseBodyKind>;
/** @internal */
export declare const ResponseBodyState$inboundSchema: z.ZodNativeEnum<typeof ResponseBodyState>;
/** @internal */
export declare const ResponseBodyState$outboundSchema: z.ZodNativeEnum<typeof ResponseBodyState>;
/** @internal */
export declare const ResponseBodyTypeName$inboundSchema: z.ZodNativeEnum<typeof ResponseBodyTypeName>;
/** @internal */
export declare const ResponseBodyTypeName$outboundSchema: z.ZodNativeEnum<typeof ResponseBodyTypeName>;
/** @internal */
export declare const UpdateFlagResponseBody1$inboundSchema: z.ZodType<UpdateFlagResponseBody1, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagResponseBody1$Outbound = {
    description?: string | undefined;
    variants: Array<ResponseBodyVariants$Outbound>;
    id: string;
    environments: {
        [k: string]: ResponseBodyEnvironments$Outbound;
    };
    kind: string;
    revision: number;
    seed: number;
    state: string;
    slug: string;
    createdAt: number;
    updatedAt: number;
    createdBy: string;
    ownerId: string;
    projectId: string;
    typeName: string;
};
/** @internal */
export declare const UpdateFlagResponseBody1$outboundSchema: z.ZodType<UpdateFlagResponseBody1$Outbound, z.ZodTypeDef, UpdateFlagResponseBody1>;
export declare function updateFlagResponseBody1ToJSON(updateFlagResponseBody1: UpdateFlagResponseBody1): string;
export declare function updateFlagResponseBody1FromJSON(jsonString: string): SafeParseResult<UpdateFlagResponseBody1, SDKValidationError>;
/** @internal */
export declare const UpdateFlagResponseBody$inboundSchema: z.ZodType<UpdateFlagResponseBody, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFlagResponseBody$Outbound = UpdateFlagResponseBody1$Outbound | Flag$Outbound;
/** @internal */
export declare const UpdateFlagResponseBody$outboundSchema: z.ZodType<UpdateFlagResponseBody$Outbound, z.ZodTypeDef, UpdateFlagResponseBody>;
export declare function updateFlagResponseBodyToJSON(updateFlagResponseBody: UpdateFlagResponseBody): string;
export declare function updateFlagResponseBodyFromJSON(jsonString: string): SafeParseResult<UpdateFlagResponseBody, SDKValidationError>;
//# sourceMappingURL=updateflagop.d.ts.map