import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as bodyparser from 'koa-bodyparser';
import * as json from 'koa-json';
import * as cors from '@koa/cors';

export const app: Koa = new Koa();

const router: Router = new Router();

let nHackathons = 0;

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

  const existingHackathons = await db.collection('hackathons').find({ name }).toArray();

  if (existingHackathons.length) {
    return {
      isValid: false,
      reason: 'name already in use',
    };
  }

  return {
    isValid: true,
    payload: { name, id: ++nHackathons },
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

  broker.publish(newHackathonEvent.type, JSON.stringify(newHackathonEvent.payload));

  ctx.body = { hackathon: payload };
};

router.post('/hackathons', createNewHackathon);

app.use(bodyparser());
app.use(json());
app.use(cors());
app.use(router.routes()).use(router.allowedMethods());
