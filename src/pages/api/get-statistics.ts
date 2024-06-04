import { NextApiRequest, NextApiResponse } from 'next';


import { prisma } from 'lib/prisma';
// utils
import cors from 'src/utils/cors';
import { getEnvironmentData } from 'worker_threads';

async function getStatistics(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { courseId } = req.body;
    
    const helperPerms = await prisma.permission.findMany({
      where: {
        courseId,
        role: "HELPER", 
      },
      include: {
        user: true
      }
    });

    let requestDict = new Map();

    for (let helper of helperPerms) {
      let requests = await prisma.request.findMany({
        where: {
          helperId: helper.id,
          queue: {
            courseId
          }
        }
      });
      let requestsClosed = requests.filter(request => request.timeClosed != undefined);
      requestDict.set(helper.user.email, requestsClosed);
    }


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
      case 'POST':
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
