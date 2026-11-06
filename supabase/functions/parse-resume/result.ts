export const resumeOutputFormat = {
  type: "object",
  properties: {
    ...Object.fromEntries(["first_name", "last_name", "job_title", "linkedin_url", "description"].map(key => [key, { type: "string" }])),
    emails: { type: "array", items: { type: "string" } }, phones: { type: "array", items: { type: "string" } },
    addresses: { type: "array", items: { type: "object", properties: Object.fromEntries(["street", "city", "state", "postal_code", "country"].map(key => [key, { type: "string" }])), required: ["street", "city", "state", "postal_code", "country"], additionalProperties: false } },
  },
  required: ["first_name", "last_name", "job_title", "linkedin_url", "description", "emails", "phones", "addresses"],
  additionalProperties: false,
};

export function normalizeResumeResult(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("Invalid resume result");
  const stringField = (key: string) => {
    const field: unknown = Reflect.get(value, key);
    if (field === null || field === undefined) return "";
    if (typeof field !== "string") throw new Error("Invalid resume field");
    return field.trim();
  };
  const rawLink = stringField("linkedin_url");
  let linkedin_url = "";
  if (rawLink) {
    try {
      const link = new URL(/^https?:\/\//i.test(rawLink) ? rawLink : `https://${rawLink}`);
      if (["linkedin.com", "www.linkedin.com"].includes(link.hostname) && ["http:", "https:"].includes(link.protocol) && !link.username && !link.password) {
        link.protocol = "https:";
        linkedin_url = link.toString();
      }
    } catch { /* Ignore absent or unusable optional links, not the whole resume. */ }
  }
  const arrayField = (key: string): unknown[] => {
    const field = Reflect.get(value, key);
    if (field == null) return [];
    if (!Array.isArray(field)) throw new Error("Invalid resume contact details");
    return field;
  };
  const strings = (key: string) => [...new Set(arrayField(key).map(item => { if (typeof item !== "string") throw new Error("Invalid contact detail"); return item.trim(); }).filter(Boolean))];
  const addresses = arrayField("addresses").map(item => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error("Invalid address");
    return Object.fromEntries(["street", "city", "state", "postal_code", "country"].map(key => {
      const part = Reflect.get(item, key);
      if (part != null && typeof part !== "string") throw new Error("Invalid address part");
      return [key, typeof part === "string" ? part.trim() : ""];
    }));
  }).filter(item => Object.values(item).some(Boolean));
  const result = { first_name: stringField("first_name"), last_name: stringField("last_name"), job_title: stringField("job_title"), linkedin_url, description: stringField("description"), emails: strings("emails"), phones: strings("phones"), addresses };
  if (!result.first_name && !result.last_name && !result.job_title && !result.description) throw new Error("Empty resume result");
  return result;
}