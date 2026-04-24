import bcrypt from 'bcryptjs';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

type HashInput = {
  saltRound: number;
  password: string;
};

function parseSaltRound(value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 4 || parsed > 31) {
    throw new Error('SALT_ROUND must be an integer between 4 and 31.');
  }

  return parsed;
}

async function readInputsFromPrompt(): Promise<HashInput> {
  const rl = createInterface({ input, output });
  try {
    const saltRoundRaw = await rl.question('SALT_ROUND: ');
    const password = await rl.question('password: ');

    if (!password) {
      throw new Error('password is required.');
    }

    return {
      saltRound: parseSaltRound(saltRoundRaw.trim()),
      password,
    };
  } finally {
    rl.close();
  }
}

async function resolveInputs(): Promise<HashInput> {
  const [, , saltRoundRaw, ...passwordParts] = process.argv;

  if (saltRoundRaw && passwordParts.length > 0) {
    return {
      saltRound: parseSaltRound(saltRoundRaw.trim()),
      password: passwordParts.join(' '),
    };
  }

  return readInputsFromPrompt();
}

async function main() {
  try {
    const { saltRound, password } = await resolveInputs();
    const hashedValue = await bcrypt.hash(password, saltRound);

    console.log('--- hash result ---');
    console.log(`salt_round: ${saltRound}`);
    console.log(`hashed_value: ${hashedValue}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(message);
    process.exit(1);
  }
}

void main();
