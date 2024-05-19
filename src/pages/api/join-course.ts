import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'lib/prisma';
// utils
import cors from 'src/utils/cors';

async function joinCourse(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId, data } = req.body;
    const { code } = data;

    const codeToCourse = await prisma.enrollmentCode.findFirst({
      where: {
        id: code,
      },
    });

    if (codeToCourse === null) {
      res.status(500).json({ error: 'Error joining course' });
      return;
    }

    const alreadyJoined = await prisma.permission.findFirst({
      where: {
        courseId: codeToCourse.courseId,
        userId,
      },
    });

    if (alreadyJoined != null) {
      res.status(500).json({ error: 'Error joining course' });
      return;
    }

    const perm = await prisma.permission.create({
      data: {
        courseId: codeToCourse.courseId,
        userId,
        role: 'STUDENT',
      },
    });

    res.status(200).json({ perm });
  } catch (error) {
    console.error('Error joining course:', error);
    res.status(500).json({ error: 'Error joining course' });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    switch (req.method) {
      case 'POST':
        await joinCourse(req, res);
        break;
      default:
        res.status(405).json({
          message: 'Method not allowed',
        });
    }
  } catch (error) {
    console.error('[COURSES API]: ', error);
    res.status(500).json({
      message: 'Internal server error',
    });
  }
}
