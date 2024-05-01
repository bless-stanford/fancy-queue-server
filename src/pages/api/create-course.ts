import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'lib/prisma';
// utils
import cors from 'src/utils/cors';

async function createCourse(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId, data } = req.body;
    const { className, year, session } = data;

    const course = await prisma.course.create({
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

    // const instructorPerm = await prisma.permission.create({
    //   data: {
    //     courseId: course.id,
    //     userId,
    //     role: 'ADMIN'
    //   }
    // })  
    
    // const permCourse = await prisma.course.update({
    //   where: {
    //     id: course.id
    //   },
    //   data: {
    //     perms: {
    //       connect: {
    //         id: instructorPerm.id
    //       }
    //     }
    //   }
    // })

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
