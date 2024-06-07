import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'lib/prisma';
// utils
import cors from 'src/utils/cors';

async function takeRequest(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { requestId, helperId, timeTaken } = req.body;

    const reqUpdate = await prisma.request.update({
      where: {
        id: requestId,
      },
      data: {
        helperId,
        timeTaken,
        status: 'IN_PROGRESS',
      },
    });

    res.status(200).json({ reqUpdate });
  } catch (error) {
    console.error('Error taking request:', error);
    res.status(500).json({ error: 'Error taking request' });
  }
}

async function resolveRequest(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { requestId, timeClosed } = req.body;

    const reqUpdate = await prisma.request.update({
      where: {
        id: requestId,
      },
      data: {
        timeClosed,
        status: "DONE",
      },
    });

    res.status(200).json({ reqUpdate });
  } catch (error) {
    console.error('Error taking request:', error);
    res.status(500).json({ error: 'Error taking request' });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    const { endpoint } = req.query;

    switch (req.method) {
      case 'POST':
        if (endpoint === 'take-request') await takeRequest(req, res);
        if (endpoint === 'resolve-request') await resolveRequest(req, res);
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
