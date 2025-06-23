// import { client } from "./cache.server";
// import SuperJSON from "superjson";

// type AsyncMethod<Args extends any[], R> = (...args: Args) => Promise<R>;

// export function Cache<Args extends any[] = any[], R = any>(
//   tags: string[] = [],
//   keyGenerator?: (...args: Args) => string,
//   ttl = 1000
// ): MethodDecorator {
//   return (
//     target: Object,
//     propertyKey: string | symbol,
//     descriptor: PropertyDescriptor
//   ): PropertyDescriptor | void => {
//     if (typeof descriptor.value !== "function") {
//       throw new Error("@Cache can only be applied to methods");
//     }

//     const original = descriptor.value as AsyncMethod<Args, R>;

//     const wrapped: AsyncMethod<Args, R> = async function (
//       this: unknown,
//       ...args: Args
//     ): Promise<R> {
//       const cacheKey = [
//         target.constructor.name,
//         propertyKey,
//         keyGenerator?.(...args) ??
//           args.map((a) => SuperJSON.stringify(a)).join("|"),
//       ].join(":");

//       try {
//         const hit = await client.get(cacheKey);
//         if (hit != null) {
//           return SuperJSON.parse(hit) as R;
//         }

//         const result = await original.apply(this, args);
//         await client.setEx(cacheKey, ttl, SuperJSON.stringify(result));

//         if (tags.length) {
//           const pipeline = client.multi();
//           for (const tag of tags) {
//             pipeline.sAdd(`tag:${tag}`, cacheKey);
//             pipeline.expire(`tag:${tag}`, ttl);
//           }
//           await pipeline.exec();
//         }

//         return result;
//       } catch (err) {
//         console.error(`Cache error [${cacheKey}]:`, err);
//         return original.apply(this, args);
//       }
//     };

//     descriptor.value = wrapped as unknown as Function;

//     return descriptor;
//   };
// }
