import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'lib/prisma';
// utils
import cors from 'src/utils/cors';

async function getCourses(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const courses = await prisma.permission.findMany({
      where: {
        userId: userId as string,
      },
      include: {
        course: true,
      },
    });

    return res.status(200).json({ courses });
  } catch (error) {
    console.error('Error getting courses:', error);
    return res.status(500).json({ error: 'Error getting courses' });
  }
}

// ----------------------------------------------------------------------------------
async function getHelperQueues(req: NextApiRequest, res: NextApiResponse) {
  const { userId, courseId } = req.query;

  if (!userId || !courseId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  console.log("Getting helper queues ....", req.query)

  try {
    const queues = await prisma.queue.findMany({
      where: {
        courseId: courseId as string,
        helpers: {
          has: userId as string,
        },
      },
      include: {
        requests: {
          where: {
            status: {
              not: 'DONE',
            },
          },
          include: {
            user: true,
          },
        },
      },
    });

    return res.status(200).json({ queues });
  } catch (error) {
    console.error('Error fetching queues:', error);
    return res.status(500).json({ error: 'An error occurred while fetching queues' });
  }
}

// ----------------------------------------------------------------------------------

async function getCourseQueues(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId, courseId } = req.query;

    if (!userId || !courseId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const queues = await prisma.queue.findMany({
      where: {
        courseId: courseId as string,
      },
      include: {
        requests: {
          where: {
            status: {
              not: 'DONE',
            },
          },
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

async function getHelpers(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { courseId } = req.query;

    if (!courseId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const permissions = await prisma.permission.findMany({
      where: {
        courseId: courseId as string,
        role: 'HELPER',
      },
      include: {
        user: true,
      },
    });

    const helpers = permissions.map((permission) => ({
      displayName: permission.user.displayName,
      email: permission.user.email,
    }));

    return res.status(200).json({ helpers });
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
        if (endpoint === 'get-courses') await getCourses(req, res);
        if (endpoint === 'get-course-queues') await getCourseQueues(req, res);
        if (endpoint === 'get-helper-queues') await getHelperQueues(req, res);
        if (endpoint === 'get-helpers') await getHelpers(req, res);
        break;
      default:
        res.status(405).json({
          message: 'Method not allowed',
        });
    }
  } catch (error) {
    console.error('[GET DATA API]: ', error);
    res.status(500).json({
      message: 'Internal server error',
    });
  }
}
