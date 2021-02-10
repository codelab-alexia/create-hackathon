import { Message } from 'node-nats-streaming';

import { stan } from './stan';

export function setupListeners(db: any) {
  const replayAllOpts = stan.subscriptionOptions().setDeliverAllAvailable();

  const newHackathonSubs = stan.subscribe('NEW_HACKATHON_CREATED', replayAllOpts);

  newHackathonSubs.on(
    'message',
    async (msg: Message): Promise<void> => {
      const hackathon = JSON.parse(msg.getData() as string);

      await db.collection('hackathons').insertOne(hackathon);
    },
  );
}
