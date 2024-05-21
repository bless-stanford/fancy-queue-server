import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'lib/prisma';
// utils
import cors from 'src/utils/cors';

async function createQueue(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { courseId, data} = req.body;
    const {userEmail, startTime, endTime, recurring, helpers} = data;

    if (recurring) {
      // create many such queues, for each time. At most 16 weeks into the future.
    }

    const queueOwner = await prisma.user.findFirst({
      where: {
        email: userEmail
      }
    });

    const course = await prisma.course.findFirst({
      where: {
        id: courseId
      }
    });


    const queue = await prisma.queue.create({
      data: {
        course: {
          connect: {
            id: courseId
          },
        },
        owner: {
          connect: {
            id: queueOwner?.id
          },
        },
        startTime,
        endTime,
        helpers,
      },
    });

    res.status(200).json({ queue });
  } catch (error) {
    console.error('Error creating queue:', error);
    res.status(500).json({ error: 'Error creating queue' });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    switch (req.method) {
      case 'GET':
        break;
      case 'POST':
        await createQueue(req, res);
        break;
      case 'PUT':
        break;
      case 'PATCH':
        break;
      case 'DELETE':
        break;
      default:
        res.status(405).json({
          message: 'Method not allowed',
        });
    }
  } catch (error) {
    console.error('[REGISTER API]: ', error);
    res.status(500).json({
      message: 'Internal server error',
    });
  }
}