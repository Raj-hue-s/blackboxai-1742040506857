// Import required test utilities
const { TextEncoder, TextDecoder } = require('util');

// Mock global objects that might not exist in the test environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock WebSocket
global.WebSocket = class MockWebSocket {
    constructor(url) {
        this.url = url;
        this.readyState = WebSocket.CONNECTING;
        setTimeout(() => {
            this.readyState = WebSocket.OPEN;
            if (this.onopen) {
                this.onopen();
            }
        }, 0);
    }

    send(data) {
        if (this.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket is not open');
        }
    }

    close() {
        this.readyState = WebSocket.CLOSED;
        if (this.onclose) {
            this.onclose();
        }
    }

    static get CONNECTING() { return 0; }
    static get OPEN() { return 1; }
    static get CLOSING() { return 2; }
    static get CLOSED() { return 3; }
};

// Mock MediaRecorder
global.MediaRecorder = class MockMediaRecorder {
    constructor() {
        this.state = 'inactive';
    }

    start() {
        this.state = 'recording';
        if (this.onstart) {
            this.onstart();
        }
    }

    stop() {
        this.state = 'inactive';
        if (this.onstop) {
            this.onstop();
        }
    }

    pause() {
        this.state = 'paused';
        if (this.onpause) {
            this.onpause();
        }
    }

    resume() {
        this.state = 'recording';
        if (this.onresume) {
            this.onresume();
        }
    }
};

// Mock Web Audio API
global.AudioContext = class MockAudioContext {
    constructor() {
        this.state = 'suspended';
        this.sampleRate = 44100;
        this.destination = {};
    }

    createMediaStreamSource() {
        return {
            connect: jest.fn(),
            disconnect: jest.fn()
        };
    }

    createAnalyser() {
        return {
            connect: jest.fn(),
            disconnect: jest.fn(),
            fftSize: 2048,
            frequencyBinCount: 1024,
            getByteFrequencyData: jest.fn(),
            getByteTimeDomainData: jest.fn()
        };
    }

    createGain() {
        return {
            connect: jest.fn(),
            disconnect: jest.fn(),
            gain: { value: 1 }
        };
    }
};

// Mock getUserMedia
global.navigator.mediaDevices = {
    getUserMedia: jest.fn().mockImplementation(() => 
        Promise.resolve({
            getTracks: () => [{
                stop: jest.fn()
            }]
        })
    )
};

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn()
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn()
};
global.sessionStorage = sessionStorageMock;

// Mock fetch
global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
        blob: () => Promise.resolve(new Blob()),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        headers: new Headers()
    })
);

// Mock ResizeObserver
global.ResizeObserver = class MockResizeObserver {
    constructor(callback) {
        this.callback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
};

// Custom test matchers
expect.extend({
    toBeWithinRange(received, floor, ceiling) {
        const pass = received >= floor && received <= ceiling;
        if (pass) {
            return {
                message: () =>
                    `expected ${received} not to be within range ${floor} - ${ceiling}`,
                pass: true,
            };
        } else {
            return {
                message: () =>
                    `expected ${received} to be within range ${floor} - ${ceiling}`,
                pass: false,
            };
        }
    },
});

// Global test timeout
jest.setTimeout(10000);

// Suppress console errors during tests
const originalError = console.error;
console.error = (...args) => {
    if (
        typeof args[0] === 'string' &&
        args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
        return;
    }
    originalError.call(console, ...args);
};

// Clean up after each test
afterEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Reset fetch mock
    fetch.mockClear();
});
