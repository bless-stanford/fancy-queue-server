import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'lib/prisma';
// utils
import cors from 'src/utils/cors';

async function createCourse(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId, data } = req.body;

    const { courseName, year, term } = data;

    const course = await prisma.course.create({
      data: {
        name: courseName,
        year,
        term,
        permissions: {
          create: {
            userId,
            role: 'ADMIN',
          },
        },
      },
    });

    res.status(200).json({ course });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Error creating course' });
  }
}

// ----------------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    const { endpoint } = req.query;

    switch (req.method) {
      case 'POST':
        if (endpoint === 'create-course') await createCourse(req, res);
        break;
      default:
        res.status(405).json({
          message: 'Method not allowed',
        });
    }
  } catch (error) {
    console.error('[QUEUE API]: ', error);
    res.status(500).json({
      message: 'Internal server error',
    });
  }
}
