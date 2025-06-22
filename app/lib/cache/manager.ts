import { client } from "./cache.server";

class CacheManager {
  static async revalidateKey(key: string) {
    try {
      client.del(key);
    } catch (e) {
      console.log(`Falied to revalidate key ${key}: `, e);
    }
  }

  static async revalidatePattern(pattern: string) {
    try {
      const keys = await client.keys(pattern);
      const pipeline = await client.multi();

      keys.forEach((key) => {
        pipeline.del(key);
      });

      await pipeline.exec();
    } catch (e) {
      console.log(`Falied to revalidate pattern ${pattern}: `, e);
    }
  }

  static async revalidateTag(tag: string) {
    try {
      const keys = await client.sMembers(`tag:${tag}`);
      const pipeline = await client.multi();

      keys.forEach((key) => {
        pipeline.del(key);
      });

      await pipeline.exec();
    } catch (e) {
      console.log(`Falied to revalidate tag ${tag}: `, e);
    }
  }
}

export { CacheManager };
