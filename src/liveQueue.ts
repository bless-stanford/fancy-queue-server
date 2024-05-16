
import WebSocket, { Server } from 'ws';

interface Student {
  name: string;
  signedUp: string;
  claimed: string;
}

const wss = new Server({ port: 3030 });
let students: Student[] = [];

wss.on('connection', (ws: WebSocket) => {
  console.log('New client connected');
  // Send the initial list of students
  ws.send(JSON.stringify({ type: 'INITIAL', students }));

  ws.on('message', (message: string) => {
    const { type, student, signedUp } = JSON.parse(message);

    if (type === 'ADD_STUDENT') {
      const newStudent: Student = { ...student, id: Date.now() }; // Generate a unique ID
      students.push(newStudent);
      
      // Broadcast the new student to all connected clients
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'NEW_STUDENT', student: newStudent }));
        }
      });
    } else if (type === 'REMOVE_STUDENT') {
      students = students.filter(s => s.signedUp !== signedUp);
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'REMOVE_STUDENT', signedUp }));
        }
      });
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log('WebSocket server is running on ws://localhost:3030');
