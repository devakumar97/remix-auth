import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

import { db } from "drizzle/client";
import { users, passwords } from "drizzle/schema";

export type User = typeof users.$inferSelect;
export type Password = typeof passwords.$inferSelect;

export async function getUserById(id: User["id"]) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
  });
  return user ?? null;
}

export async function getUserByEmail(email: User["email"]) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  return user ?? null;
}

export async function createUser(email: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, 10);

  const [newUser] = await db.insert(users)
    .values({
      email,
      username: email, 
    })
    .returning();

  await db.insert(passwords).values({
    userId: newUser.id,
    hash: hashedPassword,
  });

  return newUser;
}

export async function deleteUserByEmail(email: string) {
  const [deletedUser] = await db
    .delete(users)
    .where(eq(users.email, email))
    .returning();
  return deletedUser;
}

export async function verifyLogin(email: string, password: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) return null;

  const passwordRecord = await db.query.passwords.findFirst({
    where: eq(passwords.userId, user.id),
  });

  if (!passwordRecord) return null;

  const isValid = await bcrypt.compare(password, passwordRecord.hash);

  if (!isValid) return null;

  return user;
}
