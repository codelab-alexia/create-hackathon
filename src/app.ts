import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as bodyparser from 'koa-bodyparser';
import * as json from 'koa-json';
import * as cors from '@koa/cors';

export const app: Koa = new Koa();

const router: Router = new Router();

interface ValidationResult {
  isValid: boolean;
  reason?: string;
  payload?: any;
}

const validateNewHackathon = async (hackathon: any, db: any): Promise<ValidationResult> => {
  const { name }: any = hackathon;

  if (!name) {
    return {
      isValid: false,
      reason: 'no name provided',
    };
  }

  const hackEvents = await db.collection('hackathons').find({}).toArray();

  const nameIsUsed = hackEvents
    .map(({ payload }: any): string => payload.name)
    .some((n: string): boolean => n === name);

  if (nameIsUsed) {
    return {
      isValid: false,
      reason: 'name already taken',
    };
  }

  return {
    isValid: true,
    payload: { name, id: ++hackEvents.length },
  };
};

const createNewHackathon = async (ctx: Koa.Context): Promise<void> => {
  const { broker, db }: Koa.Context = ctx;
  const { isValid, reason, payload } = await validateNewHackathon(ctx.request.body, db);

  if (!isValid) {
    ctx.body = { error: reason };
    ctx.status = 400;

    return;
  }

  const newHackathonEvent = {
    type: 'NEW_HACKATHON_CREATED',
    payload,
  };

  broker.publish('hackathons', JSON.stringify(newHackathonEvent));

  ctx.body = { hackathon: payload };
};

router.post('/hackathons', createNewHackathon);

const readAllHackathons = async (ctx: Koa.Context): Promise<void> => {
  const { db } = ctx;

  const hackEvents = await db.collection('hackathons').find({}).toArray();

  const hackathons = hackEvents.map(({ payload }: any): any => payload);

  ctx.body = { hackathons };
};

router.get('/hackathons', readAllHackathons);

app.use(bodyparser());
app.use(json());
app.use(cors());
app.use(router.routes()).use(router.allowedMethods());
