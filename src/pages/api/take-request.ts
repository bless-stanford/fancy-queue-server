import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'lib/prisma';
// utils
import cors from 'src/utils/cors';

async function takeRequest(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { data } = req.body;
    const { requestId, helperId, timeTaken } = data;

    const reqUpdate = await prisma.request.update({
      where: {
        id: requestId
      },
      data: {
        helperId,
        timeTaken
      }
    })
    

    res.status(200).json({ reqUpdate });
  } catch (error) {
    console.error('Error taking request:', error);
    res.status(500).json({ error: 'Error taking request' });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    switch (req.method) {
      case 'POST':
        await takeRequest(req, res);
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
