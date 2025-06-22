import type { Password, PrismaClient, User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "~/db.server";
import { Cache } from "~/lib/cache/decorator";
import { CacheManager } from "~/lib/cache/manager";

export type { User } from "@prisma/client";

class UserManager {
  constructor(private readonly prismaUser: PrismaClient["user"]) {}

  @Cache(["users"], (id) => id)
  async getUserById(id: User["id"]) {
    return await this.prismaUser.findUnique({
      where: { id },
      include: { avatar: true, userInfo: true },
    });
  }

  @Cache(["users"], (email) => email)
  async getUserByEmail(email: User["email"]) {
    return this.prismaUser.findUnique({ where: { email } });
  }

  async verifyLogin(email: User["email"], password: Password["hash"]) {
    const userWithPassword = await this.prismaUser.findUnique({
      where: { email },
      include: {
        password: true,
      },
    });

    if (!userWithPassword || !userWithPassword.password) {
      return null;
    }

    const isValid = await bcrypt.compare(
      password,
      userWithPassword.password.hash
    );

    if (!isValid) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } = userWithPassword;

    return userWithoutPassword;
  }

  async updateBlog({ id, name, bio }: Pick<User, "id" | "name" | "bio">) {
    CacheManager.revalidateTag("users");

    return this.prismaUser.update({
      data: { name, bio },
      where: { id: id },
    });
  }

  async createUser(email: User["email"], name: User["name"], password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prismaUser.create({
      data: {
        email,
        name,
        password: {
          create: {
            hash: hashedPassword,
          },
        },
      },
    });
  }
}

const users = new UserManager(prisma.user);

export { users };
