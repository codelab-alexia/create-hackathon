import { Message } from 'node-nats-streaming';

import { stan } from './stan';

export function setupListeners(db: any) {
  const replayAll = stan.subscriptionOptions().setDeliverAllAvailable();

  const hackSubs = stan.subscribe('hackathons', replayAll);

  hackSubs.on(
    'message',
    async (msg: Message): Promise<void> => {
      const event = JSON.parse(msg.getData() as string);

      await db.collection('hackathons').insertOne({
        sequence: msg.getSequence(),
        ...event,
      });
    },
  );
}
