import WebSocket from 'isomorphic-ws';
import EventEmitter from 'eventemitter3';

const { promisify } = require('es6-promisify');

const setTimeoutAsync = promisify(setTimeout);

const MINIMUM_BACKOFF_TIME_SEC = 1;
const MAXIMUM_BACKOFF_TIME_SEC = 32;

const PROXY_EVENTS = ['close', 'error', 'unexpected-response', 'ping', 'pong', 'open'];

class SlaveService extends EventEmitter {
  constructor(publishAsync, minimumBackOffTimeSec, maximumBackOffTimeSec) {
    super();
    if (this.socket) {
      this.socket.close();
    }
    const { hostname } = window.location;
    const port = window.location.protocol === 'https:' ? 443 : 3004;
    this.socket = new WebSocket(`ws://${hostname}:${port}/ws`);
    this.socket.addEventListener('message', this.handleMessage.bind(this));
    const onOpen = () => {
      this.isOpen = true;
      this.socket.removeEventListener('open', onOpen);
    };

    this.publishAsync = publishAsync;
    this.backOffTimeSec = minimumBackOffTimeSec || MINIMUM_BACKOFF_TIME_SEC;
    this.maximumBackOffTimeSec = maximumBackOffTimeSec || MAXIMUM_BACKOFF_TIME_SEC;

    this.socket.addEventListener('open', onOpen);
    const onClose = (e) => {
      switch (e.code) {
        case 1001: // NORMAL_CLOSE
          console.log('NORMAL_CLOSE');
          this.close();
          break;
        default: // ABNORMAL CLOSURE
          console.log('ABNORMAL CLOSURE');
          this.execute();
          break;
      }
    };

    this.socket.addEventListener('close', onClose);
    PROXY_EVENTS.forEach((eventName) => {
      this.socket.addEventListener(eventName, event => this.emit(eventName, event));
    });
  }

  async execute() {
    try {
      await this.publishAsync();
    } catch (e) {
      const delayMs = 1000 * (this.backOffTimeSec + Math.random());
      if (this.backOffTimeSec < MAXIMUM_BACKOFF_TIME_SEC) {
        this.backOffTimeSec *= 2;
      }
      console.log(`${new Date().toString()} - backing off for ${delayMs}ms`);
      await setTimeoutAsync(delayMs);
      await this.execute();
    }
  }

  handleMessage(event) {
    const { type, data } = JSON.parse(event.data);
    this.emit(type, data);
  }

  buildFrame(type, data) {
    return JSON.stringify({ type, data });
  }

  async listSlaves() {
    return new Promise((resolve, reject) => {
      if (this.isOpen) {
        this.socket.send(this.buildFrame('listSlaves'));
        this.once('slaves', slaves => resolve(slaves));
        this.once('error', err => reject(err));
        return;
      }
      reject(new Error('Connection is no opened'));
    });
  }

  async listSources(id) {
    return new Promise((resolve, reject) => {
      if (this.isOpen) {
        this.socket.send(this.buildFrame('listSources', { id }));
        this.once('sources', sources => resolve(sources));
        this.once('error', err => reject(err));
        return;
      }
      reject(new Error('Connection is no opened'));
    });
  }
}

export default SlaveService;
