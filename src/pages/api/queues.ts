import { NextApiRequest, NextApiResponse } from 'next';
import dayjs from 'dayjs';
// import utc from 'dayjs/plugin/utc';
// import timezone from 'dayjs/plugin/timezone';

// Extend dayjs with plugins
// dayjs.extend(utc);
// dayjs.extend(timezone);
// dayjs.tz.setDefault("America/Los_Angeles");

import { prisma } from 'lib/prisma';
// utils
import cors from 'src/utils/cors';
import { forEach } from 'lodash';
import uuidv4 from 'src/utils/uuidv4';

// takes a 2d list of requests and gives me the n earliest ones
function getFirst(list: any[], n: number) {
  const allRequests = [];

  for (let i = 0; i < list.length; i++) {
    for (let j = 0; j < list[i].length; j++) {
      allRequests.push(list[i][j]);
    }
  }

  allRequests.sort((req1: any, req2: any) => req1.timeJoined.getTime() - req2.timeJoined.getTime());

  return allRequests.slice(0, n);
}

// make sure to deal with string int stuff in the database
function removeReqsOfType(type: any) {
  return function (value: { problemType: any }, index: any, arr: any[]) {
    if (value.problemType == parseInt(type)) {
      arr.splice(index, 1);
      return true;
    }
    return false;
  };
}

async function createQueue(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { courseId, data } = req.body;
    const { email, numberOfWeeks, day, startTime, endTime, helpers } = data;

    const startTimeParsed = dayjs(startTime, 'HH:mm');
    const endTimeParsed = dayjs(endTime, 'HH:mm');

    // Combine day with startTime and endTime
    const combineDateAndTime = (date: string, timeParsed: dayjs.Dayjs) =>
      dayjs(date).hour(timeParsed.hour()).minute(timeParsed.minute()).second(0);

    const initialStartDateTime = combineDateAndTime(day, startTimeParsed);
    const initialEndDateTime = combineDateAndTime(day, endTimeParsed);

    const queueOwner = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (!queueOwner) {
      throw new Error('Queue owner not found');
    }

    const createQueueForDate = async (startDateTime: dayjs.Dayjs, endDateTime: dayjs.Dayjs) =>
      prisma.queue.create({
        data: {
          course: {
            connect: {
              id: courseId,
            },
          },
          owner: {
            connect: {
              id: queueOwner.id,
            },
          },
          startTime: startDateTime.format('YYYY-MM-DDTHH:mm:ssZ'),
          endTime: endDateTime.format('YYYY-MM-DDTHH:mm:ssZ'),
          helpers: `${helpers}\n${email}`.split('\n').filter((name) => name !== ''),
        },
      });

    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < numberOfWeeks; i++) {
      const startDateTime = initialStartDateTime.add(i, 'week');
      const endDateTime = initialEndDateTime.add(i, 'week');
      // eslint-disable-next-line no-await-in-loop
      await createQueueForDate(startDateTime, endDateTime);
    }

    res.status(200).json({ message: 'Queue(s) created successfully' });
  } catch (error) {
    console.error('Error creating queue:', error);
    res.status(500).json({ error: 'Error creating queue' });
  }
}

async function joinQueue(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId, queueId, displayName } = req.body;

    if (!userId || !queueId || !displayName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const queue = await prisma.queue.findFirst({
      where: {
        id: queueId as string,
      },
    });

    if (!queue) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    // Check if the user is currently in the queue
    const existingRequest = await prisma.request.findFirst({
      where: {
        userId: userId as string,
        queueId: queueId as string,
        timeClosed: null,
      },
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'User has already joined the queue' });
    }

    // Create a new request to join the queue
    const request = await prisma.request.create({
      data: {
        displayName,
        joined: true,
        status: 'WAITING',
        queue: {
          connect: {
            id: queueId as string,
          },
        },
        user: {
          connect: {
            id: userId as string,
          },
        },
      },
    });

    console.log('Created req: ', request);

    return res.status(200).json({ message: 'Successfully joined the queue', request });
  } catch (error) {
    console.error('Error joining queue:', error);
    return res.status(500).json({ error: 'Error joining queue' });
  }
}

// ----------------------------------------------------------------------------------
async function leaveQueue(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId, queueId } = req.body;

    console.log('About to leave', userId, queueId);
    if (!userId || !queueId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const request = await prisma.request.findFirst({
      where: {
        userId: userId as string,
        queueId: queueId as string,
        status: {
          not: 'DONE',
        },
      },
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    console.log('Req: ', request);

    // Update the request status to mark it as done
    await prisma.request.update({
      where: {
        id: request.id,
      },
      data: {
        joined: false,
        status: 'DONE',
        timeClosed: new Date(),
      },
    });
    console.log('Left Queue');

    return res.status(200).json({ message: 'Successfully marked the request as done' });
  } catch (error) {
    console.error('Error marking request as done:', error);
    return res.status(500).json({ error: 'Error marking request as done' });
  }
}

// ----------------------------------------------------------------------------------

// should probably call this open queue so with some check (eg, if already open throw error.)
async function toggleQueue(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId, queueId, data } = req.body;
    const percentFilter = data;

    if (!userId || !queueId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const queue = await prisma.queue.findUnique({
      where: { id: queueId },
    });

    if (!queue) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    // all the queues that are open for this course
    const queues = await prisma.queue.findMany({
      where: {
        courseId: queue.courseId,
        isOpen: true,
      },
    });

    // Update the queue to open
    await prisma.queue.update({
      where: { id: queueId },
      data: { isOpen: !queue.isOpen },
    });

    // if there is more than 1, redistribute prorated by the percentFilter
    if (queues.length > 0 && !queue.isOpen) {
      let totalReq = 0;
      const requestsList = [];
      for (let i = 0; i < queues.length; i++) {
        const requests = await prisma.request.findMany({
          where: {
            queueId: queues[i].id,
          },
        });
        requestsList.push(requests);
        totalReq += requests.length;
      }

      const n = percentFilter * totalReq;
      const requests = getFirst(requestsList, n);

      // get rid of everything in prisma from requests
      for (let i = 0; i < requests.length; i++) {
        const deletedReq = await prisma.request.delete({
          where: {
            id: requests[i].id,
          },
        });
      }

      // distribute based on specialty
      queues.push(queue);
      const newReqs = [];
      for (let i = 0; i < queues.length; i++) {
        // get the owner of each queue
        const user = await prisma.user.findFirst({
          where: {
            id: queues[i].userId,
          },
        });
        // sort requests by specialty
        newReqs.push(requests.filter(removeReqsOfType(user?.specialty)));
      }

      // create new requests by specialty
      for (let i = 0; i < newReqs.length; i++) {
        for (let j = 0; j < newReqs[i].length; j++) {
          const newreq = await prisma.request.create({
            data: {
              info: newReqs[i][j].info,
              displayName: newReqs[i][j].displayName,
              problemType: newReqs[i][j].problemType,
              timeJoined: newReqs[i][j].timeJoined,
              queue: {
                connect: {
                  id: queues[i].id as string,
                },
              },
              user: {
                connect: {
                  id: newReqs[i][j].userId as string,
                },
              },
            },
          });
        }
      }

      // current state of the queues
      const remainQueues = await prisma.queue.findMany({
        where: {
          courseId: queue.courseId,
          isOpen: true,
        },
      });
      const remainReqs = [];
      for (let i = 0; i < remainQueues.length; i++) {
        const requests = await prisma.request.findMany({
          where: {
            queueId: remainQueues[i].id,
          },
        });
        remainReqs.push(requests);
      }

      // add the remainders balanced
      while (requests.length > 0) {
        let smallest = Number.MAX_SAFE_INTEGER;
        let index = 0;
        for (let i = 0; i < remainReqs.length; i++) {
          if (remainReqs[i].length < smallest) {
            smallest = remainReqs[i].length;
            index = i;
          }
        }

        const req = requests.pop();
        const newreq = await prisma.request.create({
          data: {
            info: req.info,
            displayName: req.displayName,
            problemType: req.problemType,
            timeJoined: req.timeJoined,
            queue: {
              connect: {
                id: queues[index].id as string,
              },
            },
            user: {
              connect: {
                id: req.userId as string,
              },
            },
          },
        });
        remainReqs[index].push(newreq);
      }
    }

    // do the opposite if we are closing the queue
    // move all requests in the queue to other open ones
    // prioritize specialty in the move, but after move freely
    if (queues.length > 1 && queue.isOpen) {
      const requests = await prisma.request.findMany({
        where: {
          queueId: queue.id,
        },
      });

      for (let i = 0; i < requests.length; i++) {
        const deletedReq = await prisma.request.delete({
          where: {
            id: requests[i].id,
          },
        });
      }

      // get the open queues newly
      const queuesLeft = await prisma.queue.findMany({
        where: {
          courseId: queue.courseId,
          isOpen: true,
        },
      });

      // distribute based on specialty
      const newReqs = [];
      for (let i = 0; i < queuesLeft.length; i++) {
        // get the owner of each queue
        const user = await prisma.user.findFirst({
          where: {
            id: queuesLeft[i].userId,
          },
        });
        // sort requests by specialty
        newReqs.push(requests.filter(removeReqsOfType(user?.specialty)));
      }

      // create new requests by specialty
      for (let i = 0; i < newReqs.length; i++) {
        for (let j = 0; j < newReqs[i].length; j++) {
          const newreq = await prisma.request.create({
            data: {
              info: newReqs[i][j].info,
              displayName: newReqs[i][j].displayName,
              problemType: newReqs[i][j].problemType,
              timeJoined: newReqs[i][j].timeJoined,
              queue: {
                connect: {
                  id: queuesLeft[i].id as string,
                },
              },
              user: {
                connect: {
                  id: newReqs[i][j].userId as string,
                },
              },
            },
          });
        }
      }

      const remainReqs = [];
      for (let i = 0; i < queuesLeft.length; i++) {
        const requests = await prisma.request.findMany({
          where: {
            queueId: queuesLeft[i].id,
          },
        });
        remainReqs.push(requests);
      }

      // add the remainders balanced
      while (requests.length > 0) {
        let smallest = Number.MAX_SAFE_INTEGER;
        let index = 0;
        for (let i = 0; i < remainReqs.length; i++) {
          if (remainReqs[i].length < smallest) {
            smallest = remainReqs[i].length;
            index = i;
          }
        }

        const req = requests.pop();
        const newreq = await prisma.request.create({
          data: {
            info: req?.info,
            displayName: req?.displayName ? req?.displayName : '',
            problemType: req?.problemType,
            timeJoined: req?.timeJoined,
            queue: {
              connect: {
                id: queues[index].id as string,
              },
            },
            user: {
              connect: {
                id: req?.userId as string,
              },
            },
          },
        });
        remainReqs[index].push(newreq);
      }
    }

    return res.status(200).json({ message: 'Successfully opened the queue' });
  } catch (error) {
    console.error('Error leaving queue:', error);
    return res.status(500).json({ error: 'Error leaving queue' });
  }
}

// ----------------------------------------------------------------------------------

async function closeQueue(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId, queueId } = req.body;

    if (!userId || !queueId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const queue = await prisma.queue.findUnique({
      where: { id: queueId },
    });

    if (!queue) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    // Update the queue to open
    await prisma.queue.update({
      where: { id: queueId },
      data: { isOpen: false },
    });

    return res.status(200).json({ message: 'Successfully opened the queue' });
  } catch (error) {
    console.error('Error leaving queue:', error);
    return res.status(500).json({ error: 'Error leaving queue' });
  }
}

// ----------------------------------------------------------------------------------

async function testHarness(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // dummy course
    const course = await prisma.course.create({
      data: {
        id: uuidv4(),
        name: 'CS 101',
        year: '2024',
        term: 'Spring',
      },
    });

    // its owner
    await prisma.permission.create({
      data: {
        courseId: course.id,
        userId: userId as string,
        role: 'ADMIN',
      },
    });

    const helpers = [
      'alice@stanford.edu',
      'bob@stanford.edu',
      'carol@stanford.edu',
      'dave@stanford.edu',
      'erin@stanford.edu',
    ];
    const names = ['Alice', 'Bob', 'Carol', 'Dave', 'Erin'];
    const concepts = ['Data Structure', 'Algorithm', 'Networking', 'Systems', 'Bug fix'];

    // add 5 helpers
    for (let i = 0; i < 5; i++) {
      const user = await prisma.user.create({
        data: {
          email: helpers[i],
          displayName: names[i],
          specialty: i.toString(),
        },
      });

      // helper perms
      if (user) {
        await prisma.permission.create({
          data: {
            userId: user.id,
            role: 'HELPER',
            courseId: course.id,
          },
        });

        // create the queue
        const queue = await prisma.queue.create({
          data: {
            course: {
              connect: {
                id: course.id,
              },
            },
            owner: {
              connect: {
                id: user.id,
              },
            },
            helpers: [helpers[i]],
            isOpen: true,
          },
        });

        // add 12 requests to it
        for (let j = 0; j < 12; j++) {
          const student = await prisma.user.create({
            data: {
              email: names[i].concat('-student-', (j + 1).toString(), '@stanford.edu'),
              displayName: helpers[i].concat("'s #", (j + 1).toString(), ' student'),
            },
          });

          if (student) {
            const probType = Math.floor(Math.random() * (concepts.length + 1)) - 1;
            if (probType == -1) {
              const request = await prisma.request.create({
                data: {
                  displayName: 'Misc',
                  queue: {
                    connect: {
                      id: queue.id as string,
                    },
                  },
                  user: {
                    connect: {
                      id: student.id as string,
                    },
                  },
                },
              });
            } else {
              const request = await prisma.request.create({
                data: {
                  displayName: concepts[probType],
                  queue: {
                    connect: {
                      id: queue.id as string,
                    },
                  },
                  user: {
                    connect: {
                      id: student.id as string,
                    },
                  },
                  problemType: probType,
                },
              });
            }
          }
        }
      }
    }

    return res.status(200).json({ course });
  } catch (error) {
    console.error('Error generating harness:', error);
    return res.status(500).json({ error: 'Error generating harness' });
  }
}

// ----------------------------------------------------------------------------------

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await cors(req, res);

    const { endpoint } = req.query;

    switch (req.method) {
      case 'POST':
        if (endpoint === 'create-queue') await createQueue(req, res);
        if (endpoint === 'join-queue') await joinQueue(req, res);
        if (endpoint === 'leave-queue') await leaveQueue(req, res);
        if (endpoint === 'toggle-queue') await toggleQueue(req, res);
        if (endpoint === 'close-queue') await closeQueue(req, res);
        if (endpoint === 'test-harness') await testHarness(req, res);
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
