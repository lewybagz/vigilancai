import type { JsonLdObject } from "@/lib/guides/schema";

/**
 * Renders one <script type="application/ld+json"> per non-null schema object.
 * "<" is escaped to "<" so a "</script>" inside content cannot break out.
 */
export function JsonLd({ schemas }: { schemas: Array<JsonLdObject | null | undefined> }) {
  const valid = schemas.filter((s): s is JsonLdObject => Boolean(s));
  if (valid.length === 0) return null;
  return (
    <>
      {valid.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
        />
      ))}
    </>
  );
}
