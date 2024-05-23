import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'lib/prisma';
// utils
import cors from 'src/utils/cors';
import random from 'random'

async function getErc(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { courseId, data } = req.body;
    const { expires } = data;

    const hasOne = await prisma.enrollmentCode.findFirst({
      where: {
        courseId
      }
    });

    if (hasOne !== null) {
      res.status(200).json({erc: hasOne});
        return; // unclear if necessary?
    }

    console.log(hasOne);

    let retries = 3;
    while (retries != 0) {
      var potentialErc = createErc();
      const exists = await prisma.enrollmentCode.findFirst({
        where: {
          id: potentialErc
        }
      });
      
      if (exists === null) {
        const erc = await prisma.enrollmentCode.create({
          data: {
            id: potentialErc,
            courseId,
            expires
          }
        });

        res.status(200).json({erc});
        return; // unclear if necessary?
      }
      retries--;
    }
    res.status(500).json({ error: "Couldn't find an available enrollment code." });
  } catch (error) {
    console.error('Error issuing enrollment code:', error);
    res.status(500).json({ error: 'Error issuing enrollment code' });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    switch (req.method) {

      case 'POST':
        await getErc(req, res);
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


const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
function createErc() {
  let erc = "";
  for (let iters = 0; iters < 6; iters++) {
    let spot = random.int(0, 35);
    erc += CHARS[spot];
  }
  return erc;
}