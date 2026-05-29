export * from "./users";
export * from "./alerts";
export * from "./posts";
export * from "./events";
export * from "./businesses";
export * from "./marketplace";
export * from "./notifications";
export * from "./messages";
export * from "./admin";

import { mockUsers } from "./users";

export function getUserById(id: string) {
  return mockUsers.find((u) => u.id === id);
}
