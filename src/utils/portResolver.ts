import net from 'node:net';

export async function findAvailablePort(startPort = 3000, maxAttempts = 20): Promise<number> {
  const requestedPort = Number(startPort);

  for (let offset = 0; offset < maxAttempts; offset += 1) {
    const candidatePort = requestedPort + offset;

    if (candidatePort > 65535) {
      break;
    }

    const isAvailable = await new Promise<boolean>((resolve) => {
      const tester = net.createServer();

      tester.once('error', () => resolve(false));
      tester.once('listening', () => {
        tester.close(() => resolve(true));
      });

      tester.listen(candidatePort, '0.0.0.0');
    });

    if (isAvailable) {
      return candidatePort;
    }
  }

  throw new Error(`No available port found starting from ${requestedPort} after ${maxAttempts} attempts.`);
}
