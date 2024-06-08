import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'lib/prisma';
// utils
import cors from 'src/utils/cors';

async function createCourse(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId, data } = req.body;

    const { courseName, year, term, helpers, id } = data;

    console.log(data);

    const course = await prisma.course.create({
      data: {
        id,
        name: courseName,
        year,
        term,
      },
    });

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    console.log(user);

    await prisma.permission.create({
      data: {
        courseId: course.id,
        userId,
        role: 'ADMIN',
      },
    });

    const helperEmails: string[] = helpers?.split(',').map((helper: string) => helper.trim()) ?? [];

    await Promise.all(
      helperEmails.map(async (email) => {
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          await prisma.permission.create({
            data: {
              userId: user.id,
              role: 'HELPER',
              courseId: course.id,
            },
          });
        }
      })
    );

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
