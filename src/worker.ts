import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppKnownError, AppService } from './app.service';

type WorkerEnv = {
  DATABASE_URL?: string;
  JWT_SECRET?: string;
  JWT_REFRESH_SECRET?: string;
  METRICS_TOKEN?: string;
};

function applyRuntimeEnv(env: WorkerEnv) {
  const envKeys: Array<keyof WorkerEnv> = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'METRICS_TOKEN',
  ];

  for (const key of envKeys) {
    const currentValue = process.env[key];
    const bindingValue = env[key];
    if (!currentValue && bindingValue) {
      process.env[key] = bindingValue;
    }
  }
}

async function withAppService<T>(fn: (appService: AppService) => Promise<T>): Promise<T> {
  const appContext = await NestFactory.createApplicationContext(AppModule, {
    abortOnError: false,
  });
  try {
    return await fn(appContext.get(AppService));
  } finally {
    await appContext.close();
  }
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init?.headers ?? {}),
    },
  });
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    try {
      applyRuntimeEnv(env);
      const pathname = new URL(request.url).pathname;

      if (request.method === 'POST' && pathname === '/users') {
        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return json({ message: 'Invalid JSON body' }, { status: 400 });
        }

        return await withAppService(async (appService) => {
          try {
            const created = await appService.createUser(payload);
            return json(created, { status: 201 });
          } catch (error) {
            if (!(error instanceof AppKnownError)) {
              throw error;
            }

            if (error.code === 'INVALID_USER_PAYLOAD') {
              return json({ message: 'username, password is required (role/created optional)' }, { status: 400 });
            }

            if (error.code === 'DUPLICATE_USER') {
              return json({ message: 'user already exists' }, { status: 409 });
            }

            if (error.code === 'DATABASE_NOT_READY') {
              return json({ message: 'database is not ready' }, { status: 503 });
            }

            if (error.code === 'DB_INSERT_FAILED') {
              return json(
                {
                  message: 'failed to insert user',
                  dbCode: error.meta?.dbCode ?? null,
                  dbMessage: error.meta?.dbMessage ?? null,
                  dbDetail: error.meta?.dbDetail ?? null,
                  dbHint: error.meta?.dbHint ?? null,
                },
                { status: 500 },
              );
            }

            return json({ message: 'unknown error' }, { status: 500 });
          }
        });
      }

      if (request.method !== 'GET') {
        return new Response('Method Not Allowed', { status: 405 });
      }

      return await withAppService(async (appService) => {
        if (pathname === '/') {
          return json({ message: appService.getHello() });
        }

        if (pathname === '/health') {
          return json(appService.getHealth());
        }

        if (pathname === '/news/categories') {
          return json(appService.getNewsCategories());
        }

        if (pathname === '/build-info') {
          return json(appService.getBuildInfo());
        }

        return new Response('Not Found', { status: 404 });
      });
    } catch (error) {
      const message = error instanceof Error ? error.stack ?? error.message : 'Unknown error';
      return new Response(message, { status: 500 });
    }
  },
};

