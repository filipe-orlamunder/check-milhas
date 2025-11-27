// src/prisma.ts
import { PrismaClient } from "@prisma/client";

function createModelStub() {
	const notImplemented = async () => {
		throw new Error("Prisma client stub invoked. Provide a mock or run prisma generate.");
	};

	return {
		findUnique: notImplemented,
		findMany: notImplemented,
		findFirst: notImplemented,
		create: notImplemented,
		createMany: notImplemented,
		update: notImplemented,
		updateMany: notImplemented,
		delete: notImplemented,
		deleteMany: notImplemented,
		upsert: notImplemented,
		count: notImplemented,
	};
}

function createPrismaClientStub(): PrismaClient {
	const stub: any = {
		user: createModelStub(),
		profile: createModelStub(),
		beneficiary: createModelStub(),
		$transaction: async (arg: any) => (typeof arg === "function" ? arg() : arg),
		$connect: async () => {},
		$disconnect: async () => {},
		$use: () => {},
	};

	stub.$extends = () => stub;
	return stub as PrismaClient;
}

function instantiatePrismaClient(): PrismaClient {
	try {
		return new PrismaClient();
	} catch (error) {
		const message = error instanceof Error ? error.message : "";
		if (/did not initialize yet/i.test(message)) {
			console.warn("@prisma/client not initialized; using stub PrismaClient fallback.");
			return createPrismaClientStub();
		}
		throw error;
	}
}

export const prisma = instantiatePrismaClient();
