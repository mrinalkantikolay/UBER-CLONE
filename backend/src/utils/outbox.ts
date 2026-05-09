import crypto from "crypto";
import { Prisma } from "@prisma/client";

import env from "../config/env";
import { KafkaTopic, CloudEvent } from "../config/kafka";

/* ======================================================
   TRANSACTIONAL OUTBOX UTILITIES (mvp.md §2)

   These helpers are used inside `prisma.$transaction()` to
   atomically insert an OutboxEvent row alongside business
   DB writes. The Outbox Relay Worker (outboxRelay.queue.ts)
   polls unpublished rows and publishes them to Kafka.

   Usage:
     await prisma.$transaction(async (tx) => {
       await tx.ride.create({ data: {...} });
       await insertOutboxEvent(tx, 'ride.requested', buildCloudEvent(...));
     });
====================================================== */

/**
 * Build a CloudEvents-compliant event object.
 * Does NOT publish — only constructs the payload to be stored in OutboxEvent.
 *
 * @param type    - CloudEvent type (e.g. "ride.requested")
 * @param source  - Source service name (defaults to env.SERVICE_NAME)
 * @param payload - Event-specific data
 * @param traceId - Distributed trace correlation ID
 * @returns CloudEvent object ready for JSON serialization
 */
export const buildCloudEvent = <T>(
  type: string,
  payload: T,
  traceId: string,
  source: string = env.SERVICE_NAME
): CloudEvent<T> => ({
  eventId: crypto.randomUUID(),
  version: "1.0",
  type,
  source,
  timestamp: new Date().toISOString(),
  traceId,
  payload,
});

/**
 * Insert an OutboxEvent row inside an existing Prisma transaction.
 *
 * MUST be called within `prisma.$transaction()` to guarantee
 * atomicity with the business DB write. The row is created with
 * `published: false` — the Outbox Relay Worker picks it up.
 *
 * @param tx      - Prisma transaction client (from `$transaction(async (tx) => {...})`)
 * @param topic   - Kafka topic to publish to
 * @param event   - CloudEvent object (will be JSON-serialized into `payload`)
 *
 * O(1) — single INSERT.
 */
export const insertOutboxEvent = async <T>(
  tx: Prisma.TransactionClient,
  topic: KafkaTopic | string,
  event: CloudEvent<T>
): Promise<void> => {
  await tx.outboxEvent.create({
    data: {
      topic,
      payload: event as unknown as Prisma.InputJsonValue,
      published: false,
    },
  });
};
