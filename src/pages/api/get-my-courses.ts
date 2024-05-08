import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'lib/prisma';
// utils
import cors from 'src/utils/cors';

async function getMyCourses(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId } = req.body;

    const perms = await prisma.permission.findMany({
      where: {
        userId
      }
    });

    let courses = [];

    for (const perm of perms) {
      const course = await prisma.course.findFirst({
        where: {
          id: perm.courseId
        }
      });
      courses.push(course);
    }
    res.status(200).json({ coursesFetched: courses, permsFetched: perms });
  } catch (error) {
    console.error('Error retrieving courses:', error);
    res.status(500).json({ error: 'Error retrieving courses' });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    switch (req.method) {
      case 'GET':
        await getMyCourses(req, res);
        break;
      case 'POST':
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
