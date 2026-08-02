export const PIPELINE_USERS = ["Miguel", "Ralf", "Oliver"] as const;
export type PipelineUser = (typeof PIPELINE_USERS)[number];

export function isPipelineUser(value: string): value is PipelineUser {
  return (PIPELINE_USERS as readonly string[]).includes(value);
}
