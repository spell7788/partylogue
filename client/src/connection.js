import io from 'socket.io-client';
import store from './store';

const query = {};
const { token } = store.state.user;
if (token) query.token = token;

const connection = io(process.env.VUE_APP_CONNECTION, {
  transports: ['websocket'],
  query,
  reconnectionDelay: 3000,
  reconnectionDelayMax: 60000,
});

connection.on('reconnect_attempt', () => {
  connection.io.opts.transports = ['polling', 'websocket'];
});

export default connection;
