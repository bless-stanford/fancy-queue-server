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

async function getQueues(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId, courseId } = req.query;

    if (!userId || !courseId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const queues = await prisma.queue.findMany({
      where: {
        courseId: courseId as string,
        course: {
          permissions: {
            some: {
              userId: userId as string,
            },
          },
        },
      },
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

async function getHelperQueues(req: NextApiRequest, res: NextApiResponse) {
  const { userId, courseId } = req.body;

  if (!userId || !courseId) {
    // Ensuring both userId and courseId are provided
    return res.status(400).json({ error: 'Missing required fields' });
  }

  console.log(req);

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
          include: {
            user: true, 
          },
        },
      },
    });
    
    res.status(200).json(queues); // Responding with the fetched queues
  } catch (error) {
    console.error('Error fetching queues:', error);
    res.status(500).json({ error: 'An error occurred while fetching queues' });
  }
}

async function getCourseQueues(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId, courseId } = req.query;

    if (!userId || !courseId) {
      // will use userId to get queues later on - for now, just get all queues for testing
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const queues = await prisma.queue.findMany({
      where: {
        courseId: courseId as string,
      },
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
        if (endpoint === 'get-courses') await getCourses(req, res);
        if (endpoint === 'get-course-queues') await getCourseQueues(req, res);
        if (endpoint === 'get-helper-queues') await getHelperQueues(req, res);
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
