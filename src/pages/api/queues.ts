import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'lib/prisma';
// utils
import cors from 'src/utils/cors';

async function joinQueue(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId, queueId, displayName } = req.body;

    if (!userId || !queueId || !displayName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const queue = await prisma.queue.findFirst({
      where: {
        id: queueId as string,
      },
    });

    if (!queue) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    // Check if the user has already joined the queue
    const existingRequest = await prisma.request.findFirst({
      where: {
        userId: userId as string,
        queueId: queueId as string,
      },
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'User has already joined the queue' });
    }

    // Create a new request to join the queue
    const request = await prisma.request.create({
      data: {
        displayName,
        queue: {
          connect: {
            id: queueId as string,
          },
        },
        user: {
          connect: {
            id: userId as string,
          },
        },
      },
    });

    return res.status(200).json({ message: 'Successfully joined the queue', request });
  } catch (error) {
    console.error('Error joining queue:', error);
    return res.status(500).json({ error: 'Error joining queue' });
  }
}

// ----------------------------------------------------------------------------------

async function leaveQueue(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId, queueId } = req.body;

    if (!userId || !queueId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const request = await prisma.request.findFirst({
      where: {
        userId: userId as string,
        queueId: queueId as string,
      },
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Delete the request to leave the queue
    await prisma.request.delete({
      where: {
        id: request.id,
      },
    });

    return res.status(200).json({ message: 'Successfully left the queue' });
  } catch (error) {
    console.error('Error leaving queue:', error);
    return res.status(500).json({ error: 'Error leaving queue' });
  }
}

// ----------------------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    const { endpoint } = req.query;

    switch (req.method) {
      case 'POST':
        if (endpoint === 'join-queue') await joinQueue(req, res);
        if (endpoint === 'leave-queue') await leaveQueue(req, res);
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
