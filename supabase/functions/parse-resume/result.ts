export const resumeOutputFormat = {
  type: "object",
  properties: Object.fromEntries(["first_name", "last_name", "job_title", "linkedin_url", "description"].map(key => [key, { type: "string" }])),
  required: ["first_name", "last_name", "job_title", "linkedin_url", "description"],
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
  const result = { first_name: stringField("first_name"), last_name: stringField("last_name"), job_title: stringField("job_title"), linkedin_url, description: stringField("description") };
  if (!result.first_name && !result.last_name && !result.job_title && !result.description) throw new Error("Empty resume result");
  return result;
}