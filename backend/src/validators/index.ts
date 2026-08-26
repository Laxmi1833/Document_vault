import { GraphQLError } from "graphql";

export function validateNonEmpty(value: string, fieldName: string): string {
  const trimmed = value.trim();
  if (trimmed === "") {
    throw new GraphQLError(`${fieldName} must not be empty or whitespace-only`, {
      extensions: { code: "VALIDATION_ERROR" },
    });
  }
  return trimmed;
}

export function validateSlug(slug: string): string {
  const trimmed = slug.trim();
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugRegex.test(trimmed)) {
    throw new GraphQLError(
      "Slug must contain only lowercase letters, numbers, and single hyphens, and cannot start or end with a hyphen",
      {
        extensions: { code: "VALIDATION_ERROR" },
      }
    );
  }
  return trimmed;
}
