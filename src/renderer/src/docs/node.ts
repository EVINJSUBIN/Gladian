import type { DocModule } from '../catalog'

export const nodeModules: DocModule[] = [
  {
    id: 'node-setup',
    title: 'Node.js Basics',
    sections: [
      {
        id: 'node-what-is',
        title: 'What Node.js Is',
        body: `Node.js runs JavaScript outside the browser — on a server or your terminal. It uses the same JS syntax you know, but adds built-in modules for files, networks, and processes.\n\n\`\`\`bash\n# Check your version\nnode --version\n\n# Run a file\nnode server.js\n\`\`\`\n\nNode.js is single-threaded but handles many connections at once using an event loop. This makes it fast for I/O-heavy work like web servers and APIs.`,
        tryIt: 'Open a terminal, run node --version to confirm Node is installed, then run node -e "console.log(42)".'
      },
      {
        id: 'node-modules',
        title: 'Built-in Modules',
        body: `Node.js comes with built-in modules. Use require() to load them (CommonJS) or import with ES modules.\n\n\`\`\`javascript\n// CommonJS (most common in Node.js)\nconst http = require('http')\nconst fs = require('fs')\nconst path = require('path')\nconst os = require('os')\n\nconsole.log(os.platform())   // "win32", "linux", "darwin"\nconsole.log(os.hostname())   // your computer name\nconsole.log(path.join(__dirname, 'data', 'file.txt'))\n\`\`\`\n\nKey built-in modules: http (web server), fs (files), path (file paths), os (operating system info), events (EventEmitter).`,
        tryIt: 'Create a file, require the os module, and print your platform and the number of CPUs using os.cpus().length.'
      }
    ]
  },
  {
    id: 'node-http',
    title: 'HTTP Server',
    sections: [
      {
        id: 'node-create-server',
        title: 'Creating an HTTP Server',
        body: `The http module's createServer() makes a server. Every request calls your callback function.\n\n\`\`\`javascript\nconst http = require('http')\n\nconst server = http.createServer((req, res) => {\n    res.writeHead(200, { 'Content-Type': 'text/plain' })\n    res.end('Hello, World!')\n})\n\nserver.listen(3000, () => {\n    console.log('Server running at http://localhost:3000')\n})\n\`\`\`\n\nreq is the incoming request. res is the outgoing response. writeHead sets the status code and headers. end() finishes the response and sends it. Without end(), the browser waits forever.`,
        tryIt: 'Create this server and visit http://localhost:3000 in your browser. Change the response text to your name.'
      },
      {
        id: 'node-routing',
        title: 'Routing by URL',
        body: `Check req.url and req.method to route different paths.\n\n\`\`\`javascript\nconst http = require('http')\n\nconst server = http.createServer((req, res) => {\n    const url = req.url\n    const method = req.method\n\n    if (url === '/' && method === 'GET') {\n        res.writeHead(200, { 'Content-Type': 'text/html' })\n        res.end('<h1>Home Page</h1>')\n    } else if (url === '/about' && method === 'GET') {\n        res.writeHead(200, { 'Content-Type': 'text/plain' })\n        res.end('About page')\n    } else {\n        res.writeHead(404, { 'Content-Type': 'text/plain' })\n        res.end('Not Found')\n    }\n})\n\nserver.listen(3000)\n\`\`\`\n\nThis is manual routing. For real projects you would use Express.js or Fastify, but understanding bare http first makes those libraries easier.`,
        tryIt: 'Add a /contact route that returns your email address. Test it in the browser at localhost:3000/contact.'
      },
      {
        id: 'node-json-response',
        title: 'Sending JSON',
        body: `Set Content-Type to application/json and use JSON.stringify() to send data.\n\n\`\`\`javascript\nconst http = require('http')\n\nconst server = http.createServer((req, res) => {\n    if (req.url === '/api/status') {\n        const data = {\n            status: 'ok',\n            timestamp: new Date().toISOString(),\n            version: '1.0.0'\n        }\n        res.writeHead(200, { 'Content-Type': 'application/json' })\n        res.end(JSON.stringify(data))\n    } else {\n        res.writeHead(404)\n        res.end(JSON.stringify({ error: 'Not found' }))\n    }\n})\n\nserver.listen(3000)\n\`\`\`\n\nvisit /api/status and you get JSON back. The browser or any HTTP client will show the data.`,
        tryIt: 'Create an /api/info endpoint that returns a JSON object with your name and the current date.'
      }
    ]
  },
  {
    id: 'node-request-body',
    title: 'Reading Request Body',
    sections: [
      {
        id: 'node-post-body',
        title: 'Reading POST Data',
        body: `HTTP request bodies arrive as a stream. Collect the chunks and parse at the end.\n\n\`\`\`javascript\nconst http = require('http')\n\nconst server = http.createServer((req, res) => {\n    if (req.method === 'POST' && req.url === '/echo') {\n        let body = ''\n\n        req.on('data', (chunk) => {\n            body += chunk.toString()\n            if (body.length > 1_000_000) {\n                req.destroy()  // reject huge bodies\n            }\n        })\n\n        req.on('end', () => {\n            try {\n                const data = JSON.parse(body)\n                res.writeHead(200, { 'Content-Type': 'application/json' })\n                res.end(JSON.stringify({ received: data }))\n            } catch {\n                res.writeHead(400)\n                res.end(JSON.stringify({ error: 'Invalid JSON' }))\n            }\n        })\n    } else {\n        res.writeHead(404)\n        res.end()\n    }\n})\n\nserver.listen(3000)\n\`\`\`\n\ndata events fire as chunks arrive. The end event fires when the full body has arrived. Always guard against huge bodies to prevent memory attacks.`,
        tryIt: 'Test the echo endpoint with curl: curl -X POST http://localhost:3000/echo -H "Content-Type: application/json" -d "{\\"name\\":\\"Alice\\"}"'
      }
    ]
  },
  {
    id: 'node-fs',
    title: 'File System',
    sections: [
      {
        id: 'node-read-file',
        title: 'Reading Files',
        body: `The fs module reads and writes files. Use the promise-based version for cleaner async code.\n\n\`\`\`javascript\nconst fs = require('fs').promises\n\nasync function main() {\n    try {\n        // Read a file\n        const contents = await fs.readFile('data.txt', 'utf8')\n        console.log(contents)\n\n        // Check if a file exists\n        try {\n            await fs.access('data.txt')\n            console.log('File exists')\n        } catch {\n            console.log('File does not exist')\n        }\n    } catch (error) {\n        console.error('Error:', error.message)\n    }\n}\n\nmain()\n\`\`\`\n\nfs.promises uses async/await instead of callbacks. Always catch errors — file operations can fail if the path is wrong or permissions are missing.`,
        tryIt: 'Create a file called data.txt with some text. Write a Node script that reads it and prints its contents.'
      },
      {
        id: 'node-write-file',
        title: 'Writing Files',
        body: `fs.writeFile creates or overwrites a file. fs.appendFile adds to the end.\n\n\`\`\`javascript\nconst fs = require('fs').promises\n\nasync function main() {\n    // Write (creates or overwrites)\n    await fs.writeFile('log.txt', 'First line\\n', 'utf8')\n\n    // Append more lines\n    await fs.appendFile('log.txt', 'Second line\\n', 'utf8')\n    await fs.appendFile('log.txt', new Date().toISOString() + '\\n', 'utf8')\n\n    // Read it back\n    const data = await fs.readFile('log.txt', 'utf8')\n    console.log(data)\n}\n\nmain()\n\`\`\`\n\nwriteFile with an existing path deletes the old content. appendFile is safer when you want to keep history.`,
        tryIt: 'Create a script that appends the current timestamp to a log file each time it runs. Run it three times and read the file.'
      }
    ]
  },
  {
    id: 'node-npm',
    title: 'npm & Scripts',
    sections: [
      {
        id: 'node-package-json',
        title: 'package.json Scripts',
        body: `Define npm scripts in package.json to standardize how you run your project.\n\n\`\`\`json\n{\n  "name": "my-server",\n  "version": "1.0.0",\n  "scripts": {\n    "start": "node server.js",\n    "dev": "node --watch server.js",\n    "test": "node test.js"\n  }\n}\n\`\`\`\n\nThen run them:\n\n\`\`\`bash\nnpm start       # runs node server.js\nnpm run dev     # runs with --watch (auto-restarts on file changes)\nnpm test        # runs tests\n\`\`\`\n\nnode --watch is built into Node 18+ and restarts your server whenever you save a file. No extra tools needed.`,
        tryIt: 'Create a package.json with a start script and a dev script using --watch. Run npm run dev and edit your server file to see it restart.'
      }
    ]
  }
]
