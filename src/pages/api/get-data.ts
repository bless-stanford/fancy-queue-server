import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'lib/prisma';
// utils
import cors from 'src/utils/cors';

async function getQueues(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId } = req.query;

    if (!userId) {
      // will use userId to get queues later on - for now, just get all queues for testing
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const queues = await prisma.queue.findMany({
      include: {
        requests: {
          include: {
            user: true,
          },
        },
      },
    });

    return res.status(200).json({ queues });
  } catch (error) {
    console.error('Error getting queues:', error);
    return res.status(500).json({ error: 'Error getting queues' });
  }
}

// ----------------------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    const { endpoint } = req.query;

    switch (req.method) {
      case 'GET':
        if (endpoint === 'get-queues') await getQueues(req, res);
        break;
      default:
        res.status(405).json({
          message: 'Method not allowed',
        });
    }
  } catch (error) {
    console.error('[GET API]: ', error);
    res.status(500).json({
      message: 'Internal server error',
    });
  }
}
