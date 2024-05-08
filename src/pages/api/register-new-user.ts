import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'lib/prisma';
// utils
import cors from 'src/utils/cors';

// ----------------------------------------------------------------------------------

async function getUserProfile(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'Id should not be null.' });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId as string,
      },
    });

    return res.status(200).json({ profile: user });
  } catch (error) {
    console.error('Error getting user profile:', error);
    return res.status(500).json({ error: 'Error getting user profile' });
  }
}

// ----------------------------------------------------------------------------------

async function registerNewUser(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id, email, displayName } = req.body;

    const userExists = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (userExists) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const user = await prisma.user.create({
      data: {
        id,
        email,
        displayName,
      },
    });

    return res.status(200).json({ user });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Error creating user' });
  }
}

// ----------------------------------------------------------------------------------

async function checkIfUserExists(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email should not be null.' });
    }

    const user = await prisma.user.findFirst({
      where: {
        email: email as string,
      },
    });

    return res.status(200).json({ userExists: !!user });
  } catch (error) {
    console.error('Error checking if user exists:', error);
    return res.status(500).json({ error: 'Error checking if user exists' });
  }
}

// ----------------------------------------------------------------------------------
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    const { endpoint } = req.query;

    switch (req.method) {
      case 'GET':
        if (endpoint === 'get-user-profile') await getUserProfile(req, res);
        if (endpoint === 'check-if-user-exists') await checkIfUserExists(req, res);
        break;
      case 'POST':
        if (endpoint === 'register-new-user') await registerNewUser(req, res);
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
