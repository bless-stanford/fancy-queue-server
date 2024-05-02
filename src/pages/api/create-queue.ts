import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'lib/prisma';
// utils
import cors from 'src/utils/cors';

async function createQueue(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId, data } = req.body;
    const { courseId, name } = data;

    const course = await prisma.queue.create({
      data: {
        name: className,
        year,
        term: session,
        perms: {
          create: {
            userId,
            role: 'ADMIN'
          }
        }
      }
    });

    res.status(200).json({ course });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Error creating course' });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    switch (req.method) {
      case 'GET':
        break;
      case 'POST':
        await createCourse(req, res);
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
