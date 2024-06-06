import { NextApiRequest, NextApiResponse } from 'next';


import { prisma } from 'lib/prisma';
// utils
import cors from 'src/utils/cors';
import { getEnvironmentData } from 'worker_threads';

async function getStatistics(req: NextApiRequest, res: NextApiResponse) {
  try {

    const { courseId } = req.query;
    const cid = courseId as string; // getting around type weirdness

    const helperPerms = await prisma.permission.findMany({
      where: {
        courseId: cid,
        role: "HELPER", 
      },
      include: {
        user: true
      }
    });

    let requestDict: Record<string, Object[]> = {};

    for (let helper of helperPerms) {
      let requests = await prisma.request.findMany({
        where: {
          helperId: helper.user.id,
          queue: {
            courseId : cid,
          },
          timeClosed: {
            not: null
          }
        }
      });

      requestDict[helper.user.displayName] = requests;
    }
    console.log(requestDict);
    res.status(200).json({ requestDict });
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({ error: 'Error getting statistics' });
  }
}


// ----------------------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    const { endpoint } = req.query;

    switch (req.method) {
      case 'GET':
        await getStatistics(req, res)
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
